import { getVotingHistoryByStudentId } from "@/lib/data/voting-history.data";
import type { VotingHistoryEntry } from "@/lib/types";

export const votingHistoryService = {
  async getByStudentId(studentId: string): Promise<VotingHistoryEntry[]> {
    return getVotingHistoryByStudentId(studentId);
  },
};