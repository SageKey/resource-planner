"""SDLC model configuration router -- editable phase weights + role efforts."""

from fastapi import APIRouter, Depends, HTTPException

from ..deps import get_connector
from engines import SQLiteConnector, SDLC_PHASES, ROLE_KEYS
from ..schemas.sdlc import (
    SdlcModelResponse,
    PhaseWeightsUpdate,
    RolePhaseEffortsUpdate,
)

router = APIRouter(prefix="/sdlc", tags=["sdlc"])


@router.get("/", response_model=SdlcModelResponse)
def get_sdlc_model(conn: SQLiteConnector = Depends(get_connector)) -> SdlcModelResponse:
    return SdlcModelResponse(
        phase_weights=conn.read_phase_weights(),
        role_phase_efforts=conn.read_role_phase_efforts(),
    )


@router.put("/phase-weights", response_model=SdlcModelResponse)
def update_phase_weights(
    payload: PhaseWeightsUpdate,
    conn: SQLiteConnector = Depends(get_connector),
) -> SdlcModelResponse:
    # Validate: all 6 phases present, sum to ~1.0
    for phase in SDLC_PHASES:
        if phase not in payload.weights:
            raise HTTPException(status_code=400, detail=f"Missing phase: {phase}")
    total = sum(payload.weights.values())
    if abs(total - 1.0) > 0.02:
        raise HTTPException(status_code=400, detail=f"Phase weights must sum to 1.0 (got {total:.4f})")

    conn.update_phase_weights(payload.weights)
    return SdlcModelResponse(
        phase_weights=conn.read_phase_weights(),
        role_phase_efforts=conn.read_role_phase_efforts(),
    )


@router.put("/role-efforts", response_model=SdlcModelResponse)
def update_role_efforts(
    payload: RolePhaseEffortsUpdate,
    conn: SQLiteConnector = Depends(get_connector),
) -> SdlcModelResponse:
    # Validate: each role's phases sum to ~1.0
    for role_key, phases in payload.efforts.items():
        if role_key not in ROLE_KEYS:
            raise HTTPException(status_code=400, detail=f"Unknown role: {role_key}")
        for phase in SDLC_PHASES:
            if phase not in phases:
                raise HTTPException(status_code=400, detail=f"Missing phase '{phase}' for role '{role_key}'")
        total = sum(phases.values())
        if abs(total - 1.0) > 0.02:
            raise HTTPException(status_code=400, detail=f"Role '{role_key}' efforts must sum to 1.0 (got {total:.4f})")

    conn.update_role_phase_efforts(payload.efforts)
    return SdlcModelResponse(
        phase_weights=conn.read_phase_weights(),
        role_phase_efforts=conn.read_role_phase_efforts(),
    )


@router.post("/reset-defaults", response_model=SdlcModelResponse)
def reset_sdlc_defaults(conn: SQLiteConnector = Depends(get_connector)) -> SdlcModelResponse:
    conn.reset_sdlc_defaults()
    return SdlcModelResponse(
        phase_weights=conn.read_phase_weights(),
        role_phase_efforts=conn.read_role_phase_efforts(),
    )
