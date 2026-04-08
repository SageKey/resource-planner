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
  currentPct: number | null;
}

export function AssignmentMatrix() {
  const { data, isLoading } = useAssignmentMatrix();
  const createAssignment = useCreateAssignment();
  const deleteAssignment = useDeleteAssignment();
  const [editing, setEditing] = useState<CellEdit | null>(null);
  const [editValue, setEditValue] = useState("");

  // Flat sorted people list for column headers
  const sortedPeople = useMemo(() => {
    if (!data) return [];
    return [...data.people].sort((a, b) => {
      const teamCmp = (a.team || "").localeCompare(b.team || "");
      if (teamCmp !== 0) return teamCmp;
      return a.name.localeCompare(b.name);
    });
  }, [data]);

  // Team boundaries for column group headers
  const teamColumns = useMemo(() => {
    const groups: { team: string; start: number; count: number }[] = [];
    let current = "";
    for (let i = 0; i < sortedPeople.length; i++) {
      const team = sortedPeople[i].team || "Unassigned";
      if (team !== current) {
        groups.push({ team, start: i, count: 1 });
        current = team;
      } else {
        groups[groups.length - 1].count++;
      }
    }
    return groups;
  }, [sortedPeople]);

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

  const handleCellClick = (personName: string, roleKey: string, projectId: string) => {
    const pct = getCellPct(personName, projectId);
    setEditing({
      person: personName,
      projectId,
      roleKey,
      currentPct: pct,
    });
    setEditValue(pct != null ? Math.round(pct * 100).toString() : "100");
  };

  const handleSave = () => {
    if (!editing) return;
    const pct = Math.max(0, Math.min(100, parseInt(editValue) || 0));
    if (pct === 0) {
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

  // Count assignments per project
  const projectTotals = useMemo(() => {
    const totals = new Map<string, number>();
    for (const [pid, people] of Object.entries(assignments)) {
      totals.set(pid, Object.keys(people).length);
    }
    return totals;
  }, [assignments]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            {/* Team group header row */}
            <tr>
              <th className="sticky left-0 z-20 bg-white border-b border-r border-slate-100 min-w-[200px]" />
              <th className="border-b border-r border-slate-100 w-10" />
              {teamColumns.map((tg) => (
                <th
                  key={tg.team}
                  colSpan={tg.count}
                  className="border-b border-slate-100 px-1 py-1.5 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-50"
                >
                  {tg.team}
                </th>
              ))}
            </tr>
            {/* Person header row */}
            <tr>
              <th className="sticky left-0 z-20 bg-white border-b border-r border-slate-200 px-3 py-2 text-left font-semibold text-slate-700 min-w-[200px]">
                Project
              </th>
              <th className="border-b border-r border-slate-200 px-1 py-2 text-center font-medium text-slate-500 w-10">
                #
              </th>
              {sortedPeople.map((person) => (
                <th
                  key={person.name}
                  className="border-b border-slate-200 px-0.5 py-1.5 text-center font-normal min-w-[52px]"
                  title={`${person.name} (${ROLE_LABELS[person.role_key] ?? person.role_key})`}
                >
                  <div className="flex flex-col items-center gap-0.5">
                    <div
                      className="flex h-5 w-5 items-center justify-center rounded-full text-[7px] font-semibold"
                      style={{ backgroundColor: avatarTone(person.name) }}
                    >
                      {person.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </div>
                    <div className="text-[9px] font-medium text-slate-700 leading-tight max-w-[50px] truncate">
                      {person.name.split(" ")[0]}
                    </div>
                    <div className="text-[8px] text-slate-400">
                      {ROLE_LABELS[person.role_key] ?? person.role_key}
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {projects.map((proj) => {
              const assigned = projectTotals.get(proj.id) || 0;
              return (
                <tr key={proj.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="sticky left-0 z-10 bg-white border-r border-slate-100 px-3 py-1.5">
                    <div className="min-w-0">
                      <div className="font-medium text-slate-800 text-[11px]">{proj.name}</div>
                      <div className="text-[9px] text-slate-400">
                        {proj.id} · {proj.est_hours > 0 ? `${proj.est_hours}h` : ""}
                        {proj.priority ? ` · ${proj.priority}` : ""}
                      </div>
                    </div>
                  </td>
                  <td className="border-r border-slate-100 px-1 py-1.5 text-center">
                    <span className={cn(
                      "tabular-nums font-medium",
                      assigned > 0 ? "text-slate-700" : "text-slate-300",
                    )}>
                      {assigned}
                    </span>
                  </td>
                  {sortedPeople.map((person) => {
                    const pct = getCellPct(person.name, proj.id);
                    const isEditing = editing?.person === person.name && editing?.projectId === proj.id;

                    return (
                      <td
                        key={person.name}
                        onClick={() => !isEditing && handleCellClick(person.name, person.role_key, proj.id)}
                        className={cn(
                          "px-0.5 py-0.5 text-center cursor-pointer transition-colors",
                          !isEditing && "hover:bg-indigo-50",
                        )}
                      >
                        {isEditing ? (
                          <div className="flex items-center gap-0.5 justify-center">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              step={5}
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={handleKeyDown}
                              autoFocus
                              className="w-11 rounded border border-indigo-300 bg-white px-0.5 py-0.5 text-center text-[10px] tabular-nums focus:outline-none focus:ring-1 focus:ring-indigo-400"
                            />
                            <button onClick={handleSave} className="text-emerald-500 hover:text-emerald-700">
                              <Check className="h-2.5 w-2.5" />
                            </button>
                            {editing.currentPct != null && (
                              <button onClick={handleRemove} className="text-red-400 hover:text-red-600">
                                <X className="h-2.5 w-2.5" />
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
          </tbody>
        </table>
      </div>
    </div>
  );
}
