// ============================================================
// SEVS — Shared Type Definitions
// Single source of truth, consumed by both mock data and
// (eventually) real API responses. Do not duplicate these
// shapes elsewhere — import from "@/lib/types".
// ============================================================

// ---------- Enums / Unions ----------

export type UserRole =
  | "STUDENT"
  | "CANDIDATE"
  | "ELECTION_OFFICER"
  | "VERIFICATION_OFFICER"
  | "AUDITOR"
  | "OBSERVER"
  | "SYSTEM_ADMIN";

export type ElectionStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "SCHEDULED"
  | "ACTIVE"
  | "CLOSED"
  | "ARCHIVED";

export type CandidateStatus = "PENDING" | "APPROVED" | "REJECTED";

export type ApprovalActionType =
  | "ELECTION_CREATION"
  | "ELECTION_ACTIVATION"
  | "ELECTION_CLOSURE"
  | "RESULT_PUBLICATION";

export type ApprovalDecision = "PENDING" | "APPROVED" | "REJECTED";

export type ApprovalRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

// ---------- Users / Students ----------

export interface StudentProfile {
  id: string;
  admissionNo: string;
  fullName: string;
  school: string;
  yearOfStudy: number;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  student: StudentProfile | null;
}

// ---------- Elections ----------

export interface ElectionPosition {
  id: string;
  title: string;
  electionId: string;
}

export interface Election {
  id: string;
  title: string;
  description?: string;
  status: ElectionStatus;
  startDate: string; // ISO 8601
  endDate: string; // ISO 8601
  createdBy: string;
  createdAt: string;
  positions: ElectionPosition[];
}

export interface CreateElectionPayload {
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
}

// ---------- Candidates ----------

export interface Candidate {
  id: string;
  studentId: string;
  positionId: string;
  manifesto?: string;
  status: CandidateStatus;
  student: {
    fullName: string;
    admissionNo: string;
    school: string;
    yearOfStudy: number;
  };
}

// ---------- Voting ----------

export interface Ballot {
  id: string;
  electionId: string;
  token: string;
  issuedAt: string;
}

export interface VoteReceipt {
  id: string;
  voteId: string;
  receiptCode: string;
  createdAt: string;
}

export interface CastVotePayload {
  electionId: string;
  selections: Array<{ positionId: string; candidateId: string }>;
}

// ---------- Approvals ----------

export interface OfficerApproval {
  id: string;
  officerId: string;
  officerName: string;
  decision: ApprovalDecision;
  timestamp: string | null;
}

export interface ApprovalRequest {
  id: string;
  actionType: ApprovalActionType;
  requestedBy: string;
  status: ApprovalRequestStatus;
  targetId: string;
  targetLabel: string;
  createdAt: string;
  approvals: OfficerApproval[];
}

// ---------- Audit ----------

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  eventType: string;
  eventData: Record<string, unknown>;
  previousHash: string;
  currentHash: string;
  createdAt: string;
}

// ---------- Results ----------

export interface CandidateResult {
  candidateId: string;
  candidateName: string;
  voteCount: number;
  percentage: number;
}

export interface PositionResult {
  positionId: string;
  positionTitle: string;
  candidates: CandidateResult[];
  winnerId: string | null;
}

export interface ElectionResults {
  electionId: string;
  electionTitle: string;
  totalBallotsCast: number;
  publishedAt: string | null;
  positions: PositionResult[];
}