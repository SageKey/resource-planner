import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/cn";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { useHeatmapDetail } from "@/hooks/useCapacity";
import type { HeatmapResponse } from "@/types/capacity";

const ROLE_LABELS: Record<string, string> = {
  pm: "PM",
  ba: "BA",
  functional: "Functional",
  technical: "Technical",
  developer: "Developer",
  infrastructure: "Infrastructure",
  dba: "DBA",
  erp: "ERP",
  "wms consultant": "WMS Consultant",
};

function cellColor(util: number): string {
  if (util <= 0) return "bg-slate-50";
  if (util < 0.8) return "bg-emerald-100 text-emerald-800";
  if (util < 1.0) return "bg-amber-200 text-amber-900";
  if (util < 1.25) return "bg-red-300 text-red-900";
  return "bg-red-500 text-white";
}

interface Props {
  data: HeatmapResponse;
}

interface SelectedCell {
  roleKey: string;
  weekIdx: number;
}

export function HeatmapGrid({ data }: Props) {
  const [selected, setSelected] = useState<SelectedCell | null>(null);

  const handleCellClick = (roleKey: string, weekIdx: number, util: number) => {
    if (util <= 0) return;
    if (selected?.roleKey === roleKey && selected?.weekIdx === weekIdx) {
      setSelected(null);
    } else {
      setSelected({ roleKey, weekIdx });
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="mb-4 text-sm font-semibold text-slate-700">
        26-Week Capacity Heatmap
        <InfoTooltip>
          <div className="font-semibold text-slate-800">How the Role Heatmap works</div>
          <p>Each cell shows the <strong>utilization %</strong> for that role in that week. <strong>Click any cell</strong> to see which projects contribute.</p>
          <p><strong>Demand per week</strong> varies by SDLC phase. During Build (heaviest phase), developers have high demand. During Discovery, BAs are busiest.</p>
          <p>The phase distribution is configured on the <strong>Settings</strong> page under Phase Weights and Role-Phase Effort Matrix.</p>
          <p><strong>This shows ALL project demand</strong> for the role — whether or not specific people are assigned.</p>
          <p className="text-slate-400">Colors: empty=0%, green &lt;80%, yellow 80-99%, red 100-124%, dark red 125%+.</p>
        </InfoTooltip>
      </h2>

      {/* Legend */}
      <div className="mb-3 flex items-center gap-3 text-[10px] text-slate-500">
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-slate-50 border border-slate-200" />
          0%
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-emerald-100" />
          &lt;80%
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-amber-200" />
          80-99%
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-red-300" />
          100-124%
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-red-500" />
          125%+
        </span>
        <span className="ml-2 text-slate-400">Click a cell to see project breakdown</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-white px-2 py-1.5 text-left font-medium text-slate-500 min-w-[80px]">
                Role
              </th>
              {data.weeks.map((w) => (
                <th
                  key={w}
                  className="min-w-[52px] px-0.5 py-1.5 text-center font-normal text-slate-400"
                >
                  {w}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row) => (
              <tr key={row.role_key}>
                <td className="sticky left-0 z-10 bg-white px-2 py-1 font-medium text-slate-600">
                  {ROLE_LABELS[row.role_key] ?? row.role_key}
                </td>
                {row.cells.map((util, i) => {
                  const isSelected =
                    selected?.roleKey === row.role_key && selected?.weekIdx === i;
                  return (
                    <td key={i} className="px-0.5 py-0.5">
                      <div
                        onClick={() => handleCellClick(row.role_key, i, util)}
                        className={cn(
                          "flex h-6 items-center justify-center rounded text-[10px] font-medium tabular-nums",
                          cellColor(util),
                          util > 0 && "cursor-pointer hover:ring-2 hover:ring-indigo-400 hover:ring-offset-1",
                          isSelected && "ring-2 ring-indigo-500 ring-offset-1",
                        )}
                      >
                        {util > 0 ? `${Math.round(util * 100)}` : ""}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail panel below the heatmap */}
      {selected && (
        <CellDetail
          roleKey={selected.roleKey}
          weekIdx={selected.weekIdx}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function CellDetail({
  roleKey,
  weekIdx,
  onClose,
}: {
  roleKey: string;
  weekIdx: number;
  onClose: () => void;
}) {
  const { data, isLoading } = useHeatmapDetail(roleKey, weekIdx);
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div ref={ref} className="mt-4 rounded-lg border border-indigo-200 bg-indigo-50/30 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold text-slate-800">
          {ROLE_LABELS[roleKey] ?? roleKey} — Week of {data?.week_label ?? "..."}
        </div>
        <button
          onClick={onClose}
          className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
        >
          Close
        </button>
      </div>

      {isLoading && (
        <div className="text-xs text-slate-400">Loading breakdown...</div>
      )}

      {data && (
        <>
          <div className="flex gap-4 mb-3 text-xs">
            <div>
              <span className="text-slate-500">Supply:</span>{" "}
              <span className="font-semibold text-slate-700">{data.supply_hrs}h/wk</span>
            </div>
            <div>
              <span className="text-slate-500">Demand:</span>{" "}
              <span className="font-semibold text-slate-700">{data.total_demand_hrs}h/wk</span>
            </div>
            <div>
              <span className="text-slate-500">Utilization:</span>{" "}
              <span className="font-semibold text-slate-700">
                {Math.round(data.utilization_pct * 100)}%
              </span>
            </div>
          </div>

          {data.projects.length > 0 ? (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-indigo-200/50 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="pb-1.5 pr-3">Project</th>
                  <th className="pb-1.5 pr-3">Phase</th>
                  <th className="pb-1.5 pr-3 text-right">Role Alloc</th>
                  <th className="pb-1.5 pr-3 text-right">Est Hours</th>
                  <th className="pb-1.5 pr-3 text-right">% Done</th>
                  <th className="pb-1.5 text-right">Demand/wk</th>
                </tr>
              </thead>
              <tbody>
                {data.projects.map((p) => (
                  <tr key={p.project_id} className="border-b border-indigo-100/50">
                    <td className="py-1.5 pr-3">
                      <span className="font-mono text-slate-400">{p.project_id}</span>{" "}
                      <span className="font-medium text-slate-700">{p.project_name}</span>
                    </td>
                    <td className="py-1.5 pr-3 capitalize text-slate-500">{p.phase}</td>
                    <td className="py-1.5 pr-3 text-right tabular-nums text-slate-600">
                      {Math.round(p.role_alloc * 100)}%
                    </td>
                    <td className="py-1.5 pr-3 text-right tabular-nums text-slate-600">
                      {p.est_hours}h
                    </td>
                    <td className="py-1.5 pr-3 text-right tabular-nums text-slate-600">
                      {Math.round(p.pct_complete * 100)}%
                    </td>
                    <td className="py-1.5 text-right tabular-nums font-semibold text-slate-800">
                      {p.demand_hrs}h
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-xs text-slate-400">No projects contributing demand this week.</div>
          )}
        </>
      )}
    </div>
  );
}
