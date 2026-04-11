"""
Direct Model Engine (Round 1)
-----------------------------

Alternative capacity engine that skips percentages entirely. A project's
phase plan is a list of phases, each with an absolute duration in weeks
and an absolute hours-per-week value per role. No SDLC phase weights, no
role-phase effort percentages, no pct_complete × est_hours math.

This engine is intentionally quarantined from CapacityEngine / v1 / v2 —
it does not extend CapacityEngine, does not consume RMAssumptions, and
does not write to legacy project fields. It only reads from the Direct
Model tables plus the shared `projects`, `team_members`, and
`project_assignments` tables. v1 and v2 keep running untouched in
parallel.

Response shapes match the existing capacity schemas so the React
components (UtilizationBars, HeatmapGrid, PersonHeatmapGrid) can be
reused without modification.
"""

from collections import defaultdict
from dataclasses import dataclass, field
from datetime import date, timedelta
from typing import Optional

from .capacity_engine import _utilization_status
from .models import Project, TeamMember, ROLE_KEYS
from .sqlite_connector import SQLiteConnector


# ---------------------------------------------------------------------------
# Dataclasses
# ---------------------------------------------------------------------------

@dataclass
class DirectPhase:
    """One phase of a Direct Model project plan.

    `duration_weeks` is absolute (e.g., 2.0 means two calendar weeks).
    `role_weekly_hours` maps canonical role key → hours-per-week for
    that role during this phase. Roles with 0 hours are present in
    the dict when seeded but may be omitted; callers must tolerate
    missing keys.
    """
    name: str
    order: int
    duration_weeks: float
    role_weekly_hours: dict = field(default_factory=dict)

    def hours_for(self, role_key: str) -> float:
        return float(self.role_weekly_hours.get(role_key, 0.0))


@dataclass
class DirectProjectPlan:
    """Full Direct Model plan for a single project."""
    project_id: str
    project_name: str
    phases: list[DirectPhase]

    @property
    def total_duration_weeks(self) -> float:
        return sum(p.duration_weeks for p in self.phases)

    @property
    def total_hours(self) -> float:
        total = 0.0
        for phase in self.phases:
            total += phase.duration_weeks * sum(phase.role_weekly_hours.values())
        return round(total, 2)

    def role_totals(self) -> dict[str, float]:
        """Total hours over the life of the project, per role."""
        totals: dict[str, float] = defaultdict(float)
        for phase in self.phases:
            for role_key, hrs in phase.role_weekly_hours.items():
                totals[role_key] += phase.duration_weeks * hrs
        return {k: round(v, 2) for k, v in totals.items()}

    def phase_at_week(self, week_offset: float) -> Optional[DirectPhase]:
        """Return the phase covering `week_offset` weeks after project start.

        Uses half-open intervals [start, end). Negative offsets return
        None (project hasn't started). Offsets past the last phase also
        return None (project has ended).
        """
        if week_offset < 0:
            return None
        cumulative = 0.0
        for phase in self.phases:
            end = cumulative + phase.duration_weeks
            if week_offset < end:
                return phase
            cumulative = end
        return None


# ---------------------------------------------------------------------------
# Engine
# ---------------------------------------------------------------------------

