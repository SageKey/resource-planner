import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export interface SdlcModel {
  phase_weights: Record<string, number>;
  role_phase_efforts: Record<string, Record<string, number>>;
}

export function useSdlc() {
  return useQuery<SdlcModel>({
    queryKey: ["sdlc"],
    queryFn: () => api.get("/sdlc/").then((r) => r.data),
  });
}

export function useUpdatePhaseWeights() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (weights: Record<string, number>) =>
      api.put("/sdlc/phase-weights", { weights }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sdlc"] });
      qc.invalidateQueries({ queryKey: ["capacity"] });
    },
  });
}

export function useUpdateRoleEfforts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (efforts: Record<string, Record<string, number>>) =>
      api.put("/sdlc/role-efforts", { efforts }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sdlc"] });
      qc.invalidateQueries({ queryKey: ["capacity"] });
    },
  });
}

export function useResetSdlcDefaults() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post("/sdlc/reset-defaults").then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sdlc"] });
      qc.invalidateQueries({ queryKey: ["capacity"] });
    },
  });
}
