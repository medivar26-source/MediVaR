"""
Live view: the HTTP layer and the service's flow, with the database unreachable (same scripted-cursor style as
tests/test_connect_endpoint.py). What it proves is the behaviour; that Postgres accepts the SQL needs 016 applied.
"""
import json
import unittest
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from unittest import mock

from fastapi.testclient import TestClient

from core.security import get_current_active_user
from main import app
from schemas.auth import UserProfile
from services import connect_service
from services import live_service as svc
from tests.test_connect_endpoint import DEVICE, FakeCursor, NoDatabase, TABLES
from tests.test_live_contract import batch, ev

NOW = datetime(2026, 11, 5, 10, 0, tzinfo=timezone.utc)
LIVE_TABLES = [{"l": "live_runs", "e": "run_events", "f": "live_frames"}]
LEARNER = UserProfile(id="u-1", first_name="Meera", last_name="Pillai", display_name="Meera Pillai", role="resident",
                      status="active", default_difficulty="intermediate")
INSTRUCTOR = UserProfile(id="i-1", first_name="Jane", last_name="Doe", display_name="Jane Doe", role="instructor",
                         status="active", default_difficulty="intermediate")
JPEG = b"\xff\xd8\xff\xe0" + b"\x00" * 60 + b"\xff\xd9"
FRAME_HEADERS = {"Content-Type": "image/jpeg", "X-Frame-Seq": "3", "X-Captured-At": "2026-11-05T10:00:02Z",
                 "X-Frame-Width": "640", "X-Frame-Height": "360"}


def patched_cursor(fake):
    @contextmanager
    def _cursor():
        yield fake
    return mock.patch.object(svc, "cursor", _cursor)


def assignment(**over):
    row = {"id": "a-1", "plan_id": "p-1", "resident_id": "u-1", "status": "paired", "headset_mode": "Practice",
           "device_id": "d-1", "session_id": None, "created_at": NOW, "resident_name": "Meera Pillai",
           "case_title": "Varus right knee", "report_outcome": None, "scoring_status": None, "attempt_id": None}
    row.update(over)
    return row


def live_run(**over):
    row = {"assignment_id": "a-1", "run_id": "run-1", "device_id": "d-1", "last_seq": 3,
           "state": {"stepId": "P1_02", "sceneId": "1.2", "stepsDone": 1, "stepsTotal": 61, "paused": False, "elapsedS": 40.0},
           "started_at": NOW - timedelta(minutes=1), "last_event_at": NOW - timedelta(seconds=2), "ended_at": None,
           "outcome": None, "last_viewed_at": None}
    row.update(over)
    return row


def rules(*, assignment_row=None, run=None, frame=None, events=None, live_tables=True, visible=None):
    """The scripted answers. Order matters: a more specific fragment goes before a general one."""
    return [
        ("public.live_runs", LIVE_TABLES if live_tables else [{"l": None, "e": None, "f": None}]),
        ("to_regclass", TABLES),
        ("FROM assignments WHERE id", [assignment_row or assignment()]),
        ("FROM live_runs WHERE assignment_id", [run] if run else []),
        ("SELECT seq FROM live_frames", [{"seq": frame["seq"]}] if frame else []),
        ("FROM live_frames WHERE assignment_id", [frame] if frame else []),
        ("FROM run_events WHERE assignment_id", events or []),
        ("FROM assignments a", [visible] if visible else []),
    ]


