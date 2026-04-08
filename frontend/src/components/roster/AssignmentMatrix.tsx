import { useMemo, useState } from "react";
import { Check, X } from "lucide-react";
import {
  useAssignmentMatrix,
  useCreateAssignment,
  useDeleteAssignment,
} from "@/hooks/useAssignments";
import { cn } from "@/lib/cn";
import { avatarTone } from "@/lib/format";

const ROLE_LABELS: Record<string, string> = {
  pm: "PM", ba: "BA", functional: "Functional", technical: "Technical",
  developer: "Developer", infrastructure: "Infrastructure", dba: "DBA",
  erp: "ERP", "wms consultant": "WMS Consultant",
};

interface CellEdit {
  person: string;
  projectId: string;
  roleKey: string;
  currentPct: number | null; // null = no assignment
}

export function AssignmentMatrix() {
  const { data, isLoading } = useAssignmentMatrix();
  const createAssignment = useCreateAssignment();
  const deleteAssignment = useDeleteAssignment();
  const [editing, setEditing] = useState<CellEdit | null>(null);
  const [editValue, setEditValue] = useState("");

  // Group people by team
  const teamGroups = useMemo(() => {
    if (!data) return [];
    const map = new Map<string, typeof data.people>();
    for (const p of data.people) {
      const team = p.team || "Unassigned";
      if (!map.has(team)) map.set(team, []);
      map.get(team)!.push(p);
    }
    return Array.from(map.entries())
      .map(([team, people]) => ({ team, people: people.sort((a, b) => a.name.localeCompare(b.name)) }))
      .sort((a, b) => a.team.localeCompare(b.team));
  }, [data]);

  if (isLoading || !data) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
        Loading assignment matrix...
      </div>
    );
  }

  const { projects, assignments } = data;

  if (projects.length === 0 || data.people.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
        Need both projects and team members to show the assignment matrix.
      </div>
    );
  }

  const getCellPct = (personName: string, projectId: string): number | null => {
    const projAssignments = assignments[projectId];
    if (!projAssignments) return null;
    const entry = projAssignments[personName];
    if (!entry) return null;
    return entry.allocation_pct;
  };

  const handleCellClick = (person: typeof data.people[0], projectId: string) => {
    const pct = getCellPct(person.name, projectId);
    setEditing({
      person: person.name,
      projectId,
      roleKey: person.role_key,
      currentPct: pct,
    });
    setEditValue(pct != null ? Math.round(pct * 100).toString() : "100");
  };

  const handleSave = () => {
    if (!editing) return;
    const pct = Math.max(0, Math.min(100, parseInt(editValue) || 0));
    if (pct === 0) {
      // Remove assignment
      if (editing.currentPct != null) {
        deleteAssignment.mutate({
          projectId: editing.projectId,
          person_name: editing.person,
          role_key: editing.roleKey,
        });
      }
    } else {
      createAssignment.mutate({
        projectId: editing.projectId,
        person_name: editing.person,
        role_key: editing.roleKey,
        allocation_pct: pct / 100,
      });
    }
    setEditing(null);
  };

  const handleRemove = () => {
    if (!editing || editing.currentPct == null) return;
    deleteAssignment.mutate({
      projectId: editing.projectId,
      person_name: editing.person,
      role_key: editing.roleKey,
    });
    setEditing(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") setEditing(null);
  };

  // Count assignments per person for the total column
  const personTotals = useMemo(() => {
    const totals = new Map<string, number>();
    for (const [_pid, people] of Object.entries(assignments)) {
      for (const [name, info] of Object.entries(people)) {
        totals.set(name, (totals.get(name) || 0) + 1);
      }
    }
    return totals;
  }, [assignments]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className="sticky left-0 z-20 bg-white border-b border-r border-slate-200 px-3 py-2.5 text-left font-semibold text-slate-700 min-w-[160px]">
                Person
              </th>
              <th className="sticky left-[160px] z-20 bg-white border-b border-r border-slate-200 px-2 py-2.5 text-center font-medium text-slate-500 w-12">
                #
              </th>
              {projects.map((p) => (
                <th
                  key={p.id}
                  className="border-b border-slate-200 px-1 py-2 text-center font-normal min-w-[56px] max-w-[80px]"
                  title={`${p.id}: ${p.name}`}
                >
                  <div className="text-[10px] font-semibold text-slate-700 truncate">{p.id}</div>
                  <div className="text-[9px] text-slate-400 truncate">{p.name.slice(0, 12)}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {teamGroups.map((group) => (
              <>
                {/* Team separator row */}
                <tr key={`team-${group.team}`}>
                  <td
                    colSpan={projects.length + 2}
                    className="sticky left-0 z-10 bg-slate-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100"
                  >
                    {group.team} ({group.people.length})
                  </td>
                </tr>
                {group.people.map((person) => {
                  const totalAssigned = personTotals.get(person.name) || 0;
                  return (
                    <tr key={person.name} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="sticky left-0 z-10 bg-white border-r border-slate-100 px-3 py-1.5">
                        <div className="flex items-center gap-1.5">
                          <div
                            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[8px] font-semibold"
                            style={{ backgroundColor: avatarTone(person.name) }}
                          >
                            {person.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-slate-800 truncate text-[11px]">{person.name}</div>
                            <div className="text-[9px] text-slate-400">{ROLE_LABELS[person.role_key] ?? person.role_key}</div>
                          </div>
                        </div>
                      </td>
                      <td className="sticky left-[160px] z-10 bg-white border-r border-slate-100 px-2 py-1.5 text-center">
                        <span className={cn(
                          "tabular-nums font-medium",
                          totalAssigned > 0 ? "text-slate-700" : "text-slate-300",
                        )}>
                          {totalAssigned}
                        </span>
                      </td>
                      {projects.map((proj) => {
                        const pct = getCellPct(person.name, proj.id);
                        const isEditing = editing?.person === person.name && editing?.projectId === proj.id;

                        return (
                          <td
                            key={proj.id}
                            onClick={() => !isEditing && handleCellClick(person, proj.id)}
                            className={cn(
                              "px-0.5 py-0.5 text-center cursor-pointer transition-colors",
                              !isEditing && "hover:bg-indigo-50",
                            )}
                          >
                            {isEditing ? (
                              <div className="flex items-center gap-0.5">
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  step={5}
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onKeyDown={handleKeyDown}
                                  autoFocus
                                  className="w-12 rounded border border-indigo-300 bg-white px-1 py-0.5 text-center text-[10px] tabular-nums focus:outline-none focus:ring-1 focus:ring-indigo-400"
                                />
                                <button onClick={handleSave} className="text-emerald-500 hover:text-emerald-700">
                                  <Check className="h-3 w-3" />
                                </button>
                                {editing.currentPct != null && (
                                  <button onClick={handleRemove} className="text-red-400 hover:text-red-600">
                                    <X className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                            ) : pct != null ? (
                              <div
                                className={cn(
                                  "rounded py-0.5 text-[10px] font-medium tabular-nums",
                                  pct >= 0.8
                                    ? "bg-indigo-100 text-indigo-800"
                                    : pct >= 0.5
                                      ? "bg-indigo-50 text-indigo-700"
                                      : "bg-slate-100 text-slate-600",
                                )}
                              >
                                {Math.round(pct * 100)}%
                              </div>
                            ) : (
                              <div className="h-5 rounded" />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
