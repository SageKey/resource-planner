"""Scenario planning router -- POST /scenarios/evaluate."""

from typing import Dict, List

from fastapi import APIRouter, Depends, HTTPException

from ..deps import get_capacity, get_connector
from engines import CapacityEngine, SQLiteConnector
from ..schemas.scenario import (
    InFlightProject,
    RoleUtilSnapshot,
    ScenarioDelta,
    ScenarioEvaluateRequest,
    ScenarioEvaluateResponse,
    ScenarioSummary,
    ScheduledProject,
    SchedulePortfolioRequest,
    SchedulePortfolioResponse,
    UtilizationSide,
)

router = APIRouter(prefix="/scenarios", tags=["scenarios"])


def _to_snapshot(role_util) -> RoleUtilSnapshot:
    pct = role_util.utilization_pct
    if pct == float("inf"):
        pct = 9999.0
    return RoleUtilSnapshot(
        role_key=role_util.role_key,
        supply_hrs_week=role_util.supply_hrs_week,
        demand_hrs_week=role_util.demand_hrs_week,
        utilization_pct=pct,
        status=role_util.status,
    )


def _build_summary(deltas, baseline_roles, scenario_roles) -> ScenarioSummary:
    became_over = [d.role_key for d in deltas if d.scenario_status == "RED" and d.baseline_status != "RED"]
    became_stretched = [d.role_key for d in deltas if d.scenario_status == "YELLOW" and d.baseline_status not in ("YELLOW", "RED")]
    became_unstaffed = [d.role_key for d in deltas if d.scenario_status == "GREY" and d.baseline_status != "GREY"]
    became_better = [d.role_key for d in deltas if d.delta_pct <= -0.05]

    if became_over:
        headline = f"{len(became_over)} role{'s' if len(became_over) != 1 else ''} pushed over capacity: {', '.join(became_over)}"
    elif became_unstaffed:
        headline = f"{len(became_unstaffed)} role{'s' if len(became_unstaffed) != 1 else ''} newly unstaffed: {', '.join(became_unstaffed)}"
    elif became_stretched:
        headline = f"{len(became_stretched)} role{'s' if len(became_stretched) != 1 else ''} approaching capacity: {', '.join(became_stretched)}"
    elif became_better:
        headline = f"{len(became_better)} role{'s' if len(became_better) != 1 else ''} freed up"
    else:
        significant = [d for d in deltas if abs(d.delta_pct) > 0.03]
        if significant:
            top = max(significant, key=lambda d: abs(d.delta_pct))
            direction = "up" if top.delta_pct > 0 else "down"
            headline = f"{top.role_key} {direction} {abs(top.delta_pct) * 100:.0f}pp, no status changes"
        else:
            headline = "No meaningful impact on team utilization"

    return ScenarioSummary(
        headline=headline,
        became_over=became_over,
        became_stretched=became_stretched,
        became_unstaffed=became_unstaffed,
        became_better=became_better,
    )


@router.post("/evaluate", response_model=ScenarioEvaluateResponse)
def evaluate_scenario(
    payload: ScenarioEvaluateRequest,
    engine: CapacityEngine = Depends(get_capacity),
) -> ScenarioEvaluateResponse:
    mods_as_dicts = [mod.model_dump() for mod in payload.modifications]

    try:
        result = engine.compute_with_scenario(mods_as_dicts)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    baseline_util = result["baseline"]["utilization"]
    scenario_util = result["scenario"]["utilization"]
    all_role_keys = set(baseline_util.keys()) | set(scenario_util.keys())

    baseline_roles: Dict[str, RoleUtilSnapshot] = {}
    scenario_roles: Dict[str, RoleUtilSnapshot] = {}
    deltas: List[ScenarioDelta] = []

    for role_key in sorted(all_role_keys):
        b_snap = _to_snapshot(baseline_util[role_key]) if role_key in baseline_util else None
        s_snap = _to_snapshot(scenario_util[role_key]) if role_key in scenario_util else None

        if b_snap:
            baseline_roles[role_key] = b_snap
        if s_snap:
            scenario_roles[role_key] = s_snap

        if b_snap and s_snap:
            b_pct = min(b_snap.utilization_pct, 9999.0)
            s_pct = min(s_snap.utilization_pct, 9999.0)
            deltas.append(
                ScenarioDelta(
                    role_key=role_key,
                    baseline_pct=b_pct,
                    scenario_pct=s_pct,
                    delta_pct=round(s_pct - b_pct, 4),
                    baseline_status=b_snap.status,
                    scenario_status=s_snap.status,
                    status_changed=b_snap.status != s_snap.status,
                )
            )

    summary = _build_summary(deltas, baseline_roles, scenario_roles)

    return ScenarioEvaluateResponse(
        baseline=UtilizationSide(roles=baseline_roles),
        scenario=UtilizationSide(roles=scenario_roles),
        deltas=deltas,
        summary=summary,
    )


@router.post("/schedule-portfolio", response_model=SchedulePortfolioResponse)
def schedule_portfolio(
    payload: SchedulePortfolioRequest,
    engine: CapacityEngine = Depends(get_capacity),
    conn: SQLiteConnector = Depends(get_connector),
) -> SchedulePortfolioResponse:
    max_util = payload.max_util_pct
    if max_util is None:
        try:
            thresholds = conn.read_utilization_thresholds()
            max_util = thresholds.get("stretched", {}).get("max", 0.85)
        except Exception:
            max_util = 0.85

    schedule_kwargs = dict(
        max_util_pct=max_util,
        horizon_weeks=payload.horizon_weeks,
        exclude_ids=payload.exclude_ids,
    )

    if payload.modifications:
        mods_as_dicts = [m.model_dump() for m in payload.modifications]
        try:
            import copy
            from engines.capacity_engine import _apply_scenario_modifications
            engine._load()
            orig_data = engine._data
            engine._data = copy.deepcopy(orig_data)
            try:
                _apply_scenario_modifications(engine._data, mods_as_dicts)
                in_dev, _plannable = engine._classify_projects()
                results = engine.simulate_portfolio_schedule(**schedule_kwargs)
            finally:
                engine._data = orig_data
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc))
    else:
        in_dev, _plannable = engine._classify_projects()
        results = engine.simulate_portfolio_schedule(**schedule_kwargs)

    in_flight = [
        InFlightProject(
            project_id=p.id,
            project_name=p.name,
            priority=p.priority or "",
            est_hours=p.est_hours,
            health=p.health or "",
            pct_complete=p.pct_complete,
            start_date=p.start_date.isoformat() if p.start_date else None,
            end_date=p.end_date.isoformat() if p.end_date else None,
        )
        for p in in_dev
    ]

    projects = [ScheduledProject(**r) for r in results]
    can_now = sum(1 for p in projects if p.can_start_now)
    waiting = sum(1 for p in projects if p.suggested_start and not p.can_start_now)
    infeasible = sum(1 for p in projects if not p.suggested_start)

    bottleneck_counts: Dict[str, int] = {}
    for p in projects:
        if p.bottleneck_role and not p.can_start_now:
            bottleneck_counts[p.bottleneck_role] = bottleneck_counts.get(p.bottleneck_role, 0) + 1

    return SchedulePortfolioResponse(
        max_util_pct=max_util,
        horizon_weeks=payload.horizon_weeks,
        in_flight=in_flight,
        projects=projects,
        can_start_now_count=can_now,
        waiting_count=waiting,
        infeasible_count=infeasible,
        bottleneck_roles=bottleneck_counts,
    )
