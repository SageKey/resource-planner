"""Pydantic schemas for scenario planning (what-if analysis)."""

from typing import Dict, List, Literal, Optional, Union

from pydantic import BaseModel, Field


class AddProjectPayload(BaseModel):
    id: Optional[str] = None
    name: str
    type: Optional[str] = None
    portfolio: Optional[str] = None
    sponsor: Optional[str] = None
    priority: Optional[str] = "Medium"
    start_date: str
    end_date: str
    est_hours: float = 0.0
    role_allocations: Dict[str, float] = Field(default_factory=dict)


class AddPersonPayload(BaseModel):
    name: str
    role_key: str
    role: Optional[str] = None
    team: Optional[str] = None
    vendor: Optional[str] = None
    classification: Optional[str] = None
    rate_per_hour: float = 0.0
    weekly_hrs_available: float = 40.0
    support_reserve_pct: float = 0.0


class AddProjectMod(BaseModel):
    type: Literal["add_project"]
    project: AddProjectPayload


class CancelProjectMod(BaseModel):
    type: Literal["cancel_project"]
    project_id: str


class ExcludePersonMod(BaseModel):
    type: Literal["exclude_person"]
    person_name: str


class AddPersonMod(BaseModel):
    type: Literal["add_person"]
    person: AddPersonPayload


class ShiftProjectMod(BaseModel):
    type: Literal["shift_project"]
    project_id: str
    new_start_date: Optional[str] = None
    new_end_date: Optional[str] = None


class ChangeAllocationMod(BaseModel):
    type: Literal["change_allocation"]
    project_id: str
    role_key: str
    allocation: float = Field(ge=0.0, le=1.0)


class ResizeProjectMod(BaseModel):
    type: Literal["resize_project"]
    project_id: str
    est_hours: float = Field(ge=0.0)


Modification = Union[
    AddProjectMod,
    CancelProjectMod,
    ExcludePersonMod,
    AddPersonMod,
    ShiftProjectMod,
    ChangeAllocationMod,
    ResizeProjectMod,
]


class ScenarioEvaluateRequest(BaseModel):
    name: Optional[str] = None
    modifications: List[Modification] = Field(default_factory=list)


class RoleUtilSnapshot(BaseModel):
    role_key: str
    supply_hrs_week: float
    demand_hrs_week: float
    utilization_pct: float
    status: str


class UtilizationSide(BaseModel):
    roles: Dict[str, RoleUtilSnapshot]


class ScenarioDelta(BaseModel):
    role_key: str
    baseline_pct: float
    scenario_pct: float
    delta_pct: float
    baseline_status: str
    scenario_status: str
    status_changed: bool


class ScenarioSummary(BaseModel):
    headline: str
    became_over: List[str]
    became_stretched: List[str]
    became_unstaffed: List[str]
    became_better: List[str]


class ScenarioEvaluateResponse(BaseModel):
    baseline: UtilizationSide
    scenario: UtilizationSide
    deltas: List[ScenarioDelta]
    summary: ScenarioSummary


class SchedulePortfolioRequest(BaseModel):
    max_util_pct: Optional[float] = Field(None, ge=0.1, le=2.0)
    horizon_weeks: int = Field(52, ge=4, le=156)
    exclude_ids: List[str] = Field(default_factory=list)
    modifications: List[Modification] = Field(default_factory=list)


class ScheduledProject(BaseModel):
    project_id: str
    project_name: str
    priority: str
    est_hours: float
    health: str
    suggested_start: Optional[str] = None
    suggested_end: Optional[str] = None
    duration_weeks: float
    wait_weeks: Optional[int] = None
    bottleneck_role: Optional[str] = None
    can_start_now: bool


class InFlightProject(BaseModel):
    project_id: str
    project_name: str
    priority: str
    est_hours: float
    health: str
    pct_complete: float
    start_date: Optional[str] = None
    end_date: Optional[str] = None


class SchedulePortfolioResponse(BaseModel):
    max_util_pct: float
    horizon_weeks: int
    in_flight: List[InFlightProject]
    projects: List[ScheduledProject]
    can_start_now_count: int
    waiting_count: int
    infeasible_count: int
    bottleneck_roles: Dict[str, int]
