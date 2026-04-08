import { TopBar } from "@/components/layout/TopBar";
import { UtilizationBars } from "@/components/capacity/UtilizationBars";
import { HeatmapGrid } from "@/components/capacity/HeatmapGrid";
import { PersonHeatmapGrid } from "@/components/capacity/PersonHeatmapGrid";
import { useHeatmap, useUtilization, usePersonHeatmap } from "@/hooks/useCapacity";

export function Capacity() {
  const util = useUtilization();
  const heat = useHeatmap(26);
  const personHeat = usePersonHeatmap(26);

  return (
    <>
      <TopBar
        title="Capacity"
        subtitle="Role-level utilization and 26-week forward view."
      />
      <div className="space-y-6 p-8">
        {util.isLoading && <LoadingCard text="Computing utilization..." />}
        {util.isError && <ErrorCard err={util.error as Error} />}
        {util.data?.roles && <UtilizationBars roles={util.data.roles} />}

        {heat.isLoading && <LoadingCard text="Building heatmap..." />}
        {heat.isError && <ErrorCard err={heat.error as Error} />}
        {heat.data?.rows && <HeatmapGrid data={heat.data} />}

        {personHeat.isLoading && <LoadingCard text="Building person heatmap..." />}
        {personHeat.isError && <ErrorCard err={personHeat.error as Error} />}
        {personHeat.data?.people && <PersonHeatmapGrid data={personHeat.data} />}
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