# ---------------------------------------------------------------------------------------------------------
class TestHttpLayer(NoDatabase):
    def setUp(self):
        super().setUp()
        self.client = TestClient(app)
        app.dependency_overrides[get_current_active_user] = lambda: LEARNER
        self.addCleanup(app.dependency_overrides.clear)

    def test_everything_is_404_not_set_up_until_016_is_applied(self):
        fake = FakeCursor(rules(live_tables=False))
        with patched_cursor(fake), mock.patch.object(connect_service, "cursor", lambda: _ctx(fake)):
            with mock.patch.object(connect_service, "authenticate_device", return_value=dict(DEVICE)):
                r = self.client.post("/api/v1/assignments/a-1/runs/run-1/events", json=batch(), headers={"Authorization": "Bearer t"})
                self.assertEqual(r.status_code, 404)
                r = self.client.put("/api/v1/assignments/a-1/runs/run-1/frame", content=JPEG,
                                    headers={**FRAME_HEADERS, "Authorization": "Bearer t"})
                self.assertEqual(r.status_code, 404)
            self.assertEqual(self.client.get("/api/v1/assignments/a-1/live").status_code, 404)
            self.assertEqual(self.client.get("/api/v1/assignments/a-1/live/frame").status_code, 404)
            self.assertEqual(self.client.get("/api/v1/live/active").status_code, 404)

    def test_headset_calls_need_a_bearer_and_never_reach_the_database_without_one(self):
        r = self.client.post("/api/v1/assignments/a-1/runs/run-1/events", json=batch())
        self.assertEqual(r.status_code, 401)
        r = self.client.put("/api/v1/assignments/a-1/runs/run-1/frame", content=JPEG, headers=FRAME_HEADERS)
        self.assertEqual(r.status_code, 401)

    def test_a_raw_jpeg_body_reaches_the_service_with_its_headers(self):
        seen = {}

        def store(device, assignment_id, run_id, headers, jpeg):
            seen.update(device=device, assignment_id=assignment_id, run_id=run_id, headers=headers, jpeg=jpeg)
            return {"accepted": True, "seq": 3, "live": {"watchers": 1, "wantFrames": True, "frameIntervalMs": 1000}}

        with mock.patch.object(connect_service, "cursor", lambda: _ctx(FakeCursor([("to_regclass", TABLES)]))), \
             mock.patch.object(connect_service, "authenticate_device", return_value=dict(DEVICE)), \
             mock.patch.object(svc, "store_frame", side_effect=store):
            r = self.client.put("/api/v1/assignments/a-1/runs/run-7/frame", content=JPEG,
                                headers={**FRAME_HEADERS, "Authorization": "Bearer t"})
        self.assertEqual(r.status_code, 200, r.text)
        self.assertEqual(r.json()["live"]["wantFrames"], True)
        self.assertEqual((seen["assignment_id"], seen["run_id"], seen["jpeg"]), ("a-1", "run-7", JPEG))
        self.assertEqual(seen["headers"]["x-frame-seq"], "3")

    def test_an_oversized_frame_is_refused_from_its_content_length(self):
        with mock.patch.object(connect_service, "cursor", lambda: _ctx(FakeCursor([("to_regclass", TABLES)]))), \
             mock.patch.object(connect_service, "authenticate_device", return_value=dict(DEVICE)):
            r = self.client.put("/api/v1/assignments/a-1/runs/run-7/frame", content=b"x" * (150 * 1024 + 1),
                                headers={**FRAME_HEADERS, "Authorization": "Bearer t"})
        self.assertEqual(r.status_code, 413)

    def test_the_frame_read_is_an_image_that_is_never_cached(self):
        with mock.patch.object(svc, "read_frame", return_value={"seq": 9, "width": 640, "height": 360, "jpeg": JPEG, "capturedAt": NOW}):
            r = self.client.get("/api/v1/assignments/a-1/live/frame")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.headers["content-type"], "image/jpeg")
        self.assertEqual(r.headers["cache-control"], "no-store")
        self.assertEqual(r.headers["x-frame-seq"], "9")
        self.assertEqual(r.content, JPEG)
        with mock.patch.object(svc, "read_frame", return_value=None):
            self.assertEqual(self.client.get("/api/v1/assignments/a-1/live/frame").status_code, 404)

    def test_service_errors_become_their_status(self):
        with mock.patch.object(svc, "read_live", side_effect=connect_service.ConnectError(404, "Unknown assignment.")):
            self.assertEqual(self.client.get("/api/v1/assignments/x/live").status_code, 404)


@contextmanager
def _ctx(fake):
    yield fake


