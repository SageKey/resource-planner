import { useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import type {
  ScenarioEvaluateResponse,
  SchedulePortfolioResponse,
  Modification,
} from "@/types/scenario";

export function useEvaluateScenario() {
  return useMutation<
    ScenarioEvaluateResponse,
    Error,
    { modifications: Modification[] }
  >({
    mutationFn: (payload) =>
      api.post("/scenarios/evaluate", payload).then((r) => r.data),
  });
}

export function useSchedulePortfolio() {
  return useMutation<
    SchedulePortfolioResponse,
    Error,
    {
      max_util_pct?: number;
      horizon_weeks?: number;
      exclude_ids?: string[];
      modifications?: Modification[];
    }
  >({
    mutationFn: (payload) =>
      api.post("/scenarios/schedule-portfolio", payload).then((r) => r.data),
  });
}
