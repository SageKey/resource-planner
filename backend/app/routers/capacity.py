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


@router.get("/heatmap-detail")
def heatmap_detail(
    role_key: str = Query(...),
    week_idx: int = Query(..., ge=0),
    engine: CapacityEngine = Depends(get_capacity),
):
    """Return project-by-project breakdown for a specific role + week cell."""
    active = engine.active_projects
    supply = engine.compute_supply_by_role()

    today = date.today()
    days_to_monday = (7 - today.weekday()) % 7
    scan_start = today + timedelta(days=days_to_monday if days_to_monday else 0)
    week_start = scan_start + timedelta(weeks=week_idx)
    week_label = week_start.strftime("%b %d")

    projects = []
    total_demand = 0.0

    for project in active:
        timeline = engine.compute_weekly_demand_timeline(project)
        snapshots = timeline.get(role_key, [])
        for snap in snapshots:
            delta_days = (snap.week_start - scan_start).days
            if delta_days < 0:
                continue
            idx = delta_days // 7
            if idx == week_idx and snap.role_demand_hrs > 0.01:
                projects.append({
                    "project_id": project.id,
                    "project_name": project.name,
                    "phase": snap.phase_name,
                    "demand_hrs": round(snap.role_demand_hrs, 2),
                    "est_hours": project.est_hours,
                    "pct_complete": project.pct_complete,
                    "role_alloc": project.role_allocations.get(role_key, 0),
                })
                total_demand += snap.role_demand_hrs

    role_supply = supply.get(role_key, 0.0)
    util = total_demand / role_supply if role_supply > 0 else 0.0

    projects.sort(key=lambda p: -p["demand_hrs"])

    return {
        "role_key": role_key,
        "week_idx": week_idx,
        "week_label": week_label,
        "supply_hrs": round(role_supply, 1),
        "total_demand_hrs": round(total_demand, 1),
        "utilization_pct": round(util, 4),
        "projects": projects,
    }


@router.get("/assignment-coverage")
def assignment_coverage(
    engine: CapacityEngine = Depends(get_capacity),
):
    """Per-role breakdown of assigned vs unassigned demand.

    For each role, computes:
    - total_demand: all project demand for this role
    - assigned_demand: demand from projects where someone is explicitly assigned
    - unassigned_demand: demand from projects with no assignment for this role
    """
    data = engine._load()
    active = data["active_portfolio"]
    assignments = data.get("assignments", [])

    # Build set of (project_id, role_key) that have explicit assignments
    assigned_project_roles = set()
    for a in assignments:
        assigned_project_roles.add((a.project_id, a.role_key))

    # Compute demand per project per role
    role_assigned = defaultdict(float)
    role_unassigned = defaultdict(float)

    for project in active:
        for demand in engine.compute_project_role_demand(project):
            key = (project.id, demand.role_key)
            if key in assigned_project_roles:
                role_assigned[demand.role_key] += demand.weekly_hours
            else:
                role_unassigned[demand.role_key] += demand.weekly_hours

    supply = engine.compute_supply_by_role()
    result = {}
    all_roles = set(role_assigned.keys()) | set(role_unassigned.keys()) | set(supply.keys())

    for role_key in sorted(all_roles):
        s = supply.get(role_key, 0)
        a = role_assigned.get(role_key, 0)
        u = role_unassigned.get(role_key, 0)
        result[role_key] = {
            "supply_hrs_week": round(s, 1),
            "assigned_hrs_week": round(a, 1),
            "unassigned_hrs_week": round(u, 1),
            "total_demand_hrs_week": round(a + u, 1),
            "assigned_pct": round(a / s, 4) if s > 0 else 0,
            "unassigned_pct": round(u / s, 4) if s > 0 else 0,
        }

    return result


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
