// -------------------------------------------------------------------------
// Simplified SDLC v2 — frontend constants
// -------------------------------------------------------------------------
// Mirror of backend/engines/models.py SDLC_PHASES_V2 and helpers. The
// backend is the source of truth for the math; this file is purely for
// rendering phase labels and colors on the v2 pages, plus mapping legacy
// v1 phase strings (stored on projects) to the simplified phase buckets.
// -------------------------------------------------------------------------

export const V2_PHASE_KEYS = ["planning", "execution", "testing_go_live"] as const;

export type V2PhaseKey = (typeof V2_PHASE_KEYS)[number];

export const V2_PHASE_LABEL: Record<V2PhaseKey, string> = {
  planning: "Planning",
  execution: "Execution",
  testing_go_live: "Testing / Go Live",
};

/**
 * Mirror of DEFAULT_PHASE_WEIGHTS_V2 in backend/engines/models.py.
 * What fraction of a project's timeline each phase occupies.
 * Display-only; the backend is the source of truth for math.
 */
export const V2_PHASE_WEIGHTS: Record<V2PhaseKey, number> = {
  planning: 0.20,
  execution: 0.60,
  testing_go_live: 0.20,
};

/**
 * Mirror of DEFAULT_ROLE_PHASE_EFFORTS_V2 in backend/engines/models.py.
 * For each role, what fraction of their total project hours happens in
 * each phase. Each row sums to 1.00. Used to build "why this number
 * looks the way it does" explanations in the person detail modal.
 */
export const V2_ROLE_PHASE_EFFORTS: Record<string, Record<V2PhaseKey, number>> = {
  pm:             { planning: 0.30, execution: 0.50, testing_go_live: 0.20 },
  ba:             { planning: 0.40, execution: 0.20, testing_go_live: 0.40 },
  functional:     { planning: 0.60, execution: 0.30, testing_go_live: 0.10 },
  technical:      { planning: 0.40, execution: 0.50, testing_go_live: 0.10 },
  developer:      { planning: 0.05, execution: 0.80, testing_go_live: 0.15 },
  infrastructure: { planning: 0.10, execution: 0.30, testing_go_live: 0.60 },
  dba:            { planning: 0.10, execution: 0.60, testing_go_live: 0.30 },
  erp:            { planning: 0.15, execution: 0.30, testing_go_live: 0.55 },
  wms:            { planning: 0.15, execution: 0.30, testing_go_live: 0.55 },
};

/** Human-friendly role label for explanation text. */
export const ROLE_DISPLAY_NAME: Record<string, string> = {
  pm: "PM",
  ba: "BA",
  functional: "Functional",
  technical: "Technical",
  developer: "Developer",
  infrastructure: "Infrastructure",
  dba: "DBA",
  erp: "ERP Consultant",
  wms: "WMS Consultant",
  "wms consultant": "WMS Consultant",
};

/**
 * Look up a role's effort % in a given v2 phase. Returns null if the
 * role or phase isn't known.
 */
export function roleEffortInPhase(
  roleKey: string,
  phaseKey: string | null | undefined,
): number | null {
  if (!phaseKey) return null;
  const v2Phase = mapV1PhaseToV2(phaseKey);
  if (!v2Phase) return null;
  const efforts = V2_ROLE_PHASE_EFFORTS[roleKey.toLowerCase()];
  if (!efforts) return null;
  return efforts[v2Phase];
}

/** Tailwind classes for the v2 phase pill — matches the Phase Kanban
 *  wireframe color vocabulary so v2 visual language stays consistent. */
export const V2_PHASE_STYLE: Record<V2PhaseKey, string> = {
  planning: "bg-sky-100 text-sky-700",
  execution: "bg-amber-100 text-amber-700",
  testing_go_live: "bg-emerald-100 text-emerald-700",
};

export function v2PhaseStyle(key: string | null | undefined): string {
  if (!key) return "bg-slate-100 text-slate-500";
  return V2_PHASE_STYLE[key as V2PhaseKey] ?? "bg-slate-100 text-slate-500";
}

export function v2PhaseLabel(key: string | null | undefined): string {
  if (!key) return "—";
  return V2_PHASE_LABEL[key as V2PhaseKey] ?? key;
}

/**
 * Map a phase string to the v2 simplified phase it belongs to.
 *
 * Accepts BOTH v1 phase names (from the 6-phase model stored on projects)
 * AND v2 phase keys (returned by the backend when phase_model=v2 is passed
 * to the capacity endpoints). This makes the function safe to call with
 * any phase value without knowing its origin.
 *
 * Rules:
 *   v1: discovery / planning / design → planning (v2)
 *   v1: build                          → execution
 *   v1: test / deploy / hypercare      → testing_go_live
 *   v2: planning / execution / testing_go_live → pass through
 *   anything else / null               → null
 */
export function mapV1PhaseToV2(phase: string | null | undefined): V2PhaseKey | null {
  if (!phase) return null;
  const p = phase.toLowerCase().trim();

  // v2 phase keys pass through unchanged (idempotent)
  if (p === "planning" || p === "execution" || p === "testing_go_live") {
    return p as V2PhaseKey;
  }

  // v1 phase names map forward
  if (["discovery", "design"].includes(p)) return "planning";
  if (p === "build") return "execution";
  if (["test", "deploy", "deploy/hypercare", "hypercare"].includes(p)) {
    return "testing_go_live";
  }
  return null;
}
