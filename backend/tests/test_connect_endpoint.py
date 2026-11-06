"""
Dashboard <-> Quest 3: the HTTP layer and the service's flow.

No live database exists in the test run (and migration 015 is not applied), so the service is driven through a
scripted cursor: it answers each statement by matching a fragment of the SQL, records what was executed, and
lets the test assert on the *behaviour* (what was stored, what was refused, what was never written in the
clear). What it cannot prove is that the SQL is accepted by Postgres; that needs the migration applied.
"""
import json
import unittest
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from unittest import mock

from fastapi.testclient import TestClient

from core.connect import pairing
from core.security import get_current_active_user
from main import app
from schemas.auth import UserProfile
from services import connect_service as svc
from tests.test_connect_core import CONFIG, CRITERIA as _UNUSED, VR, complete_report, plan as make_plan  # noqa: F401

NOW = datetime(2026, 11, 3, 10, 0, tzinfo=timezone.utc)
LEARNER = UserProfile(id="u-1", first_name="Meera", last_name="Pillai", display_name="Meera Pillai", role="resident",
                      status="active", default_difficulty="intermediate")
DEVICE = {"uuid": "d-1", "device_id": "quest-1"}
TABLES = [{"a": "assignments", "r": "run_reports", "p": "plans", "t": "attempts"}]


class NoDatabase(unittest.TestCase):
    """Every test here runs with the database unreachable: reaching for one fails the test."""

    def setUp(self):
        super().setUp()
        guard = mock.patch.object(svc, "get_db_conn", side_effect=AssertionError("a test reached for a database"))
        guard.start()
        self.addCleanup(guard.stop)


class FakeCursor:
    """Answers a statement with the first rule whose fragment it contains; anything else returns no rows."""

    def __init__(self, rules):
        self.rules, self.log, self._rows = rules, [], []

    def execute(self, sql, params=None):
        flat = " ".join(sql.split())
        self.log.append((flat, params))
        self._rows = []
        for fragment, rows in self.rules:
            if fragment in flat:
                self._rows = [dict(r) for r in (rows() if callable(rows) else rows)]
                return

    def fetchone(self):
        return self._rows.pop(0) if self._rows else None

    def fetchall(self):
        rows, self._rows = self._rows, []
        return rows

    def ran(self, fragment):
        return [p for sql, p in self.log if fragment in sql]


def patched_cursor(fake):
    @contextmanager
    def _cursor():
        yield fake
    return mock.patch.object(svc, "cursor", _cursor)


def locked_plan(**over):
    row = {"id": "p-1", "owner_id": "u-1", "status": "locked", "case_id": "c-1", "personal_case_id": None,
           "case_version_id": "cv-1", "session_config": CONFIG, "payload": {}, "vr_payload": VR, "locked_version_id": "lv-1"}
    row.update(over)
    return row


CASE_AND_WHO = [
    ("FROM case_versions", [{"title": "Severe varus osteoarthritis (left knee)", "pathology": "varus", "pathology_label": "Severe varus", "patient": {}}]),
    ("FROM users u", [{"first_name": "Meera", "last_name": "Pillai", "institution": "Demo", "cohort": "Sample", "instructor": "Jane Doe"}]),
]


