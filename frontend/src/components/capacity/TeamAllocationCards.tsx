import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Briefcase, Clock, Users, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { useAssignmentMatrix, type MatrixData } from "@/hooks/useAssignments";
import type { PersonHeatmapResponse, PersonHeatmapRow } from "@/hooks/useCapacity";

/**
 * TeamAllocationCards
 *
 * Per-person "weekly allocation vs capacity" cards for executive scanning.
 * One card per roster member (excluding people flagged include_in_capacity=false).
 * Each card shows:
 *   - Free hours this week (hero)
 *   - Allocated % (hero)
 *   - Usage bar with status color
 *   - Next 4 weeks mini-chart
 *
 * Click a card to open a detail modal showing the person's current-week
 * and 26-week average load along with every project they're assigned to.
 *
 * Data source: the same PersonHeatmapResponse that feeds PersonHeatmapGrid,
 * so the numbers on the cards match the heatmap cells exactly. The project
 * list in the modal comes from the assignment matrix.
 */

interface Props {
  data: PersonHeatmapResponse | undefined;
}

type Status = "healthy" | "fine" | "stretched" | "over" | "unknown";

function statusFromPct(pct: number): Status {
  if (pct >= 1.1) return "over";
  if (pct >= 0.9) return "stretched";
  if (pct >= 0.7) return "fine";
  return "healthy";
}

const STATUS_STYLE: Record<
  Status,
  {
    bar: string;
    pillBg: string;
    pillText: string;
    text: string;
    label: string;
  }
> = {
  healthy: {
    bar: "bg-emerald-500",
    pillBg: "bg-emerald-100",
    pillText: "text-emerald-700",
    text: "text-emerald-700",
    label: "Healthy",
  },
  fine: {
    bar: "bg-sky-400",
    pillBg: "bg-sky-100",
    pillText: "text-sky-700",
    text: "text-sky-700",
    label: "OK",
  },
  stretched: {
    bar: "bg-amber-500",
    pillBg: "bg-amber-100",
    pillText: "text-amber-800",
    text: "text-amber-800",
    label: "Stretched",
  },
  over: {
    bar: "bg-red-500",
    pillBg: "bg-red-100",
    pillText: "text-red-700",
    text: "text-red-700",
    label: "Over",
  },
  unknown: {
    bar: "bg-slate-300",
    pillBg: "bg-slate-100",
    pillText: "text-slate-500",
    text: "text-slate-500",
    label: "—",
  },
};

function initials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (name.slice(0, 2) || "??").toUpperCase();
}

export function TeamAllocationCards({ data }: Props) {
  const matrix = useAssignmentMatrix();
  const [selectedPerson, setSelectedPerson] = useState<PersonHeatmapRow | null>(null);

  if (!data) return null;
  const people = data.people.filter((p) => p.include_in_capacity);
  if (people.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="text-xs text-slate-500">No roster members available.</div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
        <Users className="h-4 w-4 text-slate-500" />
        Team Allocation — This Week
        <InfoTooltip>
          <div className="font-semibold text-slate-800">Per-person weekly allocation</div>
          <p>
            One card per roster member. Shows current-week allocation vs
            personal capacity. Click a card to see their full project list.
          </p>
          <p className="font-mono text-[10px] bg-slate-100 rounded px-2 py-1 mt-1">
            Free = capacity_hrs_week × (1 − utilization_this_week)
          </p>
          <p className="text-slate-400 mt-1">
            Same data as the Person Heatmap below — cells[0] is this week.
          </p>
        </InfoTooltip>
      </h2>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {people.map((person, i) => (
          <PersonCard
            key={person.name}
            person={person}
            index={i}
            onClick={() => setSelectedPerson(person)}
          />
        ))}
      </div>

      {/* Detail modal */}
      {selectedPerson && (
        <PersonDetailModal
          person={selectedPerson}
          matrix={matrix.data}
          onClose={() => setSelectedPerson(null)}
        />
      )}
    </div>
  );
}

