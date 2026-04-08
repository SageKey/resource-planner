import { useState } from "react";
import { SlidersHorizontal, BookOpen } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import {
  useSdlc,
  useUpdatePhaseWeights,
  useUpdateRoleEfforts,
  useResetSdlcDefaults,
} from "@/hooks/useSdlc";
import { cn } from "@/lib/cn";

const PHASE_LABELS: Record<string, string> = {
  discovery: "Discovery",
  planning: "Planning",
  design: "Design",
  build: "Build",
  test: "Test",
  deploy: "Deploy",
};

const ROLE_LABELS: Record<string, string> = {
  pm: "PM",
  ba: "BA",
  functional: "Functional",
  technical: "Technical",
  developer: "Developer",
  infrastructure: "Infrastructure",
  dba: "DBA",
  erp: "ERP",
  "wms consultant": "WMS Consultant",
};

const PHASES = ["discovery", "planning", "design", "build", "test", "deploy"];
const ROLES = ["pm", "ba", "functional", "technical", "developer", "infrastructure", "dba", "erp"];

export function Settings() {
  const { data: sdlc, isLoading } = useSdlc();
  const updateWeights = useUpdatePhaseWeights();
  const updateEfforts = useUpdateRoleEfforts();
  const resetDefaults = useResetSdlcDefaults();

  const [weights, setWeights] = useState<Record<string, number> | null>(null);
  const [efforts, setEfforts] = useState<Record<string, Record<string, number>> | null>(null);

  // Initialize local state from server data
  const activeWeights = weights ?? sdlc?.phase_weights ?? {};
  const activeEfforts = efforts ?? sdlc?.role_phase_efforts ?? {};

  const phaseWeightSum = PHASES.reduce((s, p) => s + (activeWeights[p] ?? 0), 0);

  const handleWeightChange = (phase: string, val: number) => {
    setWeights({ ...activeWeights, [phase]: val });
  };

  const handleEffortChange = (role: string, phase: string, val: number) => {
    const roleEfforts = { ...(activeEfforts[role] ?? {}) };
    roleEfforts[phase] = val;
    setEfforts({ ...activeEfforts, [role]: roleEfforts });
  };

  const saveWeights = () => {
    updateWeights.mutate(activeWeights, {
      onSuccess: () => setWeights(null),
    });
  };

  const saveEfforts = () => {
    updateEfforts.mutate(activeEfforts, {
      onSuccess: () => setEfforts(null),
    });
  };

  const [tab, setTab] = useState<"sdlc" | "formulas">("sdlc");

  return (
    <>
      <TopBar title="Settings" subtitle="Configure SDLC model and review calculation formulas." />

      {/* Tabs */}
      <div className="border-b border-slate-200 bg-white px-8">
        <nav className="flex gap-1">
          {[
            { key: "sdlc" as const, label: "SDLC Model", icon: SlidersHorizontal },
            { key: "formulas" as const, label: "Formulas & Math", icon: BookOpen },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                "flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                tab === key
                  ? "border-indigo-600 text-indigo-700"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-8 space-y-8">
        {/* Formulas tab */}
        {tab === "formulas" && <FormulasReference />}

        {/* SDLC tab */}
        {tab === "sdlc" && isLoading && (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
            Loading SDLC model...
          </div>
        )}

        {tab === "sdlc" && sdlc && (
          <>
            {/* Phase Weights */}
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-slate-700">
                  Phase Weights
                  <InfoTooltip>
                    <div className="font-semibold text-slate-800">Phase Weights</div>
                    <p>What <strong>percentage of the project timeline</strong> each SDLC phase occupies. Build at 40% means 40% of the project duration is spent in the Build phase.</p>
                    <p>These weights determine how demand is distributed across weeks in the heatmap. A role heavy in Build will show higher demand during Build weeks.</p>
                    <p>Must sum to 100%.</p>
                  </InfoTooltip>
                  <span className={cn(
                    "ml-2 text-xs font-normal",
                    Math.abs(phaseWeightSum - 1.0) < 0.02 ? "text-emerald-600" : "text-red-500",
                  )}>
                    (sum: {(phaseWeightSum * 100).toFixed(0)}%)
                  </span>
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={saveWeights}
                    disabled={!weights || updateWeights.isPending}
                    className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-40 transition-colors"
                  >
                    Save Weights
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-6 gap-3">
                {PHASES.map((phase) => (
                  <div key={phase} className="text-center">
                    <label className="mb-1 block text-xs font-medium text-slate-500">
                      {PHASE_LABELS[phase]}
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={Math.round((activeWeights[phase] ?? 0) * 100)}
                      onChange={(e) =>
                        handleWeightChange(phase, Number(e.target.value) / 100)
                      }
                      className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-center text-sm tabular-nums focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    />
                    <span className="mt-0.5 block text-[10px] text-slate-400">%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Role-Phase Effort Grid */}
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-slate-700">
                  Role-Phase Effort Matrix
                  <InfoTooltip>
                    <div className="font-semibold text-slate-800">Role-Phase Effort Matrix</div>
                    <p>What <strong>percentage of a role's total work</strong> happens in each SDLC phase.</p>
                    <p>Example: Developer at 50% Build means half of all developer hours on a project are spent during the Build phase.</p>
                    <p>This drives the heatmap's week-by-week variation — PMs are busier in Planning weeks, Developers are busiest in Build weeks.</p>
                    <p>Each row must sum to 100%. Changes recalculate all capacity numbers immediately.</p>
                  </InfoTooltip>
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={saveEfforts}
                    disabled={!efforts || updateEfforts.isPending}
                    className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-40 transition-colors"
                  >
                    Save Efforts
                  </button>
                  <button
                    onClick={() => {
                      resetDefaults.mutate(undefined, {
                        onSuccess: () => {
                          setWeights(null);
                          setEfforts(null);
                        },
                      });
                    }}
                    disabled={resetDefaults.isPending}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                  >
                    Reset Defaults
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="px-2 py-2 text-left font-medium text-slate-500">Role</th>
                      {PHASES.map((p) => (
                        <th key={p} className="px-2 py-2 text-center font-medium text-slate-500">
                          {PHASE_LABELS[p]}
                        </th>
                      ))}
                      <th className="px-2 py-2 text-center font-medium text-slate-500">Sum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ROLES.map((role) => {
                      const roleData = activeEfforts[role] ?? {};
                      const sum = PHASES.reduce((s, p) => s + (roleData[p] ?? 0), 0);
                      const valid = Math.abs(sum - 1.0) < 0.02;

                      return (
                        <tr key={role} className="border-b border-slate-50">
                          <td className="px-2 py-1.5 font-medium text-slate-600">
                            {ROLE_LABELS[role]}
                          </td>
                          {PHASES.map((phase) => (
                            <td key={phase} className="px-1 py-1">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="1"
                                value={Math.round((roleData[phase] ?? 0) * 100)}
                                onChange={(e) =>
                                  handleEffortChange(role, phase, Number(e.target.value) / 100)
                                }
                                className="w-full rounded border border-slate-200 px-1.5 py-1 text-center tabular-nums focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                              />
                            </td>
                          ))}
                          <td className={cn(
                            "px-2 py-1.5 text-center tabular-nums font-medium",
                            valid ? "text-emerald-600" : "text-red-500",
                          )}>
                            {Math.round(sum * 100)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

function FormulasReference() {
  return (
    <div className="space-y-6">
      <FormulaCard
        title="1. Supply (per role)"
        formula="Supply = SUM( Weekly_Hrs × (1 - Support_Reserve%) ) for all team members in role"
        explanation="Each person's available project hours = their weekly hours minus the portion reserved for support/break-fix. Supply for a role = total across all people in that role who are included in capacity."
        example={`Example: 3 Developers\n  Alex:      35h × (1 - 0%) = 35.0 hrs/wk\n  Colin:     30h × (1 - 25%) = 22.5 hrs/wk\n  Nick:      25h × (1 - 40%) = 15.0 hrs/wk\n  Developer Supply = 72.5 hrs/wk`}
      />

      <FormulaCard
        title="2. Demand (per role, per project)"
        formula="Weekly_Demand = Remaining_Hrs × Role_Alloc% / Duration_Weeks"
        explanation="For each active project, compute remaining hours (adjusted for % complete), multiply by the role's allocation percentage, divide by the project's full duration in weeks. This gives the average weekly demand that project places on that role."
        example={`Example: ETE-83 (Customer Master Data Cleanup)\n  Est Hours: 640, % Complete: 15%\n  Remaining: 640 × (1 - 0.15) = 544 hrs\n  Developer Alloc: 50%\n  Duration: 33 weeks (Oct 14 → Jun 1)\n  Weekly Demand = 544 × 0.50 / 33 = 8.2 hrs/wk`}
      />

      <FormulaCard
        title="3. Remaining Hours"
        formula="Remaining = Est_Hours × (1 - Pct_Complete)"
        explanation="A project that is 80% complete only generates 20% of its original demand. This prevents completed work from inflating the capacity picture."
        example={`Example: 640 hrs at 80% complete\n  Remaining = 640 × (1 - 0.80) = 128 hrs\n  Only 128 hrs of demand remain across all roles`}
      />

      <FormulaCard
        title="4. Utilization"
        formula="Utilization% = Total_Role_Demand / Total_Role_Supply"
        explanation="Sum weekly demand across ALL active projects for a role, divide by that role's total supply. This is the average weekly utilization."
        example={`Example: Developer\n  Total Demand: 103 hrs/wk (sum across all projects)\n  Total Supply: 69 hrs/wk (sum across all developers)\n  Utilization = 103 / 69 = 149%\n\n  < 80% = Green (healthy)\n  80-99% = Yellow (stretched)\n  ≥ 100% = Red (over capacity)`}
      />

      <FormulaCard
        title="5. Heatmap (week-by-week demand)"
        formula="Cell = Weekly_Phase_Demand / Role_Supply"
        explanation={`The heatmap distributes each project's demand across weeks using the SDLC phase model.\n\nFor each SDLC phase, the role's demand in that phase = Role_Total_Hrs × Phase_Effort% / Phase_Duration_Weeks.\n\nPhase durations come from Phase Weights on the Settings page (e.g., Build = 40% of the timeline). Role effort per phase comes from the Role-Phase Effort Matrix (e.g., Developer does 50% of their work during Build).\n\nThis creates the wave pattern: BAs are busiest in Discovery, Developers peak during Build.`}
        example={`Example: PM on a 100-hour, 10-week project\n  PM Alloc: 10% → 10 PM hours total\n  Planning phase: 25% of PM work = 2.5 hrs\n  Planning duration: 10% of timeline = 1 week\n  PM demand during Planning week = 2.5 / 1 = 2.5 hrs/wk\n\n  Build phase: 20% of PM work = 2.0 hrs\n  Build duration: 40% of timeline = 4 weeks\n  PM demand during Build weeks = 2.0 / 4 = 0.5 hrs/wk`}
      />

      <FormulaCard
        title="5b. Current Phase Override (Heatmap)"
        formula="When current_phase is set: phases rebuild from TODAY → end_date using remaining phases only"
        explanation={`By default, the engine guesses which SDLC phase a project is in based on the calendar (e.g., 70% through the timeline = Build). This can be wrong if a project is behind schedule.\n\nWhen you set the Current Phase on a project (Portfolio → Edit), the engine overrides the calendar:\n\n1. Only remaining phases (current + later) are used\n2. Phase boundaries are rebuilt from today to end_date\n3. Phase weights are renormalized so remaining phases fill the remaining time proportionally\n4. Role efforts are renormalized so total hours are preserved\n\nThis fixes the heatmap showing Build-phase developer demand when you're actually still in Planning. The total demand doesn't change — only which weeks it appears in.\n\nProjects without a current phase set continue using the calendar-based estimate.`}
        example={`Example: ETE-83, current_phase = "planning"\n  End date: Jun 1 (~8 weeks from today)\n  Remaining phases: Planning → Design → Build → Test → Deploy\n\n  Before (calendar-based): Engine thinks we're in Build\n    → Developer demand high NOW (50% effort in Build)\n    → BA demand low NOW (10% effort in Build)\n\n  After (phase override): Engine knows we're in Planning\n    → Developer demand near zero NOW (5% effort in Planning)\n    → BA demand high NOW (20% effort in Planning)\n    → Developer demand spikes LATER when Build phase starts\n\n  Total hours unchanged — just shifted to the correct weeks.`}
      />

      <FormulaCard
        title="6. Person Demand"
        formula="Person_Weekly_Demand = Project_Role_Demand × Person_Allocation%"
        explanation="Person-level demand only counts projects they're explicitly assigned to via the Assignments tab. No even-split — if a person isn't assigned, they show zero demand from that project. This means person-level views are only as complete as your assignments."
        example={`Example: Audrey assigned to ETE-7 at 100%\n  ETE-7 BA demand = 9.1 hrs/wk\n  Audrey's demand from ETE-7 = 9.1 × 1.0 = 9.1 hrs/wk\n\n  If she were assigned at 50%:\n  Audrey's demand = 9.1 × 0.5 = 4.55 hrs/wk`}
      />

      <FormulaCard
        title="7. Person Availability"
        formula="Available_Date = first date where Person_Utilization < 50%"
        explanation="The engine walks forward in time. As each assigned project reaches its end date, that project's demand is removed from the person's load. The first date where their utilization drops below 50% = their available date. 'Available Now' means they're currently under 50%."
        example={`Example: Colin at 90% utilization\n  ETE-68 ends May 15 → removes 15 hrs/wk demand\n  New utilization: 35%  → below 50% threshold\n  Available date: May 15`}
      />

      <FormulaCard
        title="8. Auto-Scheduler"
        formula="Earliest_Start = first week where ALL roles stay under 85% utilization"
        explanation={`The scheduler processes plannable projects in priority order (Highest first). For each project, it scans forward week by week, simulating adding that project's phase-by-phase demand onto existing load.\n\nThe first week where no role exceeds 85% = the suggested start. Each placed project's demand is stamped into the grid before the next project is considered, so earlier projects get first pick.\n\nBottleneck role = the role preventing an earlier start (it hits 85% first).`}
        example={`Example: New 200-hour project, Highest priority\n  Needs: Developer 50%, BA 10%\n  Week 0: Developer already at 90% → can't start\n  Week 3: Developer drops to 70% → fits at 85%\n  Suggested start: Week 3 (May 4)`}
      />

      <FormulaCard
        title="9. SDLC Model"
        formula="Phase_Weights × Role_Phase_Efforts → demand distribution"
        explanation={`Two configurable tables drive the phase-aware calculations:\n\nPhase Weights: What percentage of the project timeline each phase occupies. Build at 40% means 40% of the project duration is the Build phase.\n\nRole-Phase Effort Matrix: What percentage of a role's total work happens in each phase. Developer at 50% Build means half of all developer hours are spent during Build.\n\nChanging these values on the Settings page immediately recalculates all heatmaps and capacity numbers.`}
        example={`Default Phase Weights:\n  Discovery 10% | Planning 10% | Design 10%\n  Build 40% | Test 20% | Deploy 10%\n\nBA Effort Distribution:\n  Discovery 30% | Planning 20% | Design 20%\n  Build 10% | Test 15% | Deploy 5%\n  (BA is front-loaded, heavy in discovery/planning)`}
      />
    </div>
  );
}

function FormulaCard({
  title,
  formula,
  explanation,
  example,
}: {
  title: string;
  formula: string;
  explanation: string;
  example: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h3 className="text-sm font-semibold text-slate-800 mb-3">{title}</h3>
      <div className="rounded-md bg-slate-900 px-4 py-2.5 mb-3">
        <code className="text-sm text-emerald-400 font-mono">{formula}</code>
      </div>
      <p className="text-sm text-slate-600 leading-relaxed mb-3 whitespace-pre-line">{explanation}</p>
      <div className="rounded-md bg-slate-50 border border-slate-100 px-4 py-3">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Worked Example</div>
        <pre className="text-xs text-slate-600 font-mono whitespace-pre-wrap">{example}</pre>
      </div>
    </div>
  );
}
