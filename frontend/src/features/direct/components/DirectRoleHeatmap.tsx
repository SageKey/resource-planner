// -------------------------------------------------------------------------
// Direct Model — role heatmap (Round 1, display-only)
// -------------------------------------------------------------------------
// Duplicated from components/capacity/HeatmapGrid.tsx so the Direct
// feature can stay isolated (HeatmapGrid calls a v1 drill-down hook that
// would return v1 project breakdowns for Direct cells — wrong data).
// Round 1 is display-only, so we simply omit the cell-click detail view.
// -------------------------------------------------------------------------

import { cn } from "@/lib/cn";
import { DIRECT_ROLE_LABEL } from "../constants";
import type { DirectHeatmapResponse } from "../types";

function cellColor(util: number): string {
  if (util <= 0) return "bg-slate-50";
  if (util < 0.8) return "bg-emerald-100 text-emerald-800";
  if (util < 1.0) return "bg-amber-200 text-amber-900";
  if (util < 1.25) return "bg-red-300 text-red-900";
  return "bg-red-500 text-white";
}

export function DirectRoleHeatmap({ data }: { data: DirectHeatmapResponse }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="mb-2 text-sm font-semibold text-slate-700">
        26-Week Role Heatmap
      </h2>
      <p className="mb-3 text-[11px] text-slate-500">
        Cells are weekly role demand ÷ role supply, using the explicit
        hours-per-week from each seeded Direct Model phase plan. No SDLC
        percentages, no pct-complete averaging.
      </p>

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
                  {DIRECT_ROLE_LABEL[row.role_key] ?? row.role_key}
                </td>
                {row.cells.map((util, i) => (
                  <td key={i} className="px-0.5 py-0.5">
                    <div
                      className={cn(
                        "flex h-6 items-center justify-center rounded text-[10px] font-medium tabular-nums",
                        cellColor(util),
                      )}
                    >
                      {util > 0 ? `${Math.round(util * 100)}` : ""}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
