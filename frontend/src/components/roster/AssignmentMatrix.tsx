import { useMemo } from "react";
import { Check } from "lucide-react";
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

export function AssignmentMatrix() {
  const { data, isLoading } = useAssignmentMatrix();
  const createAssignment = useCreateAssignment();
  const deleteAssignment = useDeleteAssignment();

  const projects = data?.projects ?? [];
  const people = data?.people ?? [];
  const assignments = data?.assignments ?? {};

  const sortedPeople = useMemo(() => {
    return [...people].sort((a, b) => {
      const teamCmp = (a.team || "").localeCompare(b.team || "");
      if (teamCmp !== 0) return teamCmp;
      return a.name.localeCompare(b.name);
    });
  }, [people]);

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

  const projectTotals = useMemo(() => {
    const totals = new Map<string, number>();
    for (const [pid, ppl] of Object.entries(assignments)) {
      totals.set(pid, Object.keys(ppl).length);
    }
    return totals;
  }, [assignments]);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
        Loading assignment matrix...
      </div>
    );
  }

  if (projects.length === 0 || people.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
        Need both projects and team members to show the assignment matrix.
      </div>
    );
  }

  const isAssigned = (personName: string, projectId: string): boolean => {
    return !!assignments[projectId]?.[personName];
  };

  const toggleAssignment = (personName: string, roleKey: string, projectId: string) => {
    if (createAssignment.isPending || deleteAssignment.isPending) return;
    if (isAssigned(personName, projectId)) {
      deleteAssignment.mutate({
        projectId,
        person_name: personName,
        role_key: roleKey,
      });
    } else {
      createAssignment.mutate({
        projectId,
        person_name: personName,
        role_key: roleKey,
        allocation_pct: 1.0,
      });
    }
  };

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
                  className="border-b border-slate-200 px-0.5 py-1.5 text-center font-normal min-w-[48px]"
                  title={`${person.name} (${ROLE_LABELS[person.role_key] ?? person.role_key})`}
                >
                  <div className="flex flex-col items-center gap-0.5">
                    <div
                      className="flex h-5 w-5 items-center justify-center rounded-full text-[7px] font-semibold"
                      style={{ backgroundColor: avatarTone(person.name) }}
                    >
                      {person.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </div>
                    <div className="text-[9px] font-medium text-slate-700 leading-tight max-w-[46px] truncate">
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
                    const hasAssignment = isAssigned(person.name, proj.id);

                    return (
                      <td
                        key={person.name}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleAssignment(person.name, person.role_key, proj.id);
                        }}
                        className="px-0.5 py-0.5 text-center cursor-pointer hover:bg-indigo-50 transition-colors"
                      >
                        <div
                          className={cn(
                            "flex h-6 w-full items-center justify-center rounded transition-colors",
                            hasAssignment
                              ? "bg-indigo-100 text-indigo-700"
                              : "hover:bg-slate-100",
                          )}
                        >
                          {hasAssignment && <Check className="h-3.5 w-3.5" />}
                        </div>
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
