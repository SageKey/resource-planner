import { motion } from "framer-motion";
import { Users } from "lucide-react";
import { cn } from "@/lib/cn";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import type { PersonHeatmapResponse, PersonHeatmapRow } from "@/hooks/useCapacity";

/**
 * TeamAllocationCards
 *
 * Per-person "weekly allocation vs capacity" cards for executive scanning.
 * One card per roster member (excluding people flagged include_in_capacity=false).
 * Each card shows:
 *   - Free hours this week (hero)
 *   - Allocated % (hero)
 *   - Usage bar with status color
 *   - Next 4 weeks mini-strip
 *
 * Data source: the same PersonHeatmapResponse that feeds PersonHeatmapGrid,
 * so the numbers on the cards match the heatmap cells exactly.
 */

interface Props {
  data: PersonHeatmapResponse | undefined;
}

type Status = "healthy" | "fine" | "stretched" | "over" | "unknown";

function statusFromPct(pct: number): Status {
  if (pct >= 1.1) return "over";
  if (pct >= 0.9) return "stretched";
  if (pct >= 0.7) return "fine";
  return "healthy";
}

const STATUS_STYLE: Record<
  Status,
  {
    bar: string;
    pillBg: string;
    pillText: string;
    text: string;
    label: string;
  }
> = {
  healthy: {
    bar: "bg-emerald-500",
    pillBg: "bg-emerald-100",
    pillText: "text-emerald-700",
    text: "text-emerald-700",
    label: "Healthy",
  },
  fine: {
    bar: "bg-sky-400",
    pillBg: "bg-sky-100",
    pillText: "text-sky-700",
    text: "text-sky-700",
    label: "OK",
  },
  stretched: {
    bar: "bg-amber-500",
    pillBg: "bg-amber-100",
    pillText: "text-amber-800",
    text: "text-amber-800",
    label: "Stretched",
  },
  over: {
    bar: "bg-red-500",
    pillBg: "bg-red-100",
    pillText: "text-red-700",
    text: "text-red-700",
    label: "Over",
  },
  unknown: {
    bar: "bg-slate-300",
    pillBg: "bg-slate-100",
    pillText: "text-slate-500",
    text: "text-slate-500",
    label: "—",
  },
};

function initials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (name.slice(0, 2) || "??").toUpperCase();
}

export function TeamAllocationCards({ data }: Props) {
  if (!data) return null;
  const people = data.people.filter((p) => p.include_in_capacity);
  if (people.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="text-xs text-slate-500">No roster members available.</div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
        <Users className="h-4 w-4 text-slate-500" />
        Team Allocation — This Week
        <InfoTooltip>
          <div className="font-semibold text-slate-800">Per-person weekly allocation</div>
          <p>
            One card per roster member. Shows current-week allocation vs
            personal capacity. Next 4 weeks strip gives a forward glance.
          </p>
          <p className="font-mono text-[10px] bg-slate-100 rounded px-2 py-1 mt-1">
            Free = capacity_hrs_week × (1 − utilization_this_week)
          </p>
          <p className="text-slate-400 mt-1">
            Same data as the Person Heatmap below — cells[0] is this week.
          </p>
        </InfoTooltip>
      </h2>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {people.map((person, i) => (
          <PersonCard key={person.name} person={person} index={i} />
        ))}
      </div>
    </div>
  );
}

