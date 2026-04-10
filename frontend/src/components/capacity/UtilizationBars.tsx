import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import type { RoleUtilizationOut } from "@/types/capacity";
import type { RoleCoverage } from "@/hooks/useCapacity";

const STATUS_COLOR: Record<string, string> = {
  BLUE: "bg-sky-400",
  GREEN: "bg-emerald-500",
  YELLOW: "bg-amber-400",
  RED: "bg-red-500",
  GREY: "bg-slate-300",
};

const STATUS_BG: Record<string, string> = {
  BLUE: "bg-sky-50",
  GREEN: "bg-emerald-50",
  YELLOW: "bg-amber-50",
  RED: "bg-red-50",
  GREY: "bg-slate-50",
};

const STATUS_PILL: Record<string, string> = {
  BLUE: "bg-sky-100 text-sky-700",
  GREEN: "bg-emerald-100 text-emerald-700",
  YELLOW: "bg-amber-100 text-amber-700",
  RED: "bg-red-100 text-red-700",
  GREY: "bg-slate-100 text-slate-500",
};

const ROLE_LABELS: Record<string, string> = {
  pm: "Project Manager",
  ba: "Business Analyst",
  functional: "Functional",
  technical: "Technical",
  developer: "Developer",
  infrastructure: "Infrastructure",
  dba: "DBA",
  erp: "ERP Consultant",
  "wms consultant": "WMS Consultant",
};

interface Props {
  roles: Record<string, RoleUtilizationOut>;
  coverage?: Record<string, RoleCoverage> | null;
  /** assignments[project_id][person_name] = {role_key, allocation_pct} */
  assignments?: Record<string, Record<string, { role_key: string; allocation_pct: number }>> | null;
  /** Optional override for the section title (defaults to "Role Utilization"). */
  title?: string;
  /** Optional small second-line text per role (role_key → subtext).
   *  Rendered under the role name in the left column. Used by the v2 page to
   *  show "Peak next 13w: X%" when hero numbers reflect current-week load. */
  roleSubtext?: Record<string, string>;
  /** Optional small note rendered right under the title, explaining what
   *  the hero numbers represent in this view (e.g. "This week · peak below"). */
  titleNote?: string;
  /** Optional "project-average" (v1 aggregate) utilization per role. When
   *  provided, renders an extra "Total" column next to Util %. Used by the
   *  v2 page to show the steady-state baseline alongside current-week load
   *  without having to add another chart. The label in the header for the
   *  Util % column switches to "This Wk" when this prop is present so the
   *  distinction between current-week and total is obvious. */
  totalByRole?: Record<string, number>;
}

