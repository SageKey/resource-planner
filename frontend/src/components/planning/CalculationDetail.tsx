import { useState } from "react";
import { ChevronDown, Calculator, Info } from "lucide-react";
import { useExplainProject } from "@/hooks/useExplain";
import { cn } from "@/lib/cn";

const ROLE_LABELS: Record<string, string> = {
  pm: "PM", ba: "BA", functional: "Functional", technical: "Technical",
  developer: "Developer", infrastructure: "Infra", dba: "DBA", erp: "ERP",
};

function statusColor(util: number): string {
  if (util < 0.8) return "text-emerald-600";
  if (util < 1.0) return "text-amber-600";
  return "text-red-600";
}

export function CalculationDetail({ projectId }: { projectId: string }) {
  const [expanded, setExpanded] = useState(false);
  const { data, isLoading, isError } = useExplainProject(expanded ? projectId : null);

  return (
    <div className="mt-1">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 hover:text-indigo-600 transition-colors"
      >
        <Calculator className="h-3 w-3" />
        {expanded ? "Hide calculation" : "Show calculation"}
        <ChevronDown className={cn("h-3 w-3 transition-transform", expanded && "rotate-180")} />
      </button>

      {expanded && (
        <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs space-y-4">
          {isLoading && (
            <div className="text-slate-400">Computing breakdown...</div>
          )}
          {isError && (
            <div className="text-red-500">Failed to load calculation detail.</div>
          )}
          {data && (
            <>
              {/* Reasoning steps */}
              <div>
                <div className="font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                  <Info className="h-3.5 w-3.5" />
                  How this date was calculated
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-600">
                  {data.reasoning.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ol>
              </div>

              {/* Role demand breakdown */}
              <div>
                <div className="font-semibold text-slate-700 mb-1.5">
                  Demand by Role
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-[10px] font-medium text-slate-500">
                      <th className="pb-1 pr-3">Role</th>
                      <th className="pb-1 pr-3 text-right">Alloc</th>
                      <th className="pb-1 pr-3 text-right">Role Hrs</th>
                      <th className="pb-1 pr-3 text-right">Demand/wk</th>
                      <th className="pb-1 pr-3 text-right">Supply/wk</th>
                      <th className="pb-1 pr-3 text-right">Existing</th>
                      <th className="pb-1 pr-3 text-right">Free</th>
                      <th className="pb-1 text-right">Util if added</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.role_details.map((r) => (
                      <tr key={r.role_key} className="border-b border-slate-100">
                        <td className="py-1 pr-3 font-medium text-slate-700">
                          {ROLE_LABELS[r.role_key] ?? r.role_key}
                        </td>
                        <td className="py-1 pr-3 text-right tabular-nums">{r.allocation_pct}%</td>
                        <td className="py-1 pr-3 text-right tabular-nums">{r.total_role_hours}h</td>
                        <td className="py-1 pr-3 text-right tabular-nums font-medium">{r.avg_weekly_demand}h</td>
                        <td className="py-1 pr-3 text-right tabular-nums">{r.supply_hrs_week}h</td>
                        <td className="py-1 pr-3 text-right tabular-nums">{r.existing_demand_hrs_week}h</td>
                        <td className="py-1 pr-3 text-right tabular-nums">{r.available_hrs_week}h</td>
                        <td className={cn("py-1 text-right tabular-nums font-medium", statusColor(r.utilization_if_added))}>
                          {Math.round(r.utilization_if_added * 100)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Phase breakdown */}
              {data.phase_breakdown.length > 0 && (
                <div>
                  <div className="font-semibold text-slate-700 mb-1.5">
                    Duration by SDLC Phase
                  </div>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-[10px] font-medium text-slate-500">
                        <th className="pb-1 pr-3">Phase</th>
                        <th className="pb-1 pr-3 text-right">Weight</th>
                        <th className="pb-1 pr-3 text-right">Duration</th>
                        <th className="pb-1">Bottleneck</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.phase_breakdown.map((p) => (
                        <tr key={p.phase} className="border-b border-slate-100">
                          <td className="py-1 pr-3 font-medium text-slate-700 capitalize">{p.phase}</td>
                          <td className="py-1 pr-3 text-right tabular-nums">{p.weight_pct}%</td>
                          <td className="py-1 pr-3 text-right tabular-nums">{p.duration_days}d</td>
                          <td className="py-1 text-slate-500">
                            {p.bottleneck_role ? (ROLE_LABELS[p.bottleneck_role] ?? p.bottleneck_role) : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Capacity at suggested start */}
              {data.capacity_at_suggested_start.length > 0 && (
                <div>
                  <div className="font-semibold text-slate-700 mb-1.5">
                    Capacity at Suggested Start
                  </div>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-[10px] font-medium text-slate-500">
                        <th className="pb-1 pr-3">Role</th>
                        <th className="pb-1 pr-3 text-right">Supply</th>
                        <th className="pb-1 pr-3 text-right">Existing</th>
                        <th className="pb-1 pr-3 text-right">Free</th>
                        <th className="pb-1 text-right">Util at start</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.capacity_at_suggested_start.map((r) => (
                        <tr key={r.role} className="border-b border-slate-100">
                          <td className="py-1 pr-3 font-medium text-slate-700">
                            {ROLE_LABELS[r.role] ?? r.role}
                          </td>
                          <td className="py-1 pr-3 text-right tabular-nums">{r.total_supply_hrs_wk}h</td>
                          <td className="py-1 pr-3 text-right tabular-nums">{r.existing_demand_hrs_wk}h</td>
                          <td className="py-1 pr-3 text-right tabular-nums">{r.available_hrs_wk}h</td>
                          <td className="py-1 text-right tabular-nums">{r.utilization_at_start}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Formulas */}
              <div className="rounded-md bg-white border border-slate-200 p-3 space-y-2">
                <div className="font-semibold text-slate-700">Formulas Used</div>
                <div>
                  <div className="font-medium text-slate-600">Demand:</div>
                  <div className="text-slate-500">{data.demand_formula}</div>
                </div>
                <div>
                  <div className="font-medium text-slate-600">Duration & Scheduling:</div>
                  <div className="text-slate-500">{data.formula}</div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
