import { useState } from "react";
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

  return (
    <>
      <TopBar title="Settings" subtitle="Configure SDLC model and import data." />
      <div className="p-8 space-y-8">
        {isLoading && (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
            Loading SDLC model...
          </div>
        )}

        {sdlc && (
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
