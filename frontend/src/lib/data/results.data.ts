import type { ElectionResults } from "@/lib/types";

// Results for election-003 (Sports Council Elections 2025, CLOSED).
// Candidate IDs/names match cand-006/cand-007 in candidates.data.ts.

export const mockElectionResults: Record<string, ElectionResults> = {
  "election-003": {
    electionId: "election-003",
    electionTitle: "Sports Council Elections 2025",
    totalBallotsCast: 842,
    publishedAt: "2025-08-03T16:00:00Z",
    positions: [
      {
        positionId: "pos-004",
        positionTitle: "Sports Secretary",
        candidates: [
          {
            candidateId: "cand-006",
            candidateName: "David Mutiso",
            voteCount: 471,
            percentage: 55.9,
          },
          {
            candidateId: "cand-007",
            candidateName: "Brian Kamau",
            voteCount: 371,
            percentage: 44.1,
          },
        ],
        winnerId: "cand-006",
      },
    ],
  },
};

export function getResultsByElectionId(electionId: string): ElectionResults | null {
  return mockElectionResults[electionId] ?? null;
}