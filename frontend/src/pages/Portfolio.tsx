import { useMemo, useState } from "react";
import { AlertTriangle, ChevronDown, FolderKanban, Plus, Trash2 } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { EditProjectDialog } from "@/components/portfolio/EditProjectDialog";
import { usePortfolio, useDeleteProject } from "@/hooks/usePortfolio";
import { formatDate, dueUrgency } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Project } from "@/types/project";

// ---------------------------------------------------------------------------
// Spec helpers
// ---------------------------------------------------------------------------

/** Returns the "active" spec due date for a project in the needs_spec group —
 *  the technical due date if the project is in Needs Technical Spec (functional
 *  is done), otherwise the functional due date. */
function activeSpecDue(p: Project): string | null {
  const h = (p.health ?? "").toUpperCase();
  if (h.includes("TECHNICAL SPEC")) return p.technical_spec_due;
  return p.functional_spec_due;
}

/** Returns the "most recent" spec completion to show in the Needs Spec table
 *  (only functional spec can be completed while still in the group). */
function shownSpecCompleted(p: Project): string | null {
  const h = (p.health ?? "").toUpperCase();
  if (h.includes("TECHNICAL SPEC")) return p.functional_spec_completed;
  return null;
}

function specDueCellClass(d: string | null | undefined): string {
  const u = dueUrgency(d);
  if (u === "overdue") return "bg-red-50 text-red-700 font-semibold";
  if (u === "this_week") return "bg-amber-50 text-amber-700 font-medium";
  return "text-slate-500";
}

// ---------------------------------------------------------------------------
// Health grouping
// ---------------------------------------------------------------------------

const ROLE_DOTS = [
  { key: "pm", short: "PM", label: "Project Manager" },
  { key: "ba", short: "BA", label: "Business Analyst" },
  { key: "functional", short: "FN", label: "Functional" },
  { key: "technical", short: "TC", label: "Technical" },
  { key: "developer", short: "DV", label: "Developer" },
  { key: "infrastructure", short: "IN", label: "Infrastructure" },
  { key: "dba", short: "DB", label: "DBA" },
  { key: "erp", short: "ER", label: "ERP" },
];

const GROUP_ORDER = [
  { key: "on_track", label: "On Track", icon: "\u{1f7e2}", headerColor: "text-emerald-700" },
  { key: "needs_spec", label: "Needs Spec", icon: "\u{1f535}", headerColor: "text-blue-700" },
  { key: "not_started", label: "Not Started", icon: "\u26aa", headerColor: "text-slate-600" },
  { key: "postponed", label: "Postponed", icon: "\u23f8\ufe0f", headerColor: "text-slate-400" },
  { key: "complete", label: "Complete", icon: "\u2705", headerColor: "text-emerald-500" },
];

function healthGroupKey(h: string | null | undefined): string {
  if (!h) return "not_started";
  const up = h.toUpperCase();
  if (up.includes("ON TRACK") || up.includes("AT RISK") || up.includes("NEEDS HELP"))
    return "on_track";
  if (up.includes("NEEDS FUNCTIONAL SPEC") || up.includes("NEEDS TECHNICAL SPEC"))
    return "needs_spec";
  if (up.includes("POSTPONED")) return "postponed";
  if (up.includes("COMPLETE") && !up.includes("INCOMPLETE")) return "complete";
  return "not_started";
}

// ---------------------------------------------------------------------------
// Health badge styling
// ---------------------------------------------------------------------------

const HEALTH_STYLE: Record<string, string> = {
  "ON TRACK": "bg-emerald-100 text-emerald-800",
  "AT RISK": "bg-amber-100 text-amber-800",
  "NEEDS HELP": "bg-red-100 text-red-800",
  "NOT STARTED": "bg-slate-100 text-slate-600",
  "NEEDS FUNCTIONAL SPEC": "bg-blue-100 text-blue-800",
  "NEEDS TECHNICAL SPEC": "bg-blue-100 text-blue-800",
  PIPELINE: "bg-slate-100 text-slate-500",
  COMPLETE: "bg-emerald-50 text-emerald-600",
  POSTPONED: "bg-slate-100 text-slate-400",
};

function healthStyle(h: string | null | undefined): string {
  if (!h) return "bg-slate-100 text-slate-500";
  const up = h.toUpperCase();
  for (const [key, cls] of Object.entries(HEALTH_STYLE)) {
    if (up.includes(key)) return cls;
  }
  return "bg-slate-100 text-slate-500";
}

