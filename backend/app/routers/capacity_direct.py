"""Direct Model (round 1) capacity router.

URL prefix: `/direct` → full path `/api/v1/direct/*`

Endpoints intentionally mirror the shape of the v1 `/capacity/*` endpoints
so the shared frontend components (UtilizationBars, HeatmapGrid,
PersonHeatmapGrid) can consume them without modification. The Direct
engine does all the heavy lifting; this router is just a thin adapter.
"""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query

from ..deps import get_direct_engine
from ..schemas.capacity import (
    HeatmapResponse,
    HeatmapRow,
    RoleDemandOut,
    RoleUtilizationOut,
    UtilizationResponse,
)
from ..schemas.capacity_direct import DirectPhaseOut, DirectProjectPlanOut
from engines import DirectEngine

router = APIRouter(prefix="/direct", tags=["direct"])


# ---------------------------------------------------------------------------
# Utilization — current week across all Direct-seeded projects
# ---------------------------------------------------------------------------
@router.get("/capacity/utilization", response_model=UtilizationResponse)
def direct_utilization(
    engine: DirectEngine = Depends(get_direct_engine),
) -> UtilizationResponse:
    util = engine.compute_utilization()
    roles = {
        role_key: RoleUtilizationOut(
            role_key=info["role_key"],
            supply_hrs_week=info["supply_hrs_week"],
            demand_hrs_week=info["demand_hrs_week"],
            utilization_pct=info["utilization_pct"],
            status=info["status"],
            demand_breakdown=[
                RoleDemandOut(
                    project_id=b["project_id"],
                    project_name=b["project_name"],
                    role_key=b["role_key"],
                    role_alloc_pct=b["role_alloc_pct"],
                    weekly_hours=b["weekly_hours"],
                )
                for b in info.get("demand_breakdown", [])
            ],
        )
        for role_key, info in util.items()
    }
    return UtilizationResponse(roles=roles)


# ---------------------------------------------------------------------------
# Heatmap — forward 26-week role demand grid
# ---------------------------------------------------------------------------
@router.get("/capacity/heatmap", response_model=HeatmapResponse)
def direct_heatmap(
    weeks: int = Query(26, ge=1, le=104),
    engine: DirectEngine = Depends(get_direct_engine),
) -> HeatmapResponse:
    data = engine.compute_heatmap(weeks=weeks)
    rows: List[HeatmapRow] = [
        HeatmapRow(
            role_key=r["role_key"],
            supply_hrs_week=r["supply_hrs_week"],
            cells=r["cells"],
        )
        for r in data["rows"]
    ]
    return HeatmapResponse(weeks=data["weeks"], rows=rows)


# ---------------------------------------------------------------------------
# Person heatmap
# ---------------------------------------------------------------------------
@router.get("/capacity/person-heatmap")
def direct_person_heatmap(
    weeks: int = Query(26, ge=1, le=104),
    engine: DirectEngine = Depends(get_direct_engine),
):
    """Shape matches the v1 /capacity/person-heatmap response so the
    existing PersonHeatmapGrid + TeamAllocationCards components render
    it with zero modification. Round 1 doesn't reuse TeamAllocationCards
    (v2-specific), but PersonHeatmapGrid is phase-agnostic."""
    return engine.compute_person_heatmap(weeks=weeks)


# ---------------------------------------------------------------------------
# Project plan — the new Direct-specific read
# ---------------------------------------------------------------------------
@router.get("/projects/{project_id}/plan", response_model=DirectProjectPlanOut)
def direct_project_plan(
    project_id: str,
    engine: DirectEngine = Depends(get_direct_engine),
) -> DirectProjectPlanOut:
    plan = engine.get_project_plan(project_id)
    if plan is None:
        raise HTTPException(
            status_code=404,
            detail=f"no Direct Model plan seeded for project {project_id}",
        )

    # Pull start/end from the legacy projects row for display context
    data = engine._load()
    project = data["by_id"].get(project_id)
    start_str = project.start_date.isoformat() if project and project.start_date else None
    end_str = project.end_date.isoformat() if project and project.end_date else None

    return DirectProjectPlanOut(
        project_id=plan.project_id,
        project_name=plan.project_name,
        total_duration_weeks=round(plan.total_duration_weeks, 2),
        total_hours=plan.total_hours,
        phases=[
            DirectPhaseOut(
                name=p.name,
                order=p.order,
                duration_weeks=p.duration_weeks,
                role_weekly_hours=p.role_weekly_hours,
            )
            for p in plan.phases
        ],
        role_totals=plan.role_totals(),
        start_date=start_str,
        end_date=end_str,
    )


# ---------------------------------------------------------------------------
# List seeded projects — lets the frontend discover what's available
# ---------------------------------------------------------------------------
@router.get("/projects")
def direct_projects(
    engine: DirectEngine = Depends(get_direct_engine),
):
    """Return all projects that have a Direct Model plan, minimal shape."""
    plans = engine.list_plans()
    return [
        {
            "project_id": p.project_id,
            "project_name": p.project_name,
            "total_duration_weeks": round(p.total_duration_weeks, 2),
            "total_hours": p.total_hours,
            "phase_count": len(p.phases),
        }
        for p in plans
    ]
