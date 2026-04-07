"""Explain router — show-your-work calculation breakdowns for scheduling.

Returns detailed, human-readable explanations of how the capacity engine
computes demand, supply, duration, and suggested dates for a project.
Designed to help PMs and leadership validate the math.
"""

from collections import defaultdict
from datetime import date, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from ..deps import get_capacity, get_connector
from engines import CapacityEngine, SQLiteConnector, ROLE_KEYS, SDLC_PHASES

router = APIRouter(prefix="/explain", tags=["explain"])


class RoleDetail(BaseModel):
    role_key: str
    allocation_pct: float
    total_role_hours: float
    avg_weekly_demand: float
    supply_hrs_week: float
    existing_demand_hrs_week: float
    available_hrs_week: float
    utilization_if_added: float


class PhaseDetail(BaseModel):
    phase: str
    weight_pct: float
    duration_days: float
    bottleneck_role: Optional[str]
    roles: list[dict]


class ScheduleExplanation(BaseModel):
    project_id: str
    project_name: str
    est_hours: float
    duration_weeks: float
    suggested_start: Optional[str]
    suggested_end: Optional[str]
    wait_weeks: Optional[int]
    bottleneck_role: Optional[str]

    # The math
    formula: str
    demand_formula: str
    supply_summary: dict[str, dict]
    role_details: list[RoleDetail]
    phase_breakdown: list[PhaseDetail]
    capacity_at_suggested_start: list[dict]
    reasoning: list[str]


@router.get("/project/{project_id}")
def explain_project_schedule(
    project_id: str,
    engine: CapacityEngine = Depends(get_capacity),
    conn: SQLiteConnector = Depends(get_connector),
):
    """Show the complete calculation breakdown for how a project's
    suggested start date was determined."""

    # Find the project
    project = None
    for p in conn.read_portfolio():
        if p.id == project_id:
            project = p
            break
    if not project:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")

    assumptions = engine.assumptions
    supply = engine.compute_supply_by_role()
    role_phase_efforts = assumptions.role_phase_efforts
    phase_weights = assumptions.sdlc_phase_weights

    active_roles = {k: v for k, v in project.role_allocations.items()
                    if v > 0 and k in role_phase_efforts}

    if not active_roles or project.est_hours <= 0:
        return {
            "project_id": project.id,
            "project_name": project.name,
            "est_hours": project.est_hours,
            "reasoning": ["Project has no hours or no role allocations — nothing to schedule."],
        }

    # Duration estimate
    duration_result = engine.estimate_duration(
        project.est_hours, active_roles, max_util_pct=0.85
    )

    # Suggest dates
    suggest_result = engine.suggest_dates(
        project.est_hours, active_roles, max_util_pct=0.85,
        exclude_project_id=project.id,
    )

    # Build role detail
    role_details = []
    for role_key, alloc_pct in sorted(active_roles.items()):
        role_hours = project.est_hours * alloc_pct
        avg_effort = assumptions.role_avg_efforts.get(role_key, 0)
        duration_weeks = duration_result["total_duration_days"] / 5.0
        weekly_demand = (project.est_hours * alloc_pct * avg_effort / max(duration_weeks, 1))

        role_supply = supply.get(role_key, 0)

        # Get existing demand from other active projects
        existing_demand = 0
        for other in engine.active_projects:
            if other.id == project.id:
                continue
            for d in engine.compute_project_role_demand(other):
                if d.role_key == role_key:
                    existing_demand += d.weekly_hours

        available = role_supply - existing_demand
        util_if_added = (existing_demand + weekly_demand) / role_supply if role_supply > 0 else 0

        role_details.append(RoleDetail(
            role_key=role_key,
            allocation_pct=round(alloc_pct * 100, 1),
            total_role_hours=round(role_hours, 1),
            avg_weekly_demand=round(weekly_demand, 1),
            supply_hrs_week=round(role_supply, 1),
            existing_demand_hrs_week=round(existing_demand, 1),
            available_hrs_week=round(available, 1),
            utilization_if_added=round(util_if_added, 3),
        ))

    # Phase breakdown
    phase_breakdown = []
    for phase_info in duration_result.get("phases", []):
        phase_breakdown.append(PhaseDetail(
            phase=phase_info["phase"],
            weight_pct=round(phase_weights.get(phase_info["phase"], 0) * 100, 1),
            duration_days=phase_info["duration_days"],
            bottleneck_role=phase_info.get("bottleneck_role"),
            roles=phase_info.get("roles", []),
        ))

    # Supply summary
    supply_summary = {}
    for role_key in ROLE_KEYS:
        s = supply.get(role_key, 0)
        if s > 0:
            supply_summary[role_key] = {
                "supply_hrs_week": round(s, 1),
                "headcount": assumptions.supply_by_role.get(role_key, {}).get("headcount", 0),
            }

    # Build reasoning steps
    reasoning = []
    reasoning.append(
        f"Project '{project.name}' has {project.est_hours} estimated hours."
    )
    reasoning.append(
        f"Active roles: {', '.join(f'{k} ({v*100:.0f}%)' for k, v in active_roles.items())}."
    )
    reasoning.append(
        f"Estimated duration: {duration_result['total_duration_days']:.0f} business days "
        f"({duration_result['total_duration_days']/5:.1f} weeks)."
    )

    # Bottleneck info
    bottleneck_phases = [p for p in phase_breakdown if p.bottleneck_role]
    if bottleneck_phases:
        bottleneck_counts = defaultdict(int)
        for p in bottleneck_phases:
            if p.bottleneck_role:
                bottleneck_counts[p.bottleneck_role] += 1
        top_bottleneck = max(bottleneck_counts, key=bottleneck_counts.get)
        reasoning.append(
            f"Bottleneck role across phases: {top_bottleneck} "
            f"(constrains {bottleneck_counts[top_bottleneck]} of {len(SDLC_PHASES)} phases)."
        )

    # Scheduling result
    if suggest_result.get("suggested_start"):
        reasoning.append(
            f"Earliest feasible start: {suggest_result['suggested_start']} "
            f"({suggest_result.get('earliest_available', '')})."
        )
        reasoning.append(
            f"Projected end: {suggest_result['suggested_end']}."
        )
    else:
        reasoning.append(
            suggest_result.get("error", "No feasible start found within the planning horizon.")
        )
        if suggest_result.get("suggestion"):
            reasoning.append(suggest_result["suggestion"])

    # Demand formula explanation
    demand_formula = (
        "Weekly Demand (per role) = Est.Hours × Role% × Avg.Phase.Effort / Duration.Weeks. "
        "Avg.Phase.Effort = weighted average of role's effort across all SDLC phases "
        "(e.g., a Developer is 0% in discovery but 50% in build)."
    )

    formula = (
        "Duration is estimated bottom-up: for each SDLC phase, compute hours per role, "
        "divide by one person's available capacity → weeks needed. The bottleneck role "
        "(longest weeks) sets the phase duration. Total = sum of all phase durations."
    )

    return ScheduleExplanation(
        project_id=project.id,
        project_name=project.name,
        est_hours=project.est_hours,
        duration_weeks=round(duration_result["total_duration_days"] / 5, 1),
        suggested_start=suggest_result.get("suggested_start"),
        suggested_end=suggest_result.get("suggested_end"),
        wait_weeks=suggest_result.get("start_offset_weeks"),
        bottleneck_role=None,
        formula=formula,
        demand_formula=demand_formula,
        supply_summary=supply_summary,
        role_details=role_details,
        phase_breakdown=phase_breakdown,
        capacity_at_suggested_start=suggest_result.get("role_availability_at_start", []),
        reasoning=reasoning,
    )


