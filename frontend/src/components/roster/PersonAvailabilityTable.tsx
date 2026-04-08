import { useState } from "react";
import { ChevronDown, Calendar, Clock } from "lucide-react";
import { usePersonAvailability } from "@/hooks/useRoster";
import { cn } from "@/lib/cn";
import { avatarTone, formatDate, relativeDate } from "@/lib/format";
import type { PersonAvailability } from "@/types/roster";

const STATUS_DOT: Record<string, string> = {
  BLUE: "bg-sky-400",
  GREEN: "bg-emerald-500",
  YELLOW: "bg-amber-400",
  RED: "bg-red-500",
  GREY: "bg-slate-300",
};

export function PersonAvailabilityTable() {
  const { data, isLoading } = usePersonAvailability(0.5);
  const [expanded, setExpanded] = useState<string | null>(null);
  const people = Array.isArray(data) ? data : [];

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        Computing availability...
      </div>
    );
  }

  if (people.length === 0) return null;

  const available = people.filter((p) => p.available_now);
  const upcoming = people.filter((p) => !p.available_now && p.available_date);
  const unavailable = people.filter((p) => !p.available_now && !p.available_date);

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
        <Calendar className="h-4 w-4 text-slate-400" />
        <h3 className="text-sm font-semibold text-slate-800">
          Person Availability
        </h3>
        <span className="text-xs text-slate-500">
          When will each person have capacity for new work?
        </span>
      </div>

      <div className="divide-y divide-slate-100">
        {/* Available now */}
        {available.length > 0 && (
          <Section
            label="Available Now"
            count={available.length}
            color="text-emerald-600"
            defaultOpen
          >
            {available.map((p) => (
              <PersonRow
                key={p.name}
                person={p}
                expanded={expanded === p.name}
                onToggle={() => setExpanded(expanded === p.name ? null : p.name)}
              />
            ))}
          </Section>
        )}

        {/* Upcoming availability */}
        {upcoming.length > 0 && (
          <Section
            label="Available Soon"
            count={upcoming.length}
            color="text-amber-600"
            defaultOpen
          >
            {upcoming.map((p) => (
              <PersonRow
                key={p.name}
                person={p}
                expanded={expanded === p.name}
                onToggle={() => setExpanded(expanded === p.name ? null : p.name)}
              />
            ))}
          </Section>
        )}

        {/* Fully committed */}
        {unavailable.length > 0 && (
          <Section
            label="Fully Committed"
            count={unavailable.length}
            color="text-red-600"
            defaultOpen={false}
          >
            {unavailable.map((p) => (
              <PersonRow
                key={p.name}
                person={p}
                expanded={expanded === p.name}
                onToggle={() => setExpanded(expanded === p.name ? null : p.name)}
              />
            ))}
          </Section>
        )}
      </div>
    </div>
  );
}

function Section({
  label,
  count,
  color,
  defaultOpen,
  children,
}: {
  label: string;
  count: number;
  color: string;
  defaultOpen: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-5 py-2.5 text-left hover:bg-slate-50 transition-colors"
      >
        <span className={cn("text-xs font-semibold", color)}>{label}</span>
        <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
          {count}
        </span>
        <ChevronDown
          className={cn(
            "ml-auto h-3.5 w-3.5 text-slate-400 transition-transform",
            !open && "-rotate-90",
          )}
        />
      </button>
      {open && <div className="divide-y divide-slate-50">{children}</div>}
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
        className="flex w-full items-center gap-3 px-5 py-2 text-left hover:bg-slate-50 transition-colors"
      >
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold"
          style={{ backgroundColor: avatarTone(p.name) }}
        >
          {p.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-slate-800">{p.name}</div>
          <div className="text-[11px] text-slate-500">{p.role} · {p.team ?? ""}</div>
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
            <span className="text-xs font-semibold text-emerald-600">Now</span>
          ) : p.available_date ? (
            <div>
              <div className="text-xs font-medium text-slate-700">{relativeDate(p.available_date)}</div>
              <div className="text-[10px] text-slate-400">{formatDate(p.available_date)}</div>
            </div>
          ) : (
            <span className="text-xs text-red-500">Not in horizon</span>
          )}
        </div>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform",
            expanded && "rotate-180",
          )}
        />
      </button>

      {/* Expanded: show project commitments */}
      {expanded && p.projects.length > 0 && (
        <div className="bg-slate-50 px-5 py-2">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
            Current projects ({p.projects.length})
          </div>
          <div className="space-y-1">
            {p.projects.map((proj, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-xs text-slate-600"
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
