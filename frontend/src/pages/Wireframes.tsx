import { useState } from "react";
import { AlertTriangle, LayoutGrid, CalendarRange, Columns3 } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { RoleCardsConcept } from "@/components/wireframes/RoleCardsConcept";
import { RoleTimelineConcept } from "@/components/wireframes/RoleTimelineConcept";
import { PhaseKanbanConcept } from "@/components/wireframes/PhaseKanbanConcept";
import { cn } from "@/lib/cn";

type TabKey = "cards" | "timeline" | "kanban";

const TABS: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }>; description: string }[] = [
  {
    key: "cards",
    label: "Role Cards",
    icon: LayoutGrid,
    description: "Per-role state: who's busy, how much is free, what's queued.",
  },
  {
    key: "timeline",
    label: "Role Timeline",
    icon: CalendarRange,
    description: "Gantt-style — 12 weeks across, roles down, project blocks in between.",
  },
  {
    key: "kanban",
    label: "Phase Kanban",
    icon: Columns3,
    description: "Three columns — Planning, Build, Test/Deploy. Projects flow left to right.",
  },
];

export function Wireframes() {
  const [tab, setTab] = useState<TabKey>("cards");
  const active = TABS.find((t) => t.key === tab)!;

  return (
    <>
      <TopBar
        title="Wireframes"
        subtitle="Three design concepts for a simplified capacity view."
      />
      <div className="space-y-5 p-8">
        {/* MOCKUP banner */}
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span className="font-semibold">Wireframe mockup</span>
          <span className="text-amber-800">
            Fake data. Not live. For design review only — these are three options for a simplified view, built around a 3-phase SDLC (Planning / Build / Test&nbsp;· Deploy).
          </span>
        </div>

        {/* Tab switcher */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
            {TABS.map((t) => {
              const Icon = t.icon;
              const isActive = t.key === tab;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all",
                    isActive
                      ? "bg-navy-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {t.label}
                </button>
              );
            })}
          </div>
          <div className="text-[11px] text-slate-500 sm:text-right">
            <span className="font-semibold text-slate-700">{active.label}:</span> {active.description}
          </div>
        </div>

        {/* Active concept */}
        <div>
          {tab === "cards" && <RoleCardsConcept />}
          {tab === "timeline" && <RoleTimelineConcept />}
          {tab === "kanban" && <PhaseKanbanConcept />}
        </div>

        {/* Footer note */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[11px] text-slate-500">
          <span className="font-semibold text-slate-700">Reviewer's note:</span> all three views show
          the same 7 mock projects and 6 roles. Numbers are illustrative. Goal: pick the design
          you want us to build for real.
        </div>
      </div>
    </>
  );
}