const PHASE_STYLE: Record<string, string> = {
  discovery: "bg-violet-100 text-violet-700",
  planning: "bg-sky-100 text-sky-700",
  design: "bg-indigo-100 text-indigo-700",
  build: "bg-amber-100 text-amber-700",
  test: "bg-teal-100 text-teal-700",
  deploy: "bg-emerald-100 text-emerald-700",
};

function phaseStyle(phase: string): string {
  return PHASE_STYLE[phase.toLowerCase()] ?? "bg-slate-100 text-slate-600";
}

function healthText(h: string | null | undefined): string {
  if (!h) return "Unknown";
  return h.replace(/^[^\w]*/, "").trim();
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface HealthGroup {
  key: string;
  label: string;
  icon: string;
  headerColor: string;
  projects: Project[];
}

export function Portfolio() {
  const { data: projects, isLoading, isError, error } = usePortfolio();
  const deleteProject = useDeleteProject();
  const [filter, setFilter] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const openNew = () => {
    setEditProject(null);
    setDialogOpen(true);
  };

  const openEdit = (p: Project) => {
    setEditProject(p);
    setDialogOpen(true);
  };

  const handleDelete = () => {
    if (deleteConfirm) {
      deleteProject.mutate(deleteConfirm);
      setDeleteConfirm(null);
    }
  };

  const list = Array.isArray(projects) ? projects : [];
  const filtered = list.filter(
    (p) =>
      !filter ||
      p.name.toLowerCase().includes(filter.toLowerCase()) ||
      p.id.toLowerCase().includes(filter.toLowerCase()),
  );

  // Group filtered projects by health status
  const groups = useMemo<HealthGroup[]>(() => {
    const map = new Map<string, Project[]>();
    for (const p of filtered) {
      const gk = healthGroupKey(p.health);
      if (!map.has(gk)) map.set(gk, []);
      map.get(gk)!.push(p);
    }
    // Sort needs_spec projects by active spec due date ascending, nulls last
    const specGroup = map.get("needs_spec");
    if (specGroup) {
      specGroup.sort((a, b) => {
        const da = activeSpecDue(a);
        const db = activeSpecDue(b);
        if (!da && !db) return 0;
        if (!da) return 1;
        if (!db) return -1;
        return da.localeCompare(db);
      });
    }
    return GROUP_ORDER
      .filter((g) => map.has(g.key))
      .map((g) => ({
        ...g,
        projects: map.get(g.key)!,
      }));
  }, [filtered]);

  // Count projects in the Needs Spec group whose active spec is overdue.
  const overdueSpecCount = useMemo(() => {
    const spec = groups.find((g) => g.key === "needs_spec");
    if (!spec) return 0;
    return spec.projects.filter((p) => dueUrgency(activeSpecDue(p)) === "overdue").length;
  }, [groups]);

  const toggleCollapse = (key: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <>
      <TopBar title="Portfolio" subtitle="All projects with role allocations and sizing.">
        <input
          type="text"
          placeholder="Search projects..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
        />
        <button
          onClick={openNew}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add project
        </button>
      </TopBar>
      <div className="space-y-4 p-8">
        {isLoading && (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
            Loading projects...
          </div>
        )}
        {isError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
            {(error as Error).message}
          </div>
        )}
        {overdueSpecCount > 0 && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span className="font-semibold">
              {overdueSpecCount} spec{overdueSpecCount === 1 ? "" : "s"} overdue
            </span>
            <span className="text-xs text-red-600">
              — due date has passed and no completion recorded
            </span>
            <button
              onClick={() => {
                const el = document.getElementById("group-needs_spec");
                el?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="ml-auto rounded-md border border-red-300 bg-white px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-100 transition-colors"
            >
              Jump to Needs Spec
            </button>
          </div>
        )}
        {groups.map((group) => (
          <div
            key={group.key}
            id={`group-${group.key}`}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white"
          >
            {/* Group header */}
            <button
              onClick={() => toggleCollapse(group.key)}
              className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-slate-50 transition-colors"
            >
              <FolderKanban className={cn("h-4 w-4", group.headerColor)} />
              <span className={cn("text-sm font-semibold", group.headerColor)}>
                {group.icon} {group.label}
              </span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                {group.projects.length}
              </span>
              <span className="ml-auto text-xs tabular-nums text-slate-400">
                {group.projects.reduce((s, p) => s + (p.est_hours || 0), 0).toLocaleString()} hrs
              </span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-slate-400 transition-transform",
                  collapsed.has(group.key) && "-rotate-90",
                )}
              />
            </button>

            {/* Projects table */}
            {!collapsed.has(group.key) && (
              <div className="overflow-x-auto border-t border-slate-100">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-xs font-medium text-slate-500">
                      <th className="px-4 py-2">ID</th>
                      <th className="px-4 py-2">Name</th>
                      <th className="px-4 py-2">Team</th>
                      <th className="px-4 py-2">Health</th>
                      {group.key !== "needs_spec" && <th className="px-4 py-2">Phase</th>}
                      <th className="px-4 py-2">Priority</th>
                      <th className="px-4 py-2 text-right">Hours</th>
                      <th className="px-4 py-2">T-Shirt</th>
                      {group.key === "needs_spec" ? (
                        <>
                          <th className="px-4 py-2">Spec Due</th>
                          <th className="px-4 py-2">Spec Completed</th>
                        </>
                      ) : (
                        <>
                          <th className="px-4 py-2">Start</th>
                          <th className="px-4 py-2">End</th>
                          <th className="px-4 py-2 text-right">% Done</th>
                        </>
                      )}
                      <th className="px-4 py-2 w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {group.projects.map((p) => (
                      <tr
                        key={p.id}
                        onClick={() => openEdit(p)}
                        className="border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-2.5 font-mono text-xs text-slate-500">
                          {p.id}
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="font-medium text-slate-800">{p.name}</div>
                          <div className="mt-0.5 flex gap-1">
                            {ROLE_DOTS.map((r) => {
                              const alloc = p.role_allocations?.[r.key] ?? 0;
                              return alloc > 0 ? (
                                <span
                                  key={r.key}
                                  title={`${r.label} ${Math.round(alloc * 100)}%`}
                                  className="inline-block rounded px-1 py-0 text-[8px] font-semibold bg-slate-100 text-slate-500"
                                >
                                  {r.short}
                                </span>
                              ) : null;
                            })}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-slate-500">
                          {(p as any).team || "\u2014"}
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${healthStyle(p.health)}`}
                          >
                            {healthText(p.health)}
                          </span>
                        </td>
                        {group.key !== "needs_spec" && (
                          <td className="px-4 py-2.5">
                            {(p as any).current_phase ? (
                              <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${phaseStyle((p as any).current_phase)}`}>
                                {(p as any).current_phase}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-300">{"\u2014"}</span>
                            )}
                          </td>
                        )}
                        <td className="px-4 py-2.5 text-slate-600">
                          {p.priority ?? "\u2014"}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">
                          {p.est_hours > 0 ? p.est_hours.toLocaleString() : "\u2014"}
                        </td>
                        <td className="px-4 py-2.5 text-slate-600">
                          {p.tshirt_size ?? "\u2014"}
                        </td>
                        {group.key === "needs_spec" ? (
                          <>
                            <td className={cn("px-4 py-2.5 tabular-nums", specDueCellClass(activeSpecDue(p)))}>
                              {formatDate(activeSpecDue(p))}
                            </td>
                            <td className="px-4 py-2.5 text-slate-500 tabular-nums">
                              {formatDate(shownSpecCompleted(p))}
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-4 py-2.5 text-slate-500 tabular-nums">
                              {formatDate(p.start_date)}
                            </td>
                            <td className="px-4 py-2.5 text-slate-500 tabular-nums">
                              {formatDate(p.end_date)}
                            </td>
                            <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">
                              {Math.round(p.pct_complete * 100)}%
                            </td>
                          </>
                        )}
                        <td className="px-4 py-2.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirm(p.id);
                            }}
                            className="rounded p-1 text-slate-300 hover:bg-red-50 hover:text-red-500 transition-colors"
                            aria-label="Delete project"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
        {!isLoading && filtered.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
            No projects found. Click "Add project" to get started.
          </div>
        )}
      </div>

      <EditProjectDialog
        project={editProject}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
            <h3 className="text-sm font-semibold text-slate-900">Delete project?</h3>
            <p className="mt-2 text-sm text-slate-600">
              Remove <strong>{deleteConfirm}</strong> and all its allocations? This cannot be undone.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteProject.isPending}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {deleteProject.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
