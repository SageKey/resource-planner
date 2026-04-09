import { useState } from "react";
import { motion } from "framer-motion";
import { Clock, Users } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  ROLE_BY_KEY,
  PROJECTS,
  projectsInPhase,
  projectsWaitingToStart,
  phaseLabel,
  type MockProject,
  type PhaseKey,
  type RoleKey,
} from "./mockData";

/**
 * Concept C — Phase Kanban
 *
 * Three columns, one per simplified SDLC phase: Planning, Build, Test/Deploy.
 * Projects are cards positioned in their current phase. Beneath the columns
 * is a "Waiting to start" strip.
 *
 * This is the most visually simple of the three — kanban metaphor is instant.
 */
export function PhaseKanbanConcept() {
  const [selected, setSelected] = useState<MockProject | null>(null);

  const columns: { key: PhaseKey; label: string; headerBg: string; headerText: string; accent: string }[] = [
    {
      key: "planning",
      label: "Planning",
      headerBg: "bg-sky-50 border-sky-200",
      headerText: "text-sky-800",
      accent: "bg-sky-500",
    },
    {
      key: "build",
      label: "Build",
      headerBg: "bg-amber-50 border-amber-200",
      headerText: "text-amber-800",
      accent: "bg-amber-500",
    },
    {
      key: "test_deploy",
      label: "Test / Deploy",
      headerBg: "bg-emerald-50 border-emerald-200",
      headerText: "text-emerald-800",
      accent: "bg-emerald-500",
    },
  ];

  const waiting = projectsWaitingToStart();

  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        {columns.map((col, colIdx) => {
          const projects = projectsInPhase(col.key);
          const totalHrs = projects.reduce((s, p) => s + p.totalHours, 0);

          return (
            <div key={col.key} className="rounded-xl border border-slate-200 bg-white">
              {/* Column header */}
              <div className={cn("flex items-center justify-between rounded-t-xl border-b px-4 py-3", col.headerBg)}>
                <div>
                  <div className={cn("text-xs font-bold uppercase tracking-wider", col.headerText)}>
                    {col.label}
                  </div>
                  <div className="mt-0.5 text-[10px] text-slate-500 tabular-nums">
                    {projects.length} {projects.length === 1 ? "project" : "projects"} · {totalHrs.toLocaleString()}h total
                  </div>
                </div>
                <div className={cn("h-7 w-7 rounded-full", col.accent, "flex items-center justify-center text-[11px] font-bold text-white")}>
                  {projects.length}
                </div>
              </div>

              {/* Cards */}
              <div className="space-y-2.5 p-3">
                {projects.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-200 px-4 py-6 text-center text-xs text-slate-400">
                    No projects in this phase
                  </div>
                ) : (
                  projects.map((p, i) => {
                    const phaseState = p[col.key];
                    const activeRoles = Object.entries(phaseState.hoursByRole)
                      .filter(([, h]) => (h ?? 0) > 0)
                      .map(([k]) => k as RoleKey);

                    return (
                      <motion.button
                        key={p.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: colIdx * 0.1 + i * 0.05, ease: "easeOut" }}
                        onClick={() => setSelected(p)}
                        className="group block w-full rounded-lg border border-slate-200 bg-white p-3 text-left transition-all hover:border-slate-300 hover:shadow-md"
                      >
                        {/* Top: colored accent strip + name */}
                        <div className="flex items-start gap-2">
                          <span className={cn("mt-1 h-2.5 w-2.5 shrink-0 rounded-full", p.colorDot)} />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-semibold text-slate-900">{p.name}</div>
                            <div className="mt-0.5 font-mono text-[10px] text-slate-400">{p.id}</div>
                          </div>
                          <TshirtBadge size={p.tshirt} />
                        </div>

                        {/* Total hours row */}
                        <div className="mt-3 flex items-center gap-3 text-[11px] tabular-nums text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {p.totalHours.toLocaleString()}h total
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {activeRoles.length} {activeRoles.length === 1 ? "role" : "roles"}
                          </span>
                        </div>

                        {/* Active roles in this phase */}
                        <div className="mt-2 flex flex-wrap gap-1">
                          {activeRoles.map((rk) => {
                            const role = ROLE_BY_KEY[rk];
                            const hrs = phaseState.hoursByRole[rk] ?? 0;
                            return (
                              <span
                                key={rk}
                                className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600"
                                title={`${role.label}: ${hrs}h`}
                              >
                                {role.shortLabel}
                                <span className="tabular-nums text-slate-400">{hrs}h</span>
                              </span>
                            );
                          })}
                        </div>

                        {/* Phase progress */}
                        <div className="mt-3">
                          <div className="mb-1 flex items-center justify-between text-[10px] font-medium text-slate-400">
                            <span>Phase progress</span>
                            <span className="tabular-nums">{Math.round(phaseState.progress * 100)}%</span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${phaseState.progress * 100}%` }}
                              transition={{ duration: 0.6, delay: 0.3 + colIdx * 0.1 + i * 0.05 }}
                              className={cn("h-full rounded-full", col.accent)}
                            />
                          </div>
                        </div>
                      </motion.button>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Waiting to start strip */}
      <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-4">
        <div className="mb-3 flex items-baseline justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Waiting to start
            </div>
            <div className="mt-0.5 text-[10px] text-slate-400">
              Projects in the queue with no active phase yet
            </div>
          </div>
          <div className="text-[10px] tabular-nums text-slate-400">{waiting.length} projects</div>
        </div>
        <div className="flex flex-wrap gap-2">
          {waiting.length === 0 ? (
            <div className="w-full text-center text-xs text-slate-400">Queue is empty</div>
          ) : (
            waiting.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelected(p)}
                className="group flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left transition-colors hover:border-slate-300 hover:bg-white"
              >
                <span className={cn("h-2 w-2 rounded-full", p.colorDot)} />
                <div>
                  <div className="text-xs font-medium text-slate-800">{p.name}</div>
                  <div className="text-[10px] text-slate-400 tabular-nums">
                    {p.totalHours}h · {p.tshirt}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Project detail modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-lg rounded-xl bg-white p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className={cn("h-3 w-3 rounded-full", selected.colorDot)} />
                  <div className="text-sm font-semibold text-slate-900">{selected.name}</div>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="font-mono text-[11px] text-slate-400">{selected.id}</span>
                  <TshirtBadge size={selected.tshirt} />
                  <span className="text-[11px] tabular-nums text-slate-500">
                    {selected.totalHours.toLocaleString()}h
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Close
              </button>
            </div>

            <div className="space-y-3">
              {(["planning", "build", "test_deploy"] as PhaseKey[]).map((ph) => {
                const s = selected[ph];
                const hrs = Object.values(s.hoursByRole).reduce((a, b) => (a || 0) + (b || 0), 0);
                const isCurrent = selected.currentPhase === ph;
                return (
                  <div
                    key={ph}
                    className={cn(
                      "rounded-lg border p-3",
                      isCurrent ? "border-navy-200 bg-navy-50" : "border-slate-200 bg-white",
                    )}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="text-xs font-semibold text-slate-800">{phaseLabel(ph)}</div>
                        {isCurrent && (
                          <span className="rounded-full bg-navy-600 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
                            Current
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] tabular-nums text-slate-500">
                        {Math.round(s.progress * 100)}% · {hrs}h
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(s.hoursByRole)
                        .filter(([, h]) => (h ?? 0) > 0)
                        .map(([rk, h]) => {
                          const role = ROLE_BY_KEY[rk as RoleKey];
                          return (
                            <span
                              key={rk}
                              className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600"
                            >
                              {role.label}
                              <span className="tabular-nums text-slate-400">{h}h</span>
                            </span>
                          );
                        })}
                      {Object.keys(s.hoursByRole).length === 0 && (
                        <span className="text-[10px] text-slate-400">No work in this phase</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function TshirtBadge({ size }: { size: "S" | "M" | "L" | "XL" }) {
  const styles: Record<typeof size, string> = {
    S: "bg-slate-100 text-slate-600",
    M: "bg-sky-100 text-sky-700",
    L: "bg-violet-100 text-violet-700",
    XL: "bg-rose-100 text-rose-700",
  };
  return (
    <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-bold", styles[size])}>
      {size}
    </span>
  );
}

// Ensure PROJECTS is referenced so tree-shaking doesn't drop the module if someone imports only types.
void PROJECTS;
