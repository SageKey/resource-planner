import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export interface Assignment {
  project_id: string;
  person_name: string;
  role_key: string;
  allocation_pct: number;
}

export interface MatrixProject {
  id: string;
  name: string;
  health: string | null;
  priority: string | null;
  est_hours: number;
}

export interface MatrixPerson {
  name: string;
  role: string;
  role_key: string;
  team: string;
  capacity_hrs_week: number;
}

export interface MatrixData {
  projects: MatrixProject[];
  people: MatrixPerson[];
  assignments: Record<string, Record<string, { role_key: string; allocation_pct: number }>>;
}

export function useAssignmentMatrix() {
  return useQuery<MatrixData>({
    queryKey: ["assignments", "matrix"],
    queryFn: () => api.get("/assignments/matrix").then((r) => r.data),
  });
}

export function useProjectAssignments(projectId: string | null) {
  return useQuery<Assignment[]>({
    queryKey: ["assignments", projectId],
    queryFn: () =>
      api.get(`/assignments/${projectId}`).then((r) => r.data),
    enabled: !!projectId,
  });
}

export function useCreateAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectId,
      ...payload
    }: {
      projectId: string;
      person_name: string;
      role_key: string;
      allocation_pct: number;
    }) => api.post(`/assignments/${projectId}`, payload).then((r) => r.data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["assignments"] });
      qc.invalidateQueries({ queryKey: ["roster"] });
      qc.invalidateQueries({ queryKey: ["capacity"] });
    },
  });
}

export function useDeleteAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectId,
      person_name,
      role_key,
    }: {
      projectId: string;
      person_name: string;
      role_key: string;
    }) =>
      api
        .delete(`/assignments/${projectId}`, {
          data: { person_name, role_key },
        })
        .then((r) => r.data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["assignments"] });
      qc.invalidateQueries({ queryKey: ["roster"] });
      qc.invalidateQueries({ queryKey: ["capacity"] });
    },
  });
}
