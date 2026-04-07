import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import type { UtilizationResponse, HeatmapResponse } from "@/types/capacity";

export function useUtilization() {
  return useQuery<UtilizationResponse>({
    queryKey: ["capacity", "utilization"],
    queryFn: () => api.get("/capacity/utilization").then((r) => r.data),
  });
}

export function useHeatmap(weeks = 26) {
  return useQuery<HeatmapResponse>({
    queryKey: ["capacity", "heatmap", weeks],
    queryFn: () =>
      api.get("/capacity/heatmap", { params: { weeks } }).then((r) => r.data),
  });
}