function PersonCard({
  person,
  index,
  onClick,
}: {
  person: PersonHeatmapRow;
  index: number;
  onClick: () => void;
}) {
  const pctNow = person.cells[0] ?? 0;
  const capacity = person.capacity_hrs_week;
  const allocatedHrs = Math.round(pctNow * capacity * 10) / 10;
  const freeHrs = Math.max(0, Math.round((capacity - allocatedHrs) * 10) / 10);
  const status = capacity > 0 ? statusFromPct(pctNow) : "unknown";
  const style = STATUS_STYLE[status];

  const barWidth = Math.min(100, pctNow * 100);

  const nextWeeks = [1, 2, 3, 4].map((idx) => ({
    idx,
    pct: person.cells[idx] ?? 0,
    status: statusFromPct(person.cells[idx] ?? 0),
  }));

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04, ease: "easeOut" }}
      onClick={onClick}
      className="block w-full rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition-all hover:border-slate-300 hover:shadow-md"
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-bold text-emerald-700">
          {initials(person.name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-slate-900">{person.name}</div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-slate-400">
            <span>{person.role}</span>
            <span>·</span>
            <span className="tabular-nums">{capacity.toFixed(0)}h/wk</span>
          </div>
        </div>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-semibold",
            style.pillBg,
            style.pillText,
          )}
        >
          {style.label}
        </span>
      </div>

      {/* Hero row */}
      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Free this week
          </div>
          <div className={cn("text-2xl font-bold tabular-nums", style.text)}>
            {freeHrs}
            <span className="ml-0.5 text-sm font-semibold text-slate-400">h</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Allocated
          </div>
          <div className={cn("text-xl font-bold tabular-nums", style.text)}>
            {Math.round(pctNow * 100)}
            <span className="ml-0.5 text-sm font-semibold text-slate-400">%</span>
          </div>
        </div>
      </div>

      {/* Usage bar */}
      <div className="mt-2">
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${barWidth}%` }}
            transition={{ duration: 0.6, delay: 0.2 + index * 0.04, ease: "easeOut" }}
            className={cn("h-full rounded-full", style.bar)}
          />
        </div>
        <div className="mt-1 flex items-center justify-between text-[10px] tabular-nums text-slate-400">
          <span>{allocatedHrs}h consumed</span>
          <span>of {capacity.toFixed(0)}h capacity</span>
        </div>
      </div>

      {/* Next 4 weeks — mini vertical bar chart */}
      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Next 4 Weeks
          </span>
          <span className="text-[9px] font-medium text-slate-400">100%</span>
        </div>
        <NextWeeksChart weeks={nextWeeks} rowIndex={index} />
      </div>
    </motion.button>
  );
}

// ---------------------------------------------------------------------------
// Mini bar chart for the "Next 4 Weeks" preview
// ---------------------------------------------------------------------------

interface NextWeekCell {
  idx: number;
  pct: number;
  status: Status;
}

function NextWeeksChart({ weeks, rowIndex }: { weeks: NextWeekCell[]; rowIndex: number }) {
  const MAX_PCT = 1.25;
  const CHART_HEIGHT = 56;
  const referenceLinePct = 1.0 / MAX_PCT;

  return (
    <div className="relative rounded-lg border border-slate-100 bg-slate-50/60 p-2">
      <div className="relative" style={{ height: `${CHART_HEIGHT}px` }}>
        <div
          className="pointer-events-none absolute left-0 right-0 border-t border-dashed border-slate-300"
          style={{ bottom: `${referenceLinePct * 100}%` }}
        />
        <div className="absolute inset-0 flex items-end justify-around gap-1.5">
          {weeks.map((wk) => {
            const style = STATUS_STYLE[wk.status];
            const visualPct = Math.min(wk.pct, MAX_PCT) / MAX_PCT;
            const heightPx = Math.max(4, visualPct * CHART_HEIGHT);
            return (
              <div
                key={wk.idx}
                className="flex flex-1 flex-col items-center justify-end"
                title={`Week +${wk.idx}: ${Math.round(wk.pct * 100)}%`}
              >
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${heightPx}px` }}
                  transition={{
                    duration: 0.5,
                    delay: 0.3 + rowIndex * 0.04 + wk.idx * 0.05,
                    ease: "easeOut",
                  }}
                  className={cn(
                    "w-full rounded-t-sm",
                    style.bar,
                    wk.pct > 1.0 && "shadow-sm",
                  )}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-1 flex items-center justify-around gap-1.5">
        {weeks.map((wk) => {
          const style = STATUS_STYLE[wk.status];
          return (
            <div
              key={`pct-${wk.idx}`}
              className={cn(
                "flex-1 text-center text-[10px] font-bold tabular-nums",
                style.text,
              )}
            >
              {Math.round(wk.pct * 100)}%
            </div>
          );
        })}
      </div>

      <div className="mt-0.5 flex items-center justify-around gap-1.5">
        {weeks.map((wk) => (
          <div
            key={`lbl-${wk.idx}`}
            className="flex-1 text-center text-[9px] font-medium text-slate-400"
          >
            +{wk.idx}w
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Person detail modal
// ---------------------------------------------------------------------------

interface PersonAssignedProject {
  id: string;
  name: string;
  health: string | null;
  priority: string | null;
  est_hours: number;
  role_key: string;
  allocation_pct: number; // 0..1, the person's share of the role on this project
}

function PersonDetailModal({
  person,
  matrix,
  onClose,
}: {
  person: PersonHeatmapRow;
  matrix: MatrixData | undefined;
  onClose: () => void;
}) {
  const pctNow = person.cells[0] ?? 0;
  const capacity = person.capacity_hrs_week;
  const allocatedHrs = Math.round(pctNow * capacity * 10) / 10;
  const freeHrs = Math.max(0, Math.round((capacity - allocatedHrs) * 10) / 10);
  const status = capacity > 0 ? statusFromPct(pctNow) : "unknown";
  const style = STATUS_STYLE[status];

  // 26-week average utilization (cells average)
  const avgPct = useMemo(() => {
    if (person.cells.length === 0) return 0;
    const sum = person.cells.reduce((a, b) => a + b, 0);
    return sum / person.cells.length;
  }, [person.cells]);

  const avgStatus = statusFromPct(avgPct);
  const avgStyle = STATUS_STYLE[avgStatus];

  // Build the project list from the assignment matrix
  const assignedProjects: PersonAssignedProject[] = useMemo(() => {
    if (!matrix) return [];
    const projectsById: Record<string, MatrixData["projects"][number]> = {};
    for (const p of matrix.projects) {
      projectsById[p.id] = p;
    }

    const out: PersonAssignedProject[] = [];
    for (const [projectId, personMap] of Object.entries(matrix.assignments)) {
      const entry = personMap[person.name];
      if (!entry) continue;
      const proj = projectsById[projectId];
      if (!proj) continue;
      out.push({
        id: proj.id,
        name: proj.name,
        health: proj.health,
        priority: proj.priority,
        est_hours: proj.est_hours,
        role_key: entry.role_key,
        allocation_pct: entry.allocation_pct,
      });
    }
    // Sort by allocation_pct descending (biggest commitments first)
    out.sort((a, b) => b.allocation_pct - a.allocation_pct);
    return out;
  }, [matrix, person.name]);

  const barWidth = Math.min(100, pctNow * 100);
  const avgBarWidth = Math.min(100, avgPct * 100);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl bg-white shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
              {initials(person.name)}
            </div>
            <div>
              <div className="text-base font-semibold text-slate-900">{person.name}</div>
              <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                <span>{person.role}</span>
                <span>·</span>
                <span className="tabular-nums">{capacity.toFixed(0)}h/wk capacity</span>
                {person.team && (
                  <>
                    <span>·</span>
                    <span>{person.team}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* This Week + Total hero row */}
        <div className="grid grid-cols-2 gap-4 border-b border-slate-100 p-6">
          {/* This Week */}
          <div className="rounded-lg border border-slate-200 p-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              This Week
            </div>
            <div className="mt-2 flex items-end justify-between gap-2">
              <div>
                <div className={cn("text-3xl font-bold tabular-nums", style.text)}>
                  {Math.round(pctNow * 100)}
                  <span className="ml-0.5 text-base font-semibold text-slate-400">%</span>
                </div>
                <div className="mt-0.5 text-[11px] tabular-nums text-slate-500">
                  {allocatedHrs}h of {capacity.toFixed(0)}h · {freeHrs}h free
                </div>
              </div>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                  style.pillBg,
                  style.pillText,
                )}
              >
                {style.label}
              </span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className={cn("h-full rounded-full", style.bar)}
                style={{ width: `${barWidth}%` }}
              />
            </div>
          </div>

          {/* 26-Week Average (Total) */}
          <div className="rounded-lg border border-slate-200 p-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Total — Avg 26 Weeks
            </div>
            <div className="mt-2 flex items-end justify-between gap-2">
              <div>
                <div className={cn("text-3xl font-bold tabular-nums", avgStyle.text)}>
                  {Math.round(avgPct * 100)}
                  <span className="ml-0.5 text-base font-semibold text-slate-400">%</span>
                </div>
                <div className="mt-0.5 text-[11px] tabular-nums text-slate-500">
                  Project-average load across the visible horizon
                </div>
              </div>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                  avgStyle.pillBg,
                  avgStyle.pillText,
                )}
              >
                {avgStyle.label}
              </span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className={cn("h-full rounded-full", avgStyle.bar)}
                style={{ width: `${avgBarWidth}%` }}
              />
            </div>
          </div>
        </div>

        {/* Projects assigned */}
        <div className="p-6">
          <div className="mb-3 flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-slate-500" />
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Assigned Projects
            </div>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
              {assignedProjects.length}
            </span>
          </div>
          {assignedProjects.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 px-4 py-6 text-center text-xs text-slate-400">
              No project assignments.
            </div>
          ) : (
            <div className="space-y-2">
              {assignedProjects.map((p) => (
                <AssignedProjectRow key={`${p.id}-${p.role_key}`} project={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AssignedProjectRow({ project }: { project: PersonAssignedProject }) {
  const allocPct = Math.round(project.allocation_pct * 100);
  const healthLabel = project.health ? project.health.replace(/^[^\w]*/, "").trim() : "Unknown";
  const roleLabel = ROLE_SHORT[project.role_key] ?? project.role_key;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-slate-400">{project.id}</span>
          <span className="truncate text-sm font-medium text-slate-800">{project.name}</span>
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-500">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-2.5 w-2.5" />
            <span className="tabular-nums">{project.est_hours.toLocaleString()}h total</span>
          </span>
          {project.priority && (
            <>
              <span>·</span>
              <span>{project.priority} priority</span>
            </>
          )}
          {project.health && (
            <>
              <span>·</span>
              <span>{healthLabel}</span>
            </>
          )}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          {roleLabel}
        </div>
        <div className="text-sm font-bold tabular-nums text-slate-700">{allocPct}%</div>
      </div>
    </div>
  );
}

const ROLE_SHORT: Record<string, string> = {
  pm: "PM",
  ba: "BA",
  functional: "Functional",
  technical: "Technical",
  developer: "Developer",
  infrastructure: "Infrastructure",
  dba: "DBA",
  erp: "ERP",
  "wms consultant": "WMS",
  wms: "WMS",
};
