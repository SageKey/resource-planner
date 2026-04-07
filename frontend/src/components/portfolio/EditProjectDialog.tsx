import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import type { Project } from "@/types/project";
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

const TYPE_OPTIONS = [
  "Key Initiative",
  "Enhancement",
  "Support",
  "Infrastructure",
  "Research",
];

const TSHIRT_OPTIONS = [
  "XS (< 40 hrs)",
  "S (40-80 hrs)",
  "M (80-200 hrs)",
  "L (200-500 hrs)",
  "XL (500-1000 hrs)",
  "XXL (1000+ hrs)",
];

const ROLE_KEYS = [
  { key: "pm", label: "PM %" },
  { key: "ba", label: "BA %" },
  { key: "functional", label: "Functional %" },
  { key: "technical", label: "Technical %" },
  { key: "developer", label: "Developer %" },
  { key: "infrastructure", label: "Infra %" },
  { key: "dba", label: "DBA %" },
  { key: "erp", label: "ERP %" },
];

interface Props {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type FormState = {
  id: string;
  name: string;
  type: string;
  portfolio: string;
  sponsor: string;
  health: string;
  pct_complete: string;
  priority: string;
  start_date: string;
  end_date: string;
  team: string;
  pm: string;
  ba: string;
  functional_lead: string;
  technical_lead: string;
  developer_lead: string;
  tshirt_size: string;
  est_hours: string;
  notes: string;
  role_allocations: Record<string, string>;
};

function blank(): FormState {
  return {
    id: "",
    name: "",
    type: "Enhancement",
    portfolio: "",
    sponsor: "",
    health: "\u26aa NOT STARTED",
    pct_complete: "0",
    priority: "Medium",
    start_date: "",
    end_date: "",
    team: "",
    pm: "",
    ba: "",
    functional_lead: "",
    technical_lead: "",
    developer_lead: "",
    tshirt_size: "",
    est_hours: "0",
    notes: "",
    role_allocations: Object.fromEntries(ROLE_KEYS.map((r) => [r.key, "0"])),
  };
}

function fromProject(p: Project): FormState {
  return {
    id: p.id,
    name: p.name,
    type: p.type ?? "Enhancement",
    portfolio: p.portfolio ?? "",
    sponsor: p.sponsor ?? "",
    health: p.health ?? "\u26aa NOT STARTED",
    pct_complete: Math.round(p.pct_complete * 100).toString(),
    priority: p.priority ?? "Medium",
    start_date: p.start_date ?? "",
    end_date: p.end_date ?? "",
    team: p.team ?? "",
    pm: p.pm ?? "",
    ba: p.ba ?? "",
    functional_lead: p.functional_lead ?? "",
    technical_lead: p.technical_lead ?? "",
    developer_lead: p.developer_lead ?? "",
    tshirt_size: p.tshirt_size ?? "",
    est_hours: (p.est_hours || 0).toString(),
    notes: p.notes ?? "",
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
      type: form.type || null,
      portfolio: form.portfolio || null,
      sponsor: form.sponsor || null,
      health: form.health || null,
      pct_complete: Math.max(0, Math.min(1, (parseFloat(form.pct_complete) || 0) / 100)),
      priority: form.priority || null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      team: form.team || null,
      pm: form.pm || null,
      ba: form.ba || null,
      functional_lead: form.functional_lead || null,
      technical_lead: form.technical_lead || null,
      developer_lead: form.developer_lead || null,
      tshirt_size: form.tshirt_size || null,
      est_hours: parseFloat(form.est_hours) || 0,
      notes: form.notes || null,
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit project" : "Add project"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update project details, sizing, and role allocations."
              : "Create a new project in the portfolio."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* ID + Name */}
          <div className="grid grid-cols-[120px_1fr] gap-3">
            <Field label="Project ID">
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

          {/* Type, Priority, Health */}
          <div className="grid grid-cols-3 gap-3">
            <Field label="Type">
              <select value={form.type} onChange={(e) => set("type", e.target.value)} className={inputCls}>
                {TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
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
            <Field label="Health">
              <select value={form.health} onChange={(e) => set("health", e.target.value)} className={inputCls}>
                {HEALTH_OPTIONS.map((h) => (
                  <option key={h.value} value={h.value}>{h.label}</option>
                ))}
              </select>
            </Field>
          </div>

          {/* T-Shirt, Hours, % Complete */}
          <div className="grid grid-cols-3 gap-3">
            <Field label="T-Shirt Size">
              <select value={form.tshirt_size} onChange={(e) => set("tshirt_size", e.target.value)} className={inputCls}>
                <option value="">— none —</option>
                {TSHIRT_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </Field>
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
              Role Allocations
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

          {/* Leads */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Sponsor">
              <input type="text" value={form.sponsor} onChange={(e) => set("sponsor", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Team">
              <input type="text" value={form.team} onChange={(e) => set("team", e.target.value)} className={inputCls} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Portfolio">
              <input type="text" value={form.portfolio} onChange={(e) => set("portfolio", e.target.value)} className={inputCls} />
            </Field>
            <Field label="PM">
              <input type="text" value={form.pm} onChange={(e) => set("pm", e.target.value)} className={inputCls} />
            </Field>
          </div>

          {/* Notes */}
          <Field label="Notes">
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={2}
              className={inputCls + " resize-none"}
            />
          </Field>

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
