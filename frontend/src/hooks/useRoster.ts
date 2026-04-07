import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { TeamMemberOut, PersonDemandOut } from "@/types/roster";

export function useRoster() {
  return useQuery<TeamMemberOut[]>({
    queryKey: ["roster"],
    queryFn: () => api.get("/roster/").then((r) => r.data),
  });
}

export function usePersonDemand() {
  return useQuery<PersonDemandOut[]>({
    queryKey: ["roster", "demand"],
    queryFn: () => api.get("/roster/demand").then((r) => r.data),
  });
}

export function useCreateMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post("/roster/", data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roster"] });
      qc.invalidateQueries({ queryKey: ["capacity"] });
    },
  });
}

export function useUpdateMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown> & { name: string }) =>
      api.put(`/roster/${encodeURIComponent(data.name)}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roster"] });
      qc.invalidateQueries({ queryKey: ["capacity"] });
    },
  });
}

export function useDeleteMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api.delete(`/roster/${encodeURIComponent(name)}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roster"] });
      qc.invalidateQueries({ queryKey: ["capacity"] });
    },
  });
}
