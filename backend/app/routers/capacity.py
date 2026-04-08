"""Capacity router -- utilization summary + weekly heatmap."""

from collections import defaultdict
from datetime import date, timedelta
from typing import List

from fastapi import APIRouter, Depends, Query

from ..deps import get_capacity
from engines import CapacityEngine, ROLE_KEYS
from ..schemas.capacity import (
    HeatmapResponse,
    HeatmapRow,
    RoleUtilizationOut,
    UtilizationResponse,
)

router = APIRouter(prefix="/capacity", tags=["capacity"])


@router.get("/utilization", response_model=UtilizationResponse)
def utilization(engine: CapacityEngine = Depends(get_capacity)) -> UtilizationResponse:
    util = engine.compute_utilization()
    return UtilizationResponse(
        roles={k: RoleUtilizationOut.from_dataclass(v) for k, v in util.items()}
    )


@router.get("/heatmap", response_model=HeatmapResponse)
def heatmap(
    weeks: int = Query(26, ge=1, le=104),
    engine: CapacityEngine = Depends(get_capacity),
) -> HeatmapResponse:
    active = engine.active_projects
    supply = engine.compute_supply_by_role()

    today = date.today()
    days_to_monday = (7 - today.weekday()) % 7
    scan_start = today + timedelta(days=days_to_monday if days_to_monday else 0)

    demand_grid: "defaultdict[str, defaultdict[int, float]]" = defaultdict(
        lambda: defaultdict(float)
    )

    for project in active:
        timeline = engine.compute_weekly_demand_timeline(project)
        for role_key, snapshots in timeline.items():
            for snap in snapshots:
                delta_days = (snap.week_start - scan_start).days
                if delta_days < 0:
                    continue  # skip past weeks
                week_idx = delta_days // 7
                if week_idx < weeks:
                    demand_grid[role_key][week_idx] += snap.role_demand_hrs

    week_labels: List[str] = [
        (scan_start + timedelta(weeks=i)).strftime("%b %d") for i in range(weeks)
    ]

    rows: List[HeatmapRow] = []
    for role in ROLE_KEYS:
        role_supply = supply.get(role, 0.0)
        cells: List[float] = []
        for i in range(weeks):
            demand = demand_grid.get(role, {}).get(i, 0.0)
            util = demand / role_supply if role_supply > 0 else 0.0
            cells.append(round(util, 4))
        rows.append(
            HeatmapRow(
                role_key=role,
                supply_hrs_week=round(role_supply, 2),
                cells=cells,
            )
        )

    return HeatmapResponse(weeks=week_labels, rows=rows)


@router.get("/person-heatmap")
def person_heatmap(
    weeks: int = Query(26, ge=1, le=104),
    engine: CapacityEngine = Depends(get_capacity),
):
    """Per-person weekly utilization heatmap.

    For each team member, computes weekly demand from all their active
    projects (using even-split fallback for unassigned project-roles),
    divided by their personal project capacity.
    """
    data = engine._load()
    active = data["active_portfolio"]
    roster = data["roster"]
    assignments = data.get("assignments", [])

    today = date.today()
    days_to_monday = (7 - today.weekday()) % 7
    scan_start = today + timedelta(days=days_to_monday if days_to_monday else 0)

    # Build assignment index: (project_id, role_key) -> set of person names
    assigned_pr = defaultdict(set)
    person_assignments = defaultdict(list)  # person -> [(project_id, role_key, alloc_pct)]
    for a in assignments:
        assigned_pr[(a.project_id, a.role_key)].add(a.person_name.strip().lower())
        person_assignments[a.person_name.strip().lower()].append(
            (a.project_id, a.role_key, a.allocation_pct)
        )

    # Build weekly demand per project per role
    # project_role_weekly[project_id][role_key][week_idx] = demand_hrs
    project_role_weekly: dict = defaultdict(lambda: defaultdict(lambda: defaultdict(float)))
    for project in active:
        timeline = engine.compute_weekly_demand_timeline(project)
        for role_key, snapshots in timeline.items():
            for snap in snapshots:
                delta_days = (snap.week_start - scan_start).days
                if delta_days < 0:
                    continue  # skip past weeks
                week_idx = delta_days // 7
                if week_idx < weeks:
                    project_role_weekly[project.id][role_key][week_idx] += snap.role_demand_hrs

    # For each person, compute their weekly demand
    person_rows = []
    for member in roster:
        pkey = member.name.strip().lower()
        capacity = member.project_capacity_hrs
        if capacity <= 0:
            continue

        weekly_demand = [0.0] * weeks

        # Explicit assignments
        assigned_pids = set()
        for pid, rk, alloc_pct in person_assignments.get(pkey, []):
            assigned_pids.add(pid)
            for w in range(weeks):
                weekly_demand[w] += project_role_weekly[pid][rk].get(w, 0.0) * alloc_pct

        # No even-split fallback — person heatmap only shows demand
        # from explicit assignments. Keeps person view accurate.

        cells = [round(d / capacity, 4) if capacity > 0 else 0.0 for d in weekly_demand]

        person_rows.append({
            "name": member.name,
            "role_key": member.role_key,
            "role": member.role,
            "team": member.team or "Unassigned",
            "capacity_hrs_week": round(capacity, 2),
            "cells": cells,
        })

    # Sort by team, then name
    person_rows.sort(key=lambda r: (r["team"], r["name"]))

    week_labels: List[str] = [
        (scan_start + timedelta(weeks=i)).strftime("%b %d") for i in range(weeks)
    ]

    return {"weeks": week_labels, "people": person_rows}
