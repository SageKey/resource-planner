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
 * Map a legacy v1 phase string (e.g. "build", "discovery") to the v2
 * simplified phase it belongs to. Used on the v2 Portfolio page so that
 * projects with v1 `current_phase` values still show a meaningful v2 pill.
 *
 * Rules:
 *   discovery / planning / design  → planning
 *   build                          → execution
 *   test / deploy / deploy_hypercare → testing_go_live
 *   anything else / null            → null
 */
export function mapV1PhaseToV2(v1Phase: string | null | undefined): V2PhaseKey | null {
  if (!v1Phase) return null;
  const p = v1Phase.toLowerCase().trim();
  if (["discovery", "planning", "design"].includes(p)) return "planning";
  if (p === "build") return "execution";
  if (["test", "deploy", "deploy/hypercare", "hypercare"].includes(p)) {
    return "testing_go_live";
  }
  return null;
}
