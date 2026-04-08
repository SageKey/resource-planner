"""
SQLite Connector for Resource Planner.
Trimmed from the PMO app — no vendor, financial, initiative, or snapshot tables.
"""

import sqlite3
from collections import defaultdict
from datetime import datetime
from pathlib import Path
from typing import Optional

from .models import (
    Project, TeamMember, RMAssumptions, ProjectAssignment,
    SDLC_PHASES, ROLE_KEYS, _to_date,
)

DEFAULT_DB = "planner.db"

SCHEMA_VERSION = 1

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS schema_info (
    key     TEXT PRIMARY KEY,
    value   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS projects (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    type            TEXT,
    portfolio       TEXT,
    sponsor         TEXT,
    health          TEXT,
    pct_complete    REAL DEFAULT 0.0,
    priority        TEXT,
    start_date      TEXT,
    end_date        TEXT,
    actual_end      TEXT,
    team            TEXT,
    pm              TEXT,
    ba              TEXT,
    functional_lead TEXT,
    technical_lead  TEXT,
    developer_lead  TEXT,
    tshirt_size     TEXT,
    est_hours       REAL DEFAULT 0.0,
    notes           TEXT,
    sort_order      INTEGER,
    created_at      TEXT DEFAULT (datetime('now')),
    updated_at      TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS project_role_allocations (
    project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    role_key    TEXT NOT NULL,
    allocation  REAL DEFAULT 0.0,
    PRIMARY KEY (project_id, role_key)
);

CREATE TABLE IF NOT EXISTS team_members (
    name                 TEXT PRIMARY KEY,
    role                 TEXT NOT NULL,
    role_key             TEXT NOT NULL,
    team                 TEXT,
    vendor               TEXT,
    classification       TEXT,
    rate_per_hour        REAL DEFAULT 0.0,
    weekly_hrs_available REAL DEFAULT 0.0,
    support_reserve_pct  REAL DEFAULT 0.0,
    include_in_capacity  INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS project_assignments (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id      TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    person_name     TEXT NOT NULL,
    role_key        TEXT NOT NULL,
    allocation_pct  REAL DEFAULT 1.0,
    UNIQUE(project_id, person_name, role_key)
);

CREATE TABLE IF NOT EXISTS rm_assumptions (
    key     TEXT PRIMARY KEY,
    value   REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS sdlc_phase_weights (
    phase   TEXT PRIMARY KEY,
    weight  REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS role_phase_efforts (
    role_key    TEXT NOT NULL,
    phase       TEXT NOT NULL,
    effort      REAL NOT NULL,
    PRIMARY KEY (role_key, phase)
);

CREATE TABLE IF NOT EXISTS app_settings (
    key             TEXT PRIMARY KEY,
    category        TEXT NOT NULL,
    value           TEXT NOT NULL,
    value_type      TEXT NOT NULL,
    label           TEXT NOT NULL,
    description     TEXT,
    min_value       REAL,
    max_value       REAL,
    unit            TEXT,
    sort_order      INTEGER DEFAULT 0,
    updated_at      TEXT DEFAULT (datetime('now')),
    updated_by      TEXT
);
CREATE INDEX IF NOT EXISTS idx_app_settings_category ON app_settings(category);
"""

# Default utilization threshold settings
DEFAULT_APP_SETTINGS = [
    {
        "key": "util_under_enabled", "category": "utilization",
        "value": "1", "value_type": "bool",
        "label": "Under-utilized state",
        "description": "When enabled, roles below the threshold are flagged as under-utilized.",
        "sort_order": 10,
    },
    {
        "key": "util_under_max", "category": "utilization",
        "value": "0.70", "value_type": "float",
        "label": "Under -> Ideal boundary",
        "description": "Default 70%.",
        "min_value": 0.0, "max_value": 1.5, "unit": "%",
        "sort_order": 20,
    },
    {
        "key": "util_ideal_enabled", "category": "utilization",
        "value": "1", "value_type": "bool",
        "label": "Ideal state",
        "sort_order": 30,
    },
    {
        "key": "util_ideal_max", "category": "utilization",
        "value": "0.80", "value_type": "float",
        "label": "Ideal -> Stretched boundary",
        "description": "Default 80%.",
        "min_value": 0.0, "max_value": 1.5, "unit": "%",
        "sort_order": 40,
    },
    {
        "key": "util_stretched_enabled", "category": "utilization",
        "value": "1", "value_type": "bool",
        "label": "Stretched state",
        "sort_order": 50,
    },
    {
        "key": "util_stretched_max", "category": "utilization",
        "value": "1.00", "value_type": "float",
        "label": "Stretched -> Over boundary",
        "description": "Default 100%.",
        "min_value": 0.0, "max_value": 2.0, "unit": "%",
        "sort_order": 60,
    },
    {
        "key": "util_over_enabled", "category": "utilization",
        "value": "1", "value_type": "bool",
        "label": "Over-capacity state",
        "sort_order": 70,
    },
]

# Default SDLC phase weights (Jim's model)
DEFAULT_PHASE_WEIGHTS = {
    "discovery": 0.10, "planning": 0.10, "design": 0.15,
    "build": 0.30, "test": 0.20, "deploy": 0.15,
}

# Default role-phase effort percentages (Jim's model)
DEFAULT_ROLE_PHASE_EFFORTS = {
    "pm":             {"discovery": 0.10, "planning": 0.25, "design": 0.15, "build": 0.20, "test": 0.20, "deploy": 0.10},
    "ba":             {"discovery": 0.30, "planning": 0.20, "design": 0.20, "build": 0.10, "test": 0.15, "deploy": 0.05},
    "functional":     {"discovery": 0.20, "planning": 0.10, "design": 0.30, "build": 0.15, "test": 0.15, "deploy": 0.10},
    "technical":      {"discovery": 0.05, "planning": 0.10, "design": 0.20, "build": 0.40, "test": 0.15, "deploy": 0.10},
    "developer":      {"discovery": 0.00, "planning": 0.05, "design": 0.10, "build": 0.50, "test": 0.25, "deploy": 0.10},
    "infrastructure": {"discovery": 0.05, "planning": 0.10, "design": 0.15, "build": 0.20, "test": 0.15, "deploy": 0.35},
    "dba":            {"discovery": 0.05, "planning": 0.10, "design": 0.30, "build": 0.25, "test": 0.20, "deploy": 0.10},
    "erp":            {"discovery": 0.10, "planning": 0.15, "design": 0.10, "build": 0.10, "test": 0.05, "deploy": 0.50},
}


def _compute_sort_order(health: Optional[str], priority: Optional[str]) -> int:
    if health:
        h = str(health).upper()
        if "POSTPONED" in h or "NOT APPROVED" in h:
            return 2
        if "COMPLETE" in h:
            return 3
    return 1


class SQLiteConnector:
    """SQLite-backed data connector for the Resource Planner."""

    def __init__(self, db_path: Optional[str] = None):
        if db_path is None:
            db_path = str(Path(__file__).parent.parent / DEFAULT_DB)
        self.db_path = db_path
        self._conn = None

    def _open(self) -> sqlite3.Connection:
        if self._conn is None:
            self._conn = sqlite3.connect(self.db_path)
            self._conn.row_factory = sqlite3.Row
            self._conn.execute("PRAGMA journal_mode=WAL")
            self._conn.execute("PRAGMA foreign_keys=ON")
            self._ensure_schema()
        return self._conn

    def _ensure_schema(self):
        self._conn.executescript(SCHEMA_SQL)
        self._conn.execute(
            "INSERT OR IGNORE INTO schema_info (key, value) VALUES (?, ?)",
            ("version", str(SCHEMA_VERSION)),
        )
        self._seed_default_settings()
        self._seed_sdlc_defaults()
        self._conn.commit()

    def _seed_default_settings(self):
        for s in DEFAULT_APP_SETTINGS:
            self._conn.execute(
                """INSERT OR IGNORE INTO app_settings
                    (key, category, value, value_type, label, description,
                     min_value, max_value, unit, sort_order)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    s["key"], s["category"], s["value"], s["value_type"],
                    s["label"], s.get("description"),
                    s.get("min_value"), s.get("max_value"),
                    s.get("unit"), s.get("sort_order", 0),
                ),
            )

    def _seed_sdlc_defaults(self):
        """Seed SDLC phase weights and role-phase efforts if empty."""
        row = self._conn.execute("SELECT COUNT(*) FROM sdlc_phase_weights").fetchone()
        if row[0] == 0:
            for phase, weight in DEFAULT_PHASE_WEIGHTS.items():
                self._conn.execute(
                    "INSERT INTO sdlc_phase_weights (phase, weight) VALUES (?, ?)",
                    (phase, weight),
                )
        row = self._conn.execute("SELECT COUNT(*) FROM role_phase_efforts").fetchone()
        if row[0] == 0:
            for role_key, phases in DEFAULT_ROLE_PHASE_EFFORTS.items():
                for phase, effort in phases.items():
                    self._conn.execute(
                        "INSERT INTO role_phase_efforts (role_key, phase, effort) VALUES (?, ?, ?)",
                        (role_key, phase, effort),
                    )

    # ------------------------------------------------------------------
    # App Settings
    # ------------------------------------------------------------------
    def read_settings(self, category: Optional[str] = None) -> list[dict]:
        conn = self._open()
        if category:
            rows = conn.execute(
                "SELECT * FROM app_settings WHERE category = ? ORDER BY sort_order, key",
                (category,),
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM app_settings ORDER BY category, sort_order, key"
            ).fetchall()
        return [dict(r) for r in rows]

    def update_setting(self, key: str, value: str, updated_by: Optional[str] = None) -> Optional[dict]:
        conn = self._open()
        conn.execute(
            "UPDATE app_settings SET value = ?, updated_at = datetime('now'), updated_by = ? WHERE key = ?",
            (value, updated_by, key),
        )
        conn.commit()
        row = conn.execute("SELECT * FROM app_settings WHERE key = ?", (key,)).fetchone()
        return dict(row) if row else None

    def read_utilization_thresholds(self) -> dict:
        rows = self.read_settings(category="utilization")
        by_key = {r["key"]: r for r in rows}

        def _f(key, default):
            r = by_key.get(key)
            try:
                return float(r["value"]) if r else default
            except (TypeError, ValueError):
                return default

        def _b(key, default):
            r = by_key.get(key)
            if not r:
                return default
            return str(r["value"]).strip() in ("1", "true", "True")

        return {
            "under":     {"enabled": _b("util_under_enabled", True),     "max": _f("util_under_max", 0.70)},
            "ideal":     {"enabled": _b("util_ideal_enabled", True),     "max": _f("util_ideal_max", 0.80)},
            "stretched": {"enabled": _b("util_stretched_enabled", True), "max": _f("util_stretched_max", 1.00)},
            "over":      {"enabled": _b("util_over_enabled", True)},
        }

    def close(self):
        if self._conn:
            self._conn.close()
            self._conn = None

    @property
    def file_modified_time(self) -> datetime:
        return datetime.fromtimestamp(Path(self.db_path).stat().st_mtime)

    # ------------------------------------------------------------------
    # Project Portfolio
    # ------------------------------------------------------------------
    def read_portfolio(self) -> list[Project]:
        conn = self._open()
        rows = conn.execute(
            "SELECT * FROM projects ORDER BY sort_order, priority, name"
        ).fetchall()

        projects = []
        for row in rows:
            pid = row["id"]
            alloc_rows = conn.execute(
                "SELECT role_key, allocation FROM project_role_allocations WHERE project_id = ?",
                (pid,),
            ).fetchall()
            role_allocs = {r["role_key"]: r["allocation"] for r in alloc_rows}
            for rk in ROLE_KEYS:
                role_allocs.setdefault(rk, 0.0)

            projects.append(Project(
                id=pid,
                name=row["name"],
                type=row["type"],
                portfolio=row["portfolio"],
                sponsor=row["sponsor"],
                health=row["health"],
                pct_complete=row["pct_complete"] or 0.0,
                priority=row["priority"],
                start_date=_to_date(row["start_date"]),
                end_date=_to_date(row["end_date"]),
                actual_end=_to_date(row["actual_end"]),
                team=row["team"],
                pm=row["pm"],
                ba=row["ba"],
                functional_lead=row["functional_lead"],
                technical_lead=row["technical_lead"],
                developer_lead=row["developer_lead"],
                tshirt_size=row["tshirt_size"],
                est_hours=row["est_hours"] or 0.0,
                role_allocations=role_allocs,
                notes=row["notes"],
                sort_order=row["sort_order"],
            ))

        return projects

    def read_active_portfolio(self) -> list[Project]:
        return [p for p in self.read_portfolio() if p.is_active]

    # ------------------------------------------------------------------
    # Team Roster
    # ------------------------------------------------------------------
    def read_roster(self) -> list[TeamMember]:
        conn = self._open()
        rows = conn.execute("SELECT * FROM team_members ORDER BY role_key, name").fetchall()

        members = []
        for row in rows:
            weekly = row["weekly_hrs_available"] or 0.0
            reserve = row["support_reserve_pct"] or 0.0
            cap_pct = 1.0 - reserve
            cap_hrs = weekly * cap_pct
            try:
                include = bool(row["include_in_capacity"]) if row["include_in_capacity"] is not None else True
            except (IndexError, KeyError):
                include = True

            members.append(TeamMember(
                name=row["name"],
                role=row["role"],
                role_key=row["role_key"],
                team=row["team"],
                vendor=row["vendor"],
                classification=row["classification"],
                rate_per_hour=row["rate_per_hour"] or 0.0,
                weekly_hrs_available=weekly,
                support_reserve_pct=reserve,
                project_capacity_pct=cap_pct,
                project_capacity_hrs=cap_hrs,
                include_in_capacity=include,
            ))

        return members

    # ------------------------------------------------------------------
    # RM Assumptions
    # ------------------------------------------------------------------
    def read_assumptions(self) -> RMAssumptions:
        conn = self._open()

        kv_rows = conn.execute("SELECT key, value FROM rm_assumptions").fetchall()
        kv = {r["key"]: r["value"] for r in kv_rows}

        pw_rows = conn.execute("SELECT phase, weight FROM sdlc_phase_weights").fetchall()
        phase_weights = {r["phase"]: r["weight"] for r in pw_rows}

        re_rows = conn.execute("SELECT role_key, phase, effort FROM role_phase_efforts").fetchall()
        role_phase_efforts = {}
        for r in re_rows:
            role_phase_efforts.setdefault(r["role_key"], {})[r["phase"]] = r["effort"]

        role_avg_efforts = {}
        for role_key, phases in role_phase_efforts.items():
            weighted = sum(
                phases.get(p, 0.0) * phase_weights.get(p, 0.0)
                for p in phase_weights
            )
            role_avg_efforts[role_key] = weighted

        roster = self.read_roster()
        supply_by_role = {}
        role_members = defaultdict(list)
        for m in roster:
            role_members[m.role_key].append(m)

        for role_key in ROLE_KEYS:
            members = role_members.get(role_key, [])
            headcount = len(members)
            gross = sum(m.weekly_hrs_available for m in members)
            project = sum(m.project_capacity_hrs for m in members)
            supply_by_role[role_key] = {
                "headcount": headcount,
                "gross_hrs_week": gross,
                "project_hrs_week": project,
            }

        return RMAssumptions(
            base_hours_per_week=kv.get("base_hours_per_week", 40.0),
            admin_pct=kv.get("admin_pct", 0.10),
            breakfix_pct=kv.get("breakfix_pct", 0.10),
            project_pct=kv.get("project_pct", 0.80),
            available_project_hrs=kv.get("available_project_hrs", 32.0),
            max_projects_per_person=int(kv.get("max_projects_per_person", 3)),
            sdlc_phase_weights=phase_weights,
            role_phase_efforts=role_phase_efforts,
            role_avg_efforts=role_avg_efforts,
            supply_by_role=supply_by_role,
            annual_budget=kv.get("annual_budget", 0.0),
        )

    # ------------------------------------------------------------------
    # Project Assignments
    # ------------------------------------------------------------------
    def read_assignments(self, active_only: bool = True) -> list[ProjectAssignment]:
        conn = self._open()

        if active_only:
            active_ids = {p.id for p in self.read_active_portfolio()}
            rows = conn.execute("SELECT * FROM project_assignments").fetchall()
            return [
                ProjectAssignment(
                    project_id=r["project_id"],
                    person_name=r["person_name"],
                    role_key=r["role_key"],
                    allocation_pct=r["allocation_pct"] or 1.0,
                )
                for r in rows if r["project_id"] in active_ids
            ]
        else:
            rows = conn.execute("SELECT * FROM project_assignments").fetchall()
            return [
                ProjectAssignment(
                    project_id=r["project_id"],
                    person_name=r["person_name"],
                    role_key=r["role_key"],
                    allocation_pct=r["allocation_pct"] or 1.0,
                )
                for r in rows
            ]

    # ------------------------------------------------------------------
    # Load All
    # ------------------------------------------------------------------
    def load_all(self) -> dict:
        portfolio = self.read_portfolio()
        active = [p for p in portfolio if p.is_active]
        roster = self.read_roster()
        assumptions = self.read_assumptions()
        assignments = self.read_assignments()
        return {
            "portfolio": portfolio,
            "active_portfolio": active,
            "roster": roster,
            "assumptions": assumptions,
            "assignments": assignments,
            "data_as_of": self.file_modified_time,
        }

    # ------------------------------------------------------------------
    # Write Methods
    # ------------------------------------------------------------------
    def save_project(self, fields: dict, is_new: bool = False) -> Optional[str]:
        try:
            conn = self._open()
            pid = fields.get("id", "").strip()
            if not pid:
                return "Project ID is required."

            role_allocs = {}
            proj_fields = {}
            for k, v in fields.items():
                if k.startswith("alloc_"):
                    role_key = k[6:]
                    role_allocs[role_key] = v
                else:
                    proj_fields[k] = v

            proj_fields["sort_order"] = _compute_sort_order(
                proj_fields.get("health"), proj_fields.get("priority")
            )
            proj_fields["updated_at"] = datetime.now().isoformat()

            for date_key in ("start_date", "end_date", "actual_end"):
                val = proj_fields.get(date_key)
                if val and hasattr(val, "isoformat"):
                    proj_fields[date_key] = val.isoformat()

            if is_new:
                proj_fields["created_at"] = datetime.now().isoformat()
                cols = ", ".join(proj_fields.keys())
                placeholders = ", ".join("?" for _ in proj_fields)
                conn.execute(
                    f"INSERT INTO projects ({cols}) VALUES ({placeholders})",
                    list(proj_fields.values()),
                )
            else:
                sets = ", ".join(f"{k} = ?" for k in proj_fields if k != "id")
                vals = [v for k, v in proj_fields.items() if k != "id"]
                vals.append(pid)
                conn.execute(
                    f"UPDATE projects SET {sets} WHERE id = ?",
                    vals,
                )

            for role_key, alloc in role_allocs.items():
                conn.execute(
                    """INSERT INTO project_role_allocations (project_id, role_key, allocation)
                       VALUES (?, ?, ?)
                       ON CONFLICT(project_id, role_key) DO UPDATE SET allocation = ?""",
                    (pid, role_key, alloc, alloc),
                )

            conn.commit()
            return None

        except Exception as e:
            return f"Error saving project: {e}"

    def save_roster_member(self, fields: dict) -> Optional[str]:
        try:
            conn = self._open()
            name = fields.get("name", "").strip()
            if not name:
                return "Name is required."

            include = 1 if fields.get("include_in_capacity", True) else 0

            conn.execute(
                """INSERT INTO team_members (name, role, role_key, team, vendor,
                   classification, rate_per_hour, weekly_hrs_available, support_reserve_pct,
                   include_in_capacity)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                   ON CONFLICT(name) DO UPDATE SET
                   role=?, role_key=?, team=?, vendor=?, classification=?,
                   rate_per_hour=?, weekly_hrs_available=?, support_reserve_pct=?,
                   include_in_capacity=?""",
                (
                    name, fields.get("role", ""), fields.get("role_key", ""),
                    fields.get("team"), fields.get("vendor"), fields.get("classification"),
                    fields.get("rate_per_hour", 0.0), fields.get("weekly_hrs_available", 0.0),
                    fields.get("support_reserve_pct", 0.0),
                    include,
                    fields.get("role", ""), fields.get("role_key", ""),
                    fields.get("team"), fields.get("vendor"), fields.get("classification"),
                    fields.get("rate_per_hour", 0.0), fields.get("weekly_hrs_available", 0.0),
                    fields.get("support_reserve_pct", 0.0),
                    include,
                )
            )
            conn.commit()
            return None
        except Exception as e:
            return f"Error saving roster member: {e}"

    def delete_roster_member(self, name: str) -> Optional[str]:
        try:
            conn = self._open()
            conn.execute("DELETE FROM project_assignments WHERE person_name = ?", (name,))
            conn.execute("DELETE FROM team_members WHERE name = ?", (name,))
            conn.commit()
            return None
        except Exception as e:
            return f"Error deleting roster member: {e}"

    def save_assignment(self, project_id: str, person_name: str,
                        role_key: str, allocation_pct: float = 1.0) -> Optional[str]:
        try:
            conn = self._open()
            conn.execute(
                """INSERT INTO project_assignments (project_id, person_name, role_key, allocation_pct)
                   VALUES (?, ?, ?, ?)
                   ON CONFLICT(project_id, person_name, role_key) DO UPDATE SET allocation_pct = ?""",
                (project_id, person_name, role_key, allocation_pct, allocation_pct),
            )
            conn.commit()
            return None
        except Exception as e:
            return f"Error saving assignment: {e}"

    def read_project_assignments(self, project_id: str) -> list[ProjectAssignment]:
        conn = self._open()
        rows = conn.execute(
            "SELECT * FROM project_assignments WHERE project_id = ?", (project_id,)
        ).fetchall()
        return [
            ProjectAssignment(
                project_id=r["project_id"],
                person_name=r["person_name"],
                role_key=r["role_key"],
                allocation_pct=r["allocation_pct"] or 1.0,
            )
            for r in rows
        ]

    def delete_assignment(self, project_id: str, person_name: str, role_key: str) -> Optional[str]:
        try:
            conn = self._open()
            conn.execute(
                "DELETE FROM project_assignments WHERE project_id = ? AND person_name = ? AND role_key = ?",
                (project_id, person_name, role_key),
            )
            conn.commit()
            return None
        except Exception as e:
            return f"Error deleting assignment: {e}"

    def delete_project_assignments(self, project_id: str) -> Optional[str]:
        try:
            conn = self._open()
            conn.execute("DELETE FROM project_assignments WHERE project_id = ?", (project_id,))
            conn.commit()
            return None
        except Exception as e:
            return f"Error deleting assignments: {e}"

    def delete_project(self, project_id: str) -> Optional[str]:
        try:
            conn = self._open()
            conn.execute("DELETE FROM projects WHERE id = ?", (project_id,))
            conn.commit()
            return None
        except Exception as e:
            return f"Error deleting project: {e}"

    # ------------------------------------------------------------------
    # SDLC Model (editable)
    # ------------------------------------------------------------------
    def read_phase_weights(self) -> dict[str, float]:
        conn = self._open()
        rows = conn.execute("SELECT phase, weight FROM sdlc_phase_weights").fetchall()
        return {r["phase"]: r["weight"] for r in rows}

    def update_phase_weights(self, weights: dict[str, float]) -> None:
        conn = self._open()
        for phase, weight in weights.items():
            conn.execute(
                "INSERT INTO sdlc_phase_weights (phase, weight) VALUES (?, ?) "
                "ON CONFLICT(phase) DO UPDATE SET weight = ?",
                (phase, weight, weight),
            )
        conn.commit()

    def read_role_phase_efforts(self) -> dict[str, dict[str, float]]:
        conn = self._open()
        rows = conn.execute("SELECT role_key, phase, effort FROM role_phase_efforts").fetchall()
        result = {}
        for r in rows:
            result.setdefault(r["role_key"], {})[r["phase"]] = r["effort"]
        return result

    def update_role_phase_efforts(self, efforts: dict[str, dict[str, float]]) -> None:
        conn = self._open()
        for role_key, phases in efforts.items():
            for phase, effort in phases.items():
                conn.execute(
                    "INSERT INTO role_phase_efforts (role_key, phase, effort) VALUES (?, ?, ?) "
                    "ON CONFLICT(role_key, phase) DO UPDATE SET effort = ?",
                    (role_key, phase, effort, effort),
                )
        conn.commit()

    def reset_sdlc_defaults(self) -> None:
        conn = self._open()
        conn.execute("DELETE FROM sdlc_phase_weights")
        conn.execute("DELETE FROM role_phase_efforts")
        for phase, weight in DEFAULT_PHASE_WEIGHTS.items():
            conn.execute(
                "INSERT INTO sdlc_phase_weights (phase, weight) VALUES (?, ?)",
                (phase, weight),
            )
        for role_key, phases in DEFAULT_ROLE_PHASE_EFFORTS.items():
            for phase, effort in phases.items():
                conn.execute(
                    "INSERT INTO role_phase_efforts (role_key, phase, effort) VALUES (?, ?, ?)",
                    (role_key, phase, effort),
                )
        conn.commit()
