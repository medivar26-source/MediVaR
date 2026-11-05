"""
Pre-op plans kept in the database: the service's rules and the HTTP layer.

No database exists in the test run, so the service is driven through the same scripted cursor the connectivity
tests use: it answers each statement by matching a fragment of the SQL and records what was executed, so a test
can assert on what was written, what was refused, and what was never written. What it cannot prove is that the
SQL is accepted by Postgres (migration 013 holds the table).
"""
import json
import unittest
from datetime import datetime, timedelta, timezone
from unittest import mock

from fastapi.testclient import TestClient

from core.security import get_current_active_user
from main import app
from schemas.auth import UserProfile
from services import connect_service as cs
from services import plan_service as svc
from tests.test_connect_core import VR
from tests.test_connect_endpoint import FakeCursor, NoDatabase, patched_cursor

NOW = datetime(2026, 11, 5, 10, 0, tzinfo=timezone.utc)
PID = "11111111-1111-4111-8111-111111111111"
CASE = "22222222-2222-4222-8222-222222222222"
PERSONAL = "33333333-3333-4333-8333-333333333333"
VERSION = "44444444-4444-4444-8444-444444444444"
TABLES = [{"p": "plans", "t": "attempts"}]
SETUP = {"mode": "training", "difficulty": "intermediate"}
FULL_SETUP = {**SETUP, "implant_design": "CR", "fixation": "cemented"}


def user(role="resident", uid="u-1", institution="inst-1"):
    return UserProfile(id=uid, first_name="Meera", last_name="Pillai", display_name="Meera Pillai", role=role,
                       status="active", default_difficulty="intermediate", institution_id=institution)


def plan_row(**over):
    row = {
        "id": PID, "owner_id": "u-1", "case_id": CASE, "personal_case_id": None, "case_version_id": VERSION,
        "workflow": "tkr", "session_config": dict(SETUP), "payload": {"workflow": "tkr", "case_id": CASE, "session_config": dict(SETUP)},
        "step_timings": {}, "preset_name": None, "status": "draft", "locked_version_id": None, "locked_at": None,
        "locked_by": None, "locked_snapshot": None, "created_at": NOW, "updated_at": NOW, "attempt_id": None,
    }
    row.update(over)
    return row


def rules(*extra, plan=None):
    base = [("to_regclass('public.plans')", TABLES), ("FROM plans p WHERE p.id", [plan or plan_row()])]
    return FakeCursor(list(extra) + base)


