import { useMemo, useState } from "react";
import { ChevronDown, Plus, Trash2, Users, Briefcase, Calendar, Grid3X3 } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { EditMemberDialog } from "@/components/roster/EditMemberDialog";
import { PersonAvailabilityTable } from "@/components/roster/PersonAvailabilityTable";
import { PersonDemandTable } from "@/components/roster/PersonDemandTable";
import { AssignmentMatrix } from "@/components/roster/AssignmentMatrix";
import { useRoster, useDeleteMember } from "@/hooks/useRoster";
import { cn } from "@/lib/cn";
import { avatarTone } from "@/lib/format";
import type { TeamMember } from "@/types/roster";

const ROLE_LABELS: Record<string, string> = {
  pm: "Project Manager",
  ba: "Business Analyst",
  functional: "Functional",
  technical: "Technical",
  developer: "Developer",
  infrastructure: "Infrastructure",
  dba: "DBA",
  erp: "ERP Consultant",
  "wms consultant": "WMS Consultant",
};

interface TeamGroup {
  team: string;
  members: TeamMember[];
  totalCapacity: number;
}

type Tab = "teams" | "assignments" | "demand" | "availability";

const TABS: { key: Tab; label: string; icon: typeof Users }[] = [
  { key: "teams", label: "Teams", icon: Users },
  { key: "assignments", label: "Assignments", icon: Grid3X3 },
  { key: "demand", label: "Workload", icon: Briefcase },
  { key: "availability", label: "Availability", icon: Calendar },
];

export function TeamRoster() {
  const { data: rawMembers, isLoading, isError, error } = useRoster();
  const members = Array.isArray(rawMembers) ? rawMembers : [];
  const deleteMember = useDeleteMember();

  const [tab, setTab] = useState<Tab>("teams");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMember, setEditMember] = useState<TeamMember | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const groups = useMemo<TeamGroup[]>(() => {
    const map = new Map<string, TeamMember[]>();
    for (const m of members) {
      const team = m.team || "Unassigned";
      if (!map.has(team)) map.set(team, []);
      map.get(team)!.push(m);
    }
    return Array.from(map.entries())
      .map(([team, members]) => ({
        team,
        members: members.sort((a, b) => a.name.localeCompare(b.name)),
        totalCapacity: members
          .filter((m) => m.include_in_capacity)
          .reduce((s, m) => s + m.project_capacity_hrs, 0),
      }))
      .sort((a, b) => a.team.localeCompare(b.team));
  }, [members]);

  const toggleCollapse = (team: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(team)) next.delete(team);
      else next.add(team);
      return next;
    });
  };

  const openNew = () => {
    setEditMember(null);
    setDialogOpen(true);
  };

  const openEdit = (m: TeamMember) => {
    setEditMember(m);
    setDialogOpen(true);
  };

  const handleDelete = () => {
    if (deleteConfirm) {
      deleteMember.mutate(deleteConfirm);
      setDeleteConfirm(null);
    }
  };

  return (
    <>
      <TopBar title="Roster" subtitle="Team members, capacity, and availability.">
        {tab === "teams" && (
          <button
            onClick={openNew}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add member
          </button>
        )}
      </TopBar>

      {/* Tabs */}
      <div className="border-b border-slate-200 bg-white px-8">
        <nav className="flex gap-1">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                "flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                tab === key
                  ? "border-indigo-600 text-indigo-700"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      <div className="space-y-4 p-8">
        {isLoading && (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
            Loading roster...
          </div>
        )}
        {isError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
            {(error as Error).message}
          </div>
        )}

        {/* Tab: Teams */}
        {tab === "teams" && (
          <>
            {groups.map((group) => (
              <div
                key={group.team}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white"
              >
                <button
                  onClick={() => toggleCollapse(group.team)}
                  className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-slate-50 transition-colors"
                >
                  <Users className="h-4 w-4 text-slate-400" />
                  <span className="text-sm font-semibold text-slate-800">
                    {group.team}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                    {group.members.length}
                  </span>
                  <span className="ml-auto text-xs tabular-nums text-slate-400">
                    {group.totalCapacity.toFixed(0)} proj hrs/wk
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-slate-400 transition-transform",
                      collapsed.has(group.team) && "-rotate-90",
                    )}
                  />
                </button>

                {!collapsed.has(group.team) && (
                  <div className="overflow-x-auto border-t border-slate-100">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 text-left text-xs font-medium text-slate-500">
                          <th className="px-4 py-2">Name</th>
                          <th className="px-4 py-2">Role</th>
                          <th className="px-4 py-2">Vendor</th>
                          <th className="px-4 py-2 text-right">Weekly Hrs</th>
                          <th className="px-4 py-2 text-right">Support %</th>
                          <th className="px-4 py-2 text-right">Project Hrs</th>
                          <th className="px-4 py-2 text-center">In Capacity</th>
                          <th className="px-4 py-2 w-10" />
                        </tr>
                      </thead>
                      <tbody>
                        {group.members.map((m) => (
                          <tr
                            key={m.name}
                            onClick={() => openEdit(m)}
                            className={cn(
                              "border-b border-slate-50 transition-colors hover:bg-slate-50 cursor-pointer",
                              !m.include_in_capacity && "opacity-50",
                            )}
                          >
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-2">
                                <div
                                  className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold"
                                  style={{ backgroundColor: avatarTone(m.name) }}
                                >
                                  {m.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .slice(0, 2)}
                                </div>
                                <span className="font-medium text-slate-800">
                                  {m.name}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-2.5 text-slate-600">
                              {ROLE_LABELS[m.role_key] ?? m.role}
                            </td>
                            <td className="px-4 py-2.5 text-slate-500">
                              {m.vendor || "\u2014"}
                            </td>
                            <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">
                              {m.weekly_hrs_available}
                            </td>
                            <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">
                              {Math.round(m.support_reserve_pct * 100)}%
                            </td>
                            <td className="px-4 py-2.5 text-right tabular-nums font-medium text-slate-800">
                              {m.project_capacity_hrs.toFixed(1)}
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              <span
                                className={cn(
                                  "inline-block h-2 w-2 rounded-full",
                                  m.include_in_capacity
                                    ? "bg-emerald-500"
                                    : "bg-slate-300",
                                )}
                              />
                            </td>
                            <td className="px-4 py-2.5">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteConfirm(m.name);
                                }}
                                className="rounded p-1 text-slate-300 hover:bg-red-50 hover:text-red-500 transition-colors"
                                aria-label="Delete member"
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
            {!isLoading && members.length === 0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
                No team members found. Click "Add member" to get started.
              </div>
            )}
          </>
        )}

        {/* Tab: Assignments (Matrix) */}
        {tab === "assignments" && members.length > 0 && <AssignmentMatrix />}

        {/* Tab: Workload (Person Demand) */}
        {tab === "demand" && members.length > 0 && <PersonDemandTable roster={members} />}

        {/* Tab: Availability */}
        {tab === "availability" && members.length > 0 && <PersonAvailabilityTable roster={members} />}
      </div>

      {/* Edit/Create Dialog */}
      <EditMemberDialog
        member={editMember}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
            <h3 className="text-sm font-semibold text-slate-900">Delete team member?</h3>
            <p className="mt-2 text-sm text-slate-600">
              Remove <strong>{deleteConfirm}</strong> from the roster? This also removes their project assignments.
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
                disabled={deleteMember.isPending}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {deleteMember.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
