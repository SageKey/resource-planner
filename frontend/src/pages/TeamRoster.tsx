import { TopBar } from "@/components/layout/TopBar";
import { useRoster } from "@/hooks/useRoster";
import { cn } from "@/lib/cn";
import { avatarTone } from "@/lib/format";

const ROLE_LABELS: Record<string, string> = {
  pm: "Project Manager",
  ba: "Business Analyst",
  functional: "Functional Analyst",
  technical: "Technical Analyst",
  developer: "Developer",
  infrastructure: "Infrastructure",
  dba: "DBA",
  erp: "ERP Consultant",
};

export function TeamRoster() {
  const { data: members, isLoading, isError, error } = useRoster();

  return (
    <>
      <TopBar title="Roster" subtitle="Team members, capacity, and availability." />
      <div className="p-8">
        {isLoading && (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
            Loading roster...
          </div>
        )}
        {isError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
            {(error as Error).message}
          </div>
        )}
        {members && members.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-medium text-slate-500">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Team</th>
                  <th className="px-4 py-3 text-right">Weekly Hrs</th>
                  <th className="px-4 py-3 text-right">Support %</th>
                  <th className="px-4 py-3 text-right">Project Hrs</th>
                  <th className="px-4 py-3 text-center">In Capacity</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr
                    key={m.name}
                    className={cn(
                      "border-b border-slate-50 transition-colors hover:bg-slate-50",
                      !m.include_in_capacity && "opacity-50",
                    )}
                  >
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div
                          className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold"
                          style={{ backgroundColor: avatarTone(m.name) }}
                        >
                          {m.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </div>
                        <span className="font-medium text-slate-800">{m.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">
                      {ROLE_LABELS[m.role_key] ?? m.role}
                    </td>
                    <td className="px-4 py-2.5 text-slate-500">{m.team ?? "—"}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">
                      {m.weekly_hrs_available}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">
                      {Math.round(m.support_reserve_pct * 100)}%
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-medium text-slate-800">
                      {m.project_capacity_hrs.toFixed(1)}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span
                        className={cn(
                          "inline-block h-2 w-2 rounded-full",
                          m.include_in_capacity ? "bg-emerald-500" : "bg-slate-300",
                        )}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!isLoading && (!members || members.length === 0) && (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
            No team members found. Import data or add members to get started.
          </div>
        )}
      </div>
    </>
  );
}
