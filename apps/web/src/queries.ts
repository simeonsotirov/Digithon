import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { type IngestSource, createIngest, getCalendarEvents, getDashboard, getEvents, getPredictions, getRuns } from "./api";

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

export function useCalendarEvents() {
  return useQuery({
    queryKey: ["calendar-events"],
    queryFn: () => getCalendarEvents(),
    refetchInterval: 60_000,
  });
}

export function usePredictions(params?: { run_id?: string; store_id?: string; risk_level?: string }) {
  return useQuery({
    queryKey: ["predictions", params],
    queryFn: () => getPredictions(params),
    refetchInterval: 5000,
  });
}

export function useIngestMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (source: IngestSource = { type: "seed" }) => createIngest(source),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["runs"] });
    },
  });
}
