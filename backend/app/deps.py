"""Request-scoped dependency providers."""

from typing import Iterator

from fastapi import Depends

from .config import settings

import sys
from pathlib import Path

# Add engines to path
_ENGINES_DIR = Path(__file__).resolve().parents[1]
if str(_ENGINES_DIR) not in sys.path:
    sys.path.insert(0, str(_ENGINES_DIR))

from engines import SQLiteConnector, CapacityEngine, ScheduleOptimizer


def get_connector() -> Iterator[SQLiteConnector]:
    conn = SQLiteConnector(db_path=settings.db_path)
    try:
        yield conn
    finally:
        conn.close()


def get_capacity(conn: SQLiteConnector = Depends(get_connector)) -> CapacityEngine:
    return CapacityEngine(connector=conn)


def get_optimizer(conn: SQLiteConnector = Depends(get_connector)) -> ScheduleOptimizer:
    return ScheduleOptimizer(connector=conn)