class TestHttpLayer(NoDatabase):
    def setUp(self):
        super().setUp()
        self.client = TestClient(app)
        svc.THROTTLE._hits.clear()

    def tearDown(self):
        app.dependency_overrides.clear()

    def as_learner(self):
        app.dependency_overrides[get_current_active_user] = lambda: LEARNER

    def test_the_dashboard_calls_need_a_signed_in_user(self):
        self.assertEqual(self.client.post("/api/v1/assignments", json={"plan_id": "p-1"}).status_code, 401)
        self.assertEqual(self.client.get("/api/v1/assignments").status_code, 401)
        self.assertEqual(self.client.post("/api/v1/plans/locked", json={}).status_code, 401)

    def test_everything_is_404_not_set_up_until_015_is_applied(self):
        self.as_learner()
        with mock.patch.object(svc, "create_assignment", side_effect=svc.ConnectUnavailable()):
            r = self.client.post("/api/v1/assignments", json={"plan_id": "p-1"})
        self.assertEqual(r.status_code, 404)
        self.assertIn("015", r.json()["detail"])

    def test_creating_an_assignment_returns_the_code_once(self):
        self.as_learner()
        out = {"id": "a-1", "plan_id": "p-1", "status": "pending", "headset_mode": "Practice", "code": "004217", "code_expires_at": "x"}
        with mock.patch.object(svc, "create_assignment", return_value=out) as m:
            r = self.client.post("/api/v1/assignments", json={"plan_id": "p-1", "mode": "Exam"})
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.json()["code"], "004217")
        self.assertEqual(m.call_args.args[1:], ("p-1", "Exam", None))

    def test_service_errors_become_their_http_status_and_retry_after(self):
        self.as_learner()
        with mock.patch.object(svc, "create_assignment", side_effect=svc.ConnectError(409, "Lock the plan first.")):
            r = self.client.post("/api/v1/assignments", json={"plan_id": "p-1"})
        self.assertEqual((r.status_code, r.json()["detail"]), (409, "Lock the plan first."))
        with mock.patch.object(svc, "pair_device", side_effect=svc.ConnectError(429, "slow down", retry_after=42)):
            r = self.client.post("/api/v1/devices/pair", json={"code": "004217", "deviceId": "q", "deviceName": "Q", "appVersion": "1"})
        self.assertEqual(r.status_code, 429)
        self.assertEqual(r.headers["retry-after"], "42")

    def test_pairing_needs_no_token_but_everything_after_it_does(self):
        r = self.client.get("/api/v1/assignments/a-1/plan")
        self.assertEqual(r.status_code, 401)
        r = self.client.put("/api/v1/assignments/a-1/runs/r-1/report", json={})
        self.assertEqual(r.status_code, 401)

    def test_a_valid_bearer_reaches_the_service_with_the_device(self):
        @contextmanager
        def fake_cursor():
            yield FakeCursor([("to_regclass", TABLES)])
        with mock.patch.object(svc, "cursor", fake_cursor), \
             mock.patch.object(svc, "authenticate_device", return_value=DEVICE) as auth, \
             mock.patch.object(svc, "ingest_report", return_value={"accepted": True}) as ingest:
            r = self.client.put("/api/v1/assignments/a-1/runs/r-1/report", json={"runId": "r-1"},
                                headers={"Authorization": "Bearer tok-123"})
        self.assertEqual(r.status_code, 200)
        self.assertEqual(auth.call_args.args[1], "tok-123")
        self.assertEqual(ingest.call_args.args[0], DEVICE)
        self.assertEqual(ingest.call_args.args[1:3], ("a-1", "r-1"))

    def test_an_unknown_token_is_401_re_pair(self):
        @contextmanager
        def fake_cursor():
            yield FakeCursor([("to_regclass", TABLES)])
        with mock.patch.object(svc, "cursor", fake_cursor), mock.patch.object(svc, "authenticate_device", return_value=None):
            r = self.client.get("/api/v1/assignments/a-1/plan", headers={"Authorization": "Bearer nope"})
        self.assertEqual(r.status_code, 401)
        self.assertEqual(r.json()["detail"], "Re-pair to upload")

    def test_health_keeps_status_and_adds_what_the_headset_reads(self):
        body = self.client.get("/api/v1/health").json()
        self.assertEqual(body["status"], "ok")
        self.assertEqual(body["apiVersion"], 1)
        self.assertRegex(body["serverTimeUtc"], r"^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$")


