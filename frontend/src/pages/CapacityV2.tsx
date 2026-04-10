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

/**
 * CapacityV2
 *
 * Parallel "Simplified SDLC" capacity page using the v2 (3-phase) model:
 * Planning / Execution / Testing · Go Live. Reuses every v1 visualization
 * component — they're all phase-agnostic — just feeds them data computed
 * with v2 phase weights and role efforts.
 *
 * Extra section vs v1: Team Allocation cards at the top of the
 * person-level section, giving an exec-friendly scan of who's busy, who's
 * free, and who's overloaded this week.
 */
export function CapacityV2() {
  const util = useUtilizationV2();
  const coverage = useAssignmentCoverageV2();
  const matrix = useAssignmentMatrix();
  const heat = useHeatmapV2(26);
  const personHeat = usePersonHeatmapV2(26);

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
        {util.isLoading && <LoadingCard text="Computing v2 utilization..." />}
        {util.isError && <ErrorCard err={util.error as Error} />}
        {util.data?.roles && (
          <UtilizationBars
            roles={util.data.roles}
            coverage={coverage.data}
            assignments={matrix.data?.assignments}
          />
        )}

        {heat.isLoading && <LoadingCard text="Building v2 heatmap..." />}
        {heat.isError && <ErrorCard err={heat.error as Error} />}
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
