"""Pydantic response models for projects."""

from datetime import date
from typing import Dict, List, Optional

from pydantic import BaseModel, ConfigDict

from engines import Project


class ProjectOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    type: Optional[str] = None
    portfolio: Optional[str] = None
    sponsor: Optional[str] = None
    health: Optional[str] = None
    pct_complete: float = 0.0
    priority: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    actual_end: Optional[date] = None
    functional_spec_due: Optional[date] = None
    functional_spec_completed: Optional[date] = None
    technical_spec_due: Optional[date] = None
    technical_spec_completed: Optional[date] = None
    team: Optional[str] = None
    pm: Optional[str] = None
    ba: Optional[str] = None
    functional_lead: Optional[str] = None
    technical_lead: Optional[str] = None
    developer_lead: Optional[str] = None
    tshirt_size: Optional[str] = None
    est_hours: float = 0.0
    role_allocations: Dict[str, float] = {}
    notes: Optional[str] = None
    sort_order: Optional[int] = None
    current_phase: Optional[str] = None
    is_active: bool = True
    duration_weeks: Optional[float] = None

    @classmethod
    def from_dataclass(cls, p: Project) -> "ProjectOut":
        return cls(
            id=p.id,
            name=p.name,
            type=p.type,
            portfolio=p.portfolio,
            sponsor=p.sponsor,
            health=p.health,
            pct_complete=p.pct_complete,
            priority=p.priority,
            start_date=p.start_date,
            end_date=p.end_date,
            actual_end=p.actual_end,
            functional_spec_due=getattr(p, "functional_spec_due", None),
            functional_spec_completed=getattr(p, "functional_spec_completed", None),
            technical_spec_due=getattr(p, "technical_spec_due", None),
            technical_spec_completed=getattr(p, "technical_spec_completed", None),
            team=p.team,
            pm=p.pm,
            ba=p.ba,
            functional_lead=p.functional_lead,
            technical_lead=p.technical_lead,
            developer_lead=p.developer_lead,
            tshirt_size=p.tshirt_size,
            est_hours=p.est_hours,
            role_allocations=p.role_allocations or {},
            notes=p.notes,
            sort_order=p.sort_order,
            current_phase=getattr(p, "current_phase", None),
            is_active=p.is_active,
            duration_weeks=p.duration_weeks,
        )


ProjectListItem = ProjectOut


class ProjectCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    name: str
    type: Optional[str] = None
    portfolio: Optional[str] = None
    sponsor: Optional[str] = None
    health: Optional[str] = None
    pct_complete: float = 0.0
    priority: Optional[str] = "Medium"
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    functional_spec_due: Optional[date] = None
    functional_spec_completed: Optional[date] = None
    technical_spec_due: Optional[date] = None
    technical_spec_completed: Optional[date] = None
    pm: Optional[str] = None
    tshirt_size: Optional[str] = None
    est_hours: float = 0.0
    notes: Optional[str] = None
    current_phase: Optional[str] = None
    role_allocations: Optional[Dict[str, float]] = None


class ProjectUpdate(BaseModel):
    model_config = ConfigDict(extra="ignore")

    name: Optional[str] = None
    type: Optional[str] = None
    portfolio: Optional[str] = None
    sponsor: Optional[str] = None
    health: Optional[str] = None
    pct_complete: Optional[float] = None
    priority: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    actual_end: Optional[date] = None
    functional_spec_due: Optional[date] = None
    functional_spec_completed: Optional[date] = None
    technical_spec_due: Optional[date] = None
    technical_spec_completed: Optional[date] = None
    team: Optional[str] = None
    pm: Optional[str] = None
    ba: Optional[str] = None
    functional_lead: Optional[str] = None
    technical_lead: Optional[str] = None
    developer_lead: Optional[str] = None
    tshirt_size: Optional[str] = None
    est_hours: Optional[float] = None
    notes: Optional[str] = None
    current_phase: Optional[str] = None
    role_allocations: Optional[Dict[str, float]] = None


class PhaseHours(BaseModel):
    phase: str
    weekly_hours: float


class ProjectRoleDemandOut(BaseModel):
    role_key: str
    role_alloc_pct: float
    weekly_hours: float
    phase_breakdown: List[PhaseHours] = []


class ProjectDemandResponse(BaseModel):
    project_id: str
    duration_weeks: float
    total_est_hours: float
    roles: List[ProjectRoleDemandOut]


class ProjectTimelineWeek(BaseModel):
    week_start: str
    week_end: str
    phase: str
    demand_hrs: float


class ProjectTimelineResponse(BaseModel):
    project_id: str
    roles: Dict[str, List[ProjectTimelineWeek]]
