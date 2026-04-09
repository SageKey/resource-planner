import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import {
  PROJECTS,
  MOCK_TODAY,
  phaseLabel,
  type MockProject,
  type Priority,
} from "./mockData";

/**
 * Concept B — Project Gantt
 *
 * One row per project. Horizontal timeline of months across the top. Each
 * project has a background bar spanning its full date range, filled from
 * left by progress. Priority drives the color. TODAY marker shows where
 * the current date falls in the range. Project name column is sticky
 * during horizontal scroll.
 */

interface MonthCell {
  yearMonth: string;
  label: string;
  startTime: number;
  endTime: number;
  isCurrent: boolean;
}

const PRIORITY_STYLE: Record<
  Priority,
  { bg: string; fill: string; text: string; legend: string; label: string }
> = {
  Highest: {
    bg: "bg-rose-200",
    fill: "bg-rose-500",
    text: "text-white",
    legend: "bg-rose-500",
    label: "Highest",
  },
  High: {
    bg: "bg-amber-200",
    fill: "bg-amber-500",
    text: "text-white",
    legend: "bg-amber-500",
    label: "High",
  },
  Medium: {
    bg: "bg-sky-200",
    fill: "bg-sky-500",
    text: "text-white",
    legend: "bg-sky-500",
    label: "Medium",
  },
  Low: {
    bg: "bg-slate-300",
    fill: "bg-slate-600",
    text: "text-white",
    legend: "bg-slate-600",
    label: "Low",
  },
};

const PRIORITY_ORDER: Priority[] = ["Highest", "High", "Medium", "Low"];

function projectInitials(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return (name.slice(0, 2) || "??").toUpperCase();
}

