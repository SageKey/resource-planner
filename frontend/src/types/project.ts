export interface ProjectOut {
  id: string;
  name: string;
  type?: string | null;
  portfolio?: string | null;
  sponsor?: string | null;
  health?: string | null;
  pct_complete: number;
  priority?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  actual_end?: string | null;
  team?: string | null;
  pm?: string | null;
  ba?: string | null;
  functional_lead?: string | null;
  technical_lead?: string | null;
  developer_lead?: string | null;
  tshirt_size?: string | null;
  est_hours: number;
  role_allocations: Record<string, number>;
  notes?: string | null;
  sort_order?: number | null;
  is_active: boolean;
  duration_weeks?: number | null;
}
