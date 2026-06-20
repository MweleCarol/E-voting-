import { format } from "date-fns";
import { FileCheck } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import type { VotingHistoryEntry } from "@/lib/types";

interface VotingHistoryListProps {
  entries: VotingHistoryEntry[];
}

export function VotingHistoryList({ entries }: VotingHistoryListProps) {
  if (entries.length === 0) {
    return (
      <EmptyState
        icon={FileCheck}
        title="No voting history yet"
        description="Elections you've voted in will appear here with your receipt code."
      />
    );
  }

  return (
    <ul className="sevs-panel divide-y divide-sevs-border rounded-xl">
      {entries.map((entry) => (
        <li key={entry.electionId} className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-sevs-text-primary truncate">
              {entry.electionTitle}
            </p>
            <p className="font-mono text-xs text-sevs-text-muted">
              {format(new Date(entry.votedAt), "yyyy-MM-dd")}
            </p>
          </div>
          <span className="flex-shrink-0 rounded-md border border-sevs-accent/20 bg-sevs-accent-dim/10 px-2 py-1 font-mono text-xs text-sevs-accent">
            {entry.receiptCode}
          </span>
        </li>
      ))}
    </ul>
  );
}