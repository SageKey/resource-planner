// -------------------------------------------------------------------------
// Mock data for the Wireframes page
// -------------------------------------------------------------------------
// NOTE: This is hardcoded, illustrative data for design mockups only.
// It does NOT reflect the live capacity math or the real portfolio.
// Do not import anything from @/types/* here — keep this isolated so
// schema churn doesn't break the wireframe.
// -------------------------------------------------------------------------

export type PhaseKey = "planning" | "build" | "test_deploy";
export type PhaseOrDone = PhaseKey | "done" | "not_started";
export type RoleKey =
  | "pm"
  | "ba"
  | "functional"
  | "technical"
  | "developer"
  | "infrastructure";

export interface MockRole {
  key: RoleKey;
  label: string;
  shortLabel: string;
  headcount: number;
  totalHrsWeek: number;
}

export const ROLES: MockRole[] = [
  { key: "pm", label: "Project Manager", shortLabel: "PM", headcount: 3, totalHrsWeek: 66 },
  { key: "ba", label: "Business Analyst", shortLabel: "BA", headcount: 4, totalHrsWeek: 79 },
  { key: "functional", label: "Functional", shortLabel: "FN", headcount: 2, totalHrsWeek: 42 },
  { key: "technical", label: "Technical", shortLabel: "TC", headcount: 6, totalHrsWeek: 112 },
  { key: "developer", label: "Developer", shortLabel: "DV", headcount: 4, totalHrsWeek: 69 },
  { key: "infrastructure", label: "Infrastructure", shortLabel: "IN", headcount: 3, totalHrsWeek: 48 },
];

export const ROLE_BY_KEY: Record<RoleKey, MockRole> = Object.fromEntries(
  ROLES.map((r) => [r.key, r]),
) as Record<RoleKey, MockRole>;

export interface PhaseState {
  hoursByRole: Partial<Record<RoleKey, number>>;
  progress: number; // 0..1
  startWeek: number | null; // index into the 12-week timeline (0..11), null if not yet scheduled
  endWeek: number | null;
}

export interface MockProject {
  id: string;
  name: string;
  tshirt: "S" | "M" | "L" | "XL";
  totalHours: number;
  currentPhase: PhaseOrDone;
  // Stable Tailwind color classes so the same project looks the same everywhere
  colorBar: string; // block/bar fill (e.g. "bg-sky-500")
  colorBarText: string; // bar text
  colorBadge: string; // subtle badge (e.g. "bg-sky-100 text-sky-700")
  colorDot: string; // dot / legend swatch
  planning: PhaseState;
  build: PhaseState;
  test_deploy: PhaseState;
}

// Each project has a stable color picked from this palette.
// sky, emerald, violet, amber, rose, teal, indigo
const PALETTE = {
  sky: {
    bar: "bg-sky-500",
    barText: "text-sky-50",
    badge: "bg-sky-100 text-sky-700",
    dot: "bg-sky-500",
  },
  emerald: {
    bar: "bg-emerald-500",
    barText: "text-emerald-50",
    badge: "bg-emerald-100 text-emerald-700",
    dot: "bg-emerald-500",
  },
  violet: {
    bar: "bg-violet-500",
    barText: "text-violet-50",
    badge: "bg-violet-100 text-violet-700",
    dot: "bg-violet-500",
  },
  amber: {
    bar: "bg-amber-500",
    barText: "text-amber-50",
    badge: "bg-amber-100 text-amber-800",
    dot: "bg-amber-500",
  },
  rose: {
    bar: "bg-rose-500",
    barText: "text-rose-50",
    badge: "bg-rose-100 text-rose-700",
    dot: "bg-rose-500",
  },
  teal: {
    bar: "bg-teal-500",
    barText: "text-teal-50",
    badge: "bg-teal-100 text-teal-700",
    dot: "bg-teal-500",
  },
  indigo: {
    bar: "bg-indigo-500",
    barText: "text-indigo-50",
    badge: "bg-indigo-100 text-indigo-700",
    dot: "bg-indigo-500",
  },
} as const;

type PaletteKey = keyof typeof PALETTE;

function project(
  id: string,
  name: string,
  paletteKey: PaletteKey,
  tshirt: MockProject["tshirt"],
  totalHours: number,
  currentPhase: PhaseOrDone,
  planning: PhaseState,
  build: PhaseState,
  test_deploy: PhaseState,
): MockProject {
  const p = PALETTE[paletteKey];
  return {
    id,
    name,
    tshirt,
    totalHours,
    currentPhase,
    colorBar: p.bar,
    colorBarText: p.barText,
    colorBadge: p.badge,
    colorDot: p.dot,
    planning,
    build,
    test_deploy,
  };
}

