import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  Ban,
  CalendarClock,
  CheckCircle2,
  Clock,
  Users,
} from "lucide-react";
import { cn } from "@/lib/cn";
import {
  MOCK_TODAY,
  ROLE_BY_KEY,
  plannableByPriority,
  startQueueStats,
  type MockProject,
  type Priority,
} from "./mockData";

/**
 * Concept D — Start Queue
 *
 * Answers Jim's question: "When can a new project begin?" Lists every
 * plannable (not-yet-started) project with its computed earliest start
 * date, the role bottleneck, and a phase-by-phase start plan. Hardcoded
 * values stand in for a real scheduler — this is a wireframe.
 */

const PRIORITY_STYLE: Record<
  Priority,
  { headerBg: string; headerText: string; dot: string; label: string }
> = {
  Highest: {
    headerBg: "bg-rose-50 border-rose-200",
    headerText: "text-rose-800",
    dot: "bg-rose-500",
    label: "Highest",
  },
  High: {
    headerBg: "bg-amber-50 border-amber-200",
    headerText: "text-amber-800",
    dot: "bg-amber-500",
    label: "High",
  },
  Medium: {
    headerBg: "bg-sky-50 border-sky-200",
    headerText: "text-sky-800",
    dot: "bg-sky-500",
    label: "Medium",
  },
  Low: {
    headerBg: "bg-slate-50 border-slate-200",
    headerText: "text-slate-700",
    dot: "bg-slate-500",
    label: "Low",
  },
};

function projectInitials(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return (name.slice(0, 2) || "??").toUpperCase();
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function shortDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
}

function relativeFromToday(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  const diffDays = Math.round((d.getTime() - MOCK_TODAY.getTime()) / 86_400_000);
  if (diffDays <= 0) return "now";
  if (diffDays < 7) return `in ${diffDays}d`;
  const weeks = Math.round(diffDays / 7);
  if (weeks === 1) return "in 1 week";
  if (weeks < 9) return `in ${weeks} weeks`;
  const months = Math.round(diffDays / 30);
  if (months === 1) return "in 1 month";
  return `in ${months} months`;
}

