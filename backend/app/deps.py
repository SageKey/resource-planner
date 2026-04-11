"""Request-scoped dependency providers."""

from typing import Iterator

from fastapi import Depends, Query

from .config import settings

import sys
from pathlib import Path

# Add engines to path
_ENGINES_DIR = Path(__file__).resolve().parents[1]
if str(_ENGINES_DIR) not in sys.path:
    sys.path.insert(0, str(_ENGINES_DIR))

from engines import (
    SQLiteConnector,
    CapacityEngine,
    ScheduleOptimizer,
    DirectEngine,
    build_v2_assumptions,
)


def get_connector() -> Iterator[SQLiteConnector]:
    conn = SQLiteConnector(db_path=settings.db_path)
    try:
        yield conn
    finally:
        conn.close()


def get_capacity(
    phase_model: str = Query("v1", pattern="^(v1|v2)$"),
    conn: SQLiteConnector = Depends(get_connector),
) -> CapacityEngine:
    """Capacity engine dependency.

    Accepts an optional `?phase_model=v2` query parameter. When `v2`,
    the engine is constructed with a Simplified SDLC (3-phase) assumptions
    override. The v1 default (6-phase) path is unchanged — no query
    parameter, no override, same behavior as before.

    The v2 assumptions inherit supply_by_role and other non-phase fields
    from the live v1 assumptions (loaded from the database), so v2
    calculations still reflect the real roster. Only phase weights and
    role-phase efforts differ between the two models.
    """
    if phase_model == "v2":
        base_assumptions = conn.read_assumptions()
        override = build_v2_assumptions(base_assumptions=base_assumptions)
        return CapacityEngine(connector=conn, assumptions_override=override)
    return CapacityEngine(connector=conn)


def get_optimizer(conn: SQLiteConnector = Depends(get_connector)) -> ScheduleOptimizer:
    return ScheduleOptimizer(connector=conn)


def get_direct_engine(conn: SQLiteConnector = Depends(get_connector)) -> DirectEngine:
    """Direct Model (round 1) engine dependency.

    Independent from `get_capacity` — Direct Model does not accept a
    `phase_model` query param and does not consume RMAssumptions. The
    engine reads directly from the quarantined `direct_project_phases`
    and `direct_project_phase_roles` tables.
    """
    return DirectEngine(connector=conn)
