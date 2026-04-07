"""Schemas for the SDLC model configuration endpoints."""

from typing import Dict

from pydantic import BaseModel


class SdlcModelResponse(BaseModel):
    phase_weights: Dict[str, float]
    role_phase_efforts: Dict[str, Dict[str, float]]


class PhaseWeightsUpdate(BaseModel):
    weights: Dict[str, float]


class RolePhaseEffortsUpdate(BaseModel):
    efforts: Dict[str, Dict[str, float]]
