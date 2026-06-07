import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createIngest, getDashboard } from "./api";

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboard,
    refetchInterval: 3000,
  });
}

export function useIngestMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createIngest,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
  });
}
