import { motion } from "framer-motion";
import { ArrowRight, Circle, Clock } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  ROLES,
  currentWorkForRole,
  upcomingWorkForRole,
  roleWeeklyLoad,
  phaseLabel,
  phaseBadge,
} from "./mockData";

/**
 * Concept A — Role State Cards
 *
 * Six cards, one per role. Each card shows:
 *   - Role name + headcount + supply
 *   - Big "free this week" number with urgency pill
 *   - A usage bar (consumed vs free)
 *   - "Currently working on" list
 *   - "Up next" queue
 *
 * This is the design closest to Jim's literal description.
 */
export function RoleCardsConcept() {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      {ROLES.map((role, i) => {
        const load = roleWeeklyLoad(role.key);
        const current = currentWorkForRole(role.key);
        const next = upcomingWorkForRole(role.key);

        const stateColor =
          load.pctUsed >= 0.95
            ? { bar: "bg-red-500", bg: "bg-red-50", text: "text-red-700", pill: "bg-red-100 text-red-700", label: "Fully booked" }
            : load.pctUsed >= 0.8
            ? { bar: "bg-amber-400", bg: "bg-amber-50", text: "text-amber-800", pill: "bg-amber-100 text-amber-800", label: "Stretched" }
            : load.pctUsed >= 0.5
            ? { bar: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700", pill: "bg-emerald-100 text-emerald-700", label: "Healthy" }
            : { bar: "bg-sky-400", bg: "bg-sky-50", text: "text-sky-700", pill: "bg-sky-100 text-sky-700", label: "Under-used" };

        const pctWidth = Math.min(100, load.pctUsed * 100);

        return (
          <motion.div
            key={role.key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.05, ease: "easeOut" }}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-900">{role.label}</div>
                <div className="mt-0.5 text-[11px] text-slate-500">
                  {role.headcount} {role.headcount === 1 ? "person" : "people"} · {role.totalHrsWeek}h/wk total
                </div>
              </div>
              <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", stateColor.pill)}>
                {stateColor.label}
              </span>
            </div>

            {/* Hero row: Free hours + % allocated */}
            <div className="mt-4 flex items-end justify-between gap-3">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Free this week</div>
                <div className={cn("text-3xl font-bold tabular-nums", stateColor.text)}>
                  {load.freeHrs}
                  <span className="ml-0.5 text-base font-semibold text-slate-400">h</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Allocated</div>
                <div className={cn("text-xl font-bold tabular-nums", stateColor.text)}>
                  {Math.round(load.pctUsed * 100)}
                  <span className="ml-0.5 text-sm font-semibold text-slate-400">%</span>
                </div>
              </div>
            </div>

            {/* Usage bar */}
            <div className="mt-2">
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pctWidth}%` }}
                  transition={{ duration: 0.6, delay: 0.25 + i * 0.05, ease: "easeOut" }}
                  className={cn("h-full rounded-full", stateColor.bar)}
                />
              </div>
              <div className="mt-1 flex items-center justify-between text-[10px] tabular-nums text-slate-400">
                <span>
                  {load.consumedHrs}h consumed
                </span>
                <span>
                  of {role.totalHrsWeek}h capacity
                </span>
              </div>
            </div>

            {/* Currently working on */}
            <div className="mt-5">
              <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                <Circle className="h-2.5 w-2.5 fill-current text-emerald-500" strokeWidth={0} />
                Currently working on
              </div>
              {current.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 px-3 py-3 text-center text-xs text-slate-400">
                  Nothing right now
                </div>
              ) : (
                <div className="space-y-1.5">
                  {current.map((c) => (
                    <div
                      key={c.project.id}
                      className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50/60 px-2.5 py-2"
                    >
                      <span className={cn("h-2 w-2 shrink-0 rounded-full", c.project.colorDot)} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-medium text-slate-800">{c.project.name}</div>
                        <div className="mt-0.5 flex items-center gap-1.5">
                          <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-medium", phaseBadge(c.phase))}>
                            {phaseLabel(c.phase)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right tabular-nums">
                        <div className="text-xs font-semibold text-slate-700">{c.hoursRemaining}h</div>
                        <div className="text-[9px] text-slate-400">left</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Up next */}
            <div className="mt-4">
              <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                <ArrowRight className="h-3 w-3" />
                Up next
              </div>
              {next.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 px-3 py-3 text-center text-xs text-slate-400">
                  Queue empty
                </div>
              ) : (
                <div className="space-y-1">
                  {next.map((u) => (
                    <div
                      key={u.project.id + u.phase}
                      className="flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-slate-50"
                    >
                      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", u.project.colorDot)} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs text-slate-700">{u.project.name}</div>
                      </div>
                      <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-medium", phaseBadge(u.phase))}>
                        {phaseLabel(u.phase)}
                      </span>
                      <div className="flex items-center gap-0.5 text-[10px] tabular-nums text-slate-500">
                        <Clock className="h-2.5 w-2.5" />
                        {u.hours}h
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
