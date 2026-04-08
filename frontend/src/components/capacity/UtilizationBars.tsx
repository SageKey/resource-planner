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
}

export function UtilizationBars({ roles, coverage }: Props) {
  if (!roles) return null;
  const sorted = Object.values(roles).sort(
    (a, b) => b.utilization_pct - a.utilization_pct,
  );

  const hasCoverage = !!coverage;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="mb-4 text-sm font-semibold text-slate-700">
        Role Utilization
        <InfoTooltip>
          <div className="font-semibold text-slate-800">How Role Utilization is calculated</div>
          <p><strong>Util %</strong> = Total Demand / Supply</p>
          <p><strong>Demand</strong> = For each active project: Remaining Hours × Role Allocation % / Duration Weeks. Summed across all active projects for that role.</p>
          <p><strong>Remaining Hours</strong> = Est Hours × (1 - % Complete). A project 80% done only counts 20% of its hours.</p>
          <p><strong>Supply</strong> = Sum of project capacity hours across all team members in that role. Project capacity = Weekly Hours × (1 - Support Reserve %).</p>
          <p><strong>Assigned</strong> = Demand from projects where someone is explicitly assigned to this role (via Assignments tab).</p>
          <p><strong>Unassigned</strong> = Demand from projects that need this role but have no person assigned yet.</p>
          <p className="text-slate-400">Colors: green &lt;80%, yellow 80-99%, red &ge;100%.</p>
        </InfoTooltip>
      </h2>
      <table className="w-full">
        <thead>
          <tr className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            <th className="pb-2 text-left w-28">Role</th>
            <th className="pb-2 text-left">Utilization</th>
            <th className="pb-2 text-right w-14">Util %</th>
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
              <tr key={role.role_key} className="border-t border-slate-50">
                <td className="py-2 pr-3 text-xs font-medium text-slate-600">
                  {ROLE_LABELS[role.role_key] ?? role.role_key}
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
    </div>
  );
}