// 7 projects — varied phase, varied size, a done one, a waiting one,
// plus some small work that skipped Planning.
export const PROJECTS: MockProject[] = [
  project(
    "ETE-68",
    "Catalog API Rust2Python",
    "sky",
    "L",
    640,
    "build",
    { hoursByRole: { pm: 30, ba: 40, technical: 60 }, progress: 1, startWeek: 0, endWeek: 2 },
    { hoursByRole: { pm: 40, developer: 320, technical: 40 }, progress: 0.55, startWeek: 2, endWeek: 8 },
    { hoursByRole: { pm: 20, developer: 60, infrastructure: 30 }, progress: 0, startWeek: 8, endWeek: 10 },
  ),
  project(
    "ETE-97",
    "Standard Order Notifications",
    "emerald",
    "M",
    200,
    "planning",
    { hoursByRole: { pm: 15, ba: 40, functional: 20 }, progress: 0.6, startWeek: 0, endWeek: 2 },
    { hoursByRole: { pm: 10, developer: 90, technical: 15 }, progress: 0, startWeek: 2, endWeek: 6 },
    { hoursByRole: { pm: 5, developer: 15, infrastructure: 5 }, progress: 0, startWeek: 6, endWeek: 7 },
  ),
  project(
    "ETE-19",
    "AR Aging Report Fix",
    "amber",
    "S",
    80,
    "build",
    { hoursByRole: {}, progress: 1, startWeek: 0, endWeek: 0 }, // small: skipped planning
    { hoursByRole: { developer: 55, technical: 10 }, progress: 0.35, startWeek: 0, endWeek: 3 },
    { hoursByRole: { developer: 10, ba: 5 }, progress: 0, startWeek: 3, endWeek: 4 },
  ),
  project(
    "ETE-43",
    "Microsoft Purview Rollout",
    "violet",
    "XL",
    1280,
    "planning",
    { hoursByRole: { pm: 60, ba: 80, functional: 40, infrastructure: 60 }, progress: 0.3, startWeek: 0, endWeek: 4 },
    { hoursByRole: { pm: 40, developer: 280, technical: 120, infrastructure: 120 }, progress: 0, startWeek: 4, endWeek: 11 },
    { hoursByRole: { pm: 30, developer: 60, infrastructure: 80, ba: 30 }, progress: 0, startWeek: 11, endWeek: 12 },
  ),
  project(
    "ETE-37",
    "Magic Search (BuyETE)",
    "rose",
    "S",
    100,
    "planning",
    { hoursByRole: { pm: 8, ba: 20, functional: 10 }, progress: 0.2, startWeek: 1, endWeek: 3 },
    { hoursByRole: { developer: 45, technical: 10 }, progress: 0, startWeek: 3, endWeek: 6 },
    { hoursByRole: { developer: 5, pm: 2 }, progress: 0, startWeek: 6, endWeek: 7 },
  ),
  project(
    "ETE-124",
    "Clean Up Return Loads",
    "teal",
    "M",
    200,
    "test_deploy",
    { hoursByRole: { pm: 20, ba: 30, functional: 20 }, progress: 1, startWeek: 0, endWeek: 2 },
    { hoursByRole: { developer: 80, technical: 30 }, progress: 1, startWeek: 2, endWeek: 5 },
    { hoursByRole: { developer: 15, ba: 10, pm: 10 }, progress: 0.45, startWeek: 5, endWeek: 7 },
  ),
  project(
    "ETE-7",
    "Outsourced Unit Core Accounting",
    "indigo",
    "XL",
    1600,
    "not_started",
    { hoursByRole: { pm: 80, ba: 120, functional: 60 }, progress: 0, startWeek: 4, endWeek: 8 },
    { hoursByRole: { pm: 40, developer: 500, technical: 200 }, progress: 0, startWeek: 8, endWeek: 11 },
    { hoursByRole: { pm: 20, developer: 60, infrastructure: 40 }, progress: 0, startWeek: 11, endWeek: 12 },
  ),
];

export const TIMELINE_WEEKS = 12;

// -------------------------------------------------------------------------
// Derived helpers — pure, computed once at module load
// -------------------------------------------------------------------------

export function phaseLabel(p: PhaseOrDone): string {
  switch (p) {
    case "planning":
      return "Planning";
    case "build":
      return "Build";
    case "test_deploy":
      return "Test / Deploy";
    case "done":
      return "Done";
    case "not_started":
      return "Not Started";
  }
}

export function phaseBadge(p: PhaseOrDone): string {
  switch (p) {
    case "planning":
      return "bg-sky-100 text-sky-700";
    case "build":
      return "bg-amber-100 text-amber-800";
    case "test_deploy":
      return "bg-emerald-100 text-emerald-700";
    case "done":
      return "bg-slate-100 text-slate-500";
    case "not_started":
      return "bg-slate-100 text-slate-500";
  }
}

// "Currently working on" for a role: projects whose current phase uses this role.
export interface CurrentWorkItem {
  project: MockProject;
  phase: PhaseKey;
  hoursRemaining: number; // rough: phase hours for role × (1 - progress)
  hoursTotal: number;
}

