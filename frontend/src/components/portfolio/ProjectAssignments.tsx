import { useState } from "react";
import { Plus, Trash2, UserPlus } from "lucide-react";
import {
  useProjectAssignments,
  useCreateAssignment,
  useDeleteAssignment,
} from "@/hooks/useAssignments";
import { useRoster } from "@/hooks/useRoster";
import { cn } from "@/lib/cn";
import { avatarTone } from "@/lib/format";

const ROLE_LABELS: Record<string, string> = {
  pm: "PM", ba: "BA", functional: "Functional", technical: "Technical",
  developer: "Developer", infrastructure: "Infrastructure", dba: "DBA",
  erp: "ERP", "wms consultant": "WMS Consultant",
};

interface Props {
  projectId: string;
}

export function ProjectAssignments({ projectId }: Props) {
  const { data: assignments, isLoading } = useProjectAssignments(projectId);
  const { data: rosterData } = useRoster();
  const createAssignment = useCreateAssignment();
  const deleteAssignment = useDeleteAssignment();

  const [adding, setAdding] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [allocPct, setAllocPct] = useState("100");
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editPct, setEditPct] = useState("");

  const roster = Array.isArray(rosterData) ? rosterData : [];
  const list = Array.isArray(assignments) ? assignments : [];

  // Build set of already-assigned person+role combos
  const assignedSet = new Set(list.map((a) => `${a.person_name}::${a.role_key}`));

  const handleAdd = () => {
    if (!selectedPerson || !selectedRole) return;
    const pct = Math.max(0, Math.min(100, parseInt(allocPct) || 100));
    createAssignment.mutate(
      {
        projectId,
        person_name: selectedPerson,
        role_key: selectedRole,
        allocation_pct: pct / 100,
      },
      {
        onSuccess: () => {
          setAdding(false);
          setSelectedPerson("");
          setSelectedRole("");
          setAllocPct("100");
        },
      },
    );
  };

  const handleRemove = (personName: string, roleKey: string) => {
    deleteAssignment.mutate({ projectId, person_name: personName, role_key: roleKey });
  };

  // When a person is selected, auto-fill their role
  const handlePersonSelect = (name: string) => {
    setSelectedPerson(name);
    const member = roster.find((m) => m.name === name);
    if (member) {
      setSelectedRole(member.role_key);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Team Assignments
        </div>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            <UserPlus className="h-3 w-3" />
            Assign person
          </button>
        )}
      </div>

      {/* Existing assignments */}
      {isLoading && (
        <div className="text-xs text-slate-400 py-2">Loading assignments...</div>
      )}
      {list.length > 0 && (
        <div className="space-y-1 mb-2">
          {list.map((a) => {
            const key = `${a.person_name}::${a.role_key}`;
            const isEditing = editingKey === key;
            return (
              <div
                key={key}
                className="flex items-center gap-2 rounded-md border border-slate-100 bg-slate-50 px-3 py-1.5"
              >
                <div
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold"
                  style={{ backgroundColor: avatarTone(a.person_name) }}
                >
                  {a.person_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <span className="text-sm font-medium text-slate-800 flex-1">
                  {a.person_name}
                </span>
                <span className="text-[11px] text-slate-500">
                  {ROLE_LABELS[a.role_key] ?? a.role_key}
                </span>
                {isEditing ? (
                  <span className="flex items-center gap-1">
                    <input
                      type="number"
                      min={1}
                      max={100}
                      step={5}
                      value={editPct}
                      onChange={(e) => setEditPct(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const pct = Math.max(1, Math.min(100, parseInt(editPct) || 100));
                          createAssignment.mutate({
                            projectId,
                            person_name: a.person_name,
                            role_key: a.role_key,
                            allocation_pct: pct / 100,
                          }, { onSuccess: () => setEditingKey(null) });
                        }
                        if (e.key === "Escape") setEditingKey(null);
                      }}
                      autoFocus
                      className="w-14 rounded border border-indigo-300 bg-white px-1.5 py-0.5 text-center text-[11px] tabular-nums focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    />
                    <button
                      onClick={() => {
                        const pct = Math.max(1, Math.min(100, parseInt(editPct) || 100));
                        createAssignment.mutate({
                          projectId,
                          person_name: a.person_name,
                          role_key: a.role_key,
                          allocation_pct: pct / 100,
                        }, { onSuccess: () => setEditingKey(null) });
                      }}
                      className="text-[10px] font-medium text-indigo-600 hover:text-indigo-800"
                    >
                      Save
                    </button>
                  </span>
                ) : (
                  <button
                    onClick={() => {
                      setEditingKey(key);
                      setEditPct(Math.round(a.allocation_pct * 100).toString());
                    }}
                    className="text-[11px] font-medium tabular-nums text-slate-700 w-12 text-right hover:text-indigo-600 hover:underline transition-colors cursor-pointer"
                    title="Click to edit allocation %"
                  >
                    {Math.round(a.allocation_pct * 100)}%
                  </button>
                )}
                <button
                  onClick={() => handleRemove(a.person_name, a.role_key)}
                  className="rounded p-0.5 text-slate-300 hover:bg-red-50 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}
      {!isLoading && list.length === 0 && !adding && (
        <div className="text-xs text-slate-400 py-2">
          No assignments yet. The capacity engine will use even-split across the role.
        </div>
      )}

      {/* Add form */}
      {adding && (
        <div className="rounded-md border border-indigo-200 bg-indigo-50/30 p-3 space-y-2">
          <div className="space-y-2">
            <select
              value={selectedPerson}
              onChange={(e) => handlePersonSelect(e.target.value)}
              className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            >
              <option value="">Select person...</option>
              {roster
                .filter((m) => !assignedSet.has(`${m.name}::${m.role_key}`))
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((m) => (
                  <option key={m.name} value={m.name}>
                    {m.name} ({ROLE_LABELS[m.role_key] ?? m.role_key})
                  </option>
                ))}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
              >
                <option value="">Role...</option>
                {Object.entries(ROLE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  max={100}
                  step={5}
                  value={allocPct}
                  onChange={(e) => setAllocPct(e.target.value)}
                  className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm text-center tabular-nums focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  placeholder="Allocation %"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">%</span>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setAdding(false)}
              className="rounded px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={!selectedPerson || !selectedRole || createAssignment.isPending}
              className="flex items-center gap-1 rounded bg-indigo-600 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-40 transition-colors"
            >
              <Plus className="h-3 w-3" />
              {createAssignment.isPending ? "Adding..." : "Add"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
