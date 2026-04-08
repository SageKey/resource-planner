import { useState } from "react";
import { ChevronDown, Briefcase, FolderOpen } from "lucide-react";
import { usePersonDemand } from "@/hooks/useRoster";
import { cn } from "@/lib/cn";
import { avatarTone } from "@/lib/format";
import type { PersonDemand } from "@/types/roster";

const STATUS_BAR: Record<string, string> = {
  BLUE: "bg-sky-400",
  GREEN: "bg-emerald-500",
  YELLOW: "bg-amber-400",
  RED: "bg-red-500",
  GREY: "bg-slate-300",
};

const STATUS_BG: Record<string, string> = {
  BLUE: "bg-sky-50",
  GREEN: "bg-emerald-50",
  YELLOW: "bg-amber-50",
  RED: "bg-red-50",
  GREY: "bg-slate-50",
};

const ROLE_LABELS: Record<string, string> = {
  pm: "PM", ba: "BA", functional: "Functional", technical: "Technical",
  developer: "Developer", infrastructure: "Infra", dba: "DBA", erp: "ERP",
};

export function PersonDemandTable() {
  const { data, isLoading } = usePersonDemand();
  const [expanded, setExpanded] = useState<string | null>(null);
  const people = Array.isArray(data) ? data : [];

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        Computing demand...
      </div>
    );
  }

  if (people.length === 0) return null;

  // Sort by utilization descending
  const sorted = [...people].sort((a, b) => b.utilization_pct - a.utilization_pct);

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
        <Briefcase className="h-4 w-4 text-slate-400" />
        <h3 className="text-sm font-semibold text-slate-800">
          Person Demand
        </h3>
        <span className="text-xs text-slate-500">
          Who is working on what, and how loaded are they?
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs font-medium text-slate-500">
              <th className="px-4 py-2.5">Person</th>
              <th className="px-4 py-2.5">Role</th>
              <th className="px-4 py-2.5 text-right">Demand</th>
              <th className="px-4 py-2.5 text-right">Capacity</th>
              <th className="px-4 py-2.5 w-48">Utilization</th>
              <th className="px-4 py-2.5 text-right">Projects</th>
              <th className="px-4 py-2.5 w-8" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => {
              const isOpen = expanded === p.name;
              const pct = Math.min(p.utilization_pct, 2.0);
              const widthPct = Math.min(pct * 50, 100);
              const barColor = STATUS_BAR[p.status] ?? "bg-slate-400";
              const bgColor = STATUS_BG[p.status] ?? "bg-slate-50";

              return (
                <PersonDemandRow
                  key={p.name}
                  person={p}
                  isOpen={isOpen}
                  onToggle={() => setExpanded(isOpen ? null : p.name)}
                  widthPct={widthPct}
                  barColor={barColor}
                  bgColor={bgColor}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PersonDemandRow({
  person: p,
  isOpen,
  onToggle,
  widthPct,
  barColor,
  bgColor,
}: {
  person: PersonDemand;
  isOpen: boolean;
  onToggle: () => void;
  widthPct: number;
  barColor: string;
  bgColor: string;
}) {
  return (
    <>
      <tr
        onClick={onToggle}
        className={cn(
          "border-b border-slate-50 transition-colors hover:bg-slate-50 cursor-pointer",
          !p.include_in_capacity && "opacity-50",
        )}
      >
        <td className="px-4 py-2.5">
          <div className="flex items-center gap-2">
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold"
              style={{ backgroundColor: avatarTone(p.name) }}
            >
              {p.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </div>
            <span className="font-medium text-slate-800">{p.name}</span>
          </div>
        </td>
        <td className="px-4 py-2.5 text-slate-600">
          {ROLE_LABELS[p.role_key] ?? p.role}
        </td>
        <td className="px-4 py-2.5 text-right tabular-nums font-medium text-slate-700">
          {p.total_weekly_hrs.toFixed(1)}h
        </td>
        <td className="px-4 py-2.5 text-right tabular-nums text-slate-500">
          {p.capacity_hrs.toFixed(1)}h
        </td>
        <td className="px-4 py-2.5">
          <div className="flex items-center gap-2">
            <div className={cn("relative h-4 flex-1 rounded-full", bgColor)}>
              <div
                className={cn("absolute inset-y-0 left-0 rounded-full transition-all", barColor)}
                style={{ width: `${widthPct}%` }}
              />
            </div>
            <span className="w-10 text-right text-xs font-semibold tabular-nums text-slate-700">
              {Math.round(p.utilization_pct * 100)}%
            </span>
          </div>
        </td>
        <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">
          {p.project_count}
        </td>
        <td className="px-4 py-2.5">
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 text-slate-400 transition-transform",
              isOpen && "rotate-180",
            )}
          />
        </td>
      </tr>

      {/* Expanded: project breakdown */}
      {isOpen && p.projects.length > 0 && (
        <tr>
          <td colSpan={7} className="bg-slate-50 px-4 py-2">
            <div className="space-y-1">
              {p.projects.map((proj, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-xs text-slate-600 py-0.5"
                >
                  <div className="flex items-center gap-2">
                    <FolderOpen className="h-3 w-3 text-slate-400" />
                    <span className="font-mono text-slate-400">{proj.project_id}</span>
                    <span className="font-medium">{proj.project_name}</span>
                  </div>
                  <div className="flex items-center gap-4 tabular-nums">
                    <span className="text-slate-500">{ROLE_LABELS[proj.role_key] ?? proj.role_key}</span>
                    <span className="font-medium">{proj.weekly_hours.toFixed(1)}h/wk</span>
                    <span className="text-slate-400">{Math.round(proj.alloc_pct * 100)}% alloc</span>
                  </div>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
