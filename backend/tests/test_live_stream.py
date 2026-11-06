"""
The live stream (LAN): the binary frame header, the control block, the in-memory relay, and the HTTP layer with the
database unreachable. What it proves is the behaviour of the stream path; Postgres is never touched here.
"""
import asyncio
import json
import unittest
from unittest import mock

from fastapi.testclient import TestClient

from core.connect import live_contract as lc
from core.security import get_current_active_user
from main import app
from schemas.auth import UserProfile
from services import connect_service
from services import live_service as svc
from services.live_relay import LiveRelay, RelayFrame

JPEG = b"\xff\xd8\xff\xe0" + b"\x00" * 60 + b"\xff\xd9"
INSTRUCTOR = UserProfile(id="i-1", first_name="Jane", last_name="Doe", display_name="Jane Doe", role="instructor",
                         status="active", default_difficulty="intermediate")


class TheFrameHeader(unittest.TestCase):
    def test_round_trip(self):
        data = lc.pack_stream_frame(7, 640, 360, 1_700_000_000_000, JPEG)
        meta, jpeg, problems = lc.parse_stream_frame(data)
        self.assertEqual([], problems)
        self.assertEqual((7, 640, 360), (meta["seq"], meta["width"], meta["height"]))
        self.assertEqual(2023, meta["capturedAt"].year)
        self.assertEqual(JPEG, jpeg)

    def test_refusals_are_named(self):
        self.assertIn("shorter", lc.parse_stream_frame(b"MJ")[2][0])
        self.assertIn("magic", lc.parse_stream_frame(b"XXXX" + b"\x00" * 40)[2][0])
        _, _, p = lc.parse_stream_frame(lc.pack_stream_frame(0, 9999, 360, 0, b"nope"))
        self.assertTrue(any("JPEG" in x for x in p) and any("seq" in x for x in p) and any("size" in x for x in p))
        _, _, p = lc.parse_stream_frame(lc.pack_stream_frame(1, 640, 360, 0, b"\xff\xd8" + b"\x00" * lc.FRAME_MAX_BYTES))
        self.assertTrue(any("at most" in x for x in p))

    def test_control_block(self):
        self.assertEqual({"watchers": 0, "wantFrames": False, "fps": 10, "maxBytes": lc.FRAME_MAX_BYTES}, lc.stream_control(0))
        self.assertTrue(lc.stream_control(2)["wantFrames"])
        self.assertEqual(lc.STREAM_MAX_FPS, lc.stream_control(1, fps=99)["fps"])
        self.assertEqual(1, lc.stream_control(1, fps=0)["fps"])


def run(coro):
    return asyncio.new_event_loop().run_until_complete(coro)


class TheRelay(unittest.TestCase):
    def test_newest_wins_and_a_late_older_frame_changes_nothing(self):
        async def go():
            r = LiveRelay()
            self.assertTrue(await r.publish("a", RelayFrame(2, 640, 360, JPEG, None, 0.0)))
            self.assertFalse(await r.publish("a", RelayFrame(1, 640, 360, JPEG, None, 0.0)))
            self.assertEqual(2, r.peek("a").frame.seq)
        run(go())

    def test_a_watcher_gets_the_current_frame_then_each_new_one_and_is_counted(self):
        async def go():
            r = LiveRelay()
            await r.device_entered("a")
            await r.publish("a", RelayFrame(1, 640, 360, JPEG, None, 0.0))
            got = []

            async def viewer():
                async for f in r.watch("a", keepalive_seconds=0.05):
                    if f is not None:
                        got.append(f.seq)
                    if len(got) == 3:
                        break

            task = asyncio.ensure_future(viewer())
            await asyncio.sleep(0.01)
            self.assertEqual(1, r.watchers("a"), "counted while consumed")
            await r.publish("a", RelayFrame(2, 640, 360, JPEG, None, 0.0))
            await asyncio.sleep(0.01)
            await r.publish("a", RelayFrame(3, 640, 360, JPEG, None, 0.0))
            await asyncio.wait_for(task, 1.0)
            self.assertEqual([1, 2, 3], got)
            await asyncio.sleep(0.01)
            self.assertEqual(0, r.watchers("a"), "left when the generator closed")
        run(go())

    def test_keepalive_and_device_leaving_end_the_watch(self):
        async def go():
            r = LiveRelay()
            await r.device_entered("a")
            seen = []

            async def viewer():
                async for f in r.watch("a", keepalive_seconds=0.02):
                    seen.append(f)
            task = asyncio.ensure_future(viewer())
            await asyncio.sleep(0.07)
            self.assertIn(None, seen, "a keepalive is yielded while nothing arrives")
            await r.device_left("a")
            await asyncio.wait_for(task, 1.0)
            self.assertIsNone(r.peek("a"), "an idle channel is dropped")
        run(go())


class TheHttpLayer(unittest.TestCase):
    def setUp(self):
        app.dependency_overrides[get_current_active_user] = lambda: INSTRUCTOR
        self.client = TestClient(app)

    def tearDown(self):
        app.dependency_overrides.pop(get_current_active_user, None)

    def test_a_stranger_cannot_open_the_stream(self):
        with mock.patch.object(svc, "may_watch", side_effect=svc.ConnectError(404, "Unknown assignment.")):
            r = self.client.get("/api/v1/assignments/a/live/stream")
        self.assertEqual(404, r.status_code)

    def test_status_reads_the_relay(self):
        with mock.patch.object(svc, "may_watch", return_value={"id": "a"}):
            r = self.client.get("/api/v1/assignments/a/live/stream/status")
        self.assertEqual(200, r.status_code)
        self.assertEqual({"deviceConnected": False, "watchers": 0, "frameSeq": None}, {k: r.json()[k] for k in ("deviceConnected", "watchers", "frameSeq")})

    def test_an_unpaired_device_is_refused_before_accept(self):
        with mock.patch.object(connect_service, "authenticate_device", return_value=None), \
             mock.patch.object(connect_service, "_require_tables"), \
             mock.patch.object(connect_service, "cursor"):
            with self.assertRaises(Exception):
                with self.client.websocket_connect("/api/v1/assignments/a/runs/r/stream", headers={"Authorization": "Bearer nope"}):
                    pass

    def test_a_frame_on_the_stream_reaches_a_viewer_and_the_control_block_follows_the_watchers(self):
        device = {"uuid": "d-1", "device_id": "quest-1"}
        with mock.patch.object(connect_service, "authenticate_device", return_value=device), \
             mock.patch.object(connect_service, "_require_tables"), \
             mock.patch.object(connect_service, "cursor"), \
             mock.patch.object(svc, "open_stream", return_value={"run_id": "r"}), \
             mock.patch.object(svc, "store_stream_frame", return_value={"accepted": True}), \
             mock.patch.object(svc, "may_watch", return_value={"id": "a"}), \
             mock.patch.object(svc, "stamp_viewed"):
            with self.client.websocket_connect("/api/v1/assignments/a/runs/r/stream", headers={"Authorization": "Bearer ok"}) as ws:
                first = json.loads(ws.receive_text())
                self.assertFalse(first["wantFrames"], "nobody is watching yet")
                ws.send_bytes(lc.pack_stream_frame(1, 640, 360, 0, JPEG))
                status = self.client.get("/api/v1/assignments/a/live/stream/status").json()
                self.assertTrue(status["deviceConnected"])
                self.assertEqual(1, status["frameSeq"])
                ws.send_bytes(b"garbage")
                err = json.loads(ws.receive_text())
                self.assertIn("error", err)


if __name__ == "__main__":
    unittest.main()
