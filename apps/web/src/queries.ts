import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createIngest, getDashboard, getEvents, getRuns } from "./api";

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboard,
    refetchInterval: 3000,
  });
}

export function useRuns() {
  return useQuery({
    queryKey: ["runs"],
    queryFn: getRuns,
    refetchInterval: 3000,
  });
}

export function useEvents(runId: string | null) {
  return useQuery({
    queryKey: ["events", runId],
    queryFn: () => getEvents(runId!),
    enabled: runId !== null && runId !== "all",
    refetchInterval: 3000,
  });
}

export function useIngestMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createIngest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["runs"] });
    },
  });
}
