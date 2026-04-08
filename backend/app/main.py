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
    """Seed the DB from seed_data.sql if it has no projects.

    Safe to call on every boot — no-op once data exists. This ensures
    the free-tier Railway deploy (no persistent volume) always comes up
    with the portfolio and roster pre-loaded.
    """
    import sqlite3

    db_path = Path(settings.db_path)
    db_path.parent.mkdir(parents=True, exist_ok=True)

    need_seed = False
    if not db_path.exists():
        need_seed = True
    else:
        try:
            conn = sqlite3.connect(str(db_path))
            row = conn.execute(
                "SELECT name FROM sqlite_master WHERE type='table' AND name='projects'"
            ).fetchone()
            if row is None:
                need_seed = True
            else:
                count = conn.execute("SELECT COUNT(*) FROM projects").fetchone()
                if count[0] == 0:
                    need_seed = True
            conn.close()
        except Exception:
            need_seed = True

    if not need_seed:
        log.info("Database has data, skipping seed")
        return

    # Look for seed_data.sql in the app directory
    seed_file = Path(__file__).resolve().parent.parent / "seed_data.sql"
    if not seed_file.exists():
        log.warning("seed_data.sql not found at %s — skipping seed", seed_file)
        return

    log.info("Seeding database from %s", seed_file)
    if db_path.exists():
        db_path.unlink()
    conn = sqlite3.connect(str(db_path))
    try:
        conn.executescript(seed_file.read_text())
        conn.commit()
        log.info("Seed complete")
    except Exception as exc:
        log.error("Seed failed: %s", exc)
    finally:
        conn.close()


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
