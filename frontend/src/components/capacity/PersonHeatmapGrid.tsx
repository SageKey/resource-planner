import { useMemo, useState } from "react";
import { ChevronDown, Users } from "lucide-react";
import { cn } from "@/lib/cn";
import { avatarTone } from "@/lib/format";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
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

export function PersonHeatmapGrid({ data }: { data: PersonHeatmapResponse }) {
  const [collapsedTeams, setCollapsedTeams] = useState<Set<string>>(new Set());

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
                        {person.cells.map((util, i) => (
                          <td key={i} className="px-0.5 py-0.5">
                            <div
                              className={cn(
                                "flex h-5 items-center justify-center rounded text-[9px] font-medium tabular-nums",
                                cellColor(util),
                              )}
                            >
                              {util > 0 ? `${Math.round(util * 100)}` : ""}
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
