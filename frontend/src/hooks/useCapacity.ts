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

export interface RoleCoverage {
  supply_hrs_week: number;
  assigned_hrs_week: number;
  unassigned_hrs_week: number;
  total_demand_hrs_week: number;
  assigned_pct: number;
  unassigned_pct: number;
}

export function useAssignmentCoverage() {
  return useQuery<Record<string, RoleCoverage>>({
    queryKey: ["capacity", "assignment-coverage"],
    queryFn: () =>
      api.get("/capacity/assignment-coverage").then((r) => r.data),
  });
}

export interface PersonHeatmapRow {
  name: string;
  role_key: string;
  role: string;
  team: string;
  capacity_hrs_week: number;
  cells: number[];
}

export interface PersonHeatmapResponse {
  weeks: string[];
  people: PersonHeatmapRow[];
}

export function usePersonHeatmap(weeks = 26) {
  return useQuery<PersonHeatmapResponse>({
    queryKey: ["capacity", "person-heatmap", weeks],
    queryFn: () =>
      api.get("/capacity/person-heatmap", { params: { weeks } }).then((r) => r.data),
  });
}
