import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import type { Project } from "@/types/project";
import { ProjectAssignments } from "./ProjectAssignments";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCreateProject, useUpdateProject } from "@/hooks/usePortfolio";

const HEALTH_OPTIONS = [
  { value: "\u{1f7e2} ON TRACK", label: "On Track" },
  { value: "\u{1f7e1} AT RISK", label: "At Risk" },
  { value: "\u{1f534} NEEDS HELP", label: "Needs Help" },
  { value: "\u26aa NOT STARTED", label: "Not Started" },
  { value: "\u{1f535} NEEDS FUNCTIONAL SPEC", label: "Needs Functional Spec" },
  { value: "\u{1f535} NEEDS TECHNICAL SPEC", label: "Needs Technical Spec" },
  { value: "\u{1f4cb} PIPELINE", label: "Pipeline" },
  { value: "\u2705 COMPLETE", label: "Complete" },
  { value: "\u23f8\ufe0f POSTPONED", label: "Postponed" },
];

const PRIORITY_OPTIONS = ["Highest", "High", "Medium", "Low"];

const ROLE_KEYS = [
  { key: "pm", label: "PM" },
  { key: "ba", label: "BA" },
  { key: "functional", label: "Functional" },
  { key: "technical", label: "Technical" },
  { key: "developer", label: "Developer" },
  { key: "infrastructure", label: "Infra" },
  { key: "dba", label: "DBA" },
  { key: "erp", label: "ERP" },
];

interface Props {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type FormState = {
  id: string;
  name: string;
  health: string;
  priority: string;
  pct_complete: string;
  est_hours: string;
  start_date: string;
  end_date: string;
  role_allocations: Record<string, string>;
};

function blank(): FormState {
  return {
    id: "",
    name: "",
    health: "\u26aa NOT STARTED",
    priority: "Medium",
    pct_complete: "0",
    est_hours: "0",
    start_date: "",
    end_date: "",
    role_allocations: Object.fromEntries(ROLE_KEYS.map((r) => [r.key, "0"])),
  };
}

function matchHealth(h: string | null): string {
  if (!h) return "\u26aa NOT STARTED";
  const up = h.toUpperCase();
  for (const opt of HEALTH_OPTIONS) {
    // Match on the text portion, ignoring emoji prefix
    const optText = opt.value.replace(/^[^\w]*/, "").trim().toUpperCase();
    if (up.includes(optText)) return opt.value;
  }
  return "\u26aa NOT STARTED";
}

function fromProject(p: Project): FormState {
  return {
    id: p.id,
    name: p.name,
    health: matchHealth(p.health),
    priority: p.priority ?? "Medium",
    pct_complete: Math.round(p.pct_complete * 100).toString(),
    est_hours: (p.est_hours || 0).toString(),
    start_date: p.start_date ?? "",
    end_date: p.end_date ?? "",
    role_allocations: Object.fromEntries(
      ROLE_KEYS.map((r) => [
        r.key,
        Math.round((p.role_allocations?.[r.key] ?? 0) * 100).toString(),
      ]),
    ),
  };
}

export function EditProjectDialog({ project, open, onOpenChange }: Props) {
  const isEdit = project !== null;
  const [form, setForm] = useState<FormState>(() =>
    project ? fromProject(project) : blank(),
  );
  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject();
  const mutation = isEdit ? updateMutation : createMutation;

  useEffect(() => {
    if (open) {
      setForm(project ? fromProject(project) : blank());
      createMutation.reset();
      updateMutation.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, project?.id]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const setAlloc = (roleKey: string, value: string) =>
    setForm((f) => ({
      ...f,
      role_allocations: { ...f.role_allocations, [roleKey]: value },
    }));

  const canSubmit = form.id.trim() !== "" && form.name.trim() !== "";

  const handleSave = async () => {
    if (!canSubmit) return;

    const roleAllocations: Record<string, number> = {};
    for (const [k, v] of Object.entries(form.role_allocations)) {
      const pct = parseFloat(v) || 0;
      roleAllocations[k] = Math.max(0, Math.min(1, pct / 100));
    }

    const payload: Record<string, unknown> = {
      id: form.id.trim(),
      name: form.name.trim(),
      health: form.health || null,
      priority: form.priority || null,
      pct_complete: Math.max(0, Math.min(1, (parseFloat(form.pct_complete) || 0) / 100)),
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      est_hours: parseFloat(form.est_hours) || 0,
      role_allocations: roleAllocations,
    };

    try {
      if (isEdit) {
        await updateMutation.mutateAsync(payload as Record<string, unknown> & { id: string });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onOpenChange(false);
    } catch {
      /* error surfaces via mutation.error */
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit project" : "Add project"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update sizing, dates, and role allocations."
              : "Add a new project to the portfolio."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* ID + Name */}
          <div className="grid grid-cols-[100px_1fr] gap-3">
            <Field label="ID">
              <input
                type="text"
                value={form.id}
                onChange={(e) => set("id", e.target.value)}
                placeholder="ETE-XX"
                disabled={isEdit}
                autoFocus={!isEdit}
                className={inputCls + (isEdit ? " bg-slate-50 text-slate-500" : "")}
              />
            </Field>
            <Field label="Name">
              <input
                type="text"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Project name"
                className={inputCls}
              />
            </Field>
          </div>

          {/* Health, Priority */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Health">
              <select value={form.health} onChange={(e) => set("health", e.target.value)} className={inputCls}>
                {HEALTH_OPTIONS.map((h) => (
                  <option key={h.value} value={h.value}>{h.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Priority">
              <select value={form.priority} onChange={(e) => set("priority", e.target.value)} className={inputCls}>
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </Field>
          </div>

          {/* Hours, % Complete */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Est. Hours">
              <input
                type="number"
                min={0}
                step={10}
                value={form.est_hours}
                onChange={(e) => set("est_hours", e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="% Complete">
              <input
                type="number"
                min={0}
                max={100}
                step={5}
                value={form.pct_complete}
                onChange={(e) => set("pct_complete", e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start Date">
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => set("start_date", e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="End Date">
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => set("end_date", e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>

          {/* Role Allocations */}
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Role Allocations (%)
            </div>
            <div className="grid grid-cols-4 gap-2">
              {ROLE_KEYS.map((r) => (
                <div key={r.key}>
                  <label className="mb-0.5 block text-[10px] font-medium text-slate-500">
                    {r.label}
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={5}
                    value={form.role_allocations[r.key]}
                    onChange={(e) => setAlloc(r.key, e.target.value)}
                    className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-center text-sm tabular-nums focus:border-navy-400 focus:outline-none focus:ring-2 focus:ring-navy-100"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Team Assignments — only show in edit mode */}
          {isEdit && (
            <ProjectAssignments projectId={form.id} />
          )}

          {mutation.isError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
              Failed: {(mutation.error as Error).message}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={mutation.isPending || !canSubmit}
          >
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? "Save" : "Add project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const inputCls =
  "w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-navy-400 focus:outline-none focus:ring-2 focus:ring-navy-100";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-xs">
      <span className="mb-1 block font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}
