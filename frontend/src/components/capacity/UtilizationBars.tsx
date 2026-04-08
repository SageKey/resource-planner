import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
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
}

export function UtilizationBars({ roles, coverage }: Props) {
  if (!roles) return null;
  const sorted = Object.values(roles).sort(
    (a, b) => b.utilization_pct - a.utilization_pct,
  );

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="mb-4 text-sm font-semibold text-slate-700">
        Role Utilization
      </h2>
      <div className="space-y-4">
        {sorted.map((role, i) => {
          const pct = Math.min(role.utilization_pct, 2.0);
          const widthPct = Math.min(pct * 50, 100);
          const barColor = STATUS_COLOR[role.status] ?? "bg-slate-400";
          const bgColor = STATUS_BG[role.status] ?? "bg-slate-50";

          const cov = coverage?.[role.role_key];
          const assignedHrs = cov?.assigned_hrs_week ?? 0;
          const unassignedHrs = cov?.unassigned_hrs_week ?? 0;
          const totalDemand = assignedHrs + unassignedHrs;
          const assignedWidth = totalDemand > 0 ? (assignedHrs / totalDemand) * 100 : 0;

          return (
            <div key={role.role_key}>
              {/* Main utilization bar */}
              <div className="flex items-center gap-3">
                <div className="w-32 shrink-0 text-right text-xs font-medium text-slate-600">
                  {ROLE_LABELS[role.role_key] ?? role.role_key}
                </div>
                <div className={cn("relative h-6 flex-1 rounded-full", bgColor)}>
                  <motion.div
                    className={cn("absolute inset-y-0 left-0 rounded-full", barColor)}
                    initial={{ width: 0 }}
                    animate={{ width: `${widthPct}%` }}
                    transition={{ duration: 0.6, delay: i * 0.05, ease: "easeOut" }}
                  />
                </div>
                <div className="w-20 shrink-0 text-right tabular-nums">
                  <span className="text-xs font-semibold text-slate-700">
                    {Math.round(role.utilization_pct * 100)}%
                  </span>
                  <span className="ml-1 text-[10px] text-slate-400">
                    {role.demand_hrs_week.toFixed(0)}/{role.supply_hrs_week.toFixed(0)}h
                  </span>
                </div>
              </div>

              {/* Assigned vs unassigned sub-bar */}
              {cov && totalDemand > 0 && (
                <div className="flex items-center gap-3 mt-1">
                  <div className="w-32 shrink-0" />
                  <div className="relative h-2 flex-1 rounded-full bg-slate-100">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-indigo-400 transition-all"
                      style={{ width: `${Math.min(assignedWidth, 100)}%` }}
                    />
                  </div>
                  <div className="w-20 shrink-0 text-right">
                    <span className="text-[10px] tabular-nums text-indigo-600 font-medium">
                      {assignedHrs.toFixed(0)}h
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {" / "}
                    </span>
                    <span className="text-[10px] tabular-nums text-slate-400">
                      {unassignedHrs.toFixed(0)}h
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend for sub-bars */}
      {coverage && (
        <div className="mt-4 flex items-center gap-4 text-[10px] text-slate-400">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-4 rounded-full bg-indigo-400" />
            Assigned
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-4 rounded-full bg-slate-100" />
            Unassigned
          </span>
        </div>
      )}
    </div>
  );
}
