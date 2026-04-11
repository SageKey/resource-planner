// -------------------------------------------------------------------------
// Direct Model — TypeScript response types (Round 1)
// -------------------------------------------------------------------------
// Mirrors backend/app/schemas/capacity_direct.py and the shared capacity
// schemas that Direct endpoints intentionally reuse.
// -------------------------------------------------------------------------

import type {
  UtilizationResponse,
  HeatmapResponse,
} from "@/types/capacity";

export type DirectUtilizationResponse = UtilizationResponse;
export type DirectHeatmapResponse = HeatmapResponse;

export interface DirectPersonRow {
  name: string;
  role_key: string;
  role: string;
  team: string;
  capacity_hrs_week: number;
  include_in_capacity: boolean;
  cells: number[];
}

export interface DirectPersonHeatmapResponse {
  weeks: string[];
  people: DirectPersonRow[];
}

export interface DirectPhaseOut {
  name: string;
  order: number;
  duration_weeks: number;
  role_weekly_hours: Record<string, number>;
}

export interface DirectProjectPlanOut {
  project_id: string;
  project_name: string;
  total_duration_weeks: number;
  total_hours: number;
  phases: DirectPhaseOut[];
  role_totals: Record<string, number>;
  start_date?: string | null;
  end_date?: string | null;
}

export interface DirectProjectSummary {
  project_id: string;
  project_name: string;
  total_duration_weeks: number;
  total_hours: number;
  phase_count: number;
}
