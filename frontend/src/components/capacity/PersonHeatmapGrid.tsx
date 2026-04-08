import { useMemo, useState } from "react";
import { ChevronDown, Users } from "lucide-react";
import { cn } from "@/lib/cn";
import { avatarTone } from "@/lib/format";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { usePersonHeatmapDetail } from "@/hooks/useCapacity";
import type { PersonHeatmapResponse } from "@/hooks/useCapacity";

function cellColor(util: number): string {
  if (util <= 0) return "bg-slate-50";
  if (util < 0.8) return "bg-emerald-100 text-emerald-800";
  if (util < 1.0) return "bg-amber-200 text-amber-900";
  if (util < 1.25) return "bg-red-300 text-red-900";
  return "bg-red-500 text-white";
}

interface TeamGroup {
  team: string;
  people: PersonHeatmapResponse["people"];
}

interface SelectedPersonCell {
  personName: string;
  weekIdx: number;
}

export function PersonHeatmapGrid({ data }: { data: PersonHeatmapResponse }) {
  const [collapsedTeams, setCollapsedTeams] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<SelectedPersonCell | null>(null);

  const handleCellClick = (personName: string, weekIdx: number, util: number) => {
    if (util <= 0) return;
    if (selected?.personName === personName && selected?.weekIdx === weekIdx) {
      setSelected(null);
    } else {
      setSelected({ personName, weekIdx });
    }
  };

  const groups = useMemo<TeamGroup[]>(() => {
    const map = new Map<string, PersonHeatmapResponse["people"]>();
    for (const p of data.people) {
      const team = p.team || "Unassigned";
      if (!map.has(team)) map.set(team, []);
      map.get(team)!.push(p);
    }
    return Array.from(map.entries())
      .map(([team, people]) => ({ team, people }))
      .sort((a, b) => a.team.localeCompare(b.team));
  }, [data.people]);

  const toggleTeam = (team: string) => {
    setCollapsedTeams((prev) => {
      const next = new Set(prev);
      if (next.has(team)) next.delete(team);
      else next.add(team);
      return next;
    });
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="mb-4 text-sm font-semibold text-slate-700">
        Person-Level Heatmap
        <InfoTooltip>
          <div className="font-semibold text-slate-800">How the Person Heatmap works</div>
          <p>Each cell = <strong>person's weekly project demand / their project capacity</strong>.</p>
          <p><strong>Only counts projects they're explicitly assigned to</strong> via the Assignments tab on the Roster page. Unassigned projects don't appear here.</p>
          <p><strong>Project capacity</strong> = Weekly Hours × (1 - Support Reserve %). Support time is excluded — this only shows project utilization.</p>
          <p>If a person shows 0% everywhere, they have no assignments yet. Assign them on the Roster → Assignments tab.</p>
        </InfoTooltip>
      </h2>

      {/* Legend */}
      <div className="mb-3 flex items-center gap-3 text-[10px] text-slate-500">
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-slate-50 border border-slate-200" />
          0%
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-emerald-100" />
          &lt;80%
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-amber-200" />
          80-99%
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-red-300" />
          100-124%
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-red-500" />
          125%+
        </span>
      </div>

      <div className="space-y-3">
        {groups.map((group) => (
          <div key={group.team} className="rounded-lg border border-slate-100 overflow-hidden">
            {/* Team header */}
            <button
              onClick={() => toggleTeam(group.team)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-slate-50 transition-colors bg-slate-50/50"
            >
              <Users className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-xs font-semibold text-slate-700">{group.team}</span>
              <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-slate-500">
                {group.people.length}
              </span>
              <ChevronDown
                className={cn(
                  "ml-auto h-3.5 w-3.5 text-slate-400 transition-transform",
                  collapsedTeams.has(group.team) && "-rotate-90",
                )}
              />
            </button>

            {!collapsedTeams.has(group.team) && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr>
                      <th className="sticky left-0 z-10 bg-white px-2 py-1 text-left font-medium text-slate-500 min-w-[140px]">
                        Person
                      </th>
                      {data.weeks.map((w) => (
                        <th
                          key={w}
                          className="min-w-[44px] px-0.5 py-1 text-center font-normal text-slate-400"
                        >
                          {w}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {group.people.map((person) => (
                      <tr key={person.name}>
                        <td className="sticky left-0 z-10 bg-white px-2 py-0.5">
                          <div className="flex items-center gap-1.5">
                            <div
                              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[8px] font-semibold"
                              style={{ backgroundColor: avatarTone(person.name) }}
                            >
                              {person.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                            </div>
                            <span className="font-medium text-slate-700 truncate max-w-[100px]">
                              {person.name}
                            </span>
                          </div>
                        </td>
                        {person.cells.map((util, i) => {
                          const isSelected = selected?.personName === person.name && selected?.weekIdx === i;
                          return (
                            <td key={i} className="px-0.5 py-0.5">
                              <div
                                onClick={() => handleCellClick(person.name, i, util)}
                                className={cn(
                                  "flex h-5 items-center justify-center rounded text-[9px] font-medium tabular-nums",
                                  cellColor(util),
                                  util > 0 && "cursor-pointer hover:ring-2 hover:ring-indigo-400 hover:ring-offset-1",
                                  isSelected && "ring-2 ring-indigo-500 ring-offset-1",
                                )}
                              >
                                {util > 0 ? `${Math.round(util * 100)}` : ""}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>

      {selected && (
        <PersonCellDetail
          personName={selected.personName}
          weekIdx={selected.weekIdx}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

const ROLE_LABELS: Record<string, string> = {
  pm: "PM", ba: "BA", functional: "Functional", technical: "Technical",
  developer: "Developer", infrastructure: "Infrastructure", dba: "DBA",
  erp: "ERP", "wms consultant": "WMS Consultant",
};

function PersonCellDetail({
  personName,
  weekIdx,
  onClose,
}: {
  personName: string;
  weekIdx: number;
  onClose: () => void;
}) {
  const { data, isLoading, isError, error } = usePersonHeatmapDetail(personName, weekIdx);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-xl bg-white p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold text-slate-800">
            {personName} — Week of {data?.week_label ?? "..."}
          </div>
          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
          Close
        </button>
      </div>

      {isLoading && (
        <div className="text-xs text-slate-400">Loading breakdown...</div>
      )}

      {isError && (
        <div className="text-xs text-red-500">
          Failed to load: {(error as Error)?.message ?? "Unknown error"}
        </div>
      )}

      {data && (
        <>
          <div className="flex gap-4 mb-3 text-xs">
            <div>
              <span className="text-slate-500">Capacity:</span>{" "}
              <span className="font-semibold text-slate-700">{data.capacity_hrs}h/wk</span>
            </div>
            <div>
              <span className="text-slate-500">Demand:</span>{" "}
              <span className="font-semibold text-slate-700">{data.total_demand_hrs}h/wk</span>
            </div>
            <div>
              <span className="text-slate-500">Utilization:</span>{" "}
              <span className="font-semibold text-slate-700">
                {Math.round(data.utilization_pct * 100)}%
              </span>
            </div>
          </div>

          {data.projects.length > 0 ? (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-indigo-200/50 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="pb-1.5 pr-3">Project</th>
                  <th className="pb-1.5 pr-3">Role</th>
                  <th className="pb-1.5 pr-3">Phase</th>
                  <th className="pb-1.5 pr-3 text-right">Allocation</th>
                  <th className="pb-1.5 text-right">Demand/wk</th>
                </tr>
              </thead>
              <tbody>
                {data.projects.map((p) => (
                  <tr key={`${p.project_id}-${p.role_key}`} className="border-b border-indigo-100/50">
                    <td className="py-1.5 pr-3">
                      <span className="font-mono text-slate-400">{p.project_id}</span>{" "}
                      <span className="font-medium text-slate-700">{p.project_name}</span>
                    </td>
                    <td className="py-1.5 pr-3 text-slate-500">
                      {ROLE_LABELS[p.role_key] ?? p.role_key}
                    </td>
                    <td className="py-1.5 pr-3 capitalize text-slate-500">{p.phase}</td>
                    <td className="py-1.5 pr-3 text-right tabular-nums text-slate-600">
                      {Math.round(p.allocation_pct * 100)}%
                    </td>
                    <td className="py-1.5 text-right tabular-nums font-semibold text-slate-800">
                      {p.demand_hrs}h
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-xs text-slate-400">No assigned projects contributing demand this week.</div>
          )}
        </>
      )}
      </div>
    </div>
  );
}
