import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export interface RoleDetail {
  role_key: string;
  allocation_pct: number;
  total_role_hours: number;
  avg_weekly_demand: number;
  supply_hrs_week: number;
  existing_demand_hrs_week: number;
  available_hrs_week: number;
  utilization_if_added: number;
}

export interface PhaseDetail {
  phase: string;
  weight_pct: number;
  duration_days: number;
  bottleneck_role: string | null;
  roles: { role: string; hours: number; capacity_per_week: number; weeks_needed: number }[];
}

export interface ScheduleExplanation {
  project_id: string;
  project_name: string;
  est_hours: number;
  duration_weeks: number;
  suggested_start: string | null;
  suggested_end: string | null;
  wait_weeks: number | null;
  bottleneck_role: string | null;
  formula: string;
  demand_formula: string;
  supply_summary: Record<string, { supply_hrs_week: number; headcount: number }>;
  role_details: RoleDetail[];
  phase_breakdown: PhaseDetail[];
  capacity_at_suggested_start: {
    role: string;
    total_supply_hrs_wk: number;
    existing_demand_hrs_wk: number;
    available_hrs_wk: number;
    utilization_at_start: string;
  }[];
  reasoning: string[];
}

export function useExplainProject(projectId: string | null) {
  return useQuery<ScheduleExplanation>({
    queryKey: ["explain", projectId],
    queryFn: () =>
      api.get(`/explain/project/${projectId}`).then((r) => r.data),
    enabled: !!projectId,
  });
}

export interface FormulaReference {
  [key: string]: {
    formula?: string;
    explanation: string;
    example?: string;
  };
}

export function useFormulas() {
  return useQuery<FormulaReference>({
    queryKey: ["explain", "formulas"],
    queryFn: () => api.get("/explain/formulas").then((r) => r.data),
  });
}