@router.get("/formulas")
def explain_formulas():
    """Return the core formulas used by the capacity engine — a reference
    doc PMs can share with leadership."""
    return {
        "demand": {
            "formula": "Weekly Demand = Est.Hours × Role% × Avg.Phase.Effort / Duration.Weeks",
            "explanation": (
                "For each role on a project, multiply total project hours by that role's "
                "allocation percentage, then by the role's average effort across SDLC phases, "
                "divided by the project duration in weeks. This gives the weekly hours of "
                "demand that role places on the team."
            ),
            "example": (
                "A 640-hour project with Developer at 75% and avg effort 0.325: "
                "640 × 0.75 × 0.325 / 20 weeks = 7.8 hrs/week developer demand."
            ),
        },
        "supply": {
            "formula": "Supply = Weekly.Hrs.Available × (1 - Support.Reserve%)",
            "explanation": (
                "Each team member's available project hours = their weekly hours minus "
                "the portion reserved for support/break-fix. Supply per role = sum across "
                "all team members in that role who are included in capacity."
            ),
        },
        "utilization": {
            "formula": "Utilization% = Total.Demand / Total.Supply",
            "explanation": (
                "Sum all project demands for a role, divide by that role's total supply. "
                "< 80% = green (healthy), 80-99% = yellow (stretched), >= 100% = red (over capacity)."
            ),
        },
        "duration_estimate": {
            "formula": "Phase.Duration = max(Role.Hours.In.Phase / Role.Capacity) across all roles",
            "explanation": (
                "For each SDLC phase, compute how many hours each role needs in that phase, "
                "then divide by one person's capacity for that role. The role that takes the "
                "longest is the bottleneck — it sets the phase duration. "
                "Total project duration = sum of all 6 phase durations."
            ),
        },
        "scheduling": {
            "formula": "Earliest.Start = first week where all roles stay under 85% utilization",
            "explanation": (
                "The scheduler scans forward week by week. For each candidate start date, "
                "it simulates adding this project's phase-by-phase demand onto the existing "
                "load. The first week where no role exceeds 85% utilization = the suggested start. "
                "Projects are scheduled in priority order (Highest first), and each placed "
                "project's demand is stamped into the grid before the next project is considered."
            ),
        },
        "sdlc_model": {
            "explanation": (
                "The SDLC model defines two things: (1) Phase Weights — what percentage of "
                "the project timeline each phase occupies (e.g., Build = 30%). (2) Role-Phase "
                "Efforts — what percentage of a role's total work happens in each phase "
                "(e.g., Developer does 50% of their work during Build). These are configurable "
                "on the Settings page."
            ),
        },
    }
