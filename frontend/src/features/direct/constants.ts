// -------------------------------------------------------------------------
// Direct Model — frontend constants (Round 1)
// -------------------------------------------------------------------------
// Duplicated rather than shared with phaseModelV2.ts on purpose. See the
// plan: Direct code must not import from v1/v2 to keep the feature
// quarantined and easy to delete if the experiment doesn't land.
// -------------------------------------------------------------------------

export const DIRECT_PHASE_ORDER = ["planning", "execution", "testing_go_live"] as const;

export const DIRECT_PHASE_LABEL: Record<string, string> = {
  planning: "Planning",
  execution: "Execution",
  testing_go_live: "Testing / Go Live",
};

export const DIRECT_PHASE_STYLE: Record<string, string> = {
  planning: "bg-sky-100 text-sky-700",
  execution: "bg-amber-100 text-amber-700",
  testing_go_live: "bg-emerald-100 text-emerald-700",
};

export function directPhaseLabel(key: string | null | undefined): string {
  if (!key) return "—";
  return DIRECT_PHASE_LABEL[key] ?? key;
}

export function directPhaseStyle(key: string | null | undefined): string {
  if (!key) return "bg-slate-100 text-slate-500";
  return DIRECT_PHASE_STYLE[key] ?? "bg-slate-100 text-slate-500";
}

// Canonical role ordering for tables and headers.
export const DIRECT_ROLE_ORDER = [
  "pm",
  "ba",
  "functional",
  "technical",
  "developer",
  "infrastructure",
  "dba",
  "erp",
] as const;

export const DIRECT_ROLE_LABEL: Record<string, string> = {
  pm: "PM",
  ba: "BA",
  functional: "Functional",
  technical: "Technical",
  developer: "Developer",
  infrastructure: "Infrastructure",
  dba: "DBA",
  erp: "ERP Consultant",
};
