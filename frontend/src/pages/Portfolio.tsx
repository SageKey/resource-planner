import { useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { usePortfolio } from "@/hooks/usePortfolio";
import { formatDate } from "@/lib/format";
import type { ProjectOut } from "@/types/project";

const HEALTH_STYLE: Record<string, string> = {
  "ON TRACK": "bg-emerald-100 text-emerald-800",
  "AT RISK": "bg-amber-100 text-amber-800",
  "NEEDS HELP": "bg-red-100 text-red-800",
  "NOT STARTED": "bg-slate-100 text-slate-600",
  "NEEDS FUNCTIONAL SPEC": "bg-blue-100 text-blue-800",
  "NEEDS TECHNICAL SPEC": "bg-blue-100 text-blue-800",
  PIPELINE: "bg-slate-100 text-slate-500",
  COMPLETE: "bg-emerald-50 text-emerald-600",
  POSTPONED: "bg-slate-100 text-slate-400",
};

function healthStyle(h: string | null | undefined): string {
  if (!h) return "bg-slate-100 text-slate-500";
  const up = h.toUpperCase();
  for (const [key, cls] of Object.entries(HEALTH_STYLE)) {
    if (up.includes(key)) return cls;
  }
  return "bg-slate-100 text-slate-500";
}

function healthText(h: string | null | undefined): string {
  if (!h) return "Unknown";
  // Strip emoji prefix
  return h.replace(/^[^\w]*/, "").trim();
}

export function Portfolio() {
  const { data: projects, isLoading, isError, error } = usePortfolio();
  const [filter, setFilter] = useState("");

  const filtered = (projects ?? []).filter(
    (p) =>
      !filter ||
      p.name.toLowerCase().includes(filter.toLowerCase()) ||
      p.id.toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <>
      <TopBar title="Portfolio" subtitle="All projects with role allocations and sizing.">
        <input
          type="text"
          placeholder="Search projects..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
        />
      </TopBar>
      <div className="p-8">
        {isLoading && (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
            Loading projects...
          </div>
        )}
        {isError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
            {(error as Error).message}
          </div>
        )}
        {filtered.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-medium text-slate-500">
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Health</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3 text-right">Hours</th>
                  <th className="px-4 py-3">T-Shirt</th>
                  <th className="px-4 py-3">Start</th>
                  <th className="px-4 py-3">End</th>
                  <th className="px-4 py-3 text-right">% Done</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-slate-50 hover:bg-slate-25 transition-colors"
                  >
                    <td className="px-4 py-2.5 font-mono text-xs text-slate-500">
                      {p.id}
                    </td>
                    <td className="px-4 py-2.5 font-medium text-slate-800">
                      {p.name}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${healthStyle(p.health)}`}
                      >
                        {healthText(p.health)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">{p.priority ?? "—"}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">
                      {p.est_hours > 0 ? p.est_hours.toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">
                      {p.tshirt_size ?? "—"}
                    </td>
                    <td className="px-4 py-2.5 text-slate-500 tabular-nums">
                      {formatDate(p.start_date)}
                    </td>
                    <td className="px-4 py-2.5 text-slate-500 tabular-nums">
                      {formatDate(p.end_date)}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">
                      {Math.round(p.pct_complete * 100)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!isLoading && filtered.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
            No projects found. Import data or add projects to get started.
          </div>
        )}
      </div>
    </>
  );
}