class TestAssignmentFlow(NoDatabase):
    def rules(self, **over):
        base = {"to_regclass": TABLES, "FROM plans WHERE id": [locked_plan()], "FROM attempts WHERE plan_id": [],
                "SELECT 1 FROM assignments WHERE plan_id": [], "INSERT INTO assignments": [{"id": "a-1"}]}
        base.update(over)
        return list(base.items())

    def test_a_locked_plan_gets_a_hashed_code_and_the_plain_code_is_returned_once(self):
        fake = FakeCursor(self.rules())
        with patched_cursor(fake):
            out = svc.create_assignment(LEARNER, "p-1")
        self.assertRegex(out["code"], r"^\d{6}$")
        self.assertEqual(out["headset_mode"], "Practice")
        (params,) = fake.ran("INSERT INTO assignments")
        self.assertIn(pairing.hash_code(out["code"]), params)
        self.assertNotIn(out["code"], params)                    # the clear code is never written
        # An unused earlier code for the same plan is replaced, and stale ones are expired first.
        self.assertTrue(fake.ran("SET status = 'cancelled'"))
        self.assertTrue(fake.ran("SET status = 'expired'"))

    def test_the_plan_must_be_locked(self):
        fake = FakeCursor(self.rules(**{"FROM plans WHERE id": [locked_plan(status="draft")]}))
        with patched_cursor(fake), self.assertRaises(svc.ConnectError) as cm:
            svc.create_assignment(LEARNER, "p-1")
        self.assertEqual(cm.exception.status, 409)
        self.assertFalse(fake.ran("INSERT INTO assignments"))

    def test_someone_elses_plan_looks_like_it_does_not_exist(self):
        fake = FakeCursor(self.rules(**{"FROM plans WHERE id": [locked_plan(owner_id="u-2")]}))
        with patched_cursor(fake), self.assertRaises(svc.ConnectError) as cm:
            svc.create_assignment(LEARNER, "p-1")
        self.assertEqual(cm.exception.status, 404)

    def test_a_performed_plan_is_not_sent_again(self):
        fake = FakeCursor(self.rules(**{"FROM attempts WHERE plan_id": [{"?column?": 1}]}))
        with patched_cursor(fake), self.assertRaises(svc.ConnectError) as cm:
            svc.create_assignment(LEARNER, "p-1")
        self.assertEqual(cm.exception.status, 409)
        self.assertIn("performed", cm.exception.detail)

    def test_a_plan_already_with_a_headset_is_refused(self):
        fake = FakeCursor(self.rules(**{"SELECT 1 FROM assignments WHERE plan_id": [{"?column?": 1}]}))
        with patched_cursor(fake), self.assertRaises(svc.ConnectError) as cm:
            svc.create_assignment(LEARNER, "p-1")
        self.assertEqual(cm.exception.status, 409)

    def test_disconnect_cancels_the_link_revokes_the_devices_tokens_and_ends_the_live_run(self):
        fake = FakeCursor([
            ("to_regclass", TABLES),
            ("FROM assignments WHERE id", [{"id": "a-1", "plan_id": "p-1", "resident_id": "u-1", "status": "running", "device_id": "d-1"}]),
            ("public.live_runs", [{"l": "live_runs", "e": "run_events", "f": "live_frames"}]),
        ])
        fake.rowcount = 1
        with patched_cursor(fake), mock.patch("services.live_service.cursor", side_effect=AssertionError("live must share the transaction")):
            out = svc.disconnect_assignment(LEARNER, "a-1")
        self.assertEqual((out["status"], out["was"], out["tokens_revoked"]), ("cancelled", "running", 1))
        self.assertEqual(fake.ran("UPDATE assignments SET status = 'cancelled'"), [("a-1",)])
        self.assertEqual(fake.ran("UPDATE device_tokens SET revoked_at"), [("d-1",)])
        self.assertTrue(fake.ran("UPDATE live_runs SET ended_at"), "the live run is closed in the same transaction")
        self.assertEqual(fake.ran("DELETE FROM live_frames"), [("a-1",)])

    def test_disconnect_leaves_a_reported_run_alone_and_hides_a_strangers(self):
        fake = FakeCursor([("to_regclass", TABLES),
                           ("FROM assignments WHERE id", [{"id": "a-1", "plan_id": "p-1", "resident_id": "u-1", "status": "reported", "device_id": "d-1"}])])
        with patched_cursor(fake), self.assertRaises(svc.ConnectError) as cm:
            svc.disconnect_assignment(LEARNER, "a-1")
        self.assertEqual(cm.exception.status, 409)
        fake = FakeCursor([("to_regclass", TABLES),
                           ("FROM assignments WHERE id", [{"id": "a-1", "plan_id": "p-1", "resident_id": "someone-else", "status": "paired", "device_id": "d-1"}])])
        with patched_cursor(fake), self.assertRaises(svc.ConnectError) as cm:
            svc.disconnect_assignment(LEARNER, "a-1")
        self.assertEqual(cm.exception.status, 404)

    def test_migration_missing_is_reported_as_unavailable(self):
        fake = FakeCursor([("to_regclass", [{"a": None, "r": None, "p": "plans", "t": "attempts"}])])
        with patched_cursor(fake), self.assertRaises(svc.ConnectUnavailable):
            svc.create_assignment(LEARNER, "p-1")