export function StartQueueConcept() {
  const stats = startQueueStats();
  const groups = plannableByPriority();

  return (
    <div className="space-y-5">
      {/* Summary stats */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="mb-4 flex items-baseline justify-between">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Start Queue
            </div>
            <div className="mt-0.5 text-xs text-slate-500">
              Plannable projects sorted by earliest viable start date. Accounts for
              current commitments and higher-priority work ahead in the queue.
            </div>
          </div>
          <div className="text-[10px] tabular-nums text-slate-400">
            As of {fmtDate(MOCK_TODAY.toISOString().slice(0, 10))}
          </div>
        </div>
        <div
          className={cn(
            "grid gap-3",
            stats.later > 0 ? "grid-cols-2 md:grid-cols-4" : "grid-cols-3",
          )}
        >
          <StatTile
            label="This month"
            value={stats.thisMonth}
            accent="bg-emerald-500"
            bg="bg-emerald-50"
            text="text-emerald-700"
            icon={CalendarClock}
          />
          <StatTile
            label="Next 60 days"
            value={stats.next60}
            accent="bg-sky-500"
            bg="bg-sky-50"
            text="text-sky-700"
            icon={Clock}
          />
          {stats.later > 0 && (
            <StatTile
              label="Later"
              value={stats.later}
              accent="bg-slate-500"
              bg="bg-slate-50"
              text="text-slate-700"
              icon={CalendarClock}
            />
          )}
          <StatTile
            label="Blocked"
            value={stats.blocked}
            accent="bg-rose-500"
            bg="bg-rose-50"
            text="text-rose-700"
            icon={Ban}
          />
        </div>
      </div>

      {/* Priority groups */}
      {groups.map((group, gIdx) => {
        const style = PRIORITY_STYLE[group.priority];
        const totalHrs = group.projects.reduce((s, p) => s + p.totalHours, 0);

        return (
          <motion.div
            key={group.priority}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: gIdx * 0.08, ease: "easeOut" }}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white"
          >
            {/* Group header */}
            <div className={cn("flex items-center justify-between border-b px-5 py-3", style.headerBg)}>
              <div className="flex items-center gap-2">
                <span className={cn("h-2.5 w-2.5 rounded-full", style.dot)} />
                <div className={cn("text-xs font-bold uppercase tracking-wider", style.headerText)}>
                  {style.label} Priority
                </div>
                <span className="ml-1 rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                  {group.projects.length}
                </span>
              </div>
              <div className="text-[10px] tabular-nums text-slate-500">
                {totalHrs.toLocaleString()}h total
              </div>
            </div>

            {/* Rows */}
            <div>
              {group.projects.map((p, i) => (
                <ProjectRow key={p.id} project={p} rowIndex={i} />
              ))}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// --------------------------------------------------------------------------
// ProjectRow
// --------------------------------------------------------------------------

function ProjectRow({ project: p, rowIndex }: { project: MockProject; rowIndex: number }) {
  const isBlocked = p.proposedStart === null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: rowIndex * 0.04 + 0.1 }}
      className={cn(
        "border-b border-slate-100 px-5 py-4 transition-colors last:border-b-0",
        isBlocked ? "bg-rose-50/30 hover:bg-rose-50/50" : "hover:bg-slate-50/60",
      )}
    >
      {/* Top row: avatar + name + hero date */}
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
            isBlocked
              ? "bg-slate-100 text-slate-400"
              : "bg-emerald-100 text-emerald-700",
          )}
        >
          {projectInitials(p.name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="truncate text-sm font-semibold text-slate-900">{p.name}</div>
            <TshirtBadge size={p.tshirt} />
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-slate-400">
            <span className="font-mono">{p.id}</span>
            <span>·</span>
            <span className="tabular-nums">{p.totalHours.toLocaleString()}h total</span>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            {isBlocked ? "Status" : "Earliest Start"}
          </div>
          <div
            className={cn(
              "text-xl font-bold tabular-nums",
              isBlocked ? "text-rose-600" : "text-slate-900",
            )}
          >
            {isBlocked ? "Blocked" : fmtDate(p.proposedStart)}
          </div>
          <div className={cn("text-[10px]", isBlocked ? "text-rose-500" : "text-slate-400")}>
            {isBlocked ? "No viable window" : relativeFromToday(p.proposedStart)}
          </div>
        </div>
      </div>

      {/* Bottleneck strip */}
      <BottleneckStrip project={p} />

      {/* Phase plan strip */}
      {!isBlocked && p.proposedPhases && <PhasePlan phases={p.proposedPhases} />}
    </motion.div>
  );
}

// --------------------------------------------------------------------------
// Bottleneck strip
// --------------------------------------------------------------------------

function BottleneckStrip({ project: p }: { project: MockProject }) {
  // Team has room
  if (p.proposedStart !== null && !p.bottleneck) {
    return (
      <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs">
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
        <span className="font-semibold text-emerald-800">Team has room</span>
        <span className="text-emerald-700">No active bottleneck. Can start as soon as you green-light it.</span>
      </div>
    );
  }

  if (!p.bottleneck) return null;

  const bn = p.bottleneck;
  const role = ROLE_BY_KEY[bn.roleKey];
  const isPermanent = bn.clearDate === null;
  const barPct = Math.min(100, (bn.freeHrs / bn.neededHrs) * 100);

  return (
    <div
      className={cn(
        "mt-3 rounded-lg border px-3 py-2",
        isPermanent ? "border-rose-200 bg-rose-50" : "border-amber-200 bg-amber-50",
      )}
    >
      <div className="flex items-center gap-2 text-xs">
        {isPermanent ? (
          <Ban className="h-3.5 w-3.5 shrink-0 text-rose-700" />
        ) : (
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-700" />
        )}
        <span
          className={cn(
            "font-semibold",
            isPermanent ? "text-rose-900" : "text-amber-900",
          )}
        >
          Bottleneck: {role.label}
        </span>
        <span className={cn(isPermanent ? "text-rose-800" : "text-amber-800")}>
          {bn.freeHrs}h free, needs {bn.neededHrs}h
        </span>
        <span className="ml-auto flex items-center gap-1 text-[11px]">
          {isPermanent ? (
            <span className="font-semibold text-rose-900">No clear date</span>
          ) : (
            <>
              <span className="text-amber-700">Clears</span>
              <span className="font-semibold text-amber-900 tabular-nums">
                {fmtDate(bn.clearDate)}
              </span>
            </>
          )}
        </span>
      </div>
      {/* Mini capacity bar */}
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white">
        <div
          className={cn("h-full rounded-full", isPermanent ? "bg-rose-500" : "bg-amber-500")}
          style={{ width: `${barPct}%` }}
        />
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// Phase plan strip
// --------------------------------------------------------------------------

const PHASE_CHIP_STYLE = {
  planning: "bg-sky-100 text-sky-800 border-sky-200",
  build: "bg-amber-100 text-amber-800 border-amber-200",
  test_deploy: "bg-emerald-100 text-emerald-800 border-emerald-200",
} as const;

function PhasePlan({
  phases,
}: {
  phases: { planning: string | null; build: string | null; test_deploy: string | null };
}) {
  return (
    <div className="mt-3">
      <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        Phase Plan
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <PhaseChip label="Planning" date={phases.planning} styleKey="planning" />
        <ArrowRight className="h-3 w-3 text-slate-300" />
        <PhaseChip label="Build" date={phases.build} styleKey="build" />
        <ArrowRight className="h-3 w-3 text-slate-300" />
        <PhaseChip label="Test / Deploy" date={phases.test_deploy} styleKey="test_deploy" />
      </div>
    </div>
  );
}

function PhaseChip({
  label,
  date,
  styleKey,
}: {
  label: string;
  date: string | null;
  styleKey: keyof typeof PHASE_CHIP_STYLE;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md border px-2 py-1 text-[11px]",
        PHASE_CHIP_STYLE[styleKey],
      )}
    >
      <span className="font-semibold">{label}</span>
      <span className="tabular-nums">{shortDate(date)}</span>
    </div>
  );
}

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

function StatTile({
  label,
  value,
  accent,
  bg,
  text,
  icon: Icon,
}: {
  label: string;
  value: number;
  accent: string;
  bg: string;
  text: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className={cn("flex items-center gap-3 rounded-lg border border-slate-200 p-3", bg)}>
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
          accent,
        )}
      >
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </div>
        <div className={cn("text-2xl font-bold tabular-nums leading-tight", text)}>
          {value}
        </div>
      </div>
    </div>
  );
}

function TshirtBadge({ size }: { size: "S" | "M" | "L" | "XL" }) {
  const styles: Record<typeof size, string> = {
    S: "bg-slate-100 text-slate-600",
    M: "bg-sky-100 text-sky-700",
    L: "bg-violet-100 text-violet-700",
    XL: "bg-rose-100 text-rose-700",
  };
  return (
    <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-bold", styles[size])}>
      {size}
    </span>
  );
}

// Suppress unused warnings for icons only used conditionally
void Users;
