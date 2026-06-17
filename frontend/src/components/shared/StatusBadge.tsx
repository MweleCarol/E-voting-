import { cn } from "@/lib/utils";
import {
  TONE_STYLES,
  ELECTION_STATUS_CONFIG,
  CANDIDATE_STATUS_CONFIG,
  APPROVAL_DECISION_CONFIG,
  APPROVAL_REQUEST_STATUS_CONFIG,
  type StatusTone,
} from "@/lib/utils/status";
import type {
  ElectionStatus,
  CandidateStatus,
  ApprovalDecision,
  ApprovalRequestStatus,
} from "@/lib/types";

interface BaseBadgeProps {
  className?: string;
}

function BadgeShell({
  label,
  tone,
  className,
}: { label: string; tone: StatusTone } & BaseBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        TONE_STYLES[tone],
        className,
      )}
    >
      {tone === "success" && (
        <span
          className="h-1.5 w-1.5 rounded-full bg-sevs-accent animate-pulse"
          aria-hidden
        />
      )}
      {label}
    </span>
  );
}

// Use the variant matching the entity you're displaying. Each one is
// type-safe against the actual status union, so an invalid status value
// is a compile error, not a silent fallback.

export function ElectionStatusBadge({
  status,
  className,
}: { status: ElectionStatus } & BaseBadgeProps) {
  const config = ELECTION_STATUS_CONFIG[status];
  return (
    <BadgeShell label={config.label} tone={config.tone} className={className} />
  );
}

export function CandidateStatusBadge({
  status,
  className,
}: { status: CandidateStatus } & BaseBadgeProps) {
  const config = CANDIDATE_STATUS_CONFIG[status];
  return (
    <BadgeShell label={config.label} tone={config.tone} className={className} />
  );
}

export function ApprovalDecisionBadge({
  decision,
  className,
}: { decision: ApprovalDecision } & BaseBadgeProps) {
  const config = APPROVAL_DECISION_CONFIG[decision];
  return (
    <BadgeShell label={config.label} tone={config.tone} className={className} />
  );
}

export function ApprovalRequestStatusBadge({
  status,
  className,
}: { status: ApprovalRequestStatus } & BaseBadgeProps) {
  const config = APPROVAL_REQUEST_STATUS_CONFIG[status];
  return (
    <BadgeShell label={config.label} tone={config.tone} className={className} />
  );
}
