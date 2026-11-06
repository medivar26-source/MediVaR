"""
Live view: the pure rules (core/connect/live_contract). No database, no clock but the one each test hands in.
"""
import unittest
from datetime import datetime, timedelta, timezone

from core.connect import live_contract as lc

NOW = datetime(2026, 11, 5, 10, 0, tzinfo=timezone.utc)


def ev(seq, kind, **fields):
    """An event as Unity's JsonUtility sends it: every field present, unused ones empty/zero/false."""
    base = {"seq": seq, "type": kind, "tUtc": "2026-11-05T10:00:00Z", "elapsedS": float(seq),
            "mode": "", "appVersion": "", "stepsTotal": 0, "partId": "", "partName": "", "stepId": "", "sceneId": "",
            "label": "", "status": "", "timeSeconds": 0, "warnings": 0, "hasValue": False, "value": 0, "planKey": "",
            "committed": False, "code": "", "text": "", "stepsDone": 0, "paused": False, "outcome": ""}
    base.update(fields)
    return base


def batch(*events, device="quest-1"):
    return {"schemaVersion": 1, "deviceId": device, "events": list(events)}


class TestValidateBatch(unittest.TestCase):
    def test_a_full_width_batch_from_jsonutility_is_valid(self):
        b = batch(ev(1, "run_started", mode="Practice", appVersion="1.0", stepsTotal=61),
                  ev(2, "step_started", stepId="P1_01", sceneId="1.1", label="Flex the knee"),
                  ev(3, "heartbeat", partId="P1", stepId="P1_01", sceneId="1.1", stepsDone=0, stepsTotal=61))
        self.assertEqual(lc.validate_event_batch(b), [])

    def test_an_empty_event_list_is_valid_so_a_headset_can_ask_for_the_live_block(self):
        self.assertEqual(lc.validate_event_batch(batch()), [])

    def test_every_shape_fault_is_named(self):
        problems = lc.validate_event_batch({"schemaVersion": 2, "deviceId": "", "events": [
            {"seq": 0, "type": "nope", "tUtc": "yesterday", "elapsedS": -1},
            ev(5, "step_completed", status="Maybe"),
            ev(5, "run_ended", outcome="Lost"),
            ev(6, "run_started", mode="Fast"),
            ev(7, "value", hasValue=True, value=float("nan"), planKey="P2.tibialDepthMm"),
        ]})
        joined = "\n".join(problems)
        for needle in ("schemaVersion must be 1", "deviceId is required", "events[0].seq", "events[0].type",
                       "events[0].tUtc", "events[0].elapsedS", "events[1].status", "events[2].seq 5 repeats",
                       "events[2].outcome", "events[3].mode", "events[4].value"):
            self.assertIn(needle, joined)

    def test_more_than_fifty_events_is_refused(self):
        problems = lc.validate_event_batch(batch(*[ev(i, "heartbeat") for i in range(1, 52)]))
        self.assertTrue(any("at most 50" in p for p in problems))

    def test_free_text_is_capped(self):
        problems = lc.validate_event_batch(batch(ev(1, "warning", stepId="P1_02", code="x", text="y" * 201)))
        self.assertTrue(any("events[0].text" in p for p in problems))


class TestEventData(unittest.TestCase):
    def test_only_the_types_fields_survive_and_empty_values_are_dropped(self):
        e = ev(4, "step_started", stepId="P2_02", sceneId="4.2", label="Set depth", mode="Practice", warnings=3)
        self.assertEqual(lc.event_data(e), {"stepId": "P2_02", "sceneId": "4.2", "label": "Set depth"})

    def test_a_zero_time_and_zero_warnings_are_kept_on_a_completed_step(self):
        e = ev(4, "step_completed", stepId="P2_02", sceneId="4.2", status="Skipped", timeSeconds=0, warnings=0)
        self.assertEqual(lc.event_data(e), {"stepId": "P2_02", "sceneId": "4.2", "status": "Skipped",
                                            "timeSeconds": 0, "warnings": 0})

    def test_a_value_travels_only_when_has_value_says_so(self):
        with_value = lc.event_data(ev(1, "value", planKey="P2.tibialDepthMm", hasValue=True, value=0.0, committed=False))
        self.assertEqual(with_value, {"planKey": "P2.tibialDepthMm", "value": 0.0, "committed": False})
        without = lc.event_data(ev(1, "value", planKey="P2.tibialDepthMm", hasValue=False, value=9.0))
        self.assertNotIn("value", without)

    def test_a_pause_carries_nothing(self):
        self.assertEqual(lc.event_data(ev(1, "run_paused", stepId="P1_01")), {})