class DirectEngine:
    """Direct Model capacity engine.

    Computes weekly demand and utilization from the
    `direct_project_phases` + `direct_project_phase_roles` tables and
    the shared roster. Round 1 operates on all projects with a seeded
    phase plan (which in Round 1 is just ETE-124 — but the engine is
    written correctly for N projects).
    """

    def __init__(self, connector: SQLiteConnector):
        self.connector = connector
        self._cache: Optional[dict] = None

    # ------------------------------------------------------------------
    # Data loading (memoized per instance)
    # ------------------------------------------------------------------
    def _load(self) -> dict:
        if self._cache is not None:
            return self._cache

        portfolio = self.connector.read_portfolio()
        by_id = {p.id: p for p in portfolio}
        roster = self.connector.read_roster()
        assignments = self.connector.read_assignments(active_only=False)

        direct_ids = self.connector.list_direct_project_ids()
        plans: list[DirectProjectPlan] = []
        for pid in direct_ids:
            raw = self.connector.read_direct_project_plan(pid)
            if raw is None:
                continue
            project = by_id.get(pid)
            if project is None:
                # Plan exists but project row was deleted — skip defensively.
                continue
            phases = [
                DirectPhase(
                    name=p["name"],
                    order=p["order"],
                    duration_weeks=p["duration_weeks"],
                    role_weekly_hours=p["role_weekly_hours"],
                )
                for p in raw["phases"]
            ]
            plans.append(
                DirectProjectPlan(
                    project_id=pid,
                    project_name=project.name,
                    phases=phases,
                )
            )

        self._cache = {
            "plans": plans,
            "portfolio": portfolio,
            "by_id": by_id,
            "roster": roster,
            "assignments": assignments,
        }
        return self._cache

    # ------------------------------------------------------------------
    # Phase / week math
    # ------------------------------------------------------------------
    @staticmethod
    def _scan_start(today: Optional[date] = None) -> date:
        """Return the Monday on or after `today` (default: current date)."""
        today = today or date.today()
        days_to_monday = (7 - today.weekday()) % 7
        return today + timedelta(days=days_to_monday if days_to_monday else 0)

    def _weeks_since_start(
        self,
        plan: DirectProjectPlan,
        project: Project,
        week_start: date,
    ) -> Optional[float]:
        """How many weeks from project start is `week_start`?

        Returns None if the project has no start_date. Can be negative
        (future project) or > total duration (past project).
        """
        if not project.start_date:
            return None
        delta = (week_start - project.start_date).days
        return delta / 7.0

    def supply_by_role(self) -> dict[str, float]:
        """Weekly project-capacity supply per role, from the roster.

        Same math as v1/v2 — `project_capacity_hrs` summed across
        team members that are included in capacity.
        """
        data = self._load()
        supply: dict[str, float] = defaultdict(float)
        for m in data["roster"]:
            if not getattr(m, "include_in_capacity", True):
                continue
            supply[m.role_key] += m.project_capacity_hrs
        return dict(supply)

    # ------------------------------------------------------------------
    # Public: project plan
    # ------------------------------------------------------------------
    def get_project_plan(self, project_id: str) -> Optional[DirectProjectPlan]:
        data = self._load()
        for plan in data["plans"]:
            if plan.project_id == project_id:
                return plan
        return None

    def list_plans(self) -> list[DirectProjectPlan]:
        return list(self._load()["plans"])

    # ------------------------------------------------------------------
    # Public: per-project resource/utilization view
    # ------------------------------------------------------------------
    def compute_project_resources(self, project_id: str) -> Optional[list[dict]]:
        """Per-role resource view for a single Direct Model project.

        Returns one row per role that has hours in the plan, plus any
        extra assigned role. Each row includes the assigned person (if
        any), that person's weekly project capacity, this project's
        current/peak/lifetime hours for the role, and the % of the
        person's capacity this one project consumes in the current
        phase.

        Returns None if the project has no Direct Model plan.
        """
        plan = self.get_project_plan(project_id)
        if plan is None:
            return None

        data = self._load()
        project = data["by_id"].get(project_id)

        # Determine current phase so "current wk" numbers are accurate.
        current_phase_name: Optional[str] = None
        if project and project.start_date:
            wso = self._weeks_since_start(plan, project, self._scan_start())
            if wso is not None:
                current_phase = plan.phase_at_week(wso)
                if current_phase is not None:
                    current_phase_name = current_phase.name

        # Index assignments for this project: role_key -> list[(name, alloc)]
        assignments_by_role: dict[str, list[tuple[str, float]]] = defaultdict(list)
        for a in data["assignments"]:
            if a.project_id == project_id:
                assignments_by_role[a.role_key].append(
                    (a.person_name, a.allocation_pct)
                )

        # Index roster for capacity lookup
        roster_by_name: dict[str, float] = {}
        for m in data["roster"]:
            roster_by_name[m.name.strip().lower()] = m.project_capacity_hrs

        # Compute per-role aggregates from the plan
        role_totals = plan.role_totals()
        peak_by_role: dict[str, float] = defaultdict(float)
        current_by_role: dict[str, float] = defaultdict(float)
        current_phase_label_by_role: dict[str, str] = {}
        for phase in plan.phases:
            for role_key, hrs in phase.role_weekly_hours.items():
                if hrs > peak_by_role[role_key]:
                    peak_by_role[role_key] = hrs
                if phase.name == current_phase_name:
                    current_by_role[role_key] = hrs
                    current_phase_label_by_role[role_key] = phase.name

        # Roles to show: any role with > 0 lifetime hours OR any role
        # with an assignment (so "orphan" assignments still surface).
        role_keys_with_work = {
            rk for rk, total in role_totals.items() if total > 0
        }
        role_keys_assigned = set(assignments_by_role.keys())
        all_role_keys = role_keys_with_work | role_keys_assigned

        rows: list[dict] = []
        for role_key in sorted(all_role_keys):
            lifetime = role_totals.get(role_key, 0.0)
            peak = peak_by_role.get(role_key, 0.0)
            current = current_by_role.get(role_key, 0.0)

            assignees = assignments_by_role.get(role_key, [])
            if not assignees:
                rows.append(
                    {
                        "role_key": role_key,
                        "person_name": None,
                        "person_capacity_hrs_week": None,
                        "allocation_pct": None,
                        "current_phase_hrs_week": round(current, 2),
                        "current_phase_name": current_phase_name,
                        "peak_hrs_week": round(peak, 2),
                        "lifetime_hrs": round(lifetime, 2),
                        "current_pct_of_capacity": None,
                        "peak_pct_of_capacity": None,
                    }
                )
                continue

            for person_name, alloc in assignees:
                capacity = roster_by_name.get(person_name.strip().lower(), 0.0)
                demand_current = current * alloc
                demand_peak = peak * alloc
                rows.append(
                    {
                        "role_key": role_key,
                        "person_name": person_name,
                        "person_capacity_hrs_week": round(capacity, 2) if capacity else 0.0,
                        "allocation_pct": alloc,
                        "current_phase_hrs_week": round(demand_current, 2),
                        "current_phase_name": current_phase_name,
                        "peak_hrs_week": round(demand_peak, 2),
                        "lifetime_hrs": round(lifetime * alloc, 2),
                        "current_pct_of_capacity": (
                            round(demand_current / capacity, 4) if capacity > 0 else None
                        ),
                        "peak_pct_of_capacity": (
                            round(demand_peak / capacity, 4) if capacity > 0 else None
                        ),
                    }
                )
        return rows

    # ------------------------------------------------------------------
    # Public: current-week utilization
    # ------------------------------------------------------------------
    def compute_utilization(self) -> dict[str, dict]:
        """Per-role current-week utilization across all Direct projects.

        Response shape mirrors `RoleUtilizationOut` so the existing
        frontend schema can be reused.
        """
        data = self._load()
        supply = self.supply_by_role()
        scan_start = self._scan_start()

        # Per-role demand for the current week + breakdown list
        demand_by_role: dict[str, float] = defaultdict(float)
        breakdown: dict[str, list] = defaultdict(list)

        for plan in data["plans"]:
            project = data["by_id"].get(plan.project_id)
            if project is None:
                continue
            wso = self._weeks_since_start(plan, project, scan_start)
            if wso is None:
                continue
            phase = plan.phase_at_week(wso)
            if phase is None:
                continue
            for role_key, hrs in phase.role_weekly_hours.items():
                if hrs <= 0:
                    continue
                demand_by_role[role_key] += hrs
                breakdown[role_key].append(
                    {
                        "project_id": plan.project_id,
                        "project_name": plan.project_name,
                        "role_key": role_key,
                        "role_alloc_pct": 1.0,
                        "weekly_hours": round(hrs, 2),
                        "phase_name": phase.name,
                    }
                )

        roles: dict[str, dict] = {}
        thresholds = self.connector.read_utilization_thresholds()
        all_roles = set(ROLE_KEYS) | set(supply.keys()) | set(demand_by_role.keys())
        for role_key in sorted(all_roles):
            s = supply.get(role_key, 0.0)
            d = demand_by_role.get(role_key, 0.0)
            pct = d / s if s > 0 else 0.0
            roles[role_key] = {
                "role_key": role_key,
                "supply_hrs_week": round(s, 2),
                "demand_hrs_week": round(d, 2),
                "utilization_pct": round(pct, 4),
                "status": _utilization_status(pct, thresholds),
                "demand_breakdown": breakdown.get(role_key, []),
            }
        return roles

    # ------------------------------------------------------------------
    # Public: role heatmap (26-week forward)
    # ------------------------------------------------------------------
    def compute_heatmap(self, weeks: int = 26) -> dict:
        """Weekly role demand heatmap for the next `weeks` weeks.

        Return shape matches `HeatmapResponse`.
        """
        data = self._load()
        supply = self.supply_by_role()
        scan_start = self._scan_start()

        # demand_grid[role_key][week_idx] -> hrs
        demand_grid: dict[str, dict[int, float]] = defaultdict(
            lambda: defaultdict(float)
        )

        for plan in data["plans"]:
            project = data["by_id"].get(plan.project_id)
            if project is None or not project.start_date:
                continue
            for w in range(weeks):
                week_start = scan_start + timedelta(weeks=w)
                wso = self._weeks_since_start(plan, project, week_start)
                if wso is None:
                    continue
                phase = plan.phase_at_week(wso)
                if phase is None:
                    continue
                for role_key, hrs in phase.role_weekly_hours.items():
                    if hrs <= 0:
                        continue
                    demand_grid[role_key][w] += hrs

        week_labels = [
            (scan_start + timedelta(weeks=i)).strftime("%b %d") for i in range(weeks)
        ]
        rows = []
        for role_key in ROLE_KEYS:
            role_supply = supply.get(role_key, 0.0)
            cells = []
            for i in range(weeks):
                demand = demand_grid.get(role_key, {}).get(i, 0.0)
                util = demand / role_supply if role_supply > 0 else 0.0
                cells.append(round(util, 4))
            rows.append(
                {
                    "role_key": role_key,
                    "supply_hrs_week": round(role_supply, 2),
                    "cells": cells,
                }
            )

        return {"weeks": week_labels, "rows": rows}

    # ------------------------------------------------------------------
    # Public: per-person heatmap
    # ------------------------------------------------------------------
    def compute_person_heatmap(self, weeks: int = 26) -> dict:
        """Per-person forward heatmap based on project_assignments + Direct plans.

        A person's demand in a given week equals:
            sum over their (project_id, role_key) assignments of
              plan.current_phase.role_weekly_hours[role_key] × allocation_pct

        where `plan` is only defined for projects with a seeded Direct
        Model plan. Assignments to v1/v2-only projects contribute 0.
        """
        data = self._load()
        scan_start = self._scan_start()

        # (project_id) -> DirectProjectPlan for fast lookup
        plan_by_pid = {p.project_id: p for p in data["plans"]}

        # person (lowercased) -> [(project_id, role_key, alloc_pct)]
        person_assignments: dict[str, list] = defaultdict(list)
        for a in data["assignments"]:
            if a.project_id not in plan_by_pid:
                continue
            person_assignments[a.person_name.strip().lower()].append(
                (a.project_id, a.role_key, a.allocation_pct)
            )

        person_rows = []
        for member in data["roster"]:
            pkey = member.name.strip().lower()
            capacity = member.project_capacity_hrs
            included = getattr(member, "include_in_capacity", True)

            weekly_demand = [0.0] * weeks
            if included and capacity > 0:
                for pid, rk, alloc in person_assignments.get(pkey, []):
                    plan = plan_by_pid[pid]
                    project = data["by_id"].get(pid)
                    if project is None or not project.start_date:
                        continue
                    for w in range(weeks):
                        week_start = scan_start + timedelta(weeks=w)
                        wso = self._weeks_since_start(plan, project, week_start)
                        if wso is None:
                            continue
                        phase = plan.phase_at_week(wso)
                        if phase is None:
                            continue
                        hrs = phase.hours_for(rk)
                        if hrs > 0:
                            weekly_demand[w] += hrs * alloc

            cells = [
                round(d / capacity, 4) if capacity > 0 else 0.0 for d in weekly_demand
            ]
            person_rows.append(
                {
                    "name": member.name,
                    "role_key": member.role_key,
                    "role": member.role,
                    "team": member.team or "Unassigned",
                    "capacity_hrs_week": round(capacity, 2),
                    "include_in_capacity": included,
                    "cells": cells,
                }
            )

        person_rows.sort(key=lambda r: (r["team"], r["name"]))
        week_labels = [
            (scan_start + timedelta(weeks=i)).strftime("%b %d") for i in range(weeks)
        ]
        return {"weeks": week_labels, "people": person_rows}
