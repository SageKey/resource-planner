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
export type Priority = "Highest" | "High" | "Medium" | "Low";

// Fake "today" baked in so the wireframe looks the same regardless of
// when someone views it. Aligns with the project date spread below so
// TODAY lands mid-range.
export const MOCK_TODAY = new Date("2026-04-09T00:00:00");

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
  startWeek: number | null;
  endWeek: number | null;
}

export interface MockProject {
  id: string;
  name: string;
  tshirt: "S" | "M" | "L" | "XL";
  totalHours: number;
  currentPhase: PhaseOrDone;
  // Overall (portfolio-level) fields used by the Gantt view
  priority: Priority;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  pctComplete: number; // 0..1 overall project progress
  // Stable Tailwind color classes so the same project looks the same everywhere
  colorBar: string;
  colorBarText: string;
  colorBadge: string;
  colorDot: string;
  // Phase-level details used by RoleCards + PhaseKanban
  planning: PhaseState;
  build: PhaseState;
  test_deploy: PhaseState;
}

// Palette — each project gets a stable entry
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

interface ProjectInit {
  id: string;
  name: string;
  paletteKey: PaletteKey;
  tshirt: MockProject["tshirt"];
  totalHours: number;
  currentPhase: PhaseOrDone;
  priority: Priority;
  startDate: string;
  endDate: string;
  pctComplete: number;
  planning: PhaseState;
  build: PhaseState;
  test_deploy: PhaseState;
}

function project(o: ProjectInit): MockProject {
  const p = PALETTE[o.paletteKey];
  return {
    id: o.id,
    name: o.name,
    tshirt: o.tshirt,
    totalHours: o.totalHours,
    currentPhase: o.currentPhase,
    priority: o.priority,
    startDate: o.startDate,
    endDate: o.endDate,
    pctComplete: o.pctComplete,
    colorBar: p.bar,
    colorBarText: p.barText,
    colorBadge: p.badge,
    colorDot: p.dot,
    planning: o.planning,
    build: o.build,
    test_deploy: o.test_deploy,
  };
}

