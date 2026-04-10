"""Resource Planner Python engines.

Re-exports the core classes so backend code can import from `engines`.
"""

from .models import (
    Project,
    TeamMember,
    RMAssumptions,
    ProjectAssignment,
    ROLE_KEYS,
    SDLC_PHASES,
    SDLC_PHASES_V2,
    DEFAULT_PHASE_WEIGHTS_V2,
    DEFAULT_ROLE_PHASE_EFFORTS_V2,
    HEALTH_OPTIONS,
    PRIORITY_OPTIONS,
    TSHIRT_OPTIONS,
    TYPE_OPTIONS,
    clean_health,
)
from .sqlite_connector import SQLiteConnector
from .capacity_engine import (
    CapacityEngine,
    RoleDemand,
    RoleUtilization,
    WeeklySnapshot,
    _utilization_status,
    build_v2_assumptions,
)
from .schedule_optimizer import ScheduleOptimizer

__all__ = [
    "SQLiteConnector",
    "CapacityEngine",
    "RoleDemand",
    "RoleUtilization",
    "WeeklySnapshot",
    "_utilization_status",
    "build_v2_assumptions",
    "ScheduleOptimizer",
    "Project",
    "TeamMember",
    "RMAssumptions",
    "ProjectAssignment",
    "ROLE_KEYS",
    "SDLC_PHASES",
    "SDLC_PHASES_V2",
    "DEFAULT_PHASE_WEIGHTS_V2",
    "DEFAULT_ROLE_PHASE_EFFORTS_V2",
    "HEALTH_OPTIONS",
    "PRIORITY_OPTIONS",
    "TSHIRT_OPTIONS",
    "TYPE_OPTIONS",
    "clean_health",
]
