"""FastAPI entrypoint for the Resource Planner backend.

Run with:
    uvicorn app.main:app --reload --host 127.0.0.1 --port 8501
"""

import logging
import os
import sys
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Add engines to import path
_BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(_BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(_BACKEND_DIR))

from .config import settings
from .routers import (
    capacity,
    explain,
    import_data,
    meta,
    portfolio,
    roster,
    scenarios,
    sdlc,
)

log = logging.getLogger("planner.startup")


def _seed_database_if_missing() -> None:
    """Seed the DB with SDLC defaults if it's empty."""
    import sqlite3

    db_path = Path(settings.db_path)
    if db_path.exists():
        try:
            conn = sqlite3.connect(str(db_path))
            row = conn.execute(
                "SELECT name FROM sqlite_master WHERE type='table' AND name='projects'"
            ).fetchone()
            conn.close()
            if row is not None:
                return  # DB already has tables
        except Exception:
            pass

    # The SQLiteConnector._ensure_schema() handles table creation + SDLC defaults
    # automatically on first connect. Nothing else to do here.
    log.info("Database will be initialized on first request at %s", db_path)


def create_app() -> FastAPI:
    app = FastAPI(
        title="Resource Planner API",
        version="0.1.0",
        description="Capacity planning and resource modeling engine.",
    )

    @app.on_event("startup")
    async def on_startup() -> None:
        _seed_database_if_missing()

    # CORS
    def _norm(o: str) -> str:
        return o.strip().rstrip("/")

    origins = [_norm(o) for o in settings.cors_origins]
    extra = os.environ.get("CORS_ORIGIN_PROD")
    if extra:
        for o in extra.split(","):
            o = _norm(o)
            if o and o not in origins:
                origins.append(o)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_origin_regex=r"https://[a-zA-Z0-9-]+\.vercel\.app",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Routers
    app.include_router(meta.router, prefix=settings.api_prefix)
    app.include_router(portfolio.router, prefix=settings.api_prefix)
    app.include_router(capacity.router, prefix=settings.api_prefix)
    app.include_router(roster.router, prefix=settings.api_prefix)
    app.include_router(scenarios.router, prefix=settings.api_prefix)
    app.include_router(sdlc.router, prefix=settings.api_prefix)
    app.include_router(explain.router, prefix=settings.api_prefix)
    app.include_router(import_data.router, prefix=settings.api_prefix)

    return app


app = create_app()
