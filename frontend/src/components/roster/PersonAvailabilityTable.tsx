import { useMemo, useState } from "react";
import { ChevronDown, Clock, Users } from "lucide-react";
import { usePersonAvailability } from "@/hooks/useRoster";
import { cn } from "@/lib/cn";
import { avatarTone, formatDate, relativeDate } from "@/lib/format";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import type { PersonAvailability, TeamMember } from "@/types/roster";

const STATUS_DOT: Record<string, string> = {
  BLUE: "bg-sky-400",
  GREEN: "bg-emerald-500",
  YELLOW: "bg-amber-400",
  RED: "bg-red-500",
  GREY: "bg-slate-300",
};

interface TeamAvailGroup {
  team: string;
  people: PersonAvailability[];
  availableNow: number;
}

export function PersonAvailabilityTable({ roster }: { roster: TeamMember[] }) {
  const { data, isLoading } = usePersonAvailability(0.5);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [collapsedTeams, setCollapsedTeams] = useState<Set<string>>(new Set());
  const people = Array.isArray(data) ? data : [];

  const teamMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of roster) m.set(r.name, r.team || "Unassigned");
    return m;
  }, [roster]);

  const groups = useMemo<TeamAvailGroup[]>(() => {
    const map = new Map<string, PersonAvailability[]>();
    for (const p of people) {
      const team = teamMap.get(p.name) || p.team || "Unassigned";
      if (!map.has(team)) map.set(team, []);
      map.get(team)!.push(p);
    }
    return Array.from(map.entries())
      .map(([team, members]) => ({
        team,
        people: members.sort((a, b) => {
          // Available now first, then by available_date, then unavailable last
          if (a.available_now !== b.available_now) return a.available_now ? -1 : 1;
          if (a.available_date && b.available_date) return a.available_date.localeCompare(b.available_date);
          if (a.available_date) return -1;
          if (b.available_date) return 1;
          return 0;
        }),
        availableNow: members.filter((m) => m.available_now).length,
      }))
      .sort((a, b) => a.team.localeCompare(b.team));
  }, [people, teamMap]);

  const toggleTeam = (team: string) => {
    setCollapsedTeams((prev) => {
      const next = new Set(prev);
      if (next.has(team)) next.delete(team);
      else next.add(team);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        Computing availability...
      </div>
    );
  }

  if (people.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center text-sm font-semibold text-slate-700">
        Availability by Person
        <InfoTooltip>
          <div className="font-semibold text-slate-800">How Availability is calculated</div>
          <p><strong>Available</strong> = utilization below 50% of project capacity.</p>
          <p>The engine walks forward in time. As each assigned project reaches its end date, that project's demand is removed. The first date where utilization drops below the threshold = the available date.</p>
          <p><strong>Available Now</strong> = currently under 50% utilization — has room for new work.</p>
          <p><strong>Available Soon</strong> = will drop below 50% when a current project ends.</p>
          <p><strong>Committed</strong> = no visibility into when they'll be free within the planning horizon.</p>
        </InfoTooltip>
      </div>
      {groups.map((group) => (
        <div key={group.team} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          {/* Team header */}
          <button
            onClick={() => toggleTeam(group.team)}
            className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-slate-50 transition-colors"
          >
            <Users className="h-4 w-4 text-slate-400" />
            <span className="text-sm font-semibold text-slate-800">{group.team}</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
              {group.people.length}
            </span>
            <span className="ml-auto text-xs text-slate-400">
              <span className="text-emerald-600 font-medium">{group.availableNow}</span> available now
            </span>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-slate-400 transition-transform",
                collapsedTeams.has(group.team) && "-rotate-90",
              )}
            />
          </button>

          {!collapsedTeams.has(group.team) && (
            <div className="border-t border-slate-100 divide-y divide-slate-50">
              {group.people.map((p) => (
                <PersonRow
                  key={p.name}
                  person={p}
                  expanded={expanded === p.name}
                  onToggle={() => setExpanded(expanded === p.name ? null : p.name)}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function PersonRow({
  person: p,
  expanded,
  onToggle,
}: {
  person: PersonAvailability;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-5 py-2.5 text-left hover:bg-slate-50 transition-colors"
      >
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold"
          style={{ backgroundColor: avatarTone(p.name) }}
        >
          {p.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-slate-800">{p.name}</div>
          <div className="text-[11px] text-slate-500">{p.role}</div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1.5">
            <span className={cn("inline-block h-2 w-2 rounded-full", STATUS_DOT[p.status] ?? "bg-slate-300")} />
            <span className="text-xs font-medium tabular-nums text-slate-700">
              {Math.round(p.current_utilization * 100)}% util
            </span>
          </div>
          <div className="text-[11px] text-slate-500 tabular-nums">
            {p.current_demand.toFixed(1)}h / {p.capacity_hrs_week.toFixed(1)}h
          </div>
        </div>
        <div className="w-24 text-right">
          {p.available_now ? (
            <span className="inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
              Available
            </span>
          ) : p.available_date ? (
            <div>
              <div className="text-xs font-medium text-amber-600">{relativeDate(p.available_date)}</div>
              <div className="text-[10px] text-slate-400">{formatDate(p.available_date)}</div>
            </div>
          ) : (
            <span className="inline-block rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-600 ring-1 ring-inset ring-red-200">
              Committed
            </span>
          )}
        </div>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform",
            expanded && "rotate-180",
          )}
        />
      </button>

      {expanded && p.projects.length > 0 && (
        <div className="bg-slate-50 px-5 py-2">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
            Current projects ({p.projects.length})
          </div>
          <div className="space-y-1">
            {p.projects.map((proj, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-xs text-slate-600 py-0.5"
              >
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3 text-slate-400" />
                  <span className="font-medium">{proj.project_name}</span>
                  <span className="text-slate-400">{proj.role}</span>
                </div>
                <div className="flex items-center gap-3 tabular-nums">
                  <span>{proj.weekly_hours.toFixed(1)}h/wk</span>
                  <span className="text-slate-400">
                    {proj.end_date ? `ends ${formatDate(proj.end_date)}` : "no end date"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