class TestCreate(NoDatabase):
    def test_a_library_case_becomes_a_draft_owned_by_the_caller(self):
        fake = rules(("FROM cases WHERE id", [{"id": CASE, "published_version_id": VERSION}]),
                     ("INSERT INTO plans", [{"id": PID}]))
        with patched_cursor(fake):
            out = svc.create_plan(user(), CASE, SETUP)
        sql, params = [(s, p) for s, p in fake.log if "INSERT INTO plans" in s][0]
        self.assertEqual(params[:4], ("u-1", CASE, None, VERSION))
        self.assertEqual(json.loads(params[4]), SETUP)
        payload = json.loads(params[5])
        self.assertEqual(payload, {"workflow": "tkr", "case_id": CASE, "session_config": SETUP})
        self.assertEqual((out["id"], out["status"], out["is_personal_case"], out["locked"]), (PID, "draft", False, None))

    def test_the_case_is_looked_up_inside_the_callers_institution(self):
        fake = rules(("FROM cases WHERE id", [{"id": CASE, "published_version_id": None}]), ("INSERT INTO plans", [{"id": PID}]))
        with patched_cursor(fake):
            svc.create_plan(user(institution="inst-9"), CASE, SETUP)
        self.assertEqual(fake.ran("FROM cases WHERE id")[0], (CASE, "inst-9"))
        # An unpublished case still gets a draft: the published version is only needed to lock.
        self.assertIsNone(fake.ran("INSERT INTO plans")[0][3])

    def test_a_personal_case_is_stored_in_its_own_column(self):
        fake = rules(("FROM learner_personal_cases", [{"id": PERSONAL}]), ("INSERT INTO plans", [{"id": PID}]),
                     plan=plan_row(case_id=None, personal_case_id=PERSONAL, case_version_id=None))
        with patched_cursor(fake):
            out = svc.create_plan(user(), PERSONAL, SETUP)
        params = fake.ran("INSERT INTO plans")[0]
        self.assertEqual(params[:4], ("u-1", None, PERSONAL, None))
        self.assertEqual(fake.ran("FROM learner_personal_cases")[0], (PERSONAL, "u-1"))
        self.assertTrue(out["is_personal_case"])
        self.assertEqual(out["case_id"], PERSONAL)

    def test_a_case_that_is_not_the_callers_is_not_found_and_nothing_is_written(self):
        fake = rules()
        with patched_cursor(fake), self.assertRaises(svc.PlanError) as ctx:
            svc.create_plan(user(), CASE, SETUP)
        self.assertEqual(ctx.exception.status, 404)
        self.assertEqual(fake.ran("INSERT INTO plans"), [])

    def test_bad_input_is_refused_before_the_database_is_touched(self):
        for case, config in (("CASE_001", SETUP), (CASE, {"difficulty": "expert"}), (CASE, {"mode": "training"}),
                             (CASE, {**SETUP, "mode": "exam"}), (CASE, {**SETUP, "payload": {}}), (CASE, "x")):
            with self.subTest(case=case, config=config), self.assertRaises(svc.PlanError) as ctx:
                svc.create_plan(user(), case, config)
            self.assertEqual(ctx.exception.status, 422)

    def test_the_setup_choices_are_kept_only_when_they_are_real_choices(self):
        fake = rules(("FROM cases WHERE id", [{"id": CASE, "published_version_id": VERSION}]), ("INSERT INTO plans", [{"id": PID}]))
        with patched_cursor(fake):
            svc.create_plan(user(), CASE, {**SETUP, "implant_design": "", "fixation": None})
        self.assertEqual(json.loads(fake.ran("INSERT INTO plans")[0][4]), SETUP)  # nothing defaulted

    def test_without_migration_013_it_says_so(self):
        fake = FakeCursor([("to_regclass('public.plans')", [{"p": None, "t": None}])])
        with patched_cursor(fake), self.assertRaises(svc.PlanUnavailable):
            svc.create_plan(user(), CASE, SETUP)


