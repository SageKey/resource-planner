"""
Seed the Direct Model (round 1) template for Clean Up Return Loads (ETE-124).

This is a one-shot, idempotent script. Re-running it replaces any existing
Direct Model rows for ETE-124 with the current first-pass template below.
v1 and v2 project rows / allocations / assignments are not touched — the
only writes are to:

    - direct_project_phases
    - direct_project_phase_roles
    - project_assignments  (only if ETE-124 has no assignments yet;
      populated from the project's lead fields so the Direct Capacity
      page can render a person heatmap in Round 1)

Usage (from repo root):

    python backend/scripts/seed_direct_clean_up_return_loads.py

Or from inside backend/:

    python scripts/seed_direct_clean_up_return_loads.py
"""

import sys
from pathlib import Path
from typing import Optional

# Ensure imports resolve whether run from backend/ or repo root.
_THIS = Path(__file__).resolve()
_BACKEND = _THIS.parents[1]
if str(_BACKEND) not in sys.path:
    sys.path.insert(0, str(_BACKEND))

from engines import SQLiteConnector


PROJECT_ID = "ETE-124"

# First-pass template agreed with Brett. Rows are hours-per-week per role
# during that phase. 0 is fine — developer is explicitly 0 for this project.
# Total project hours ≈ (2×18) + (3×37) + (2×21) = 189h, close to the 200h
# est on the project.
PHASES = [
    {
        "name": "planning",
        "order": 0,
        "duration_weeks": 2.0,
        "role_weekly_hours": {
            "pm": 4.0,
            "ba": 8.0,
            "functional": 4.0,
            "technical": 2.0,
            "developer": 0.0,
            "infrastructure": 0.0,
        },
    },
    {
        "name": "execution",
        "order": 1,
        "duration_weeks": 3.0,
        "role_weekly_hours": {
            "pm": 2.0,
            "ba": 2.0,
            "functional": 3.0,
            "technical": 30.0,
            "developer": 0.0,
            "infrastructure": 0.0,
        },
    },
    {
        "name": "testing_go_live",
        "order": 2,
        "duration_weeks": 2.0,
        "role_weekly_hours": {
            "pm": 3.0,
            "ba": 6.0,
            "functional": 4.0,
            "technical": 8.0,
            "developer": 0.0,
            "infrastructure": 0.0,
        },
    },
]


def main(db_path: Optional[Path] = None) -> None:
    if db_path is None:
        # Prefer the backend Settings value so Railway /data/planner.db works.
        try:
            from app.config import settings  # type: ignore

            db_path = Path(settings.db_path)
        except Exception:
            db_path = Path(_BACKEND) / "planner.db"
    if not db_path.exists():
        raise SystemExit(f"database not found at {db_path}")
    print(f"using database: {db_path}")

    conn = SQLiteConnector(db_path=str(db_path))
    try:
        # Force schema migration / table creation before writing
        conn._open()

        # 1. Verify the project exists
        raw_conn = conn._conn
        row = raw_conn.execute(
            "SELECT id, name FROM projects WHERE id = ?", (PROJECT_ID,)
        ).fetchone()
        if row is None:
            raise SystemExit(
                f"project {PROJECT_ID} not found. Seed the portfolio first."
            )
        print(f"project: {row['id']} {row['name']}")

        # 2. Replace existing plan
        existing = raw_conn.execute(
            "SELECT COUNT(*) FROM direct_project_phases WHERE project_id = ?",
            (PROJECT_ID,),
        ).fetchone()[0]
        if existing:
            print(f"  replacing existing plan ({existing} phase rows)")
        else:
            print("  writing new plan")

        conn.write_direct_project_plan(PROJECT_ID, PHASES)

        # 3. Verify what landed
        written = conn.read_direct_project_plan(PROJECT_ID)
        assert written is not None, "write failed — read_direct_project_plan returned None"
        total_weeks = sum(p["duration_weeks"] for p in written["phases"])
        total_hours = 0.0
        print(f"  total duration: {total_weeks:.1f} weeks")
        for phase in written["phases"]:
            phase_hrs = phase["duration_weeks"] * sum(phase["role_weekly_hours"].values())
            total_hours += phase_hrs
            print(
                f"    {phase['name']:<18} ({phase['duration_weeks']:.1f}wk, {phase_hrs:.0f}h)  "
                + " ".join(
                    f"{k}={v:.0f}"
                    for k, v in phase["role_weekly_hours"].items()
                    if v > 0
                )
            )
        print(f"  total hours:     {total_hours:.0f}h")

        # 4. Backfill project_assignments if missing, so /direct/capacity can
        #    render a person heatmap. This is one-shot dev convenience — it
        #    only runs when there are zero assignments for ETE-124. It will
        #    never overwrite user-curated assignments.
        existing_assignments = raw_conn.execute(
            "SELECT COUNT(*) FROM project_assignments WHERE project_id = ?",
            (PROJECT_ID,),
        ).fetchone()[0]
        if existing_assignments == 0:
            proj_row = raw_conn.execute(
                """SELECT pm, ba, functional_lead, technical_lead, developer_lead
                     FROM projects WHERE id = ?""",
                (PROJECT_ID,),
            ).fetchone()
            lead_rows = [
                (proj_row["pm"], "pm"),
                (proj_row["ba"], "ba"),
                (proj_row["functional_lead"], "functional"),
                (proj_row["technical_lead"], "technical"),
                (proj_row["developer_lead"], "developer"),
            ]
            added = 0
            for person_name, role_key in lead_rows:
                if not person_name:
                    continue
                # Only add assignments for roles that have non-zero hours
                # somewhere in the plan, to avoid dead rows (e.g., developer).
                role_has_hours = any(
                    phase["role_weekly_hours"].get(role_key, 0.0) > 0
                    for phase in PHASES
                )
                if not role_has_hours:
                    continue
                err = conn.save_assignment(PROJECT_ID, person_name, role_key, 1.0)
                if err:
                    print(f"  warn: could not add {person_name} as {role_key}: {err}")
                else:
                    added += 1
                    print(f"  + assignment: {person_name} as {role_key} @ 100%")
            if added:
                print(f"  backfilled {added} assignment(s)")
        else:
            print(f"  {existing_assignments} existing assignment(s) — leaving untouched")

        print("done.")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