// 7 projects — varied priority, size, phase, progress, and dates so
// the Gantt has visual variety and the other views have enough state
// to look populated.
export const PROJECTS: MockProject[] = [
  project({
    id: "ETE-68",
    name: "Catalog API Rust2Python",
    paletteKey: "sky",
    tshirt: "L",
    totalHours: 640,
    currentPhase: "build",
    priority: "Highest",
    startDate: "2025-11-15",
    endDate: "2026-06-24",
    pctComplete: 0.55,
    planning: { hoursByRole: { pm: 30, ba: 40, technical: 60 }, progress: 1, startWeek: 0, endWeek: 2 },
    build: { hoursByRole: { pm: 40, developer: 320, technical: 40 }, progress: 0.55, startWeek: 2, endWeek: 8 },
    test_deploy: { hoursByRole: { pm: 20, developer: 60, infrastructure: 30 }, progress: 0, startWeek: 8, endWeek: 10 },
  }),
  project({
    id: "ETE-43",
    name: "Microsoft Purview Rollout",
    paletteKey: "violet",
    tshirt: "XL",
    totalHours: 1280,
    currentPhase: "planning",
    priority: "Highest",
    startDate: "2026-03-01",
    endDate: "2026-09-15",
    pctComplete: 0.3,
    planning: { hoursByRole: { pm: 60, ba: 80, functional: 40, infrastructure: 60 }, progress: 0.3, startWeek: 0, endWeek: 4 },
    build: { hoursByRole: { pm: 40, developer: 280, technical: 120, infrastructure: 120 }, progress: 0, startWeek: 4, endWeek: 11 },
    test_deploy: { hoursByRole: { pm: 30, developer: 60, infrastructure: 80, ba: 30 }, progress: 0, startWeek: 11, endWeek: 12 },
  }),
  project({
    id: "ETE-97",
    name: "Standard Order Notifications",
    paletteKey: "emerald",
    tshirt: "M",
    totalHours: 200,
    currentPhase: "planning",
    priority: "High",
    startDate: "2026-02-01",
    endDate: "2026-05-20",
    pctComplete: 0.2,
    planning: { hoursByRole: { pm: 15, ba: 40, functional: 20 }, progress: 0.6, startWeek: 0, endWeek: 2 },
    build: { hoursByRole: { pm: 10, developer: 90, technical: 15 }, progress: 0, startWeek: 2, endWeek: 6 },
    test_deploy: { hoursByRole: { pm: 5, developer: 15, infrastructure: 5 }, progress: 0, startWeek: 6, endWeek: 7 },
  }),
  project({
    id: "ETE-7",
    name: "Outsourced Unit Core Accounting",
    paletteKey: "indigo",
    tshirt: "XL",
    totalHours: 1600,
    currentPhase: "not_started",
    priority: "High",
    startDate: "2026-06-01",
    endDate: "2026-12-15",
    pctComplete: 0,
    planning: { hoursByRole: { pm: 80, ba: 120, functional: 60 }, progress: 0, startWeek: 4, endWeek: 8 },
    build: { hoursByRole: { pm: 40, developer: 500, technical: 200 }, progress: 0, startWeek: 8, endWeek: 11 },
    test_deploy: { hoursByRole: { pm: 20, developer: 60, infrastructure: 40 }, progress: 0, startWeek: 11, endWeek: 12 },
  }),
  project({
    id: "ETE-37",
    name: "Magic Search (BuyETE)",
    paletteKey: "rose",
    tshirt: "S",
    totalHours: 100,
    currentPhase: "planning",
    priority: "High",
    startDate: "2026-04-15",
    endDate: "2026-06-30",
    pctComplete: 0.05,
    planning: { hoursByRole: { pm: 8, ba: 20, functional: 10 }, progress: 0.2, startWeek: 1, endWeek: 3 },
    build: { hoursByRole: { developer: 45, technical: 10 }, progress: 0, startWeek: 3, endWeek: 6 },
    test_deploy: { hoursByRole: { developer: 5, pm: 2 }, progress: 0, startWeek: 6, endWeek: 7 },
  }),
  project({
    id: "ETE-124",
    name: "Clean Up Return Loads",
    paletteKey: "teal",
    tshirt: "M",
    totalHours: 200,
    currentPhase: "test_deploy",
    priority: "Medium",
    startDate: "2025-12-01",
    endDate: "2026-05-10",
    pctComplete: 0.75,
    planning: { hoursByRole: { pm: 20, ba: 30, functional: 20 }, progress: 1, startWeek: 0, endWeek: 2 },
    build: { hoursByRole: { developer: 80, technical: 30 }, progress: 1, startWeek: 2, endWeek: 5 },
    test_deploy: { hoursByRole: { developer: 15, ba: 10, pm: 10 }, progress: 0.45, startWeek: 5, endWeek: 7 },
  }),
  project({
    id: "ETE-19",
    name: "AR Aging Report Fix",
    paletteKey: "amber",
    tshirt: "S",
    totalHours: 80,
    currentPhase: "build",
    priority: "Medium",
    startDate: "2026-03-10",
    endDate: "2026-04-24",
    pctComplete: 0.35,
    planning: { hoursByRole: {}, progress: 1, startWeek: 0, endWeek: 0 }, // small: skipped planning
    build: { hoursByRole: { developer: 55, technical: 10 }, progress: 0.35, startWeek: 0, endWeek: 3 },
    test_deploy: { hoursByRole: { developer: 10, ba: 5 }, progress: 0, startWeek: 3, endWeek: 4 },
  }),
];

// -------------------------------------------------------------------------
// Derived helpers — pure, computed on call
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

export interface CurrentWorkItem {
  project: MockProject;
  phase: PhaseKey;
  hoursRemaining: number;
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
      if (p.currentPhase === ph) continue;
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
      break;
    }
  }
  return items.sort((a, b) => a.estStartWeek - b.estStartWeek).slice(0, 3);
}

export function roleWeeklyLoad(roleKey: RoleKey): {
  consumedHrs: number;
  freeHrs: number;
  pctUsed: number;
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

export function projectsInPhase(phase: PhaseKey): MockProject[] {
  return PROJECTS.filter((p) => p.currentPhase === phase);
}

export function projectsWaitingToStart(): MockProject[] {
  return PROJECTS.filter((p) => p.currentPhase === "not_started");
}
