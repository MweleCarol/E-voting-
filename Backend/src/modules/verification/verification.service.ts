// src/modules/verification/verification.service.ts

import { logger } from '@config/logger';
import { NotFoundError, AuthorizationError, ElectionStateError } from '@shared/errors';
import { findElectionForTransition } from '../elections/elections.repository.js';
import { findStudentByUserId } from '../users/users.repository.js';
import {
  REGISTRATION_ALLOWED_ELECTION_STATUSES,
  type RegisterForElectionInput,
  type ResolveRegistrationInput,
  type ListRegistrationsQuery,
  type EligibilityResult,
} from './verification.types.js';
import {
  findRegistrationForEligibility,
  createRegistration,
  findRegistrationForResolution,
  resolveRegistration,
  findRegistrationByStudentAndElection,
  listRegistrations as dbListRegistrations,
} from './verification.repository.js';

// ─── REGISTER ───────────────────────────────────────────────────────────────
export async function registerForElection(userId: string, electionId: string) {
  const student = await findStudentByUserId(userId);

  if (!student) {
    throw new AuthorizationError('Only students may register to vote');
  }

  const election = await findElectionForTransition(electionId);

  if (!election) {
    throw new NotFoundError(`Election '${electionId}' not found`);
  }

  if (!REGISTRATION_ALLOWED_ELECTION_STATUSES.includes(election.status)) {
    throw new ElectionStateError(
      `Cannot register for an election with status '${election.status}'. ` +
      `Registration is only open during: ${REGISTRATION_ALLOWED_ELECTION_STATUSES.join(', ')}.`
    );
  }

  const registration = await createRegistration({ studentId: student.id, electionId });

  logger.info('verification.registered', { studentId: student.id, electionId, registrationId: registration.id });

  return registration;
}

// ─── RESOLVE (approve/reject) ──────────────────────────────────────────────
async function resolve(input: ResolveRegistrationInput, targetStatus: 'APPROVED' | 'REJECTED') {
  const registration = await findRegistrationForResolution(input.registrationId);

  if (!registration) {
    throw new NotFoundError(`Registration '${input.registrationId}' not found`);
  }

  if (registration.status !== 'PENDING') {
    throw new ElectionStateError(
      `Registration '${input.registrationId}' is already resolved (${registration.status})`
    );
  }

  // Self-verification: compare against the registration's underlying
  // Student.userId, not its Student.id — these are different primary keys.
  if (registration.student.userId === input.officerId) {
    throw new AuthorizationError('You cannot verify your own voter registration');
  }

  const updated = await resolveRegistration(input.registrationId, targetStatus, input.officerId);

  logger.info('verification.resolved', {
    registrationId: input.registrationId,
    officerId: input.officerId,
    status: targetStatus,
  });

  return updated;
}

export const approveRegistration = (input: ResolveRegistrationInput) => resolve(input, 'APPROVED');
export const rejectRegistration = (input: ResolveRegistrationInput) => resolve(input, 'REJECTED');

// ─── STATUS QUERY (student's own) ──────────────────────────────────────────
export async function getRegistrationStatus(userId: string, electionId: string) {
  const student = await findStudentByUserId(userId);

  if (!student) {
    throw new AuthorizationError('Only students have voter registrations');
  }

  const registration = await findRegistrationByStudentAndElection(student.id, electionId);

  if (!registration) {
    throw new NotFoundError('No registration found for this election');
  }

  return registration;
}

// ─── LIST (officer view) ───────────────────────────────────────────────────
export async function listRegistrations(query: ListRegistrationsQuery) {
  return dbListRegistrations(query);
}

// ─── ELIGIBILITY CHECK — internal, no HTTP surface, called by M11 later ────
export async function isEligible(studentId: string, electionId: string): Promise<EligibilityResult> {
  const registration = await findRegistrationForEligibility(studentId, electionId);

  if (!registration) {
    return { eligible: false, reason: 'NOT_REGISTERED' };
  }

  if (registration.status !== 'APPROVED') {
    return { eligible: false, reason: 'NOT_APPROVED', currentStatus: registration.status };
  }

  if (registration.participated) {
    return { eligible: false, reason: 'ALREADY_PARTICIPATED' };
  }

  return { eligible: true };
}