class TestUpdate(NoDatabase):
    ASSESSMENT = {"v1_assessment": {"MAD_mm": 25.0}, "assessment_landmarks": {"hipCenter": {"x": 1, "y": 2}}}

    def test_planner_fields_are_merged_into_the_stored_payload(self):
        fake = rules(("UPDATE plans SET payload", [{"id": PID}]))
        with patched_cursor(fake):
            out = svc.update_plan(user(), PID, self.ASSESSMENT)
        sql, params = [(s, p) for s, p in fake.log if "UPDATE plans SET payload" in s][0]
        self.assertIn("payload || %s::jsonb", sql)          # merged in the database, not replaced
        self.assertIn("status = 'draft'", sql)               # and never on a locked row
        self.assertEqual(json.loads(params[0]), self.ASSESSMENT)
        self.assertEqual(params[1], PID)
        self.assertEqual(out["status"], "draft")

    def test_only_the_planner_keys_can_be_written(self):
        for bad in ({"v1_vr_payload": {}}, {"session_config": {}}, {"v1_tibial": {}, "status": "locked"}, {"payload": {}}):
            fake = rules()
            with self.subTest(bad=bad), patched_cursor(fake), self.assertRaises(svc.PlanError) as ctx:
                svc.update_plan(user(), PID, bad)
            self.assertEqual(ctx.exception.status, 422)
            self.assertEqual(fake.ran("UPDATE plans"), [])

    def test_a_locked_plan_cannot_be_changed(self):
        fake = rules(plan=plan_row(status="locked", locked_version_id=VERSION, locked_at=NOW))
        with patched_cursor(fake), self.assertRaises(svc.PlanError) as ctx:
            svc.update_plan(user(), PID, {"v1_tibial": {}})
        self.assertEqual(ctx.exception.status, 409)
        self.assertEqual(fake.ran("UPDATE plans"), [])

    def test_the_assessment_freezes_once_it_has_been_measured(self):
        stored = plan_row(payload={"workflow": "tkr", "v1_assessment": {"MAD_mm": 25.0}})
        for key in ("v1_assessment", "assessment_landmarks", "scan_calibration"):
            fake = rules(plan=stored)
            with self.subTest(key=key), patched_cursor(fake), self.assertRaises(svc.PlanError) as ctx:
                svc.update_plan(user(), PID, {key: {}})
            self.assertEqual(ctx.exception.status, 409)
            self.assertEqual(fake.ran("UPDATE plans"), [])
        # Tibial and femoral work is still open to change.
        fake = rules(("UPDATE plans SET payload", [{"id": PID}]), plan=stored)
        with patched_cursor(fake):
            svc.update_plan(user(), PID, {"v1_tibial": {"implant_size": 4}})
        self.assertEqual(len(fake.ran("UPDATE plans SET payload")), 1)

    def test_only_the_owner_writes_and_everyone_else_is_told_not_found(self):
        for other in (user(uid="u-2"), user(role="instructor", uid="i-1"), user(role="admin", uid="a-1")):
            fake = rules()
            with self.subTest(role=other.role), patched_cursor(fake), self.assertRaises(svc.PlanError) as ctx:
                svc.update_plan(other, PID, {"v1_tibial": {}})
            self.assertEqual(ctx.exception.status, 404)
            self.assertEqual(fake.ran("UPDATE plans"), [])

    def test_values_that_are_not_json_are_refused(self):
        for bad in ({"v1_tibial": {"x": float("nan")}}, {"v1_tibial": {"x": float("inf")}}, {"v1_tibial": {"x": object()}}):
            with self.subTest(bad=bad), self.assertRaises(svc.PlanError) as ctx:
                svc.update_plan(user(), PID, bad)
            self.assertEqual(ctx.exception.status, 422)

    def test_an_empty_or_oversized_update_is_refused(self):
        with self.assertRaises(svc.PlanError):
            svc.update_plan(user(), PID, {})
        with self.assertRaises(svc.PlanError):
            svc.update_plan(user(), PID, {"scan_calibration": {"blob": "x" * 1_100_000}})

    def test_an_unknown_plan_id_is_not_found_without_a_query(self):
        with self.assertRaises(svc.PlanError) as ctx:
            svc.update_plan(user(), "not-a-uuid", {"v1_tibial": {}})
        self.assertEqual(ctx.exception.status, 404)