class TestStoreLockedPlan(NoDatabase):
    BODY = {"case_id": "c-1", "session_config": CONFIG, "payload": {"v1_assessment": {}}, "vr_payload": VR, "locked_version_id": "lv-9"}

    def test_a_valid_sealed_plan_is_stored_locked_with_the_case_version_pinned(self):
        fake = FakeCursor([("to_regclass", TABLES), ("FROM cases", [{"published_version_id": "cv-1"}]), ("INSERT INTO plans", [{"id": "p-9"}])])
        with patched_cursor(fake):
            out = svc.store_locked_plan(LEARNER, dict(self.BODY))
        self.assertEqual(out, {"id": "p-9", "status": "locked", "locked_version_id": "lv-9"})
        (params,) = fake.ran("INSERT INTO plans")
        self.assertIn("cv-1", params)

    def test_the_vr_payload_must_have_the_v1_shape(self):
        bad = dict(self.BODY, vr_payload=dict(VR, knee_side="LEFTISH"))
        with self.assertRaises(svc.ConnectError) as cm:
            svc.store_locked_plan(LEARNER, bad)
        self.assertEqual(cm.exception.status, 422)
        self.assertIn("knee_side", cm.exception.detail)

    def test_exactly_one_case_reference(self):
        for body in (dict(self.BODY, personal_case_id="x"), {k: v for k, v in self.BODY.items() if k != "case_id"}):
            with self.assertRaises(svc.ConnectError) as cm:
                svc.store_locked_plan(LEARNER, body)
            self.assertEqual(cm.exception.status, 422)

    def test_a_case_that_is_not_published_is_refused(self):
        fake = FakeCursor([("to_regclass", TABLES), ("FROM cases", [])])
        with patched_cursor(fake), self.assertRaises(svc.ConnectError) as cm:
            svc.store_locked_plan(LEARNER, dict(self.BODY))
        self.assertEqual(cm.exception.status, 404)
        self.assertFalse(fake.ran("INSERT INTO plans"))

    def test_sealing_the_same_version_twice_is_idempotent_for_its_owner_only(self):
        again = [("to_regclass", TABLES), ("FROM cases", [{"published_version_id": "cv-1"}]), ("INSERT INTO plans", []),
                 ("SELECT id, owner_id FROM plans", [{"id": "p-9", "owner_id": "u-1"}])]
        with patched_cursor(FakeCursor(again)):
            self.assertEqual(svc.store_locked_plan(LEARNER, dict(self.BODY))["id"], "p-9")
        theirs = [("to_regclass", TABLES), ("FROM cases", [{"published_version_id": "cv-1"}]), ("INSERT INTO plans", []),
                  ("SELECT id, owner_id FROM plans", [{"id": "p-9", "owner_id": "u-2"}])]
        with patched_cursor(FakeCursor(theirs)), self.assertRaises(svc.ConnectError) as cm:
            svc.store_locked_plan(LEARNER, dict(self.BODY))
        self.assertEqual(cm.exception.status, 409)


