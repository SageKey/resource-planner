import { cn } from "@/lib/cn";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
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

export function HeatmapGrid({ data }: Props) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="mb-4 text-sm font-semibold text-slate-700">
        26-Week Capacity Heatmap
        <InfoTooltip>
          <div className="font-semibold text-slate-800">How the Role Heatmap works</div>
          <p>Each cell shows the <strong>utilization %</strong> for that role in that week.</p>
          <p><strong>Demand per week</strong> varies by SDLC phase. During Build (heaviest phase), developers have high demand. During Discovery, BAs are busiest.</p>
          <p>The phase distribution is configured on the <strong>Settings</strong> page under Phase Weights and Role-Phase Effort Matrix.</p>
          <p><strong>This shows ALL project demand</strong> for the role — whether or not specific people are assigned. It answers "do we have enough of this role type?"</p>
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
