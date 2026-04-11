// -------------------------------------------------------------------------
// Direct Model — Capacity page (Round 1)
// -------------------------------------------------------------------------
// Parallel third track alongside v1 Capacity and v2 Simplified SDLC.
// Shows only projects that have been seeded with an explicit Direct
// Model phase plan (Round 1 = just ETE-124). No percentages: the numbers
// are pulled directly from per-phase weekly hours stored in the
// direct_project_phases tables.
// -------------------------------------------------------------------------

import { AlertTriangle } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { UtilizationBars } from "@/components/capacity/UtilizationBars";
import { DirectRoleHeatmap } from "../components/DirectRoleHeatmap";
import { DirectPersonHeatmap } from "../components/DirectPersonHeatmap";
import { DirectPhasePlanCard } from "../components/DirectPhasePlanCard";
import { DirectProjectResourcesCard } from "../components/DirectProjectResourcesCard";
import {
  useDirectUtilization,
  useDirectHeatmap,
  useDirectPersonHeatmap,
  useDirectProjects,
  useDirectProjectPlan,
} from "../hooks";

export function DirectCapacity() {
  const util = useDirectUtilization();
  const heat = useDirectHeatmap(26);
  const personHeat = useDirectPersonHeatmap(26);
  const projects = useDirectProjects();

  // Round 1: just the first (only) seeded project.
  const firstProjectId = projects.data?.[0]?.project_id ?? null;
  const plan = useDirectProjectPlan(firstProjectId);

  return (
    <>
      <TopBar
        title="Capacity — Direct Model"
        subtitle="Round 1 · explicit hours/week per role per phase, no percentages."
      >
        <span className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-800">
          <AlertTriangle className="h-3 w-3" />
          Direct Model · Round 1
        </span>
      </TopBar>

      <div className="space-y-6 p-8">
        {/* Loading / error states */}
        {(util.isLoading || heat.isLoading || projects.isLoading) && (
          <LoadingCard text="Loading Direct Model data..." />
        )}
        {util.isError && <ErrorCard err={util.error as Error} />}
        {heat.isError && <ErrorCard err={heat.error as Error} />}
        {projects.isError && <ErrorCard err={projects.error as Error} />}

        {/* Phase plan card — shows the seeded template */}
        {plan.data && <DirectPhasePlanCard plan={plan.data} />}
        {plan.isError && <ErrorCard err={plan.error as Error} />}

        {/* Per-project resources + utilization */}
        {plan.data && <DirectProjectResourcesCard plan={plan.data} />}

        {/* Role utilization bars (reused from shared components) */}
        {util.data?.roles && (
          <UtilizationBars
            roles={util.data.roles}
            title="Role Utilization — This Week"
            titleNote="Current-week demand from Direct Model plans only. Click a row for the per-project breakdown."
          />
        )}

        {/* Role heatmap — 26 weeks forward */}
        {heat.data?.rows && <DirectRoleHeatmap data={heat.data} />}

        {/* Person-level heatmap */}
        {personHeat.isLoading && <LoadingCard text="Building person heatmap..." />}
        {personHeat.isError && <ErrorCard err={personHeat.error as Error} />}
        {personHeat.data?.people && <DirectPersonHeatmap data={personHeat.data} />}

        {/* Round 1 footer note */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
          <strong className="text-slate-700">Round 1 scope:</strong>{" "}
          Only projects with a seeded Direct Model phase plan appear here.
          To add another project, run{" "}
          <code className="rounded bg-slate-200 px-1 font-mono text-[11px] text-slate-700">
            python backend/scripts/seed_direct_clean_up_return_loads.py
          </code>
          {" "}(or a new seed script). Editing UI and per-person drill-down
          land in Round 2.
        </div>
      </div>
    </>
  );
}

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