class TestPairing(NoDatabase):
    BODY = {"code": "004217", "deviceId": "quest-1", "deviceName": "Quest 3", "appVersion": "0.9"}

    def setUp(self):
        super().setUp()
        svc.THROTTLE._hits.clear()

    def rules(self, assignment_rows):
        pending = {"id": "a-1", "plan_id": "p-1", "status": "paired", "headset_mode": "Practice", "device_id": "d-1"}
        return [("to_regclass", TABLES), ("FROM assignments WHERE code_hash", assignment_rows),
                ("INSERT INTO devices", [{"id": "d-1"}]), ("SET status = 'paired'", [pending]),
                ("FROM plans WHERE id", [locked_plan()])] + CASE_AND_WHO

    def live(self, **over):
        row = {"id": "a-1", "plan_id": "p-1", "status": "pending", "code_expires_at": datetime.now(timezone.utc) + timedelta(minutes=5),
               "code_consumed_at": None}
        row.update(over)
        return [row]

    def test_a_good_code_returns_a_token_and_the_plan_and_stores_only_hashes(self):
        fake = FakeCursor(self.rules(self.live()))
        with patched_cursor(fake):
            out = svc.pair_device(dict(self.BODY), "1.2.3.4|quest-1")
        self.assertEqual(out["assignmentId"], "a-1")
        self.assertGreaterEqual(len(out["token"]), 40)
        self.assertEqual(out["casePlan"]["trainee"]["displayName"], "Meera Pillai")
        self.assertEqual(out["casePlan"]["patient"]["deformity"], "Varus")
        self.assertEqual(out["casePlan"]["mode"], "Practice")
        (lookup,) = fake.ran("FROM assignments WHERE code_hash")
        self.assertEqual(lookup, (pairing.hash_code("004217"),))
        (token_params,) = fake.ran("INSERT INTO device_tokens")
        self.assertIn(pairing.hash_token(out["token"]), token_params)
        self.assertNotIn(out["token"], token_params)
        # Pairing again replaces the device's earlier token.
        self.assertTrue(fake.ran("UPDATE device_tokens SET revoked_at"))

    def test_a_typed_code_with_spaces_still_matches(self):
        fake = FakeCursor(self.rules(self.live()))
        with patched_cursor(fake):
            svc.pair_device(dict(self.BODY, code="004 217"), "c")
        self.assertEqual(fake.ran("FROM assignments WHERE code_hash")[0], (pairing.hash_code("004217"),))

    def test_unknown_expired_and_used_codes_get_the_contracts_statuses(self):
        cases = [([], 404), (self.live(code_expires_at=datetime.now(timezone.utc) - timedelta(seconds=1)), 410),
                 (self.live(code_consumed_at=NOW, status="paired"), 410)]
        for rows, status in cases:
            with patched_cursor(FakeCursor(self.rules(rows))), self.assertRaises(svc.ConnectError) as cm:
                svc.pair_device(dict(self.BODY), "client-a")
            self.assertEqual(cm.exception.status, status)

    def test_a_malformed_code_is_not_recognised_and_never_reaches_the_database_lookup(self):
        fake = FakeCursor(self.rules(self.live()))
        with patched_cursor(fake), self.assertRaises(svc.ConnectError) as cm:
            svc.pair_device(dict(self.BODY, code="12"), "client-b")
        self.assertEqual(cm.exception.status, 404)
        self.assertFalse(fake.ran("FROM assignments WHERE code_hash"))

    def test_too_many_wrong_codes_lock_the_client_out_with_retry_after(self):
        key = "client-c"
        for _ in range(pairing.MAX_FAILURES):
            with patched_cursor(FakeCursor(self.rules([]))), self.assertRaises(svc.ConnectError):
                svc.pair_device(dict(self.BODY), key)
        fake = FakeCursor(self.rules(self.live()))   # even the right code is refused while locked out
        with patched_cursor(fake), self.assertRaises(svc.ConnectError) as cm:
            svc.pair_device(dict(self.BODY), key)
        self.assertEqual(cm.exception.status, 429)
        self.assertGreater(cm.exception.retry_after, 0)
        self.assertFalse(fake.ran("FROM assignments WHERE code_hash"))

    def test_a_race_for_the_same_code_loses_cleanly(self):
        rules = self.rules(self.live())
        rules = [(f, []) if f == "SET status = 'paired'" else (f, r) for f, r in rules]
        with patched_cursor(FakeCursor(rules)), self.assertRaises(svc.ConnectError) as cm:
            svc.pair_device(dict(self.BODY), "client-d")
        self.assertEqual(cm.exception.status, 410)

    def test_a_plan_that_cannot_be_sent_stops_pairing(self):
        rules = [(f, [locked_plan(vr_payload=dict(VR, knee_side=""))]) if f == "FROM plans WHERE id" else (f, r)
                 for f, r in self.rules(self.live())]
        with patched_cursor(FakeCursor(rules)), self.assertRaises(svc.ConnectError) as cm:
            svc.pair_device(dict(self.BODY), "client-e")
        self.assertEqual(cm.exception.status, 409)
        self.assertIn("side", cm.exception.detail)


