import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import {
  ROLES,
  PROJECTS,
  TIMELINE_WEEKS,
  timelineBlocksForRole,
  phaseLabel,
  phaseBadge,
  weekLabels,
  type TimelineBlock,
} from "./mockData";

/**
 * Concept B — Role Timeline (Gantt)
 *
 * Horizontal time-based view. Weeks across the top, roles down the left.
 * Each cell area is a portion of role capacity across that week range.
 * Blocks represent a phase of a project consuming that role.
 *
 * Colors are stable per-project so the same project looks the same on
 * every row it appears in.
 */
export function RoleTimelineConcept() {
  const [selected, setSelected] = useState<TimelineBlock | null>(null);
  const labels = weekLabels();

  return (
    <>
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="mb-4 flex items-baseline justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Role timeline — next 12 weeks</h2>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Each block is a phase of a project consuming a role. Click any block to see details.
            </p>
          </div>
          <div className="text-[10px] tabular-nums text-slate-400">
            {TIMELINE_WEEKS} weeks · 7 projects
          </div>
        </div>

        {/* Week header */}
        <div className="flex items-center border-b border-slate-100 pb-2">
          <div className="w-32 shrink-0 pr-4 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Role
          </div>
          <div
            className="grid flex-1 text-center text-[10px] font-medium text-slate-400"
            style={{ gridTemplateColumns: `repeat(${TIMELINE_WEEKS}, minmax(0, 1fr))` }}
          >
            {labels.map((lbl, i) => (
              <div key={i} className="tabular-nums">
                {lbl}
              </div>
            ))}
          </div>
        </div>

        {/* Role rows */}
        <div className="divide-y divide-slate-50">
          {ROLES.map((role, rowIdx) => {
            const blocks = timelineBlocksForRole(role.key);
            return (
              <div key={role.key} className="flex items-center py-3">
                {/* Role label */}
                <div className="w-32 shrink-0 pr-4">
                  <div className="text-xs font-medium text-slate-800">{role.label}</div>
                  <div className="text-[10px] tabular-nums text-slate-400">
                    {role.totalHrsWeek}h/wk
                  </div>
                </div>

                {/* Grid of weeks, with absolutely-positioned blocks layered on top */}
                <div className="relative flex-1" style={{ minHeight: "56px" }}>
                  {/* Gridlines */}
                  <div
                    className="absolute inset-0 grid"
                    style={{ gridTemplateColumns: `repeat(${TIMELINE_WEEKS}, minmax(0, 1fr))` }}
                  >
                    {Array.from({ length: TIMELINE_WEEKS }).map((_, i) => (
                      <div key={i} className="border-l border-slate-100 first:border-l-0" />
                    ))}
                  </div>

                  {/* Blocks — split into rows by simple overlap greedy */}
                  <div className="relative">
                    {layoutBlocks(blocks).map(({ block, lane }, bIdx) => {
                      const leftPct = (block.startWeek / TIMELINE_WEEKS) * 100;
                      const widthPct = ((block.endWeek - block.startWeek) / TIMELINE_WEEKS) * 100;
                      const top = lane * 26;
                      return (
                        <motion.button
                          key={block.project.id + block.phase}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{
                            duration: 0.35,
                            delay: 0.05 * (rowIdx + bIdx * 0.1),
                            ease: "easeOut",
                          }}
                          onClick={() => setSelected(block)}
                          className={cn(
                            "absolute flex h-[22px] items-center gap-1 overflow-hidden rounded px-1.5 text-[10px] font-medium shadow-sm transition-transform hover:scale-[1.02] hover:z-10",
                            block.project.colorBar,
                            block.project.colorBarText,
                          )}
                          style={{
                            left: `${leftPct}%`,
                            width: `calc(${widthPct}% - 2px)`,
                            top: `${top}px`,
                          }}
                          title={`${block.project.name} · ${phaseLabel(block.phase)} · ${block.hours}h`}
                        >
                          <span className="truncate">
                            {block.project.name}
                          </span>
                          <span className="ml-auto shrink-0 rounded bg-white/25 px-1 text-[9px]">
                            {block.hours}h
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-5 border-t border-slate-100 pt-3">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Projects
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {PROJECTS.map((p) => (
              <div key={p.id} className="flex items-center gap-1.5">
                <span className={cn("h-2.5 w-2.5 rounded-sm", p.colorDot)} />
                <span className="text-[11px] text-slate-600">{p.name}</span>
              </div>
            ))}
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
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className={cn("h-3 w-3 rounded-full", selected.project.colorDot)} />
                  <div className="text-sm font-semibold text-slate-900">
                    {selected.project.name}
                  </div>
                </div>
                <div className="mt-1 font-mono text-[11px] text-slate-400">
                  {selected.project.id}
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Phase
                </div>
                <span className={cn("mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium", phaseBadge(selected.phase))}>
                  {phaseLabel(selected.phase)}
                </span>
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Hours
                </div>
                <div className="mt-1 font-semibold tabular-nums text-slate-800">{selected.hours}h</div>
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  T-Shirt
                </div>
                <div className="mt-1 font-semibold text-slate-800">{selected.project.tshirt}</div>
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Weeks
                </div>
                <div className="mt-1 tabular-nums text-slate-700">
                  W{selected.startWeek + 1} – W{selected.endWeek}
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-md bg-slate-50 p-3 text-[11px] text-slate-500">
              <span className="font-semibold text-slate-700">Total project:</span>{" "}
              {selected.project.totalHours}h · currently in {phaseLabel(selected.project.currentPhase)}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Greedy lane assignment so overlapping blocks stack vertically instead of covering each other.
function layoutBlocks(blocks: TimelineBlock[]): { block: TimelineBlock; lane: number }[] {
  const sorted = [...blocks].sort((a, b) => a.startWeek - b.startWeek);
  const laneEnds: number[] = []; // lane index → last end week used
  const out: { block: TimelineBlock; lane: number }[] = [];
  for (const b of sorted) {
    let assigned = -1;
    for (let i = 0; i < laneEnds.length; i++) {
      if (laneEnds[i] <= b.startWeek) {
        assigned = i;
        break;
      }
    }
    if (assigned === -1) {
      assigned = laneEnds.length;
      laneEnds.push(b.endWeek);
    } else {
      laneEnds[assigned] = b.endWeek;
    }
    out.push({ block: b, lane: assigned });
  }
  return out;
}
