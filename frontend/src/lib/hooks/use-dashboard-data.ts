import { useQuery } from "@tanstack/react-query";
import { electionsService } from "@/lib/services/elections.service";
import { voterRegistrationService } from "@/lib/services/voter-registration.service";
import { votingHistoryService } from "@/lib/services/voting-history.service";

export const useElections = () =>
  useQuery({
    queryKey: ["elections"],
    queryFn: () => electionsService.getAll(),
  });

export const useVoterRegistration = (studentId: string | undefined) =>
  useQuery({
    queryKey: ["voter-registration", studentId],
    queryFn: () => voterRegistrationService.getByStudentId(studentId!),
    enabled: !!studentId,
  });

export const useVotingHistory = (studentId: string | undefined) =>
  useQuery({
    queryKey: ["voting-history", studentId],
    queryFn: () => votingHistoryService.getByStudentId(studentId!),
    enabled: !!studentId,
  });