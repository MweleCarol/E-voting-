import type { VotingHistoryEntry } from "@/lib/types";

// IMPORTANT DESIGN NOTE — identity/vote separation (LLD section 23):
// The backend has NO table that links a student_id to a vote_id. This
// mock file represents what the CLIENT remembers locally (e.g. stored
// after a successful cast), not something a real "GET /votes?studentId=X"
// endpoint could ever return — that endpoint should never exist.
//
// In production, this list would most realistically be populated by:
//   (a) the receipt screen writing to localStorage/a personal vault on
//       cast, and the dashboard reading from there, or
//   (b) a dedicated "my receipts" record the student explicitly saves,
//       keyed by receipt code, not by vote content.
// Treat this mock as a stand-in for that client-side record, not as a
// preview of a real backend response shape.

export const mockVotingHistoryByStudentId: Record<string, VotingHistoryEntry[]> = {
  "std-001": [
    {
      electionId: "election-003",
      electionTitle: "Sports Council Elections 2025",
      votedAt: "2025-08-01T14:22:00Z",
      receiptCode: "A72F9C1D",
    },
  ],
  "std-002": [],
  "std-003": [],
  "std-004": [
    {
      electionId: "election-003",
      electionTitle: "Sports Council Elections 2025",
      votedAt: "2025-08-01T09:05:00Z",
      receiptCode: "B91E4F7A",
    },
  ],
};

export function getVotingHistoryByStudentId(studentId: string): VotingHistoryEntry[] {
  return mockVotingHistoryByStudentId[studentId] ?? [];
}