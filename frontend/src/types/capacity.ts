export interface RoleDemandOut {
  project_id: string;
  project_name: string;
  role_key: string;
  role_alloc_pct: number;
  weekly_hours: number;
}

export interface RoleUtilizationOut {
  role_key: string;
  supply_hrs_week: number;
  demand_hrs_week: number;
  utilization_pct: number;
  status: string;
  demand_breakdown: RoleDemandOut[];
}

export interface UtilizationResponse {
  roles: Record<string, RoleUtilizationOut>;
}

export interface HeatmapRow {
  role_key: string;
  supply_hrs_week: number;
  cells: number[];
}

export interface HeatmapResponse {
  weeks: string[];
  rows: HeatmapRow[];
}
