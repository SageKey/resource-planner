// -------------------------------------------------------------------------
// Direct Model — React Query hooks (Round 1)
// -------------------------------------------------------------------------

import { useQuery } from "@tanstack/react-query";
import {
  fetchDirectUtilization,
  fetchDirectHeatmap,
  fetchDirectPersonHeatmap,
  fetchDirectProjects,
  fetchDirectProjectPlan,
} from "./api";
import type {
  DirectUtilizationResponse,
  DirectHeatmapResponse,
  DirectPersonHeatmapResponse,
  DirectProjectPlanOut,
  DirectProjectSummary,
} from "./types";

export function useDirectUtilization() {
  return useQuery<DirectUtilizationResponse>({
    queryKey: ["direct", "utilization"],
    queryFn: fetchDirectUtilization,
  });
}

export function useDirectHeatmap(weeks = 26) {
  return useQuery<DirectHeatmapResponse>({
    queryKey: ["direct", "heatmap", weeks],
    queryFn: () => fetchDirectHeatmap(weeks),
  });
}

export function useDirectPersonHeatmap(weeks = 26) {
  return useQuery<DirectPersonHeatmapResponse>({
    queryKey: ["direct", "person-heatmap", weeks],
    queryFn: () => fetchDirectPersonHeatmap(weeks),
  });
}

export function useDirectProjects() {
  return useQuery<DirectProjectSummary[]>({
    queryKey: ["direct", "projects"],
    queryFn: fetchDirectProjects,
  });
}

export function useDirectProjectPlan(projectId: string | null) {
  return useQuery<DirectProjectPlanOut>({
    queryKey: ["direct", "project-plan", projectId],
    queryFn: () => fetchDirectProjectPlan(projectId as string),
    enabled: projectId !== null,
  });
}
