"""
Check plan storage against the real database, then undo all of it.

The plan service's SQL cannot be run by the unit tests (there is no Postgres in the test run), so this runs the
real service code against your database: start a plan, save planner work, try the things that must be refused,
lock it, try to change it afterwards, and (when migration 015 is applied) get a headset code for it.

EVERYTHING HAPPENS IN ONE TRANSACTION THAT IS NEVER COMMITTED. The connection is rolled back at the end (and
on any error), so no plan, assignment or code is left behind. It reads users and cases, and writes nothing that
survives. Run it yourself, from the backend folder:

    ./venv/Scripts/python.exe scripts/check_plan_storage.py
    ./venv/Scripts/python.exe scripts/check_plan_storage.py --learner-id MVR-ABC123

By default it uses the first active learner whose institution has a published case. It prints PASS or FAIL per
step and exits 1 if anything failed.
"""
from __future__ import annotations

import argparse
import sys
from contextlib import contextmanager
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import psycopg2  # noqa: E402

from db.session import get_db_conn  # noqa: E402
from schemas.auth import UserProfile  # noqa: E402
from services import connect_service as cs  # noqa: E402
from services import plan_service as ps  # noqa: E402

VR = {
    "patient_id": "CHECK-PLAN-STORAGE",
    "knee_side": "LEFT",
    "assessment": {"MAD_mm": 25.0, "AMA_deg": 6.5, "mHKA_deg": 8.0, "MPTA_deg": 85.0, "LDFA_deg": 88.0, "PTS_deg": 7.0},
    "tibial_component": {"implant_size": 4, "position_2d": {"x_offset_mm": 0.0, "y_offset_mm": 0.0, "rotation_deg": 0.0}},
    "femoral_component": {"implant_size": 5, "position_2d": {"x_offset_mm": 0.0, "y_offset_mm": 0.0, "rotation_deg": 0.0}},
}
ASSESSMENT = {
    "v1_assessment": {"MAD_mm": 25.0, "AMA_deg": 6.5, "mHKA_deg": 8.0, "MPTA_deg": 85.0, "LDFA_deg": 88.0, "PTS_deg": 7.0},
    "assessment_landmarks": {"hipCenter": {"x": 50, "y": 11}},
}

failures = []


def report(ok: bool, name: str, detail: str = "") -> None:
    print(f"  {'PASS' if ok else 'FAIL'}  {name}" + (f"  ({detail})" if detail else ""))
    if not ok:
        failures.append(name)