# ---------------------------------------------------------------------------------------------------------
class TestIngestEvents(NoDatabase):
    def ingest(self, fake, body, run_id="run-1"):
        with patched_cursor(fake):
            return svc.ingest_events(dict(DEVICE), "a-1", run_id, body, now=NOW)

    def test_a_new_run_is_created_its_events_stored_and_the_assignment_moves_to_running(self):
        fake = FakeCursor(rules())
        out = self.ingest(fake, batch(ev(1, "run_started", mode="Practice", appVersion="1.0", stepsTotal=61),
                                      ev(2, "part_started", partId="P1", partName="Exposure"),
                                      ev(3, "step_started", stepId="P1_01", sceneId="1.1", label="Flex"),
                                      ev(4, "heartbeat", partId="P1", stepId="P1_01", sceneId="1.1", stepsTotal=61)))
        self.assertEqual((out["accepted"], out["duplicates"], out["lastSeq"]), (4, 0, 4))
        self.assertEqual(out["live"], {"watchers": 0, "wantFrames": False, "frameIntervalMs": 1000})
        stored = fake.ran("INSERT INTO run_events")
        self.assertEqual([p[3] for p in stored], ["run_started", "part_started", "step_started"], "heartbeats are not stored")
        self.assertEqual(json.loads(stored[2][6]), {"stepId": "P1_01", "sceneId": "1.1", "label": "Flex"})
        inserted = fake.ran("INSERT INTO live_runs")[0]
        self.assertEqual((inserted[0], inserted[1], inserted[3]), ("a-1", "run-1", 4))
        state = json.loads(inserted[4])
        self.assertEqual((state["stepId"], state["stepsTotal"], state["mode"]), ("P1_01", 61, "Practice"))
        self.assertEqual(fake.ran("UPDATE assignments SET status = 'running'"), [("a-1",)])

    def test_a_running_assignment_is_not_touched_and_old_sequence_numbers_are_duplicates(self):
        fake = FakeCursor(rules(assignment_row=assignment(status="running"), run=live_run(last_seq=3, last_viewed_at=NOW - timedelta(seconds=4))))
        out = self.ingest(fake, batch(ev(2, "step_started", stepId="P1_01"), ev(3, "heartbeat"),
                                      ev(5, "step_completed", stepId="P1_02", sceneId="1.2", status="Done", timeSeconds=8),
                                      ev(4, "step_started", stepId="P1_02", sceneId="1.2")))
        self.assertEqual((out["accepted"], out["duplicates"], out["lastSeq"]), (2, 2, 5))
        self.assertEqual(out["live"]["wantFrames"], True, "a dashboard asked 4 s ago")
        self.assertEqual(fake.ran("UPDATE assignments"), [])
        updated = fake.ran("UPDATE live_runs SET run_id")[0]
        state = json.loads(updated[3])
        self.assertEqual((state["stepsDone"], state["stepId"], updated[2]), (2, "P1_02", 5))

    def test_run_ended_closes_the_run_and_drops_the_frame(self):
        fake = FakeCursor(rules(assignment_row=assignment(status="running"), run=live_run()))
        self.ingest(fake, batch(ev(4, "run_ended", outcome="Completed")))
        updated = fake.ran("UPDATE live_runs SET run_id")[0]
        self.assertEqual((updated[6], updated[7]), (NOW, "Completed"))
        self.assertEqual(fake.ran("DELETE FROM live_frames"), [("a-1",)])

    def test_a_second_run_id_while_one_is_live_is_refused_but_replaces_an_ended_one(self):
        with self.assertRaises(connect_service.ConnectError) as cm:
            self.ingest(FakeCursor(rules(assignment_row=assignment(status="running"), run=live_run())),
                        batch(ev(1, "run_started", mode="Practice")), run_id="run-2")
        self.assertEqual(cm.exception.status, 409)
        fake = FakeCursor(rules(assignment_row=assignment(status="running"), run=live_run(ended_at=NOW - timedelta(minutes=5), outcome="Abandoned")))
        out = self.ingest(fake, batch(ev(1, "run_started", mode="Practice")), run_id="run-2")
        self.assertEqual(out["lastSeq"], 1)
        self.assertEqual(fake.ran("INSERT INTO live_runs")[0][1], "run-2")

    def test_the_assignments_end_states_are_409_and_410_and_a_stranger_device_is_403(self):
        for status, expect in (("reported", 409), ("expired", 410), ("cancelled", 410)):
            with self.assertRaises(connect_service.ConnectError) as cm:
                self.ingest(FakeCursor(rules(assignment_row=assignment(status=status))), batch(ev(1, "heartbeat")))
            self.assertEqual(cm.exception.status, expect, status)
        with self.assertRaises(connect_service.ConnectError) as cm:
            self.ingest(FakeCursor(rules(assignment_row=assignment(device_id="d-other"))), batch(ev(1, "heartbeat")))
        self.assertEqual(cm.exception.status, 403)

    def test_a_bad_batch_or_another_devices_id_is_422_before_the_database(self):
        with self.assertRaises(connect_service.ConnectError) as cm:
            self.ingest(FakeCursor([]), batch(ev(1, "heartbeat"), device="someone-else"))
        self.assertEqual(cm.exception.status, 422)
        with self.assertRaises(connect_service.ConnectError) as cm:
            self.ingest(FakeCursor([]), {"schemaVersion": 1, "deviceId": "quest-1", "events": "no"})
        self.assertEqual(cm.exception.status, 422)

    def test_a_cold_backend_answers_not_available(self):
        with self.assertRaises(connect_service.ConnectUnavailable):
            self.ingest(FakeCursor(rules(live_tables=False)), batch())