function PersonCard({ person, index }: { person: PersonHeatmapRow; index: number }) {
  const pctNow = person.cells[0] ?? 0;
  const capacity = person.capacity_hrs_week;
  const allocatedHrs = Math.round(pctNow * capacity * 10) / 10;
  const freeHrs = Math.max(0, Math.round((capacity - allocatedHrs) * 10) / 10);
  const status = capacity > 0 ? statusFromPct(pctNow) : "unknown";
  const style = STATUS_STYLE[status];

  // Bar fill width — cap at 100% for visual purposes but show real % in text
  const barWidth = Math.min(100, pctNow * 100);

  // Next 4 weeks preview (indices 1..4)
  const nextWeeks = [1, 2, 3, 4].map((idx) => {
    const pct = person.cells[idx] ?? 0;
    return {
      idx,
      pct,
      status: statusFromPct(pct),
    };
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04, ease: "easeOut" }}
      className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-bold text-emerald-700">
          {initials(person.name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-slate-900">{person.name}</div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-slate-400">
            <span>{person.role}</span>
            <span>·</span>
            <span className="tabular-nums">{capacity.toFixed(0)}h/wk</span>
          </div>
        </div>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-semibold",
            style.pillBg,
            style.pillText,
          )}
        >
          {style.label}
        </span>
      </div>

      {/* Hero row */}
      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Free this week
          </div>
          <div className={cn("text-2xl font-bold tabular-nums", style.text)}>
            {freeHrs}
            <span className="ml-0.5 text-sm font-semibold text-slate-400">h</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Allocated
          </div>
          <div className={cn("text-xl font-bold tabular-nums", style.text)}>
            {Math.round(pctNow * 100)}
            <span className="ml-0.5 text-sm font-semibold text-slate-400">%</span>
          </div>
        </div>
      </div>

      {/* Usage bar */}
      <div className="mt-2">
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${barWidth}%` }}
            transition={{ duration: 0.6, delay: 0.2 + index * 0.04, ease: "easeOut" }}
            className={cn("h-full rounded-full", style.bar)}
          />
        </div>
        <div className="mt-1 flex items-center justify-between text-[10px] tabular-nums text-slate-400">
          <span>{allocatedHrs}h consumed</span>
          <span>of {capacity.toFixed(0)}h capacity</span>
        </div>
      </div>

      {/* Next 4 weeks — mini vertical bar chart */}
      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Next 4 Weeks
          </span>
          <span className="text-[9px] font-medium text-slate-400">100%</span>
        </div>
        <NextWeeksChart weeks={nextWeeks} rowIndex={index} />
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Mini bar chart for the "Next 4 Weeks" preview
// ---------------------------------------------------------------------------

interface NextWeekCell {
  idx: number;
  pct: number;
  status: Status;
}

function NextWeeksChart({ weeks, rowIndex }: { weeks: NextWeekCell[]; rowIndex: number }) {
  // Visual scale: cap at 125% for bar height so over-capacity weeks read
  // distinctly without blowing the layout. The 100% reference line sits
  // at 80% of the chart height.
  const MAX_PCT = 1.25;
  const CHART_HEIGHT = 56; // px
  const referenceLinePct = 1.0 / MAX_PCT; // where the 100% line sits (0..1)

  return (
    <div className="relative rounded-lg border border-slate-100 bg-slate-50/60 p-2">
      {/* Chart area with reference line */}
      <div className="relative" style={{ height: `${CHART_HEIGHT}px` }}>
        {/* 100% reference line */}
        <div
          className="pointer-events-none absolute left-0 right-0 border-t border-dashed border-slate-300"
          style={{ bottom: `${referenceLinePct * 100}%` }}
        />
        {/* Bars */}
        <div className="absolute inset-0 flex items-end justify-around gap-1.5">
          {weeks.map((wk) => {
            const style = STATUS_STYLE[wk.status];
            const visualPct = Math.min(wk.pct, MAX_PCT) / MAX_PCT;
            const heightPx = Math.max(4, visualPct * CHART_HEIGHT);
            return (
              <div
                key={wk.idx}
                className="flex flex-1 flex-col items-center justify-end"
                title={`Week +${wk.idx}: ${Math.round(wk.pct * 100)}%`}
              >
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${heightPx}px` }}
                  transition={{
                    duration: 0.5,
                    delay: 0.3 + rowIndex * 0.04 + wk.idx * 0.05,
                    ease: "easeOut",
                  }}
                  className={cn(
                    "w-full rounded-t-sm",
                    style.bar,
                    wk.pct > 1.0 && "shadow-sm",
                  )}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Percent labels */}
      <div className="mt-1 flex items-center justify-around gap-1.5">
        {weeks.map((wk) => {
          const style = STATUS_STYLE[wk.status];
          return (
            <div
              key={`pct-${wk.idx}`}
              className={cn(
                "flex-1 text-center text-[10px] font-bold tabular-nums",
                style.text,
              )}
            >
              {Math.round(wk.pct * 100)}%
            </div>
          );
        })}
      </div>

      {/* Week labels */}
      <div className="mt-0.5 flex items-center justify-around gap-1.5">
        {weeks.map((wk) => (
          <div
            key={`lbl-${wk.idx}`}
            className="flex-1 text-center text-[9px] font-medium text-slate-400"
          >
            +{wk.idx}w
          </div>
        ))}
      </div>
    </div>
  );
}
