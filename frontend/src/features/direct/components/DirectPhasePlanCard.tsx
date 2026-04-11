// -------------------------------------------------------------------------
// Direct Model — phase plan card (Round 1)
// -------------------------------------------------------------------------
// Shows a single project's seeded Direct Model plan as a phase × role
// grid. This is the "show Brett the raw inputs" card — no calculations,
// no drill-down, just the template that flows into the engine.
// -------------------------------------------------------------------------

import { Calendar, Clock } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  DIRECT_PHASE_LABEL,
  DIRECT_PHASE_STYLE,
  DIRECT_ROLE_LABEL,
  DIRECT_ROLE_ORDER,
} from "../constants";
import type { DirectProjectPlanOut } from "../types";

interface Props {
  plan: DirectProjectPlanOut;
}

export function DirectPhasePlanCard({ plan }: Props) {
  // Only show roles that have non-zero hours somewhere in the plan.
  const activeRoles = DIRECT_ROLE_ORDER.filter((rk) =>
    plan.phases.some((p) => (p.role_weekly_hours[rk] ?? 0) > 0),
  );

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-slate-400">
              {plan.project_id}
            </span>
            <h2 className="text-sm font-semibold text-slate-800">
              {plan.project_name}
            </h2>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            First-pass Direct Model template. Edit UI lands in Round 2 —
            for now, changes are made via the seed script.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 text-right">
          <div className="flex items-center gap-1 text-[11px] text-slate-500">
            <Clock className="h-3 w-3" />
            {plan.total_duration_weeks} wks
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-500">
            <Calendar className="h-3 w-3" />
            {plan.total_hours.toFixed(0)}h total
          </div>
          {plan.start_date && plan.end_date && (
            <div className="text-[10px] text-slate-400">
              {plan.start_date} → {plan.end_date}
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className="pb-2 pr-4 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Phase
              </th>
              <th className="pb-2 pr-4 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Duration
              </th>
              {activeRoles.map((rk) => (
                <th
                  key={rk}
                  className="pb-2 pr-3 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-500"
                >
                  {DIRECT_ROLE_LABEL[rk] ?? rk}
                </th>
              ))}
              <th className="pb-2 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Phase Total
              </th>
            </tr>
          </thead>
          <tbody>
            {plan.phases.map((phase) => {
              const phaseTotal = phase.duration_weeks *
                activeRoles.reduce((sum, rk) => sum + (phase.role_weekly_hours[rk] ?? 0), 0);
              return (
                <tr key={phase.name} className="border-t border-slate-100">
                  <td className="py-2 pr-4">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                        DIRECT_PHASE_STYLE[phase.name] ??
                          "bg-slate-100 text-slate-500",
                      )}
                    >
                      {DIRECT_PHASE_LABEL[phase.name] ?? phase.name}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-right tabular-nums text-slate-600">
                    {phase.duration_weeks} wk
                  </td>
                  {activeRoles.map((rk) => {
                    const hrs = phase.role_weekly_hours[rk] ?? 0;
                    return (
                      <td
                        key={rk}
                        className={cn(
                          "py-2 pr-3 text-right tabular-nums",
                          hrs > 0 ? "text-slate-800 font-medium" : "text-slate-300",
                        )}
                      >
                        {hrs > 0 ? `${hrs}h/wk` : "—"}
                      </td>
                    );
                  })}
                  <td className="py-2 text-right tabular-nums font-semibold text-slate-800">
                    {phaseTotal.toFixed(0)}h
                  </td>
                </tr>
              );
            })}
            <tr className="border-t-2 border-slate-200 bg-slate-50/60">
              <td className="py-2 pr-4 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Lifetime total
              </td>
              <td className="py-2 pr-4 text-right tabular-nums font-semibold text-slate-700">
                {plan.total_duration_weeks} wk
              </td>
              {activeRoles.map((rk) => (
                <td
                  key={rk}
                  className="py-2 pr-3 text-right tabular-nums font-semibold text-slate-700"
                >
                  {(plan.role_totals[rk] ?? 0).toFixed(0)}h
                </td>
              ))}
              <td className="py-2 text-right tabular-nums font-bold text-slate-900">
                {plan.total_hours.toFixed(0)}h
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