class TestStoreFrame(NoDatabase):
    def store(self, fake, headers=FRAME_HEADERS, jpeg=JPEG, run_id="run-1"):
        with patched_cursor(fake):
            return svc.store_frame(dict(DEVICE), "a-1", run_id, headers, jpeg, now=NOW)

    def test_a_frame_is_upserted_and_the_reply_carries_the_live_block(self):
        fake = FakeCursor(rules(assignment_row=assignment(status="running"), run=live_run(last_viewed_at=NOW)))
        out = self.store(fake)
        self.assertEqual((out["accepted"], out["seq"], out["live"]["wantFrames"]), (True, 3, True))
        params = fake.ran("INSERT INTO live_frames")[0]
        self.assertEqual((params[0], params[1], params[2], params[3], params[4], params[5]), ("a-1", "run-1", 3, 640, 360, JPEG))

    def test_an_older_frame_is_ignored(self):
        fake = FakeCursor(rules(assignment_row=assignment(status="running"), run=live_run(), frame={"seq": 5}))
        self.assertEqual(self.store(fake)["accepted"], False)
        self.assertEqual(fake.ran("INSERT INTO live_frames"), [])

    def test_no_live_run_or_an_ended_one_is_409(self):
        with self.assertRaises(connect_service.ConnectError) as cm:
            self.store(FakeCursor(rules(assignment_row=assignment(status="running"))))
        self.assertEqual(cm.exception.status, 409)
        with self.assertRaises(connect_service.ConnectError) as cm:
            self.store(FakeCursor(rules(assignment_row=assignment(status="running"), run=live_run(ended_at=NOW))))
        self.assertEqual(cm.exception.status, 409)

    def test_a_bad_frame_never_reaches_the_database(self):
        with self.assertRaises(connect_service.ConnectError) as cm:
            self.store(FakeCursor([]), jpeg=b"\x89PNG" + b"\x00" * 10)
        self.assertEqual(cm.exception.status, 422)
        with self.assertRaises(connect_service.ConnectError) as cm:
            self.store(FakeCursor([]), jpeg=b"\xff\xd8\xff" + b"\x00" * (150 * 1024))
        self.assertEqual(cm.exception.status, 413)