class TestLock(NoDatabase):
    def lock(self, fake, **kw):
        with patched_cursor(fake):
            return svc.lock_plan(kw.pop("who", user()), PID, kw.pop("vr", VR), kw.pop("choices", None))

    def test_a_draft_is_sealed_from_what_is_stored_not_from_what_the_browser_says(self):
        stored = {"workflow": "tkr", "v1_assessment": {"MAD_mm": 25.0}, "session_config": dict(FULL_SETUP)}
        fake = rules(("UPDATE plans SET payload", [{"id": PID}]), plan=plan_row(session_config=dict(FULL_SETUP), payload=stored))
        out = self.lock(fake)
        sql, params = [(s, p) for s, p in fake.log if "UPDATE plans SET payload" in s][0]
        self.assertIn("status = 'draft'", sql)
        payload, config, version, locked_id, by, snapshot, vr, plan_id = params
        self.assertEqual(json.loads(payload), json.loads(snapshot))           # the snapshot is the sealed payload
        self.assertEqual(json.loads(snapshot)["v1_assessment"], {"MAD_mm": 25.0})  # from the stored draft
        self.assertEqual(json.loads(snapshot)["v1_vr_payload"], VR)
        self.assertEqual(json.loads(vr), VR)
        self.assertEqual((json.loads(config), version, by, plan_id), (FULL_SETUP, VERSION, "u-1", PID))
        self.assertRegex(locked_id, r"^[0-9a-f-]{36}$")
        self.assertEqual(out["id"], PID)

    def test_the_implant_design_and_fixation_are_taken_at_lock_when_the_plan_never_had_them(self):
        fake = rules(("UPDATE plans SET payload", [{"id": PID}]),
                     plan=plan_row(payload={"workflow": "tkr", "session_config": dict(SETUP)}))
        self.lock(fake, choices={"implant_design": "PS", "fixation": "cementless"})
        params = fake.ran("UPDATE plans SET payload")[0]
        self.assertEqual(json.loads(params[1]), {**SETUP, "implant_design": "PS", "fixation": "cementless"})
        self.assertEqual(json.loads(params[0])["session_config"]["implant_design"], "PS")  # the payload agrees with the column

    def test_a_plan_without_the_choices_is_not_sealed_and_nothing_is_defaulted(self):
        fake = rules()
        with patched_cursor(fake), self.assertRaises(svc.PlanError) as ctx:
            svc.lock_plan(user(), PID, VR, {})
        self.assertEqual(ctx.exception.status, 422)
        self.assertIn("implant_design", ctx.exception.detail)
        self.assertIn("fixation", ctx.exception.detail)
        self.assertEqual(fake.ran("UPDATE plans"), [])

    def test_a_bad_vr_payload_is_refused(self):
        fake = rules(plan=plan_row(session_config=dict(FULL_SETUP)))
        with patched_cursor(fake), self.assertRaises(svc.PlanError) as ctx:
            svc.lock_plan(user(), PID, {"patient_id": "x"})
        self.assertEqual(ctx.exception.status, 422)
        self.assertEqual(fake.ran("UPDATE plans"), [])

    def test_mode_and_difficulty_are_not_changeable_at_lock(self):
        with self.assertRaises(svc.PlanError) as ctx:
            svc.lock_plan(user(), PID, VR, {"difficulty": "expert"})
        self.assertEqual(ctx.exception.status, 422)

    def test_an_already_locked_plan_is_refused(self):
        fake = rules(plan=plan_row(status="locked", locked_version_id=VERSION, locked_at=NOW))
        with patched_cursor(fake), self.assertRaises(svc.PlanError) as ctx:
            svc.lock_plan(user(), PID, VR, {})
        self.assertEqual(ctx.exception.status, 409)

    def test_a_losing_race_to_lock_is_a_409_not_a_second_seal(self):
        fake = rules(("UPDATE plans SET payload", []), plan=plan_row(session_config=dict(FULL_SETUP)))
        with patched_cursor(fake), self.assertRaises(svc.PlanError) as ctx:
            svc.lock_plan(user(), PID, VR, {})
        self.assertEqual(ctx.exception.status, 409)

    def test_only_the_owner_locks(self):
        fake = rules(plan=plan_row(session_config=dict(FULL_SETUP)))
        with patched_cursor(fake), self.assertRaises(svc.PlanError) as ctx:
            svc.lock_plan(user(role="instructor", uid="i-1"), PID, VR, {})
        self.assertEqual(ctx.exception.status, 404)
        self.assertEqual(fake.ran("UPDATE plans"), [])

    def test_a_case_that_was_never_published_cannot_be_locked_against(self):
        fake = rules(("FROM cases WHERE id", [{"published_version_id": None}]),
                     plan=plan_row(session_config=dict(FULL_SETUP), case_version_id=None))
        with patched_cursor(fake), self.assertRaises(svc.PlanError) as ctx:
            svc.lock_plan(user(), PID, VR, {})
        self.assertEqual(ctx.exception.status, 409)
        self.assertEqual(fake.ran("UPDATE plans"), [])

    def test_the_published_version_is_recorded_when_the_draft_began_before_publishing(self):
        fake = rules(("FROM cases", [{"published_version_id": VERSION}]), ("UPDATE plans SET payload", [{"id": PID}]),
                     plan=plan_row(session_config=dict(FULL_SETUP), case_version_id=None))
        self.lock(fake)
        self.assertEqual(fake.ran("UPDATE plans SET payload")[0][2], VERSION)

    def test_a_personal_case_plan_locks_without_a_case_version(self):
        fake = rules(("UPDATE plans SET payload", [{"id": PID}]),
                     plan=plan_row(case_id=None, personal_case_id=PERSONAL, case_version_id=None, session_config=dict(FULL_SETUP)))
        self.lock(fake)
        self.assertIsNone(fake.ran("UPDATE plans SET payload")[0][2])
        self.assertEqual(fake.ran("FROM cases"), [])