class TestReduceState(unittest.TestCase):
    def run_events(self, *events):
        s = None
        for e in events:
            s = lc.reduce_state(s, e)
        return s

    def test_a_run_is_followed_step_by_step(self):
        s = self.run_events(
            ev(1, "run_started", mode="Exam", appVersion="1.2", stepsTotal=61),
            ev(2, "part_started", partId="P1_EXPOSURE", partName="Exposure"),
            ev(3, "step_started", stepId="P1_01", sceneId="1.1", label="Flex the knee"),
            ev(4, "value", planKey="P1.flexionDeg", hasValue=True, value=88.0),
            ev(5, "step_completed", stepId="P1_01", sceneId="1.1", status="Done", timeSeconds=12.5, warnings=1,
               hasValue=True, value=90.0, planKey="P1.flexionDeg"),
            ev(6, "step_started", stepId="P1_02", sceneId="1.2", label="Mark the incision"),
            ev(7, "warning", stepId="P1_02", sceneId="1.2", code="off_line", text="Mark strayed from the line."),
            ev(8, "step_completed", stepId="P1_02", sceneId="1.2", status="Failed", timeSeconds=30, warnings=0),
        )
        self.assertEqual((s["mode"], s["appVersion"], s["stepsTotal"]), ("Exam", "1.2", 61))
        self.assertEqual((s["partId"], s["partName"]), ("P1_EXPOSURE", "Exposure"))
        self.assertEqual((s["stepId"], s["sceneId"], s["label"]), ("P1_02", "1.2", "Mark the incision"))
        self.assertEqual(s["stepsDone"], 1, "a Failed step is not done")
        self.assertEqual(s["warnings"], 2)
        self.assertEqual(s["values"]["P1.flexionDeg"], {"value": 90.0, "committed": True, "elapsedS": 5.0})
        self.assertEqual((s["lastSeq"], s["elapsedS"], s["lastType"]), (8, 8.0, "step_completed"))

    def test_a_heartbeat_overwrites_the_picture(self):
        s = self.run_events(ev(1, "step_started", stepId="P1_01", sceneId="1.1"),
                            ev(2, "heartbeat", partId="P3", stepId="P3_04", sceneId="5.2", stepsDone=20, stepsTotal=61, paused=True))
        self.assertEqual((s["partId"], s["stepId"], s["sceneId"], s["stepsDone"], s["stepsTotal"], s["paused"]),
                         ("P3", "P3_04", "5.2", 20, 61, True))

    def test_pause_and_resume(self):
        s = self.run_events(ev(1, "run_paused"))
        self.assertTrue(s["paused"])
        s = lc.reduce_state(s, ev(2, "run_resumed"))
        self.assertFalse(s["paused"])

    def test_the_input_state_is_not_changed(self):
        first = lc.reduce_state(None, ev(1, "value", planKey="k", hasValue=True, value=1.0))
        lc.reduce_state(first, ev(2, "value", planKey="k", hasValue=True, value=2.0))
        self.assertEqual(first["values"]["k"]["value"], 1.0)


class TestLiveState(unittest.TestCase):
    def word(self, **over):
        args = dict(assignment_status="running", last_event_at=NOW - timedelta(seconds=2), ended=False, paused=False,
                    has_report=False, now=NOW)
        args.update(over)
        return lc.live_state(**args)

    def test_the_table_in_the_design_note(self):
        self.assertEqual(self.word(assignment_status="paired", last_event_at=None), "waiting")
        self.assertEqual(self.word(), "live")
        self.assertEqual(self.word(paused=True), "paused")
        self.assertEqual(self.word(last_event_at=NOW - timedelta(seconds=16)), "stale")
        self.assertEqual(self.word(last_event_at=NOW - timedelta(seconds=121)), "lost")
        self.assertEqual(self.word(ended=True), "ended")
        self.assertEqual(self.word(has_report=True, last_event_at=None), "ended")

    def test_a_paused_run_that_stops_talking_reads_stale_not_paused(self):
        self.assertEqual(self.word(paused=True, last_event_at=NOW - timedelta(seconds=30)), "stale")


class TestLiveBlock(unittest.TestCase):
    def test_frames_are_wanted_only_while_someone_asked_recently(self):
        self.assertEqual(lc.live_block(None, NOW), {"watchers": 0, "wantFrames": False, "frameIntervalMs": 1000})
        self.assertEqual(lc.live_block(NOW - timedelta(seconds=9), NOW)["wantFrames"], True)
        self.assertEqual(lc.live_block(NOW - timedelta(seconds=11), NOW)["wantFrames"], False)

    def test_the_interval_never_goes_under_half_a_second(self):
        self.assertEqual(lc.live_block(NOW, NOW, frame_interval_ms=100)["frameIntervalMs"], 500)

    def test_a_read_restamps_only_every_few_seconds(self):
        self.assertTrue(lc.should_restamp(None, NOW))
        self.assertFalse(lc.should_restamp(NOW - timedelta(seconds=1), NOW))
        self.assertTrue(lc.should_restamp(NOW - timedelta(seconds=3), NOW))


class TestFrameHeaders(unittest.TestCase):
    GOOD = {"Content-Type": "image/jpeg", "X-Frame-Seq": "7", "X-Captured-At": "2026-11-05T10:00:01Z",
            "X-Frame-Width": "640", "X-Frame-Height": "360"}

    def test_a_good_frame_passes_and_its_meta_is_read(self):
        status, problems = lc.validate_frame_headers(self.GOOD, 40_000, b"\xff\xd8\xff")
        self.assertEqual((status, problems), (200, []))
        meta = lc.frame_meta(self.GOOD)
        self.assertEqual((meta["seq"], meta["width"], meta["height"]), (7, 640, 360))
        self.assertEqual(meta["capturedAt"].second, 1)

    def test_too_big_is_413_before_anything_else(self):
        status, problems = lc.validate_frame_headers({}, lc.FRAME_MAX_BYTES + 1)
        self.assertEqual(status, 413)
        self.assertEqual(len(problems), 1)

    def test_bad_headers_or_body_are_422(self):
        status, problems = lc.validate_frame_headers(
            {"Content-Type": "image/png", "X-Frame-Seq": "0", "X-Frame-Width": "641", "X-Frame-Height": "x",
             "X-Captured-At": "now"}, 10, b"\x89PNG")
        self.assertEqual(status, 422)
        joined = "\n".join(problems)
        for needle in ("Content-Type", "not a JPEG", "X-Frame-Seq", "X-Frame-Width", "x-frame-height", "X-Captured-At"):
            self.assertIn(needle, joined)

    def test_an_empty_body_is_422(self):
        status, _ = lc.validate_frame_headers(self.GOOD, 0)
        self.assertEqual(status, 422)


if __name__ == "__main__":
    unittest.main()
