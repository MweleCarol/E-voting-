import { getVoterRegistrationByStudentId } from "@/lib/data/voter-registration.data";
import type { VoterRegistration } from "@/lib/types";

export const voterRegistrationService = {
  async getByStudentId(studentId: string): Promise<VoterRegistration | null> {
    return getVoterRegistrationByStudentId(studentId);
  },
};