export function currentWorkForRole(roleKey: RoleKey): CurrentWorkItem[] {
  const items: CurrentWorkItem[] = [];
  for (const p of PROJECTS) {
    if (p.currentPhase === "done" || p.currentPhase === "not_started") continue;
    const phase = p.currentPhase as PhaseKey;
    const phaseState = p[phase];
    const hrs = phaseState.hoursByRole[roleKey] ?? 0;
    if (hrs <= 0) continue;
    items.push({
      project: p,
      phase,
      hoursRemaining: Math.round(hrs * (1 - phaseState.progress)),
      hoursTotal: hrs,
    });
  }
  return items.sort((a, b) => b.hoursRemaining - a.hoursRemaining);
}

// "Up next" for a role: projects that aren't currently using this role
// but will in a later phase. Returns at most 3.
export interface UpNextItem {
  project: MockProject;
  phase: PhaseKey;
  hours: number;
  estStartWeek: number;
}

export function upcomingWorkForRole(roleKey: RoleKey): UpNextItem[] {
  const items: UpNextItem[] = [];
  for (const p of PROJECTS) {
    const phases: PhaseKey[] = ["planning", "build", "test_deploy"];
    for (const ph of phases) {
      const state = p[ph];
      const hrs = state.hoursByRole[roleKey] ?? 0;
      if (hrs <= 0) continue;
      // Skip the phase already in progress for this role
      if (p.currentPhase === ph) continue;
      // Skip phases already done (before current phase)
      if (p.currentPhase !== "not_started") {
        const order = ["planning", "build", "test_deploy"];
        const currentIdx = order.indexOf(p.currentPhase as string);
        const thisIdx = order.indexOf(ph);
        if (currentIdx >= 0 && thisIdx < currentIdx) continue;
      }
      items.push({
        project: p,
        phase: ph,
        hours: hrs,
        estStartWeek: state.startWeek ?? 99,
      });
      break; // only the first upcoming phase per project
    }
  }
  return items.sort((a, b) => a.estStartWeek - b.estStartWeek).slice(0, 3);
}

// Demand this week for a role — sum of "currently working on" hours divided
// roughly over their remaining weeks. Used for the "free this week" metric.
export function roleWeeklyLoad(roleKey: RoleKey): {
  consumedHrs: number;
  freeHrs: number;
  pctUsed: number; // 0..1
} {
  const role = ROLE_BY_KEY[roleKey];
  let consumed = 0;
  for (const p of PROJECTS) {
    if (p.currentPhase === "done" || p.currentPhase === "not_started") continue;
    const phase = p.currentPhase as PhaseKey;
    const state = p[phase];
    const hrs = state.hoursByRole[roleKey] ?? 0;
    if (hrs <= 0) continue;
    const remainingWeeks = Math.max(1, (state.endWeek ?? 1) - (state.startWeek ?? 0));
    const remainingHrs = hrs * (1 - state.progress);
    consumed += remainingHrs / remainingWeeks;
  }
  const total = role.totalHrsWeek;
  const free = Math.max(0, total - consumed);
  return {
    consumedHrs: Math.round(consumed * 10) / 10,
    freeHrs: Math.round(free * 10) / 10,
    pctUsed: Math.min(1, consumed / total),
  };
}

// For the kanban view: group projects by current phase
export function projectsInPhase(phase: PhaseKey): MockProject[] {
  return PROJECTS.filter((p) => p.currentPhase === phase);
}

export function projectsWaitingToStart(): MockProject[] {
  return PROJECTS.filter((p) => p.currentPhase === "not_started");
}

// For the timeline view: returns all "blocks" for a role.
// A block is a phase-of-a-project that consumes this role for a week range.
export interface TimelineBlock {
  project: MockProject;
  phase: PhaseKey;
  startWeek: number;
  endWeek: number;
  hours: number;
}

export function timelineBlocksForRole(roleKey: RoleKey): TimelineBlock[] {
  const blocks: TimelineBlock[] = [];
  for (const p of PROJECTS) {
    const phases: PhaseKey[] = ["planning", "build", "test_deploy"];
    for (const ph of phases) {
      const state = p[ph];
      const hrs = state.hoursByRole[roleKey] ?? 0;
      if (hrs <= 0) continue;
      if (state.startWeek === null || state.endWeek === null) continue;
      blocks.push({
        project: p,
        phase: ph,
        startWeek: state.startWeek,
        endWeek: state.endWeek,
        hours: hrs,
      });
    }
  }
  return blocks;
}

// For the timeline week header — generate 12 labels starting from next Monday
export function weekLabels(): string[] {
  const out: string[] = [];
  const now = new Date();
  const daysToMonday = (8 - now.getDay()) % 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() + (daysToMonday || 7));
  for (let i = 0; i < TIMELINE_WEEKS; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i * 7);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    out.push(`${mm}/${dd}`);
  }
  return out;
}
