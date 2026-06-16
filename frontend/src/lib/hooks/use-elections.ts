import { useQuery } from "@tanstack/react-query";
import { electionsService } from "@/lib/services/elections.service";

export const useElections = () =>
  useQuery({
    queryKey: ["elections"],
    queryFn: () => electionsService.getAll(),
  });

export const useElection = (id: string) =>
  useQuery({
    queryKey: ["elections", id],
    queryFn: () => electionsService.getById(id),
    enabled: !!id,
  });