class TestDashboardReads(NoDatabase):
    def read(self, fake, user=LEARNER, after=0):
        with patched_cursor(fake):
            return svc.read_live(user, "a-1", after, now=NOW)

    def test_the_live_page_gets_state_events_frame_and_stamps_that_someone_is_watching(self):
        events = [{"seq": 2, "type": "step_started", "t_utc": NOW, "elapsed_s": 12.5, "data": {"stepId": "P1_01", "sceneId": "1.1"}}]
        fake = FakeCursor(rules(visible=assignment(status="running"), run=live_run(),
                                frame={"seq": 4, "width": 640, "height": 360, "captured_at": NOW, "received_at": NOW}, events=events))
        out = self.read(fake, after=1)
        self.assertEqual(out["liveState"], "live")
        self.assertEqual((out["resident"], out["caseTitle"], out["mode"]), ("Meera Pillai", "Varus right knee", "Practice"))
        self.assertEqual(out["state"]["stepId"], "P1_02")
        self.assertEqual(out["events"], [{"seq": 2, "type": "step_started", "tUtc": NOW.isoformat(), "elapsedS": 12.5,
                                          "stepId": "P1_01", "sceneId": "1.1"}])
        self.assertEqual(out["frame"]["seq"], 4)
        self.assertEqual(fake.ran("UPDATE live_runs SET last_viewed_at"), [(NOW, "a-1")])
        read_events = fake.ran("FROM run_events")[0]
        self.assertEqual(read_events[2], 1, "only events after the seq the page already has")

    def test_a_recent_stamp_is_not_rewritten_on_every_poll(self):
        fake = FakeCursor(rules(visible=assignment(status="running"), run=live_run(last_viewed_at=NOW - timedelta(seconds=1))))
        self.read(fake)
        self.assertEqual(fake.ran("UPDATE live_runs SET last_viewed_at"), [])

    def test_before_the_headset_speaks_the_page_is_waiting_and_after_a_report_it_is_ended(self):
        self.assertEqual(self.read(FakeCursor(rules(visible=assignment(status="paired"))))["liveState"], "waiting")
        out = self.read(FakeCursor(rules(visible=assignment(status="reported", report_outcome="Completed", scoring_status="scored",
                                                            attempt_id="att-1"), run=live_run(ended_at=NOW))))
        self.assertEqual((out["liveState"], out["attemptId"], out["scoringStatus"]), ("ended", "att-1", "scored"))

    def test_a_strangers_run_looks_like_it_does_not_exist(self):
        with self.assertRaises(connect_service.ConnectError) as cm:
            self.read(FakeCursor(rules()))
        self.assertEqual(cm.exception.status, 404)

    def test_who_may_watch_is_one_where_clause_per_role(self):
        self.assertIn("a.resident_id = %s", svc._visibility_where(LEARNER)[0])
        self.assertIn("c.owner_id = %s", svc._visibility_where(INSTRUCTOR)[0])
        admin = UserProfile(id="ad-1", institution_id="inst-1", first_name="A", last_name="D", display_name="A D", role="admin",
                            status="active", default_difficulty="intermediate")
        self.assertIn("u.institution_id = %s", svc._visibility_where(admin)[0])
        no_inst = admin.model_copy(update={"institution_id": None})
        self.assertEqual(svc._visibility_where(no_inst), ("FALSE", []))

    def test_the_frame_read_returns_bytes_or_nothing(self):
        fake = FakeCursor(rules(visible=assignment(status="running"),
                                frame={"seq": 4, "width": 640, "height": 360, "jpeg": memoryview(JPEG), "captured_at": NOW}))
        with patched_cursor(fake):
            out = svc.read_frame(LEARNER, "a-1")
        self.assertEqual((out["seq"], out["jpeg"]), (4, JPEG))
        with patched_cursor(FakeCursor(rules(visible=assignment(status="running")))):
            self.assertIsNone(svc.read_frame(LEARNER, "a-1"))

    def test_active_runs_lists_what_is_live_for_the_caller(self):
        fake = FakeCursor(rules(visible=assignment(status="running"), run=live_run()))
        with patched_cursor(fake):
            out = svc.active_runs(INSTRUCTOR, now=NOW)
        self.assertEqual(len(out), 1)
        self.assertEqual((out[0]["assignmentId"], out[0]["liveState"]), ("a-1", "live"))
        sql, params = [(s, p) for s, p in fake.log if "JOIN live_runs lr" in s][0]
        self.assertIn("lr.ended_at IS NULL", sql)
        self.assertEqual(params[-1], NOW - timedelta(seconds=120))


class TestReportEndsTheLiveRun(NoDatabase):
    def test_end_run_in_is_a_no_op_before_016_and_closes_the_run_after(self):
        cold = FakeCursor([("public.live_runs", [{"l": None, "e": None, "f": None}])])
        svc.end_run_in(cold, "a-1", "run-1", "Completed", now=NOW)
        self.assertEqual(cold.ran("UPDATE live_runs"), [])
        warm = FakeCursor([("public.live_runs", LIVE_TABLES)])
        svc.end_run_in(warm, "a-1", "run-1", "Completed", now=NOW)
        self.assertEqual(warm.ran("UPDATE live_runs SET ended_at"), [(NOW, "Completed", "a-1", "run-1")])
        self.assertEqual(warm.ran("DELETE FROM live_frames"), [("a-1",)])


if __name__ == "__main__":
    unittest.main()