def main() -> int:
    parser = argparse.ArgumentParser(description="Check plan storage against the real database (rolled back at the end).")
    parser.add_argument("--learner-id", help="Learner ID (e.g. MVR-ABC123) to act as; default: the first suitable learner")
    args = parser.parse_args()

    conn = get_db_conn()
    cur = conn.cursor()

    # Every service call below goes through this one cursor, and nothing ever commits.
    @contextmanager
    def one_transaction():
        yield cur

    cs.cursor = one_transaction
    try:
        where = "u.learner_id = %s" if args.learner_id else (
            "u.status = 'active' AND u.role NOT IN ('instructor', 'admin') AND u.institution_id IS NOT NULL AND EXISTS "
            "(SELECT 1 FROM cases c WHERE c.institution_id = u.institution_id AND c.published_version_id IS NOT NULL)"
        )
        cur.execute(
            f"SELECT u.id, u.institution_id, u.first_name, u.last_name, u.role, u.status, u.default_difficulty, u.learner_id "
            f"FROM users u WHERE {where} ORDER BY u.created_at LIMIT 1",
            (args.learner_id,) if args.learner_id else None,
        )
        row = cur.fetchone()
        if not row:
            print("No suitable learner found. Pass --learner-id.")
            return 1
        user = UserProfile(
            id=str(row["id"]), institution_id=str(row["institution_id"]) if row["institution_id"] else None,
            first_name=row["first_name"], last_name=row["last_name"], display_name=f"{row['first_name']} {row['last_name']}",
            role=row["role"], status=row["status"], default_difficulty=row["default_difficulty"], learner_id=row["learner_id"],
        )
        cur.execute(
            "SELECT id FROM cases WHERE institution_id IS NOT DISTINCT FROM %s AND published_version_id IS NOT NULL ORDER BY created_at LIMIT 1",
            (user.institution_id,),
        )
        case = cur.fetchone()
        if not case:
            print("That learner's institution has no published case.")
            return 1
        case_id = str(case["id"])
        print(f"Acting as {user.display_name} ({user.role}), on case {case_id}. Nothing will be kept.\n")

        def step(name, fn):
            """Run one check inside a savepoint, so a database error in it cannot poison the next one."""
            cur.execute("SAVEPOINT check_step")
            try:
                out = fn()
                cur.execute("RELEASE SAVEPOINT check_step")
                return out
            except Exception as exc:  # noqa: BLE001 - report every kind of failure
                cur.execute("ROLLBACK TO SAVEPOINT check_step")
                report(False, name, f"{type(exc).__name__}: {exc}")
                return None

        def refused(name, fn, status):
            def run():
                try:
                    fn()
                except ps.PlanError as exc:
                    report(exc.status == status, name, f"HTTP {exc.status}: {exc.detail}")
                    return
                report(False, name, "it was accepted but must be refused")
            step(name, run)

        print("Plans")
        plan = step("start a draft", lambda: ps.create_plan(user, case_id, {"mode": "training", "difficulty": "intermediate"}))
        if not plan:
            return 1
        pid = plan["id"]
        report(plan["status"] == "draft" and plan["locked"] is None, "the new plan is a draft", pid)

        saved = step("save the assessment", lambda: ps.update_plan(user, pid, ASSESSMENT))
        report(bool(saved) and "v1_assessment" in saved["payload"], "the assessment is stored")
        saved = step("save tibial work", lambda: ps.update_plan(user, pid, {"v1_tibial": {"implant_size": 4, "is_confirmed": True}}))
        report(bool(saved) and {"v1_assessment", "v1_tibial"} <= set(saved["payload"]), "saving tibial work keeps the assessment (a merge, not a replace)")

        refused("the assessment cannot be changed once measured", lambda: ps.update_plan(user, pid, {"v1_assessment": {}}), 409)
        refused("a field the planner may not write is refused", lambda: ps.update_plan(user, pid, {"v1_vr_payload": {}}), 422)
        refused("a plan cannot be locked without the implant design and fixation", lambda: ps.lock_plan(user, pid, VR, {}), 422)

        listed = step("list my plans for the case", lambda: ps.list_plans(user, case_id=case_id))
        report(bool(listed) and any(p["id"] == pid for p in listed), "the plan is in my list")
        fetched = step("read the plan back", lambda: ps.get_plan(user, pid))
        report(bool(fetched) and fetched["payload"].get("v1_tibial", {}).get("implant_size") == 4, "the saved work reads back")

        locked = step("lock the plan", lambda: ps.lock_plan(user, pid, VR, {"implant_design": "CR", "fixation": "cemented"}))
        report(bool(locked) and locked["status"] == "locked" and bool(locked["locked"]), "the plan is locked")
        if locked:
            snapshot = locked["locked"].get("payload") or {}
            report("v1_vr_payload" in snapshot and "v1_assessment" in snapshot, "the sealed snapshot holds the saved work and the VR payload")
            report(locked["session_config"].get("implant_design") == "CR", "the chosen implant design is frozen with the plan")
        refused("a locked plan cannot be saved to", lambda: ps.update_plan(user, pid, {"v1_tibial": {}}), 409)
        refused("a locked plan cannot be locked again", lambda: ps.lock_plan(user, pid, VR, {}), 409)

        def trigger():
            try:
                cur.execute("UPDATE plans SET payload = '{}'::jsonb WHERE id = %s", (pid,))
            except psycopg2.errors.CheckViolation as exc:
                report(True, "the database itself refuses to change a locked plan", str(exc).splitlines()[0])
                cur.execute("ROLLBACK TO SAVEPOINT check_step")  # the refusal aborted the transaction; undo just that
                return
            report(False, "the database itself refuses to change a locked plan", "the update went through")
        step("database trigger", trigger)

        print("\nHeadset code")
        try:
            sent = step("get a headset code for the locked plan", lambda: cs.create_assignment(user, pid, None, None))
            if sent:
                report(len(str(sent.get("code", ""))) == 6, "a six-digit code was made")
                after = step("read the plan with its headset", lambda: ps.get_plan(user, pid))
                report(bool(after) and (after["headset"] or {}).get("status") == "pending", "the plan now shows a pending code")
        except cs.ConnectUnavailable:
            print("  skipped  migration 015 is not applied, so there is no headset link to check")

        print()
    finally:
        conn.rollback()
        conn.close()
        print("Rolled back: nothing was kept in the database.")

    print(f"\n{'ALL CHECKS PASSED' if not failures else 'FAILED: ' + ', '.join(failures)}")
    return 0 if not failures else 1


if __name__ == "__main__":
    sys.exit(main())
