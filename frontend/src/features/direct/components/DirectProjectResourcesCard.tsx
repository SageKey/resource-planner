// -------------------------------------------------------------------------
// Direct Model — project resources + utilization card (Round 1)
// -------------------------------------------------------------------------
// Per-project view that answers "who is on ETE-124 and how hard does
// this one project load each of them?". For every role that has hours
// in the plan, shows the assignee, that person's weekly project
// capacity, the current-phase demand, the peak-phase demand, and what
// percentage of the person's bench this project consumes in each case.
// -------------------------------------------------------------------------

import { Users } from "lucide-react";
import { cn } from "@/lib/cn";
import { avatarTone } from "@/lib/format";
import {
  DIRECT_PHASE_LABEL,
  DIRECT_ROLE_LABEL,
  DIRECT_ROLE_ORDER,
} from "../constants";
import type { DirectProjectPlanOut, DirectResourceRow } from "../types";

interface Props {
  plan: DirectProjectPlanOut;
}

/** Pill color for a 0..∞ ratio. Mirrors the heatmap color vocabulary. */
function pctPillClass(pct: number | null): string {
  if (pct === null) return "bg-slate-100 text-slate-500";
  if (pct >= 1.0) return "bg-red-100 text-red-700";
  if (pct >= 0.8) return "bg-amber-100 text-amber-700";
  if (pct >= 0.5) return "bg-sky-100 text-sky-700";
  return "bg-emerald-100 text-emerald-700";
}

function fmtPct(pct: number | null): string {
  if (pct === null) return "—";
  return `${Math.round(pct * 100)}%`;
}

function fmtHrs(hrs: number): string {
  return `${Math.round(hrs * 10) / 10}h`;
}

export function DirectProjectResourcesCard({ plan }: Props) {
  // Sort rows by canonical role order for consistent reading.
  const orderIndex = new Map<string, number>(
    DIRECT_ROLE_ORDER.map((rk, i) => [rk, i]),
  );
  const rows = [...plan.resources].sort((a, b) => {
    const ai = orderIndex.get(a.role_key) ?? 99;
    const bi = orderIndex.get(b.role_key) ?? 99;
    if (ai !== bi) return ai - bi;
    return (a.person_name ?? "").localeCompare(b.person_name ?? "");
  });

  const currentPhaseName = rows.find((r) => r.current_phase_name)?.current_phase_name ?? null;
  const phaseLabel = currentPhaseName ? DIRECT_PHASE_LABEL[currentPhaseName] ?? currentPhaseName : null;

  // Summary chip: how many roles are assigned vs unassigned
  const assignedCount = rows.filter((r) => r.person_name).length;
  const unassignedCount = rows.filter((r) => !r.person_name).length;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-700">
            Project Resources & Utilization
          </h2>
          <p className="mt-0.5 text-[11px] text-slate-500">
            How much of each assignee's week this one project consumes.
            {phaseLabel && (
              <>
                {" "}Currently in{" "}
                <span className="font-medium text-slate-700">{phaseLabel}</span>.
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
          <Users className="h-3 w-3" />
          {assignedCount} assigned
          {unassignedCount > 0 && (
            <span className="text-amber-700">
              {" "}· {unassignedCount} unassigned
            </span>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              <th className="pb-2 pr-4">Role</th>
              <th className="pb-2 pr-4">Assignee</th>
              <th className="pb-2 pr-3 text-right">Their Capacity</th>
              <th className="pb-2 pr-3 text-right">This Week</th>
              <th className="pb-2 pr-3 text-right">Peak Week</th>
              <th className="pb-2 pr-3 text-right">Lifetime</th>
              <th className="pb-2 pr-2 text-right">% of Them — Now</th>
              <th className="pb-2 text-right">% of Them — Peak</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <ResourceRow key={`${row.role_key}-${row.person_name ?? idx}`} row={row} />
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="py-6 text-center text-slate-400">
                  No roles defined in the plan yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ResourceRow({ row }: { row: DirectResourceRow }) {
  const label = DIRECT_ROLE_LABEL[row.role_key] ?? row.role_key;
  const unassigned = !row.person_name;
  const initials = (row.person_name ?? "")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  return (
    <tr className="border-b border-slate-100 last:border-b-0">
      <td className="py-2.5 pr-4 align-middle font-medium text-slate-700">
        {label}
      </td>
      <td className="py-2.5 pr-4 align-middle">
        {unassigned ? (
          <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
            Unassigned
          </span>
        ) : (
          <div className="flex items-center gap-2">
            <div
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold text-slate-700"
              style={{ backgroundColor: avatarTone(row.person_name ?? "") }}
            >
              {initials}
            </div>
            <span className="font-medium text-slate-800">{row.person_name}</span>
            {row.allocation_pct !== null && row.allocation_pct < 1.0 && (
              <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-500">
                {Math.round(row.allocation_pct * 100)}%
              </span>
            )}
          </div>
        )}
      </td>
      <td className="py-2.5 pr-3 text-right tabular-nums text-slate-600">
        {row.person_capacity_hrs_week !== null
          ? `${row.person_capacity_hrs_week}h/wk`
          : "—"}
      </td>
      <td
        className={cn(
          "py-2.5 pr-3 text-right tabular-nums",
          row.current_phase_hrs_week > 0 ? "font-semibold text-slate-800" : "text-slate-300",
        )}
      >
        {row.current_phase_hrs_week > 0 ? fmtHrs(row.current_phase_hrs_week) : "—"}
      </td>
      <td className="py-2.5 pr-3 text-right tabular-nums font-medium text-slate-700">
        {row.peak_hrs_week > 0 ? fmtHrs(row.peak_hrs_week) : "—"}
      </td>
      <td className="py-2.5 pr-3 text-right tabular-nums text-slate-600">
        {row.lifetime_hrs > 0 ? fmtHrs(row.lifetime_hrs) : "—"}
      </td>
      <td className="py-2.5 pr-2 text-right">
        <span
          className={cn(
            "inline-flex min-w-[44px] justify-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
            pctPillClass(row.current_pct_of_capacity),
          )}
        >
          {fmtPct(row.current_pct_of_capacity)}
        </span>
      </td>
      <td className="py-2.5 text-right">
        <span
          className={cn(
            "inline-flex min-w-[44px] justify-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
            pctPillClass(row.peak_pct_of_capacity),
          )}
        >
          {fmtPct(row.peak_pct_of_capacity)}
        </span>
      </td>
    </tr>
  );
}
