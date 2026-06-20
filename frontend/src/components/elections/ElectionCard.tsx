import Link from "next/link";
import { ElectionStatusBadge } from "@/components/shared/StatusBadge";
import type { Election } from "@/lib/types";
import { formatDistanceToNow, format } from "date-fns";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ElectionCardProps {
  election: Election;
  href?: string;
}

export function ElectionCard({ election, href }: ElectionCardProps) {
  const link = href ?? `/elections/${election.id}`;
  const isActive = election.status === "ACTIVE";
  const isScheduled = election.status === "SCHEDULED";

  return (
    <Link
      href={link}
      className={cn(
        "sevs-panel block rounded-xl p-4 transition-colors hover:bg-sevs-surface-hover",
        isActive && "border-sevs-success/30 sevs-glow-accent"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display font-semibold text-sevs-text-primary truncate">
            {election.title}
          </h3>
          {election.description && (
            <p className="mt-0.5 text-sm text-sevs-text-secondary line-clamp-2">
              {election.description}
            </p>
          )}
        </div>
        <ElectionStatusBadge status={election.status} className="flex-shrink-0" />
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-sevs-border pt-3">
        <span className="font-mono text-xs text-sevs-text-muted">
          {isActive && `closes ${formatDistanceToNow(new Date(election.endDate), { addSuffix: true })}`}
          {isScheduled && `opens ${format(new Date(election.startDate), "yyyy-MM-dd")}`}
          {!isActive && !isScheduled && format(new Date(election.startDate), "yyyy-MM-dd")}
        </span>
        {isActive && (
          <span className="inline-flex items-center gap-1 font-mono text-xs font-medium text-sevs-accent">
            cast vote <ArrowRight className="h-3 w-3" />
          </span>
        )}
      </div>
    </Link>
  );
}