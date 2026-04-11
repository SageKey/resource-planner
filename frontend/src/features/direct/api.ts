// -------------------------------------------------------------------------
// Direct Model — axios helpers (Round 1)
// -------------------------------------------------------------------------

import api from "@/lib/api";
import type {
  DirectUtilizationResponse,
  DirectHeatmapResponse,
  DirectPersonHeatmapResponse,
  DirectProjectPlanOut,
  DirectProjectSummary,
} from "./types";

export async function fetchDirectUtilization(): Promise<DirectUtilizationResponse> {
  const r = await api.get("/direct/capacity/utilization");
  return r.data;
}

export async function fetchDirectHeatmap(weeks = 26): Promise<DirectHeatmapResponse> {
  const r = await api.get("/direct/capacity/heatmap", { params: { weeks } });
  return r.data;
}

export async function fetchDirectPersonHeatmap(
  weeks = 26,
): Promise<DirectPersonHeatmapResponse> {
  const r = await api.get("/direct/capacity/person-heatmap", { params: { weeks } });
  return r.data;
}

export async function fetchDirectProjects(): Promise<DirectProjectSummary[]> {
  const r = await api.get("/direct/projects");
  return r.data;
}

export async function fetchDirectProjectPlan(
  projectId: string,
): Promise<DirectProjectPlanOut> {
  const r = await api.get(`/direct/projects/${projectId}/plan`);
  return r.data;
}
