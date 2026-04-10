import { useMemo } from "react";
import { AlertTriangle } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { UtilizationBars } from "@/components/capacity/UtilizationBars";
import { HeatmapGrid } from "@/components/capacity/HeatmapGrid";
import { PersonHeatmapGrid } from "@/components/capacity/PersonHeatmapGrid";
import { TeamAllocationCards } from "@/components/capacity/TeamAllocationCards";
import {
  useHeatmapV2,
  useUtilizationV2,
  usePersonHeatmapV2,
  useAssignmentCoverageV2,
} from "@/hooks/useCapacityV2";
import { useAssignmentMatrix } from "@/hooks/useAssignments";
import type {
  RoleUtilizationOut,
  UtilizationResponse,
  HeatmapResponse,
} from "@/types/capacity";

/**
 * CapacityV2
 *
 * Parallel "Simplified SDLC" capacity page using the v2 (3-phase) model:
 * Planning / Execution / Testing · Go Live. Reuses every v1 visualization
 * component — they're all phase-agnostic — just feeds them data computed
 * with v2 phase weights and role efforts.
 *
 * Key design difference from v1: the top role utilization bars show
 * CURRENT-WEEK utilization (from the phase-aware heatmap) instead of the
 * project-average utilization. Project-average is identical between v1
 * and v2 because the averaging formula doesn't use phase weights; it's
 * only the per-week distribution that differs. Showing current-week here
 * is what gives v2 its visible "chunkier numbers" story for Jim.
 *
 * A small subtext per role shows the peak utilization over the next 13
 * weeks so execs can see the near-term worst-case alongside this week.
 *
 * The detail modal (click a role row) keeps showing v2 project-average
 * demand breakdown; reconciling the modal to current-week numbers is
 * out of scope for round 1.
 */
export function CapacityV2() {
  const util = useUtilizationV2();
  const coverage = useAssignmentCoverageV2();
  const matrix = useAssignmentMatrix();
  const heat = useHeatmapV2(26);
  const personHeat = usePersonHeatmapV2(26);

  const { rolesForBars, totalByRole } = useMemo(
    () => buildCurrentWeekBars(util.data, heat.data),
    [util.data, heat.data],
  );

  return (
    <>
      <TopBar
        title="Capacity — Simplified SDLC"
        subtitle="3-phase model: Planning / Execution / Testing · Go Live."
      >
        <span className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-800">
          <AlertTriangle className="h-3 w-3" />
          Simplified SDLC
        </span>
      </TopBar>
      <div className="space-y-6 p-8">
        {(util.isLoading || heat.isLoading) && (
          <LoadingCard text="Computing v2 role utilization..." />
        )}
        {util.isError && <ErrorCard err={util.error as Error} />}
        {heat.isError && <ErrorCard err={heat.error as Error} />}
        {rolesForBars && (
          <UtilizationBars
            roles={rolesForBars}
            coverage={coverage.data}
            assignments={matrix.data?.assignments}
            title="Role Utilization"
            titleNote="Bar and ‘This Wk’ show current-week load under the Simplified SDLC. ‘Total’ is the project-average baseline. See the heatmap below for the full 26-week forward view."
            totalByRole={totalByRole}
          />
        )}

        {heat.data?.rows && <HeatmapGrid data={heat.data} />}

        {personHeat.isLoading && <LoadingCard text="Building team allocation view..." />}
        {personHeat.isError && <ErrorCard err={personHeat.error as Error} />}
        {personHeat.data?.people && (
          <>
            <TeamAllocationCards data={personHeat.data} />
            <PersonHeatmapGrid data={personHeat.data} />
          </>
        )}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Derived "current week" utilization for the top bars
// ---------------------------------------------------------------------------

/**
 * Build a Record<string, RoleUtilizationOut> from the v2 utilization
 * response and the v2 heatmap response. The aggregate (project-average)
 * utilization values are replaced with current-week values pulled from
 * the heatmap's first cell. Supply and demand_breakdown are preserved
 * from the aggregate response so the detail modal keeps working.
 *
 * Also returns a `totalByRole` map keyed by role_key holding the original
 * project-average utilization (the v1/v2 aggregate — phase-invariant).
 * UtilizationBars uses this to render a "Total" column next to the
 * "This Wk" column.
 */
function buildCurrentWeekBars(
  utilData: UtilizationResponse | undefined,
  heatData: HeatmapResponse | undefined,
): {
  rolesForBars: Record<string, RoleUtilizationOut> | null;
  totalByRole: Record<string, number>;
} {
  if (!utilData?.roles || !heatData?.rows) {
    return { rolesForBars: null, totalByRole: {} };
  }

  // Build a quick lookup of heatmap rows by role_key
  const heatByRole: Record<
    string,
    { supply: number; cells: number[] }
  > = {};
  for (const row of heatData.rows) {
    heatByRole[row.role_key] = {
      supply: row.supply_hrs_week,
      cells: row.cells,
    };
  }

  const rolesForBars: Record<string, RoleUtilizationOut> = {};
  const totalByRole: Record<string, number> = {};

  for (const [roleKey, aggRole] of Object.entries(utilData.roles)) {
    // Capture the original aggregate (project-average) number BEFORE we
    // overwrite utilization_pct with current-week.
    totalByRole[roleKey] = aggRole.utilization_pct;

    const hr = heatByRole[roleKey];
    if (!hr) {
      // Role doesn't appear in heatmap (e.g., no supply) — fall back to
      // the aggregate row unchanged.
      rolesForBars[roleKey] = aggRole;
      continue;
    }

    const currentPct = hr.cells[0] ?? 0;
    const supplyHrs = hr.supply;
    const currentDemandHrs = currentPct * supplyHrs;

    rolesForBars[roleKey] = {
      ...aggRole,
      supply_hrs_week: supplyHrs,
      demand_hrs_week: currentDemandHrs,
      utilization_pct: currentPct,
      status: statusFromPct(currentPct, supplyHrs, currentDemandHrs),
    };
  }

  return { rolesForBars, totalByRole };
}

/** Map a 0..∞ utilization ratio to the backend's status string codes.
 *  Mirrors the thresholds used by the engine's _utilization_status. */
function statusFromPct(pct: number, supply: number, demand: number): string {
  if (supply === 0 && demand > 0) return "GREY";
  if (pct >= 1.0) return "RED";
  if (pct >= 0.8) return "YELLOW";
  if (pct >= 0.7) return "GREEN";
  return "BLUE";
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function LoadingCard({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
      {text}
    </div>
  );
}

function ErrorCard({ err }: { err: Error }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
      {err.message}
    </div>
  );
}
