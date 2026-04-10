import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import type { UtilizationResponse, HeatmapResponse } from "@/types/capacity";
import type {
  RoleCoverage,
  PersonHeatmapResponse,
} from "@/hooks/useCapacity";

/**
 * Capacity hooks that request the "Simplified SDLC" v2 phase model from
 * the backend. They hit the same endpoints as v1 but pass
 * `?phase_model=v2`, which flips the engine to use v2 phase weights and
 * role efforts for the request. Response shapes are identical to v1.
 */

const V2_PARAM = { phase_model: "v2" } as const;

export function useUtilizationV2() {
  return useQuery<UtilizationResponse>({
    queryKey: ["capacity", "utilization", "v2"],
    queryFn: () =>
      api.get("/capacity/utilization", { params: V2_PARAM }).then((r) => r.data),
  });
}

export function useHeatmapV2(weeks = 26) {
  return useQuery<HeatmapResponse>({
    queryKey: ["capacity", "heatmap", "v2", weeks],
    queryFn: () =>
      api
        .get("/capacity/heatmap", { params: { weeks, ...V2_PARAM } })
        .then((r) => r.data),
  });
}

export function usePersonHeatmapV2(weeks = 26) {
  return useQuery<PersonHeatmapResponse>({
    queryKey: ["capacity", "person-heatmap", "v2", weeks],
    queryFn: () =>
      api
        .get("/capacity/person-heatmap", { params: { weeks, ...V2_PARAM } })
        .then((r) => r.data),
  });
}

export function useAssignmentCoverageV2() {
  return useQuery<Record<string, RoleCoverage>>({
    queryKey: ["capacity", "assignment-coverage", "v2"],
    queryFn: () =>
      api
        .get("/capacity/assignment-coverage", { params: V2_PARAM })
        .then((r) => r.data),
  });
}