class TestRead(NoDatabase):
    def test_the_owner_reads_the_plan_with_its_snapshot(self):
        locked = plan_row(status="locked", locked_version_id=VERSION, locked_at=NOW, locked_by="u-1", locked_snapshot={"a": 1},
                          attempt_id="55555555-5555-4555-8555-555555555555")
        fake = rules(("to_regclass('public.assignments')", [{"a": None}]), plan=locked)
        with patched_cursor(fake):
            out = svc.get_plan(user(), PID)
        self.assertEqual(out["locked"], {"version_id": VERSION, "sealed_by": "u-1", "sealed_at": NOW.isoformat(), "payload": {"a": 1}})
        self.assertEqual(out["attempt_id"], "55555555-5555-4555-8555-555555555555")
        self.assertIsNone(out["headset"])

    def test_a_stranger_gets_not_found_never_forbidden(self):
        fake = rules(("FROM cohort_members", []))
        for other in (user(uid="u-2"), user(role="instructor", uid="i-1")):
            with self.subTest(role=other.role), patched_cursor(fake), self.assertRaises(svc.PlanError) as ctx:
                svc.get_plan(other, PID)
            self.assertEqual(ctx.exception.status, 404)

    def test_the_supervising_instructor_can_read(self):
        fake = rules(("FROM cohort_members", [{"x": 1}]), ("to_regclass('public.assignments')", [{"a": None}]))
        with patched_cursor(fake):
            out = svc.get_plan(user(role="instructor", uid="i-1"), PID)
        self.assertEqual(out["id"], PID)

    def test_an_administrator_reads_within_their_institution_only(self):
        fake = rules(("FROM users WHERE id", [{"x": 1}]), ("to_regclass('public.assignments')", [{"a": None}]))
        with patched_cursor(fake):
            svc.get_plan(user(role="admin", uid="a-1", institution="inst-1"), PID)
        self.assertEqual(fake.ran("FROM users WHERE id")[0], ("u-1", "inst-1"))
        none = rules(("FROM users WHERE id", []))
        with patched_cursor(none), self.assertRaises(svc.PlanError):
            svc.get_plan(user(role="admin", uid="a-1", institution="inst-2"), PID)

    def test_listing_returns_my_plans_with_the_state_of_their_headset_code(self):
        long_ago = datetime(2020, 1, 1, tzinfo=timezone.utc)
        fake = FakeCursor([
            ("to_regclass('public.plans')", TABLES),
            ("FROM plans p WHERE", [plan_row(), plan_row(id="66666666-6666-4666-8666-666666666666")]),
            ("to_regclass('public.assignments')", [{"a": "assignments"}]),
            ("FROM assignments WHERE plan_id", [
                {"plan_id": PID, "status": "pending", "code_expires_at": datetime.now(timezone.utc) + timedelta(minutes=5), "paired_at": None, "created_at": NOW},
                {"plan_id": "66666666-6666-4666-8666-666666666666", "status": "pending", "code_expires_at": long_ago, "paired_at": None, "created_at": NOW},
            ]),
        ])
        with patched_cursor(fake):
            out = svc.list_plans(user())
        self.assertEqual(fake.ran("FROM plans p WHERE")[0][0], "u-1")
        self.assertEqual([p["headset"]["status"] for p in out], ["pending", "expired"])  # expiry is derived, not written
        self.assertNotIn("payload", out[0]["locked"] or {})
        self.assertEqual(fake.ran("UPDATE"), [])

    def test_listing_can_be_narrowed_to_one_case(self):
        fake = FakeCursor([("to_regclass('public.plans')", TABLES), ("FROM plans p WHERE", [])])
        with patched_cursor(fake):
            svc.list_plans(user(), case_id=CASE)
        self.assertEqual(tuple(fake.ran("FROM plans p WHERE")[0]), ("u-1", CASE, CASE, svc.DEFAULT_LIMIT))

    def test_a_built_in_case_has_no_stored_plans_and_costs_no_query(self):
        self.assertEqual(svc.list_plans(user(), case_id="CASE_001"), [])

    def test_supervised_listing_is_for_staff(self):
        with self.assertRaises(svc.PlanError) as ctx:
            svc.list_plans(user(), supervised=True)
        self.assertEqual(ctx.exception.status, 403)
        fake = FakeCursor([("to_regclass('public.plans')", TABLES), ("FROM plans p WHERE", [])])
        with patched_cursor(fake):
            svc.list_plans(user(role="instructor", uid="i-1"), case_id=CASE, supervised=True)
        sql, params = fake.log[1]
        self.assertIn("c.owner_id = %s", sql)
        self.assertEqual(params[0], "i-1")
        self.assertNotIn("p.owner_id = %s", sql)

    def test_the_limit_is_bounded(self):
        fake = FakeCursor([("to_regclass('public.plans')", TABLES), ("FROM plans p WHERE", [])])
        with patched_cursor(fake):
            svc.list_plans(user(), limit=10_000)
        self.assertEqual(fake.log[1][1][-1], svc.MAX_LIMIT)