class TestIngest(NoDatabase):
    def rules(self, *, existing=None, attempt=None, assignment=None, criteria=None, result_exists=False):
        assignment = assignment or {"id": "a-1", "plan_id": "p-1", "status": "paired", "headset_mode": "Practice",
                                    "device_id": "d-1", "session_id": None}
        criteria = criteria if criteria is not None else [{"name": "MAD", "parameter": "MAD_mm", "unit": "mm", "target_value": 25.0,
                                                           "tolerance_max": 2.0, "severity_rule": {"minor": 2.0, "major": 4.0, "critical": 6.0}}]
        return [
            ("to_regclass", TABLES),
            ("FROM assignments WHERE id", [assignment]),
            ("FROM run_reports WHERE assignment_id", [existing] if existing else []),
            ("FROM plans WHERE id", [locked_plan()]),
            ("FROM attempts WHERE plan_id", [attempt] if attempt else []),
            ("INSERT INTO attempts", [{"id": "att-1"}]),
            ("FROM assessment_results", [{"?column?": 1}] if result_exists else []),
            ("FROM assessment_criteria", criteria),
            ("INSERT INTO run_reports", [{"received_at": NOW}]),
            ("UPDATE run_reports", [{"received_at": NOW}]),
        ] + CASE_AND_WHO

    def report(self, **over):
        r = complete_report(make_plan(assignment_id="a-1"))
        r.update(over)
        return r

    def ingest(self, fake, body):
        with patched_cursor(fake):
            return svc.ingest_report(dict(DEVICE), "a-1", "run-1", body)

    def test_a_complete_report_is_stored_scored_and_the_assignment_marked_reported(self):
        fake = FakeCursor(self.rules())
        out = self.ingest(fake, self.report())
        self.assertEqual((out["accepted"], out["scoring"]), (True, "scored"))
        (res,) = fake.ran("INSERT INTO assessment_results")
        self.assertIn("mediver-tkr-1.0-sample", res)
        stored = json.loads(res[12])   # payload column
        self.assertEqual(stored["source"], "headset-report")
        self.assertEqual(stored["reported_by_device"]["totalScore"], 77)    # kept aside, never used to score
        self.assertTrue(fake.ran("UPDATE attempts SET status = 'assessed'"))
        self.assertIn("reported", fake.ran("UPDATE assignments SET status")[0])
        (att,) = fake.ran("INSERT INTO attempts")
        self.assertIn("submitted", att)
        self.assertIn("training", att)                       # Practice records as training

    def test_a_report_missing_a_parameter_is_scored_on_the_rest_and_says_so(self):
        body = self.report()
        for s in body["steps"]:
            if s.get("planKey") == "P5.hkaDeg":
                s.update({"hasCommittedValue": False, "committedValue": 0})   # the scene ran; nothing was measured
        fake = FakeCursor(self.rules())
        out = self.ingest(fake, body)
        self.assertEqual(out["scoring"], "scored")
        self.assertTrue(any("P5.hkaDeg" in c for c in out["coverage"]), out)
        self.assertTrue(fake.ran("INSERT INTO assessment_results"))          # scored on what was measured
        (stored,) = fake.ran("INSERT INTO run_reports")
        self.assertTrue(any("P5.hkaDeg" in str(col) for col in stored))     # the gap is recorded with the report
        self.assertIn(json.dumps(body), stored)                              # kept verbatim

    def test_a_report_with_no_scene_times_is_stored_and_waits(self):
        body = self.report()
        for s in body["steps"]:
            s.pop("sceneId", None)
        fake = FakeCursor(self.rules())
        out = self.ingest(fake, body)
        self.assertEqual(out["scoring"], "awaiting_inputs")
        self.assertTrue(any("no time recorded" in m for m in out["missing"]))
        self.assertFalse(fake.ran("INSERT INTO assessment_results"))          # no result invented
        (stored,) = fake.ran("INSERT INTO run_reports")
        self.assertIn("awaiting_inputs", stored)

    def test_an_abandoned_run_is_kept_but_not_scored(self):
        fake = FakeCursor(self.rules())
        out = self.ingest(fake, self.report(outcome="Abandoned"))
        self.assertEqual(out["scoring"], "not_scored")
        self.assertIn("paused", fake.ran("INSERT INTO attempts")[0])
        self.assertIn("running", fake.ran("UPDATE assignments SET status")[0])
        self.assertFalse(fake.ran("INSERT INTO assessment_results"))

    def test_a_duplicate_or_older_revision_changes_nothing(self):
        existing = {"id": "rr-1", "report_revision": 2, "received_at": NOW, "attempt_id": "att-1"}
        for revision, accepted in ((2, True), (1, False)):
            fake = FakeCursor(self.rules(existing=existing))
            out = self.ingest(fake, self.report(reportRevision=revision))
            self.assertEqual(out["accepted"], accepted)
            self.assertFalse(fake.ran("INSERT INTO run_reports"))
            self.assertFalse(fake.ran("UPDATE run_reports"))
            self.assertFalse(fake.ran("INSERT INTO assessment_results"))

    def test_a_higher_revision_replaces_the_stored_report_and_scores_once(self):
        existing = {"id": "rr-1", "report_revision": 1, "received_at": NOW, "attempt_id": "att-1"}
        fake = FakeCursor(self.rules(existing=existing, attempt={"id": "att-1", "status": "paused"}))
        out = self.ingest(fake, self.report(reportRevision=2))
        self.assertEqual(out["scoring"], "scored")
        self.assertTrue(fake.ran("UPDATE run_reports"))
        self.assertFalse(fake.ran("INSERT INTO attempts"))                   # the same attempt, resumed

    def test_a_result_once_written_is_final(self):
        existing = {"id": "rr-1", "report_revision": 1, "received_at": NOW, "attempt_id": "att-1"}
        fake = FakeCursor(self.rules(existing=existing, attempt={"id": "att-1", "status": "assessed"}, result_exists=True))
        out = self.ingest(fake, self.report(reportRevision=2))
        self.assertEqual(out["scoring"], "not_scored")
        self.assertFalse(fake.ran("INSERT INTO assessment_results"))
        self.assertFalse(fake.ran("UPDATE attempts SET status = %s"))        # the assessed attempt is not rewound

    def test_a_second_run_on_the_same_plan_is_a_conflict(self):
        fake = FakeCursor(self.rules(attempt={"id": "att-other", "status": "paused"}))
        with self.assertRaises(svc.ConnectError) as cm:
            self.ingest(fake, self.report())
        self.assertEqual(cm.exception.status, 409)

    def test_poison_is_422_and_touches_nothing(self):
        for body in (self.report(mode="Easy"), self.report(runId="other"), self.report(deviceId="someone-else")):
            fake = FakeCursor(self.rules())
            with self.assertRaises(svc.ConnectError) as cm:
                self.ingest(fake, body)
            self.assertEqual(cm.exception.status, 422)
            self.assertFalse(fake.log)

    def test_a_device_not_paired_to_the_assignment_is_forbidden(self):
        other = {"id": "a-1", "plan_id": "p-1", "status": "paired", "headset_mode": "Practice", "device_id": "d-2"}
        with self.assertRaises(svc.ConnectError) as cm:
            self.ingest(FakeCursor(self.rules(assignment=other)), self.report())
        self.assertEqual(cm.exception.status, 403)

    def test_a_cancelled_assignment_takes_no_reports(self):
        cancelled = {"id": "a-1", "plan_id": "p-1", "status": "cancelled", "headset_mode": "Practice", "device_id": "d-1"}
        with self.assertRaises(svc.ConnectError) as cm:
            self.ingest(FakeCursor(self.rules(assignment=cancelled)), self.report())
        self.assertEqual(cm.exception.status, 410)

    def test_a_personal_case_run_is_stored_but_not_scored(self):
        fake = FakeCursor([(f, [locked_plan(case_version_id=None, case_id=None, personal_case_id="pc-1")]) if f == "FROM plans WHERE id" else (f, r)
                           for f, r in self.rules()])
        out = self.ingest(fake, self.report())
        self.assertEqual(out["scoring"], "not_scored")
        self.assertFalse(fake.ran("INSERT INTO assessment_results"))


if __name__ == "__main__":
    unittest.main()
