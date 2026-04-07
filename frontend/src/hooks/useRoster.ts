import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { TeamMember, PersonDemand } from "@/types/roster";

export interface RosterMemberPayload {
  name: string;
  role: string;
  role_key: string;
  team?: string | null;
  vendor?: string | null;
  classification?: string | null;
  rate_per_hour: number;
  weekly_hrs_available: number;
  support_reserve_pct: number;
  include_in_capacity: boolean;
}

export function useRoster() {
  return useQuery<TeamMember[]>({
    queryKey: ["roster"],
    queryFn: () => api.get("/roster/").then((r) => r.data),
  });
}

export function usePersonDemand() {
  return useQuery<PersonDemand[]>({
    queryKey: ["roster", "demand"],
    queryFn: () => api.get("/roster/demand").then((r) => r.data),
  });
}

export function useCreateMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: RosterMemberPayload) => {
      const { data } = await api.post<TeamMember>("/roster/", payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roster"] });
      qc.invalidateQueries({ queryKey: ["capacity"] });
    },
  });
}

export function useUpdateMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      originalName,
      payload,
    }: {
      originalName: string;
      payload: RosterMemberPayload;
    }) => {
      const { data } = await api.put<TeamMember>(
        `/roster/${encodeURIComponent(originalName)}`,
        payload,
      );
      return data;
    },
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
