"""Assignments router — manage person-to-project allocations."""

from typing import Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from ..deps import get_connector
from engines import SQLiteConnector

router = APIRouter(prefix="/assignments", tags=["assignments"])


class AssignmentOut(BaseModel):
    project_id: str
    person_name: str
    role_key: str
    allocation_pct: float


class AssignmentWrite(BaseModel):
    person_name: str
    role_key: str
    allocation_pct: float = Field(default=1.0, ge=0.0, le=1.0)


class AssignmentDelete(BaseModel):
    person_name: str
    role_key: str


@router.get("/matrix")
def assignment_matrix(
    conn: SQLiteConnector = Depends(get_connector),
):
    """Return all data needed to render the assignment matrix:
    active projects, roster members, and all assignments."""
    portfolio = conn.read_active_portfolio()
    roster = conn.read_roster()
    assignments = conn.read_assignments(active_only=True)

    # Build assignment lookup: {project_id: {person_name: {role_key, allocation_pct}}}
    assignment_map: Dict[str, Dict[str, dict]] = {}
    for a in assignments:
        if a.project_id not in assignment_map:
            assignment_map[a.project_id] = {}
        assignment_map[a.project_id][a.person_name] = {
            "role_key": a.role_key,
            "allocation_pct": a.allocation_pct,
        }

    projects = [
        {
            "id": p.id,
            "name": p.name,
            "health": p.health,
            "priority": p.priority,
            "est_hours": p.est_hours,
        }
        for p in portfolio
    ]

    people = [
        {
            "name": m.name,
            "role": m.role,
            "role_key": m.role_key,
            "team": m.team or "Unassigned",
            "capacity_hrs_week": m.project_capacity_hrs,
        }
        for m in roster
        if m.include_in_capacity
    ]

    return {
        "projects": projects,
        "people": people,
        "assignments": assignment_map,
    }


@router.get("/{project_id}", response_model=List[AssignmentOut])
def list_assignments(
    project_id: str,
    conn: SQLiteConnector = Depends(get_connector),
) -> List[AssignmentOut]:
    assignments = conn.read_project_assignments(project_id)
    return [
        AssignmentOut(
            project_id=a.project_id,
            person_name=a.person_name,
            role_key=a.role_key,
            allocation_pct=a.allocation_pct,
        )
        for a in assignments
    ]


@router.post("/{project_id}", response_model=AssignmentOut, status_code=201)
def create_assignment(
    project_id: str,
    payload: AssignmentWrite,
    conn: SQLiteConnector = Depends(get_connector),
) -> AssignmentOut:
    err = conn.save_assignment(
        project_id=project_id,
        person_name=payload.person_name,
        role_key=payload.role_key,
        allocation_pct=payload.allocation_pct,
    )
    if err:
        raise HTTPException(status_code=400, detail=err)
    return AssignmentOut(
        project_id=project_id,
        person_name=payload.person_name,
        role_key=payload.role_key,
        allocation_pct=payload.allocation_pct,
    )


@router.delete("/{project_id}", status_code=204)
def delete_assignment(
    project_id: str,
    payload: AssignmentDelete,
    conn: SQLiteConnector = Depends(get_connector),
) -> None:
    err = conn.delete_assignment(project_id, payload.person_name, payload.role_key)
    if err:
        raise HTTPException(status_code=400, detail=err)
    return None
