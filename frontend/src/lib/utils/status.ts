import type {
  ElectionStatus,
  CandidateStatus,
  ApprovalDecision,
  ApprovalRequestStatus,
} from "@/lib/types";

export type StatusTone = "neutral" | "warning" | "info" | "success" | "danger";

interface StatusConfig {
  label: string;
  tone: StatusTone;
}

export const TONE_STYLES: Record<StatusTone, string> = {
  neutral: "bg-sevs-surface-raised text-sevs-text-secondary border-sevs-border-strong",
  warning: "bg-sevs-warning-dim text-sevs-warning border-sevs-warning/30",
  info: "bg-sevs-accent-dim/20 text-sevs-accent border-sevs-accent/30",
  success: "bg-sevs-success-dim text-sevs-success border-sevs-success/30",
  danger: "bg-sevs-danger-dim text-sevs-danger border-sevs-danger/30",
};

export const ELECTION_STATUS_CONFIG: Record<ElectionStatus, StatusConfig> = {
  DRAFT: { label: "Draft", tone: "neutral" },
  PENDING_APPROVAL: { label: "Pending approval", tone: "warning" },
  SCHEDULED: { label: "Scheduled", tone: "info" },
  ACTIVE: { label: "Live", tone: "success" },
  CLOSED: { label: "Closed", tone: "neutral" },
  ARCHIVED: { label: "Archived", tone: "neutral" },
};

export const CANDIDATE_STATUS_CONFIG: Record<CandidateStatus, StatusConfig> = {
  PENDING: { label: "Pending review", tone: "warning" },
  APPROVED: { label: "Approved", tone: "success" },
  REJECTED: { label: "Rejected", tone: "danger" },
};

export const APPROVAL_DECISION_CONFIG: Record<ApprovalDecision, StatusConfig> = {
  PENDING: { label: "Awaiting decision", tone: "warning" },
  APPROVED: { label: "Approved", tone: "success" },
  REJECTED: { label: "Rejected", tone: "danger" },
};

export const APPROVAL_REQUEST_STATUS_CONFIG: Record<ApprovalRequestStatus, StatusConfig> = {
  PENDING: { label: "Pending", tone: "warning" },
  APPROVED: { label: "Approved", tone: "success" },
  REJECTED: { label: "Rejected", tone: "danger" },
};