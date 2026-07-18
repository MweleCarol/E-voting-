// src/modules/elections/elections.repository.ts

import { prisma }         from '@database/client.js';
import { ElectionStatus, Prisma } from '@generated/prisma/client';
import type {
  CreateElectionInput,
  UpdateElectionInput,
  ListElectionsInput,
  ElectionSummaryResponse,
  ElectionDetailResponse,
  PaginatedElectionsResponse,
  ElectionPositionResponse,
} from './elections.types.js';

// ─── HELPERS ──────────────────────────────────────────────────────────────────

// Maps a raw Prisma election row (with _count) to our summary response shape.
// Keeping this private to the repository means callers never depend on Prisma's
// raw shape — if the query changes, only this mapper changes.
function toSummary(raw: {
  id: string;
  title: string;
  description: string | null;
  status: ElectionStatus;
  startDate: Date;
  endDate: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  _count: { positions: number };
}): ElectionSummaryResponse {
  return {
    id:            raw.id,
    title:         raw.title,
    description:   raw.description,
    status:        raw.status,
    startDate:     raw.startDate,
    endDate:       raw.endDate,
    positionCount: raw._count.positions,
    createdBy:     raw.createdBy,
    createdAt:     raw.createdAt,
    updatedAt:     raw.updatedAt,
  };
}

function toDetail(raw: {
  id: string;
  title: string;
  description: string | null;
  status: ElectionStatus;
  startDate: Date;
  endDate: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  positions: { id: string; title: string }[];
}): ElectionDetailResponse {
  return {
    id:          raw.id,
    title:       raw.title,
    description: raw.description,
    status:      raw.status,
    startDate:   raw.startDate,
    endDate:     raw.endDate,
    createdBy:   raw.createdBy,
    createdAt:   raw.createdAt,
    updatedAt:   raw.updatedAt,
    positions:   raw.positions.map(
      (p): ElectionPositionResponse => ({ id: p.id, title: p.title }),
    ),
  };
}

// ─── CREATE ───────────────────────────────────────────────────────────────────

export async function createElection(
  input: CreateElectionInput,
  actorId: string,
): Promise<ElectionDetailResponse> {
  const raw = await prisma.election.create({
    data: {
      title:       input.title,
      description: input.description,
      startDate:   input.startDate,
      endDate:     input.endDate,
      createdBy:   actorId,
      positions: {
        create: input.positions.map((title) => ({ title })),
      },
    },
    include: {
      positions: { select: { id: true, title: true } },
    },
  });

  return toDetail(raw);
}

// ─── READ ─────────────────────────────────────────────────────────────────────

export async function findElectionById(
  id: string,
): Promise<ElectionDetailResponse | null> {
  const raw = await prisma.election.findUnique({
    where:   { id },
    include: {
      positions: { select: { id: true, title: true } },
    },
  });

  if (!raw) return null;
  return toDetail(raw);
}

// Minimal fetch — used by transition guards in the service layer.
// Returns only what is needed to evaluate whether a transition is allowed.
export async function findElectionForTransition(
  id: string,
  tx?: Prisma.TransactionClient,
): Promise<{ id: string; status: ElectionStatus } | null> {
  const client = tx ?? prisma; // tx is optional, fallback to global prisma client
  return client.election.findUnique({
    where:  { id },
    select: { id: true, status: true },
  });
}


// elections.repository.ts — addition

export async function findElectionForBallotWindow(id: string) {
  return prisma.election.findUnique({
    where: { id },
    select: { id: true, status: true, startDate: true, endDate: true },
  });
}

export async function listElections(
  input: ListElectionsInput,
): Promise<PaginatedElectionsResponse> {
  const where = input.status ? { status: input.status } : {};
  const skip  = (input.page - 1) * input.limit;

  const [rows, total] = await prisma.$transaction([
    prisma.election.findMany({
      where,
      skip,
      take:    input.limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id:          true,
        title:       true,
        description: true,
        status:      true,
        startDate:   true,
        endDate:     true,
        createdBy:   true,
        createdAt:   true,
        updatedAt:   true,
        _count: {
          select: { positions: true },
        },
      },
    }),
    prisma.election.count({ where }),
  ]);

  return {
    elections: rows.map(toSummary),
    total,
    page:  input.page,
    limit: input.limit,
  };
}

// Active elections only — exposed to all authenticated roles including students.
export async function listActiveElections(
  input: Pick<ListElectionsInput, 'page' | 'limit'>,
): Promise<PaginatedElectionsResponse> {
  return listElections({ ...input, status: 'ACTIVE' });
}

// ─── UPDATE ───────────────────────────────────────────────────────────────────

export async function updateElection(
  id: string,
  input: UpdateElectionInput,
): Promise<ElectionDetailResponse> {
  const raw = await prisma.election.update({
    where: { id },
    data:  {
      title:       input.title,
      description: input.description,
      startDate:   input.startDate,
      endDate:     input.endDate,
    },
    include: {
      positions: { select: { id: true, title: true } },
    },
  });

  return toDetail(raw);
}

// ─── STATUS TRANSITIONS ───────────────────────────────────────────────────────

export async function updateElectionStatus(
  id: string,
  status: ElectionStatus,
  tx?: Prisma.TransactionClient,
): Promise<void> {
  const client = tx ?? prisma;
  await client.election.update({
    where: { id },
    data:  { status },
  });
}

// ─── POSITIONS ────────────────────────────────────────────────────────────────

export async function addPosition(
  electionId: string,
  title: string,
): Promise<ElectionPositionResponse> {
  return prisma.electionPosition.create({
    data:   { electionId, title },
    select: { id: true, title: true },
  });
}

export async function removePosition(
  positionId: string,
): Promise<void> {
  await prisma.electionPosition.delete({
    where: { id: positionId },
  });
}

export async function findPositionById(
  positionId: string,
): Promise<{ id: string; electionId: string; title: string } | null> {
  return prisma.electionPosition.findUnique({
    where:  { id: positionId },
    select: { id: true, electionId: true, title: true },
  });
}

// ─── APPROVAL REQUESTS ────────────────────────────────────────────────────────

// Creates a formal approval request for an election lifecycle action.
// Called by the service on submit() and initiateClose().
export async function createApprovalRequest(
  electionId: string,
  actionType: 'ELECTION_ACTIVATE' | 'ELECTION_CLOSE',
  requestedBy: string,
): Promise<{ id: string }> {
  return prisma.approvalRequest.create({
    data: {
      electionId,
      actionType,
      requestedBy,
    },
    select: { id: true },
  });
}