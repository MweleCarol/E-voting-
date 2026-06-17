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

// Tone → Tailwind classes, built on the --sevs-* tokens from globals.css.
// This is the ONLY place tone-to-color mapping lives. Every status badge
// in the app should resolve through here, not through ad-hoc classNames.
export const TONE_STYLES: Record<StatusTone, string> = {
  neutral: "bg-muted text-muted-foreground border-border",
  warning: "bg-sevs-warning-light text-sevs-warning border-sevs-warning/20",
  info: "bg-sevs-primary-muted text-sevs-primary border-sevs-primary/20",
  success: "bg-sevs-accent-light text-sevs-accent border-sevs-accent/20",
  danger: "bg-sevs-danger-light text-sevs-danger border-sevs-danger/20",
};

export const ELECTION_STATUS_CONFIG: Record<ElectionStatus, StatusConfig> = {
  DRAFT: { label: "Draft", tone: "neutral" },
  PENDING_APPROVAL: { label: "Pending approval", tone: "warning" },
  SCHEDULED: { label: "Scheduled", tone: "info" },
  ACTIVE: { label: "Active", tone: "success" },
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