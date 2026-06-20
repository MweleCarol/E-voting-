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
        "sevs-tag inline-flex items-center gap-1.5 rounded-md border px-2 py-1",
        TONE_STYLES[tone],
        tone === "success" && "sevs-glow-accent",
        className
      )}
    >
      {tone === "success" && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sevs-success opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-sevs-success" />
        </span>
      )}
      {label}
    </span>
  );
}

export function ElectionStatusBadge({
  status,
  className,
}: { status: ElectionStatus } & BaseBadgeProps) {
  const config = ELECTION_STATUS_CONFIG[status];
  return <BadgeShell label={config.label} tone={config.tone} className={className} />;
}

export function CandidateStatusBadge({
  status,
  className,
}: { status: CandidateStatus } & BaseBadgeProps) {
  const config = CANDIDATE_STATUS_CONFIG[status];
  return <BadgeShell label={config.label} tone={config.tone} className={className} />;
}

export function ApprovalDecisionBadge({
  decision,
  className,
}: { decision: ApprovalDecision } & BaseBadgeProps) {
  const config = APPROVAL_DECISION_CONFIG[decision];
  return <BadgeShell label={config.label} tone={config.tone} className={className} />;
}

export function ApprovalRequestStatusBadge({
  status,
  className,
}: { status: ApprovalRequestStatus } & BaseBadgeProps) {
  const config = APPROVAL_REQUEST_STATUS_CONFIG[status];
  return <BadgeShell label={config.label} tone={config.tone} className={className} />;
}