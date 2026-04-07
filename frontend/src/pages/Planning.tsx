import { useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { useSchedulePortfolio } from "@/hooks/useScenario";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";

export function Planning() {
  const schedule = useSchedulePortfolio();
  const [hasRun, setHasRun] = useState(false);

  const runScheduler = () => {
    schedule.mutate({ horizon_weeks: 52 });
    setHasRun(true);
  };

  const data = schedule.data;

  return (
    <>
      <TopBar title="Planning" subtitle="Auto-schedule projects and explore what-if scenarios.">
        <button
          onClick={runScheduler}
          disabled={schedule.isPending}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {schedule.isPending ? "Scheduling..." : "Run Scheduler"}
        </button>
      </TopBar>
      <div className="p-8 space-y-6">
        {!hasRun && (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
            Click "Run Scheduler" to see suggested project start dates based on team capacity.
          </div>
        )}

        {schedule.isError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
            {(schedule.error as Error).message}
          </div>
        )}

        {data && (
          <>
            {/* Summary */}
            <div className="grid grid-cols-4 gap-4">
              <SummaryCard label="In-Flight" value={data.in_flight.length} color="blue" />
              <SummaryCard label="Can Start Now" value={data.can_start_now_count} color="green" />
              <SummaryCard label="Waiting" value={data.waiting_count} color="amber" />
              <SummaryCard label="Infeasible" value={data.infeasible_count} color="red" />
            </div>

            {/* In-Flight Projects */}
            {data.in_flight.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <h3 className="mb-3 text-sm font-semibold text-slate-700">
                  In-Flight (consuming capacity)
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-left text-xs font-medium text-slate-500">
                        <th className="px-3 py-2">Project</th>
                        <th className="px-3 py-2">Priority</th>
                        <th className="px-3 py-2 text-right">Hours</th>
                        <th className="px-3 py-2 text-right">% Done</th>
                        <th className="px-3 py-2">Start</th>
                        <th className="px-3 py-2">End</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.in_flight.map((p) => (
                        <tr key={p.project_id} className="border-b border-slate-50">
                          <td className="px-3 py-2 font-medium text-slate-800">{p.project_name}</td>
                          <td className="px-3 py-2 text-slate-600">{p.priority}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{p.est_hours.toLocaleString()}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{Math.round(p.pct_complete * 100)}%</td>
                          <td className="px-3 py-2 tabular-nums text-slate-500">{formatDate(p.start_date)}</td>
                          <td className="px-3 py-2 tabular-nums text-slate-500">{formatDate(p.end_date)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Scheduled Projects */}
            {data.projects.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <h3 className="mb-3 text-sm font-semibold text-slate-700">
                  Plannable Projects (suggested dates)
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-left text-xs font-medium text-slate-500">
                        <th className="px-3 py-2">Project</th>
                        <th className="px-3 py-2">Priority</th>
                        <th className="px-3 py-2 text-right">Hours</th>
                        <th className="px-3 py-2">Suggested Start</th>
                        <th className="px-3 py-2">Suggested End</th>
                        <th className="px-3 py-2 text-right">Wait</th>
                        <th className="px-3 py-2">Bottleneck</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.projects.map((p) => (
                        <tr key={p.project_id} className="border-b border-slate-50">
                          <td className="px-3 py-2 font-medium text-slate-800">{p.project_name}</td>
                          <td className="px-3 py-2 text-slate-600">{p.priority}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{p.est_hours.toLocaleString()}</td>
                          <td className="px-3 py-2 tabular-nums">
                            {p.suggested_start ? (
                              <span className={cn(p.can_start_now && "text-emerald-600 font-medium")}>
                                {formatDate(p.suggested_start)}
                              </span>
                            ) : (
                              <span className="text-red-500">No slot found</span>
                            )}
                          </td>
                          <td className="px-3 py-2 tabular-nums text-slate-500">
                            {formatDate(p.suggested_end)}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums text-slate-600">
                            {p.wait_weeks != null ? `${p.wait_weeks}w` : "—"}
                          </td>
                          <td className="px-3 py-2 text-slate-500">
                            {p.bottleneck_role ?? "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

function SummaryCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "blue" | "green" | "amber" | "red";
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    red: "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <div className={cn("rounded-xl border p-4", colors[color])}>
      <div className="text-2xl font-bold tabular-nums">{value}</div>
      <div className="text-xs font-medium opacity-80">{label}</div>
    </div>
  );
}
