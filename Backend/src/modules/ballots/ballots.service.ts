// src/modules/ballots/ballots.service.ts

import { logger } from '@config/logger';
import { NotFoundError, AuthorizationError, ConflictError, ElectionStateError } from '@shared/errors';
import { findStudentByUserId } from '../users/users.repository.js';
import { findElectionForBallotWindow } from '../elections/elections.repository.js';
import { isEligible } from '../verification/verification.service.js';
import {
  findRegistrationForToken,
  findBallotByToken,
  clearActiveToken,
  issueBallot as dbIssueBallot,
  consumeBallotToken,
} from './ballots.repository.js';
import { BALLOT_SESSION_DURATION_MINUTES, type BallotTokenResponse , type TokenValidationResult } from './ballots.types.js';
import {Prisma} from "@generated/prisma/client";

function toResponse(ballot: { token: string; issuedAt: Date; expiresAt: Date }): BallotTokenResponse {
  return { token: ballot.token, issuedAt: ballot.issuedAt, expiresAt: ballot.expiresAt };
}

export async function requestBallot(userId: string, electionId: string): Promise<BallotTokenResponse> {
  const student = await findStudentByUserId(userId);
  if (!student) {
    throw new NotFoundError('No student profile linked to this account');
  }

  // Eligibility — reuses M9's isEligible() rather than re-implementing the
  // check. See design note above on the imperfect error-class fit here.
  const eligibility = await isEligible(student.id, electionId);
  if (!eligibility.eligible) {
    if (eligibility.reason === 'NOT_REGISTERED') {
      throw new NotFoundError('You are not registered as a voter for this election');
    }
    if (eligibility.reason === 'NOT_APPROVED') {
      throw new AuthorizationError(
        `Your voter registration is not yet approved (current status: ${eligibility.currentStatus})`
      );
    }
    // ALREADY_PARTICIPATED
    throw new ConflictError('You have already voted in this election');
  }

  // Clock + status gate — M11 checks the window defensively, never writes
  // election status (that stays M7/M15's job). Both conditions required.
  const election = await findElectionForBallotWindow(electionId);
  if (!election) {
    throw new NotFoundError(`Election '${electionId}' not found`);
  }
  const now = new Date();
  if (election.status !== 'ACTIVE' || now < election.startDate || now > election.endDate) {
    throw new ElectionStateError(
      `Voting is not currently open for this election (status: ${election.status}).`
    );
  }

  const registration = await findRegistrationForToken(student.id, electionId);
  if (!registration) {
    // Structurally shouldn't happen — isEligible just confirmed this exists.
    throw new NotFoundError('Voter registration not found');
  }

  // ─── OUTSTANDING TOKEN CHECK — idempotent reuse or expiry-triggered reissue ─
  if (registration.activeBallotToken) {
    const existingBallot = await findBallotByToken(registration.activeBallotToken);

    if (!existingBallot) {
      // Defensive: pointer set but row missing — inconsistent state, clear and reissue.
      await clearActiveToken(registration.id);
    } else if (existingBallot.expiresAt > now) {
      // Still valid — idempotent re-request, not a new issuance.
      logger.info('ballot.reused_existing_token', { registrationId: registration.id });
      return toResponse(existingBallot);
    } else {
      // Expired, unused — clear and fall through to fresh issuance.
      await clearActiveToken(registration.id);
    }
  }

  // ─── ISSUE ──────────────────────────────────────────────────────────────
  const issued = await dbIssueBallot(registration.id, electionId, BALLOT_SESSION_DURATION_MINUTES);

  if (issued) {
    logger.info('ballot.issued', { registrationId: registration.id, electionId });
    return toResponse(issued);
  }

  // Lost the race — another concurrent request won the claim between our
  // read and the write. Treat this as a success from the caller's
  // perspective, not an error: re-fetch and return whichever token won,
  // rather than surface a 409 for what's likely just a double-tap.
  const afterRace = await findRegistrationForToken(student.id, electionId);
  if (!afterRace?.activeBallotToken) {
    // Genuinely shouldn't happen — someone won the claim, so a token must exist.
    throw new ConflictError('Ballot issuance failed — please try again');
  }
  const winningBallot = await findBallotByToken(afterRace.activeBallotToken);
  if (!winningBallot) {
    throw new ConflictError('Ballot issuance failed — please try again');
  }

  logger.info('ballot.race_resolved_to_existing', { registrationId: registration.id });
  return toResponse(winningBallot);
}


// ballots.service.ts — addition

export async function validateAndConsumeToken(
  token: string,
  tx: Prisma.TransactionClient,
): Promise<TokenValidationResult> {
  const result = await consumeBallotToken(token, tx);

  if (result.outcome === 'not_found') return { valid: false, reason: 'NOT_FOUND' };
  if (result.outcome === 'expired') return { valid: false, reason: 'EXPIRED' };
  if (result.outcome === 'already_used') return { valid: false, reason: 'ALREADY_USED' };

  return { valid: true, registrationId: result.registrationId, electionId: result.electionId };
}