function fmtMonth(d: Date): string {
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function fmtDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function ProjectGanttConcept() {
  const [selected, setSelected] = useState<MockProject | null>(null);

  const { rangeStart, rangeEnd, months, todayPct } = useMemo(() => {
    const allStarts = PROJECTS.map((p) => new Date(p.startDate).getTime());
    const allEnds = PROJECTS.map((p) => new Date(p.endDate).getTime());
    const earliest = new Date(Math.min(...allStarts));
    const latest = new Date(Math.max(...allEnds));

    const rs = new Date(earliest.getFullYear(), earliest.getMonth(), 1);
    const re = new Date(latest.getFullYear(), latest.getMonth() + 1, 0);

    const ms: MonthCell[] = [];
    const cursor = new Date(rs);
    const todayYM = `${MOCK_TODAY.getFullYear()}-${String(MOCK_TODAY.getMonth() + 1).padStart(2, "0")}`;
    while (cursor <= re) {
      const start = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
      const end = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
      const ym = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`;
      ms.push({
        yearMonth: ym,
        label: fmtMonth(start),
        startTime: start.getTime(),
        endTime: end.getTime(),
        isCurrent: ym === todayYM,
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }

    const totalMs = re.getTime() - rs.getTime();
    const todayMs = Math.max(0, Math.min(totalMs, MOCK_TODAY.getTime() - rs.getTime()));
    const tPct = (todayMs / totalMs) * 100;

    return { rangeStart: rs, rangeEnd: re, months: ms, todayPct: tPct };
  }, []);

  const totalMs = rangeEnd.getTime() - rangeStart.getTime();

  // Sort by priority then by start date
  const sortedProjects = useMemo(() => {
    return [...PROJECTS].sort((a, b) => {
      const priDiff = PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority);
      if (priDiff !== 0) return priDiff;
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    });
  }, []);

  const rangeLabel = `${fmtMonth(rangeStart)} → ${fmtMonth(rangeEnd)}`;

  return (
    <>
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        {/* Header */}
        <div className="mb-5 flex items-start justify-between">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Project Gantt
            </div>
            <div className="mt-0.5 text-xs text-slate-500">
              {PROJECTS.length} scheduled projects · {rangeLabel}
            </div>
          </div>
          {/* Priority legend */}
          <div className="flex items-center gap-4">
            {PRIORITY_ORDER.map((p) => {
              const s = PRIORITY_STYLE[p];
              return (
                <div key={p} className="flex items-center gap-1.5">
                  <span className={cn("h-2.5 w-4 rounded-sm", s.legend)} />
                  <span className="text-[11px] font-medium text-slate-700">{s.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Gantt */}
        <div className="overflow-x-auto">
          <div className="flex min-w-[1100px]">
            {/* Left: sticky project column */}
            <div className="sticky left-0 z-10 w-72 shrink-0 border-r border-slate-200 bg-white">
              {/* Header cell */}
              <div className="flex h-10 items-center border-b border-slate-200 px-4">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Project
                </div>
              </div>
              {/* Project rows */}
              {sortedProjects.map((p) => {
                const initials = projectInitials(p.name);
                return (
                  <div
                    key={p.id}
                    className="flex h-16 items-center gap-3 border-b border-slate-100 px-4 transition-colors hover:bg-slate-50/60"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-bold text-emerald-700">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-slate-800">
                        {p.name}
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-slate-400">
                        <span className="font-mono">{p.id}</span>
                        <span>·</span>
                        <span>{p.priority}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right: timeline column */}
            <div className="relative flex-1">
              {/* Month header row (contains TODAY pill) */}
              <div className="relative flex h-10 border-b border-slate-200">
                {months.map((m, i) => (
                  <div
                    key={m.yearMonth}
                    className={cn(
                      "flex flex-1 items-center px-2 text-[10px] font-semibold uppercase tracking-wider",
                      i > 0 && "border-l border-slate-100",
                      m.isCurrent ? "bg-slate-50 text-slate-700" : "text-slate-400",
                    )}
                  >
                    {m.label}
                  </div>
                ))}
                {/* TODAY pill — pinned inside the header row at the TODAY x-position */}
                <div
                  className="pointer-events-none absolute inset-y-0 z-30 flex -translate-x-1/2 items-center"
                  style={{ left: `${todayPct}%` }}
                >
                  <span className="inline-block rounded bg-red-500 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow-sm">
                    Today
                  </span>
                </div>
              </div>

              {/* Body rows */}
              <div className="relative">
                {/* TODAY vertical line — spans full body height */}
                <div
                  className="pointer-events-none absolute top-0 z-20 w-px bg-red-500"
                  style={{ left: `${todayPct}%`, height: "100%" }}
                />
                {sortedProjects.map((p, rowIdx) => {
                  const pStart = new Date(p.startDate).getTime();
                  const pEnd = new Date(p.endDate).getTime();
                  const leftPct = Math.max(0, ((pStart - rangeStart.getTime()) / totalMs) * 100);
                  const widthPct = Math.max(
                    0,
                    Math.min(100 - leftPct, ((pEnd - pStart) / totalMs) * 100),
                  );
                  const style = PRIORITY_STYLE[p.priority];
                  const progressPct = p.pctComplete * 100;

                  return (
                    <div
                      key={p.id}
                      className="relative flex h-16 items-center border-b border-slate-100 transition-colors hover:bg-slate-50/40"
                    >
                      {/* Month gridlines */}
                      <div className="pointer-events-none absolute inset-0 flex">
                        {months.map((m, i) => (
                          <div
                            key={m.yearMonth}
                            className={cn("flex-1", i > 0 && "border-l border-slate-100")}
                          />
                        ))}
                      </div>

                      {/* Bar (bg + fill + label) */}
                      <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{
                          duration: 0.35,
                          delay: rowIdx * 0.05,
                          ease: "easeOut",
                        }}
                        onClick={() => setSelected(p)}
                        className={cn(
                          "absolute top-1/2 h-7 -translate-y-1/2 cursor-pointer overflow-hidden rounded-md shadow-sm transition-all hover:brightness-105 hover:shadow",
                          style.bg,
                        )}
                        style={{
                          left: `${leftPct}%`,
                          width: `${widthPct}%`,
                        }}
                      >
                        {/* Progress fill — left-aligned, width = progressPct of bar */}
                        {p.pctComplete > 0 && (
                          <div
                            className={cn(
                              "flex h-full items-center justify-end overflow-hidden px-2",
                              style.fill,
                            )}
                            style={{ width: `${progressPct}%` }}
                          >
                            <span
                              className={cn(
                                "whitespace-nowrap text-[10px] font-bold tabular-nums",
                                style.text,
                              )}
                            >
                              {Math.round(progressPct)}%
                            </span>
                          </div>
                        )}
                        {/* Zero-progress label — inside bg bar, left-aligned */}
                        {p.pctComplete === 0 && (
                          <div className="flex h-full items-center px-2">
                            <span className="whitespace-nowrap text-[10px] font-semibold text-slate-600">
                              0%
                            </span>
                          </div>
                        )}
                      </motion.button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detail modal */}
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
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="font-mono text-[11px] text-slate-400">{selected.id}</span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[9px] font-bold uppercase text-white",
                      PRIORITY_STYLE[selected.priority].legend,
                    )}
                  >
                    {selected.priority}
                  </span>
                  <span className="text-[11px] tabular-nums text-slate-500">
                    {selected.totalHours.toLocaleString()}h total
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

            <div className="grid grid-cols-2 gap-3 rounded-md bg-slate-50 p-3 text-xs">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Start
                </div>
                <div className="mt-0.5 tabular-nums text-slate-700">{fmtDate(selected.startDate)}</div>
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  End
                </div>
                <div className="mt-0.5 tabular-nums text-slate-700">{fmtDate(selected.endDate)}</div>
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Progress
                </div>
                <div className="mt-0.5 font-semibold text-slate-800 tabular-nums">
                  {Math.round(selected.pctComplete * 100)}%
                </div>
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Current Phase
                </div>
                <div className="mt-0.5 text-slate-700">{phaseLabel(selected.currentPhase)}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
