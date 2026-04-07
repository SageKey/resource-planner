import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { ProjectOut } from "@/types/project";

export function usePortfolio(activeOnly = false) {
  return useQuery<ProjectOut[]>({
    queryKey: ["portfolio", { activeOnly }],
    queryFn: () =>
      api
        .get("/portfolio/", { params: { active_only: activeOnly } })
        .then((r) => r.data),
  });
}

export function useProject(projectId: string) {
  return useQuery<ProjectOut>({
    queryKey: ["portfolio", projectId],
    queryFn: () => api.get(`/portfolio/${projectId}`).then((r) => r.data),
    enabled: !!projectId,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post("/portfolio/", data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["portfolio"] }),
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: Record<string, unknown> & { id: string }) =>
      api.patch(`/portfolio/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["portfolio"] });
      qc.invalidateQueries({ queryKey: ["capacity"] });
    },
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/portfolio/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["portfolio"] });
      qc.invalidateQueries({ queryKey: ["capacity"] });
    },
  });
}