export function UtilizationBars({
  roles,
  coverage,
  assignments,
  title,
  roleSubtext,
  titleNote,
  totalByRole,
}: Props) {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  if (!roles) return null;
  const sorted = Object.values(roles).sort(
    (a, b) => b.utilization_pct - a.utilization_pct,
  );

  const hasCoverage = !!coverage;
  const selectedData = selectedRole ? roles[selectedRole] : null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="mb-1 text-sm font-semibold text-slate-700">
        {title ?? "Role Utilization"}
        <InfoTooltip>
          <div className="font-semibold text-slate-800">Role Utilization Formulas</div>
          <p className="font-mono text-[10px] bg-slate-100 rounded px-2 py-1">Util% = Total_Demand / Supply</p>
          <p className="font-mono text-[10px] bg-slate-100 rounded px-2 py-1 mt-1">Demand = Remaining_Hrs × Role% / Duration_Wks</p>
          <p className="font-mono text-[10px] bg-slate-100 rounded px-2 py-1 mt-1">Remaining = Est_Hrs × (1 - Pct_Complete)</p>
          <p className="font-mono text-[10px] bg-slate-100 rounded px-2 py-1 mt-1">Supply = SUM(Weekly_Hrs × (1 - Support%))</p>
          <p className="mt-2"><strong>Assigned</strong> = demand from projects with a person assigned for this role.</p>
          <p><strong>Unassigned</strong> = demand from projects needing this role but nobody assigned yet.</p>
          <p className="text-slate-400 mt-1">Click any row for project breakdown. See Settings → Formulas for full detail.</p>
        </InfoTooltip>
      </h2>
      {titleNote && (
        <div className="mb-4 text-[11px] text-slate-500">{titleNote}</div>
      )}
      {!titleNote && <div className="mb-4" />}
      <table className="w-full">
        <thead>
          <tr className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            <th className="pb-2 text-left w-28">Role</th>
            <th className="pb-2 text-left">Utilization</th>
            <th className="pb-2 text-right w-14">{totalByRole ? "This Wk" : "Util %"}</th>
            {totalByRole && <th className="pb-2 text-right w-14">Total</th>}
            <th className="pb-2 text-right w-16">Demand</th>
            <th className="pb-2 text-right w-16">Supply</th>
            {hasCoverage && (
              <>
                <th className="pb-2 text-right w-18">Assigned</th>
                <th className="pb-2 text-right w-20">Unassigned</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {sorted.map((role, i) => {
            const pct = Math.min(role.utilization_pct, 2.0);
            const widthPct = Math.min(pct * 50, 100);
            const barColor = STATUS_COLOR[role.status] ?? "bg-slate-400";
            const bgColor = STATUS_BG[role.status] ?? "bg-slate-50";

            const cov = coverage?.[role.role_key];
            const assignedHrs = cov?.assigned_hrs_week ?? 0;
            const unassignedHrs = cov?.unassigned_hrs_week ?? 0;

            return (
              <tr
                key={role.role_key}
                onClick={() =>
                  setSelectedRole(
                    selectedRole === role.role_key ? null : role.role_key,
                  )
                }
                className={cn(
                  "border-t border-slate-50 cursor-pointer transition-colors hover:bg-slate-50",
                  selectedRole === role.role_key && "bg-indigo-50/50",
                )}
              >
                <td className="py-2 pr-3 text-xs font-medium text-slate-600">
                  <div>{ROLE_LABELS[role.role_key] ?? role.role_key}</div>
                  {roleSubtext?.[role.role_key] && (
                    <div className="mt-0.5 text-[9px] font-normal tabular-nums text-slate-400">
                      {roleSubtext[role.role_key]}
                    </div>
                  )}
                </td>
                <td className="py-2 pr-3">
                  <div className={cn("relative h-5 rounded-full", bgColor)}>
                    <motion.div
                      className={cn("absolute inset-y-0 left-0 rounded-full", barColor)}
                      initial={{ width: 0 }}
                      animate={{ width: `${widthPct}%` }}
                      transition={{ duration: 0.6, delay: i * 0.05, ease: "easeOut" }}
                    />
                  </div>
                </td>
                <td className="py-2 text-right">
                  <span className={cn(
                    "inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums",
                    STATUS_PILL[role.status] ?? "bg-slate-100 text-slate-600",
                  )}>
                    {Math.round(role.utilization_pct * 100)}%
                  </span>
                </td>
                {totalByRole && (
                  <td className="py-2 text-right text-xs font-medium tabular-nums text-slate-600">
                    {Math.round((totalByRole[role.role_key] ?? 0) * 100)}%
                  </td>
                )}
                <td className="py-2 text-right text-xs tabular-nums text-slate-600">
                  {role.demand_hrs_week.toFixed(0)}h
                </td>
                <td className="py-2 text-right text-xs tabular-nums text-slate-600">
                  {role.supply_hrs_week.toFixed(0)}h
                </td>
                {hasCoverage && (
                  <>
                    <td className="py-2 text-right text-xs tabular-nums font-medium text-indigo-600">
                      {assignedHrs.toFixed(0)}h
                    </td>
                    <td className="py-2 text-right text-xs tabular-nums text-slate-400">
                      {unassignedHrs.toFixed(0)}h
                    </td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Role detail modal */}
      {selectedData && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setSelectedRole(null)}
        >
          <div
            className="w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-xl bg-white p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold text-slate-800">
                {ROLE_LABELS[selectedData.role_key] ?? selectedData.role_key} — Demand Breakdown
              </div>
              <button
                onClick={() => setSelectedRole(null)}
                className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
              >
                Close
              </button>
            </div>

            <div className="flex gap-4 mb-3 text-xs">
              <div>
                <span className="text-slate-500">Supply:</span>{" "}
                <span className="font-semibold text-slate-700">{selectedData.supply_hrs_week.toFixed(1)}h/wk</span>
              </div>
              <div>
                <span className="text-slate-500">Demand:</span>{" "}
                <span className="font-semibold text-slate-700">{selectedData.demand_hrs_week.toFixed(1)}h/wk</span>
              </div>
              <div>
                <span className="text-slate-500">Utilization:</span>{" "}
                <span className="font-semibold text-slate-700">
                  {Math.round(selectedData.utilization_pct * 100)}%
                </span>
              </div>
            </div>

            {selectedData.demand_breakdown.length > 0 ? (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    <th className="pb-1.5 pr-3">Project</th>
                    <th className="pb-1.5 pr-3 text-right">Role Alloc</th>
                    <th className="pb-1.5 pr-3 text-right">Demand/wk</th>
                    <th className="pb-1.5 text-right">Staffed</th>
                  </tr>
                </thead>
                <tbody>
                  {[...selectedData.demand_breakdown]
                    .sort((a, b) => b.weekly_hours - a.weekly_hours)
                    .map((d) => {
                      const projAssigns = assignments?.[d.project_id] ?? {};
                      const hasAssignment = Object.values(projAssigns).some(
                        (a) => a.role_key === selectedData.role_key,
                      );
                      return (
                        <tr key={d.project_id} className="border-b border-slate-50">
                          <td className="py-1.5 pr-3">
                            <span className="font-mono text-slate-400">{d.project_id}</span>{" "}
                            <span className="font-medium text-slate-700">{d.project_name}</span>
                          </td>
                          <td className="py-1.5 pr-3 text-right tabular-nums text-slate-600">
                            {Math.round(d.role_alloc_pct * 100)}%
                          </td>
                          <td className="py-1.5 pr-3 text-right tabular-nums font-semibold text-slate-800">
                            {d.weekly_hours.toFixed(1)}h
                          </td>
                          <td className="py-1.5 text-right">
                            {hasAssignment ? (
                              <span className="inline-block rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-medium text-emerald-700">
                                Assigned
                              </span>
                            ) : (
                              <span className="inline-block rounded-full bg-red-50 px-1.5 py-0.5 text-[9px] font-medium text-red-500">
                                Unassigned
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            ) : (
              <div className="text-xs text-slate-400">No projects contributing demand for this role.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