class TestHttp(NoDatabase):
    def setUp(self):
        super().setUp()
        self.client = TestClient(app)

    def tearDown(self):
        app.dependency_overrides.clear()

    def as_learner(self):
        app.dependency_overrides[get_current_active_user] = lambda: user()

    def test_every_call_needs_a_signed_in_user(self):
        calls = [("post", "/api/v1/plans", {"case_id": CASE, "session_config": SETUP}), ("get", "/api/v1/plans", None),
                 ("get", f"/api/v1/plans/{PID}", None), ("patch", f"/api/v1/plans/{PID}", {"payload": {}}),
                 ("post", f"/api/v1/plans/{PID}/lock", {"vr_payload": {}})]
        for method, url, body in calls:
            r = getattr(self.client, method)(url, **({"json": body} if body is not None else {}))
            self.assertEqual(r.status_code, 401, (method, url))

    def test_the_routes_reach_the_service_with_the_caller(self):
        self.as_learner()
        with mock.patch.object(svc, "create_plan", return_value={"id": PID}) as create, \
             mock.patch.object(svc, "list_plans", return_value=[]) as listing, \
             mock.patch.object(svc, "get_plan", return_value={"id": PID}) as get, \
             mock.patch.object(svc, "update_plan", return_value={"id": PID}) as update, \
             mock.patch.object(svc, "lock_plan", return_value={"id": PID}) as lock:
            self.assertEqual(self.client.post("/api/v1/plans", json={"case_id": CASE, "session_config": SETUP}).status_code, 201)
            self.assertEqual(self.client.get("/api/v1/plans?case_id=" + CASE).status_code, 200)
            self.assertEqual(self.client.get("/api/v1/plans?supervised=true").status_code, 200)
            self.assertEqual(self.client.get(f"/api/v1/plans/{PID}").status_code, 200)
            self.assertEqual(self.client.patch(f"/api/v1/plans/{PID}", json={"payload": {"v1_tibial": {}}}).status_code, 200)
            self.assertEqual(self.client.post(f"/api/v1/plans/{PID}/lock", json={"vr_payload": VR, "session_config": {"fixation": "cemented"}}).status_code, 200)
        self.assertEqual(create.call_args.args[1:], (CASE, SETUP))
        self.assertEqual(listing.call_args_list[0].args[1:], (CASE, False, 200))
        self.assertEqual(listing.call_args_list[1].args[1:], (None, True, 200))
        self.assertEqual(get.call_args.args[1], PID)
        self.assertEqual(update.call_args.args[1:], (PID, {"v1_tibial": {}}))
        self.assertEqual(lock.call_args.args[1:], (PID, VR, {"fixation": "cemented"}))
        self.assertEqual(create.call_args.args[0].id, "u-1")

    def test_service_errors_become_their_http_status(self):
        self.as_learner()
        with mock.patch.object(svc, "update_plan", side_effect=svc.PlanError(409, "This plan is locked.")):
            r = self.client.patch(f"/api/v1/plans/{PID}", json={"payload": {"v1_tibial": {}}})
        self.assertEqual((r.status_code, r.json()["detail"]), (409, "This plan is locked."))
        with mock.patch.object(svc, "get_plan", side_effect=svc.PlanUnavailable()):
            r = self.client.get(f"/api/v1/plans/{PID}")
        self.assertEqual(r.status_code, 404)
        self.assertIn("013", r.json()["detail"])

    def test_the_older_store_a_sealed_plan_route_still_goes_to_the_headset_router(self):
        self.as_learner()
        with mock.patch.object(cs, "store_locked_plan", return_value={"id": PID, "status": "locked"}) as old, \
             mock.patch.object(svc, "lock_plan") as new:
            r = self.client.post("/api/v1/plans/locked", json={"case_id": CASE})
        self.assertEqual(r.status_code, 200)
        self.assertTrue(old.called)
        self.assertFalse(new.called)


if __name__ == "__main__":
    unittest.main()
