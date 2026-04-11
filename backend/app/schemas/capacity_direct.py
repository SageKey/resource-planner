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


class DirectResourceRow(BaseModel):
    """One row per (role, assignee) for a single Direct project.

    When a role has no assignee, `person_name` is null and the capacity
    / % fields are null too. When a role has multiple assignees (rare),
    they each get a row and their allocation_pct tells you how the
    role's weekly hours are split across them.
    """
    role_key: str
    person_name: Optional[str] = None
    person_capacity_hrs_week: Optional[float] = None
    allocation_pct: Optional[float] = None
    current_phase_hrs_week: float
    current_phase_name: Optional[str] = None
    peak_hrs_week: float
    lifetime_hrs: float
    current_pct_of_capacity: Optional[float] = None
    peak_pct_of_capacity: Optional[float] = None


class DirectProjectPlanOut(BaseModel):
    project_id: str
    project_name: str
    total_duration_weeks: float
    total_hours: float
    phases: List[DirectPhaseOut]
    role_totals: Dict[str, float]  # role_key -> total hours over lifetime
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    resources: List[DirectResourceRow] = []
