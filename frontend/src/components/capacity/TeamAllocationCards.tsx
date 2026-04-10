import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Briefcase, ChevronRight, Clock, Users, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { useAssignmentMatrix, type MatrixData } from "@/hooks/useAssignments";
import type { PersonHeatmapResponse, PersonHeatmapRow } from "@/hooks/useCapacity";
import { usePersonHeatmapDetailV2 } from "@/hooks/useCapacityV2";
import { mapV1PhaseToV2, v2PhaseLabel, v2PhaseStyle } from "@/lib/phaseModelV2";

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

  // "This Month" = rolling 4-week average starting with the current week.
  // cells[0..3]. Skip undefined cells gracefully for partial data.
  const monthCells = [0, 1, 2, 3]
    .map((i) => person.cells[i])
    .filter((c): c is number => typeof c === "number");
  const monthPct =
    monthCells.length > 0
      ? monthCells.reduce((a, b) => a + b, 0) / monthCells.length
      : 0;
  const monthStatus = capacity > 0 ? statusFromPct(monthPct) : "unknown";
  const monthStyle = STATUS_STYLE[monthStatus];
  const monthBarWidth = Math.min(100, monthPct * 100);
  const monthAllocatedHrs = Math.round(monthPct * capacity * 10) / 10;

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

      {/* This Month — rolling 4-week summary */}
      <div className="mt-4">
        <div className="mb-1 flex items-end justify-between">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              This Month
            </div>
            <div className="text-[9px] text-slate-400">Avg over next 4 weeks</div>
          </div>
          <div className={cn("text-lg font-bold tabular-nums", monthStyle.text)}>
            {Math.round(monthPct * 100)}
            <span className="ml-0.5 text-xs font-semibold text-slate-400">%</span>
          </div>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${monthBarWidth}%` }}
            transition={{ duration: 0.6, delay: 0.35 + index * 0.04, ease: "easeOut" }}
            className={cn("h-full rounded-full", monthStyle.bar)}
          />
        </div>
        <div className="mt-1 text-right text-[10px] tabular-nums text-slate-400">
          {monthAllocatedHrs}h/wk avg
        </div>
      </div>
    </motion.button>
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

  // Drill-down state: which project the user clicked into (if any)
  const [selectedProject, setSelectedProject] = useState<PersonAssignedProject | null>(null);

  // Fetch per-project current-week breakdown for this person. Used to
  // annotate each project row in the list with "Xh this week · [phase]".
  const detail = usePersonHeatmapDetailV2(person.name, 0);

  // Build a lookup: project_id → { hours this week, phase }
  // Only the projects currently consuming hours show up here. Projects
  // assigned but idle this week get 0h by default.
  const currentWeekByProjectId: Record<string, { hours: number; phase: string }> =
    useMemo(() => {
      const out: Record<string, { hours: number; phase: string }> = {};
      if (detail.data?.projects) {
        for (const p of detail.data.projects) {
          const prev = out[p.project_id];
          out[p.project_id] = {
            hours: (prev?.hours ?? 0) + p.demand_hrs,
            phase: p.phase,
          };
        }
      }
      return out;
    }, [detail.data]);

  // "This Month" = rolling 4-week average starting with the current week.
  // Matches the card's This Month metric.
  const monthPct = useMemo(() => {
    const monthCells = [0, 1, 2, 3]
      .map((i) => person.cells[i])
      .filter((c): c is number => typeof c === "number");
    if (monthCells.length === 0) return 0;
    return monthCells.reduce((a, b) => a + b, 0) / monthCells.length;
  }, [person.cells]);

  const monthStatus = capacity > 0 ? statusFromPct(monthPct) : "unknown";
  const monthStyle = STATUS_STYLE[monthStatus];
  const monthAllocatedHrs = Math.round(monthPct * capacity * 10) / 10;

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
  const monthBarWidth = Math.min(100, monthPct * 100);

  // If a project is selected, show the project drill-down view instead of
  // the person view. Back button returns to the person view.
  if (selectedProject) {
    return (
      <ProjectDrillDown
        project={selectedProject}
        fromPerson={person}
        matrix={matrix}
        onBack={() => setSelectedProject(null)}
        onClose={onClose}
      />
    );
  }

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

          {/* This Month (rolling 4-week avg, matches the card) */}
          <div className="rounded-lg border border-slate-200 p-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              This Month
            </div>
            <div className="mt-2 flex items-end justify-between gap-2">
              <div>
                <div className={cn("text-3xl font-bold tabular-nums", monthStyle.text)}>
                  {Math.round(monthPct * 100)}
                  <span className="ml-0.5 text-base font-semibold text-slate-400">%</span>
                </div>
                <div className="mt-0.5 text-[11px] tabular-nums text-slate-500">
                  {monthAllocatedHrs}h/wk avg · rolling 4-week window
                </div>
              </div>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                  monthStyle.pillBg,
                  monthStyle.pillText,
                )}
              >
                {monthStyle.label}
              </span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className={cn("h-full rounded-full", monthStyle.bar)}
                style={{ width: `${monthBarWidth}%` }}
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
              {assignedProjects.map((p) => {
                const weekInfo = currentWeekByProjectId[p.id];
                return (
                  <AssignedProjectRow
                    key={`${p.id}-${p.role_key}`}
                    project={p}
                    currentWeekHours={weekInfo?.hours ?? 0}
                    currentPhase={weekInfo?.phase ?? null}
                    onClick={() => setSelectedProject(p)}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AssignedProjectRow({
  project,
  currentWeekHours,
  currentPhase,
  onClick,
}: {
  project: PersonAssignedProject;
  currentWeekHours: number;
  currentPhase: string | null;
  onClick: () => void;
}) {
  const allocPct = Math.round(project.allocation_pct * 100);
  const healthLabel = project.health ? project.health.replace(/^[^\w]*/, "").trim() : "Unknown";
  const roleLabel = ROLE_SHORT[project.role_key] ?? project.role_key;

  // Map v1 phase string (if any) to v2 labels for consistency with the v2 page
  const v2Phase = mapV1PhaseToV2(currentPhase);
  const v2PhaseLbl = v2Phase ? v2PhaseLabel(v2Phase) : null;
  const hasHoursThisWeek = currentWeekHours >= 0.05;
  const hoursDisplay = hasHoursThisWeek
    ? `${currentWeekHours.toFixed(1)}h this week`
    : "No work this week";

  return (
    <button
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2.5 text-left transition-all hover:border-slate-200 hover:bg-white hover:shadow-sm"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-slate-400">{project.id}</span>
          <span className="truncate text-sm font-medium text-slate-800 group-hover:text-slate-900">
            {project.name}
          </span>
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
        {/* This-week breakdown line (connective tissue between the hero
            numbers above and the assigned projects below) */}
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span
            className={cn(
              "inline-flex items-center gap-1 text-[10px] font-semibold tabular-nums",
              hasHoursThisWeek ? "text-slate-700" : "text-slate-400",
            )}
          >
            {hoursDisplay}
          </span>
          {v2PhaseLbl && (
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[9px] font-medium",
                v2PhaseStyle(v2Phase),
              )}
            >
              {v2PhaseLbl}
            </span>
          )}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          {roleLabel}
        </div>
        <div className="text-sm font-bold tabular-nums text-slate-700">{allocPct}%</div>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition-colors group-hover:text-slate-500" />
    </button>
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

// ---------------------------------------------------------------------------
// Project drill-down view
// ---------------------------------------------------------------------------

/**
 * ProjectDrillDown — the "Person → Project" drill-down panel. Rendered in
 * place of the PersonDetailModal body when a user clicks an assigned
 * project row. Shows the project header, quick facts, and the full team
 * roster (everyone assigned to this project grouped by role), with the
 * originating person highlighted.
 *
 * A back button returns to the person view without closing the modal.
 */

interface ProjectTeamMember {
  name: string;
  role_key: string;
  allocation_pct: number;
  role_label: string;
  team: string | null;
  capacity_hrs_week: number;
}

function ProjectDrillDown({
  project,
  fromPerson,
  matrix,
  onBack,
  onClose,
}: {
  project: PersonAssignedProject;
  fromPerson: PersonHeatmapRow;
  matrix: MatrixData | undefined;
  onBack: () => void;
  onClose: () => void;
}) {
  // Build the full team on this project from the assignment matrix.
  // The matrix is keyed project_id → person_name → {role_key, allocation_pct}.
  const team: ProjectTeamMember[] = useMemo(() => {
    if (!matrix) return [];
    const personByName: Record<string, MatrixData["people"][number]> = {};
    for (const p of matrix.people) {
      personByName[p.name] = p;
    }
    const projectAssignments = matrix.assignments[project.id] ?? {};

    const out: ProjectTeamMember[] = [];
    for (const [personName, entry] of Object.entries(projectAssignments)) {
      const person = personByName[personName];
      out.push({
        name: personName,
        role_key: entry.role_key,
        allocation_pct: entry.allocation_pct,
        role_label: person?.role ?? entry.role_key,
        team: person?.team ?? null,
        capacity_hrs_week: person?.capacity_hrs_week ?? 0,
      });
    }
    // Sort by role order first (PM, BA, Functional, Technical, Developer, Infra, DBA, ERP),
    // then by allocation % desc within each role, then by name
    const ROLE_ORDER = [
      "pm",
      "ba",
      "functional",
      "technical",
      "developer",
      "infrastructure",
      "dba",
      "erp",
      "wms",
      "wms consultant",
    ];
    const roleIdx = (rk: string) => {
      const i = ROLE_ORDER.indexOf(rk);
      return i < 0 ? 99 : i;
    };
    out.sort((a, b) => {
      const r = roleIdx(a.role_key) - roleIdx(b.role_key);
      if (r !== 0) return r;
      const alloc = b.allocation_pct - a.allocation_pct;
      if (alloc !== 0) return alloc;
      return a.name.localeCompare(b.name);
    });
    return out;
  }, [matrix, project.id]);

  // Group team by role for display
  const teamByRole: { role_key: string; members: ProjectTeamMember[] }[] = useMemo(() => {
    const groups: Record<string, ProjectTeamMember[]> = {};
    for (const m of team) {
      if (!groups[m.role_key]) groups[m.role_key] = [];
      groups[m.role_key].push(m);
    }
    return Object.entries(groups).map(([role_key, members]) => ({ role_key, members }));
  }, [team]);

  const totalAllocated = team.reduce((s, m) => s + m.allocation_pct, 0);
  const healthLabel = project.health
    ? project.health.replace(/^[^\w]*/, "").trim()
    : "Unknown";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl bg-white shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Back / breadcrumb header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-2.5">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-600 transition-colors hover:text-slate-900"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to {fromPerson.name}
          </button>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Project header */}
        <div className="border-b border-slate-100 px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="font-mono text-[10px] text-slate-400">{project.id}</div>
              <div className="mt-0.5 text-base font-semibold text-slate-900">{project.name}</div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {project.priority && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                    {project.priority} priority
                  </span>
                )}
                {project.health && (
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                    {healthLabel}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                  <Clock className="h-2.5 w-2.5" />
                  <span className="tabular-nums">
                    {project.est_hours.toLocaleString()}h total
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Team roster */}
        <div className="p-6">
          <div className="mb-3 flex items-center gap-2">
            <Users className="h-4 w-4 text-slate-500" />
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Project Team
            </div>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
              {team.length} {team.length === 1 ? "person" : "people"}
            </span>
            {totalAllocated > 0 && (
              <span className="ml-auto text-[10px] tabular-nums text-slate-400">
                {Math.round(totalAllocated * 100)}% total allocated
              </span>
            )}
          </div>

          {team.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 px-4 py-6 text-center text-xs text-slate-400">
              No team members assigned yet.
            </div>
          ) : (
            <div className="space-y-3">
              {teamByRole.map(({ role_key, members }) => (
                <div key={role_key}>
                  <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    {ROLE_SHORT[role_key] ?? role_key}
                  </div>
                  <div className="space-y-1.5">
                    {members.map((member) => {
                      const isFromPerson = member.name === fromPerson.name;
                      return (
                        <div
                          key={member.name}
                          className={cn(
                            "flex items-center gap-3 rounded-lg border px-3 py-2",
                            isFromPerson
                              ? "border-emerald-200 bg-emerald-50"
                              : "border-slate-100 bg-slate-50/60",
                          )}
                        >
                          <div
                            className={cn(
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                              isFromPerson
                                ? "bg-emerald-200 text-emerald-800"
                                : "bg-slate-200 text-slate-600",
                            )}
                          >
                            {initials(member.name)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  "truncate text-sm font-medium",
                                  isFromPerson ? "text-emerald-900" : "text-slate-800",
                                )}
                              >
                                {member.name}
                              </span>
                              {isFromPerson && (
                                <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-emerald-700">
                                  Viewing
                                </span>
                              )}
                            </div>
                            {member.team && (
                              <div className="mt-0.5 text-[10px] text-slate-500">
                                {member.team} · {member.capacity_hrs_week.toFixed(0)}h/wk
                              </div>
                            )}
                          </div>
                          <div className="shrink-0 text-right">
                            <div className="text-sm font-bold tabular-nums text-slate-700">
                              {Math.round(member.allocation_pct * 100)}%
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
