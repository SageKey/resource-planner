"""Pydantic response models for the Direct Model (round 1) endpoints.

The utilization, heatmap, and person-heatmap responses are intentionally
shaped the same as `capacity.py` so the existing frontend components
(UtilizationBars, HeatmapGrid, PersonHeatmapGrid) render them with no
changes. The project plan response is new — Direct Model has data
structures v1/v2 don't.
"""

from typing import Dict, List, Optional

from pydantic import BaseModel


class DirectPhaseOut(BaseModel):
    name: str
    order: int
    duration_weeks: float
    role_weekly_hours: Dict[str, float]


class DirectProjectPlanOut(BaseModel):
    project_id: str
    project_name: str
    total_duration_weeks: float
    total_hours: float
    phases: List[DirectPhaseOut]
    role_totals: Dict[str, float]  # role_key -> total hours over lifetime
    start_date: Optional[str] = None
    end_date: Optional[str] = None
