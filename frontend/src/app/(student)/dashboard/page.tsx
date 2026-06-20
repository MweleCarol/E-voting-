"use client";

import { useAuth } from "@/contexts/auth.context";
import { useElections, useVoterRegistration, useVotingHistory } from "@/lib/hooks/use-dashboard-data";
import { VoterStatusBanner } from "@/components/elections/VoterStatusBanner";
import { ElectionCard } from "@/components/elections/ElectionCard";
import { VotingHistoryList } from "@/components/elections/VotingHistoryList";
import { EmptyState } from "@/components/shared/EmptyState";
import { CardSkeletonGrid } from "@/components/shared/LoadingSkeleton";
import { Vote } from "lucide-react";

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const studentId = user?.student?.id;

  const { data: elections, isLoading: electionsLoading } = useElections();
  const { data: registration } = useVoterRegistration(studentId);
  const { data: history } = useVotingHistory(studentId);

  const activeElections = elections?.filter((e) => e.status === "ACTIVE") ?? [];
  const scheduledElections = elections?.filter((e) => e.status === "SCHEDULED") ?? [];

  const firstName = user?.student?.fullName.split(" ")[0] ?? "there";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-sevs-text-primary">
          Hello, {firstName}
        </h1>
        <p className="mt-1 font-mono text-sm text-sevs-text-secondary">
          {user?.student?.school} · year {user?.student?.yearOfStudy}
        </p>
      </div>

      <VoterStatusBanner registration={registration ?? null} />

      <section className="space-y-3">
        <h2 className="sevs-tag text-sevs-text-muted">Active elections</h2>
        {electionsLoading ? (
          <CardSkeletonGrid count={1} />
        ) : activeElections.length === 0 ? (
          <EmptyState
            icon={Vote}
            title="No active elections"
            description="You'll be notified when voting opens for your school."
          />
        ) : (
          <div className="space-y-3">
            {activeElections.map((election) => (
              <ElectionCard key={election.id} election={election} />
            ))}
          </div>
        )}
      </section>

      {scheduledElections.length > 0 && (
        <section className="space-y-3">
          <h2 className="sevs-tag text-sevs-text-muted">Upcoming</h2>
          <div className="space-y-3">
            {scheduledElections.map((election) => (
              <ElectionCard key={election.id} election={election} />
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="sevs-tag text-sevs-text-muted">Voting history</h2>
        <VotingHistoryList entries={history ?? []} />
      </section>
    </div>
  );
}