"""
Live view: what the resident is doing and seeing, while they operate.

Headset (bearer token from pairing; the paths are the VR team's contract, VR_TEAM_PROMPT_live_view.md):
    POST /assignments/{id}/runs/{runId}/events   up to 50 small events, at most once a second; heartbeat every 5 s
    PUT  /assignments/{id}/runs/{runId}/frame    raw JPEG <= 640x360, <= 150 KB, only while the reply said wantFrames

Dashboard (signed-in user):
    GET /assignments/{id}/live?after=<seq>       state + events after seq + frame meta; stamps "someone is watching"
    GET /assignments/{id}/live/frame             the newest JPEG, never cached
    GET /live/active                             the runs live now that the caller may watch
Live stream (LAN, 2026-11-06; the moving picture the owner asked for):
    WS  /assignments/{id}/runs/{runId}/stream    headset pushes binary frames (24-byte header + JPEG) while the
                                                 control block it receives says wantFrames; the relay keeps the newest
    GET /assignments/{id}/live/stream            viewer: multipart/x-mixed-replace MJPEG off the relay, as frames land

Every path answers 404 "not set up" until migration 016 is applied: the headset switches live off for ten
minutes and carries on, the dashboard shows no live page. Design: mediver_documentation/25_LIVE_VIEW_AND_RUN_JOURNEY.md
"""
from typing import Any, Dict

import asyncio
import json
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Body, Depends, HTTPException, Request, Response, WebSocket, WebSocketDisconnect
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import StreamingResponse

from api.v1.endpoints.connect import current_device
from core.connect import live_contract as lc
from core.security import get_current_active_user as get_current_user
from schemas.auth import UserProfile
from services import connect_service as devices
from services import live_service as svc
from services.live_relay import RelayFrame, now_monotonic, relay

router = APIRouter()

NOT_SET_UP = "Live view is not set up (migration 016 not applied)."


def _run(fn, *args, **kwargs):
    """The connect helper's answers, except that an unavailable live view names ITS migration. The service
    is called exactly once; its two errors become the HTTP answers the contract names."""
    try:
        return fn(*args, **kwargs)
    except svc.ConnectUnavailable:
        raise HTTPException(status_code=404, detail=NOT_SET_UP)
    except svc.ConnectError as exc:
        headers = {"Retry-After": str(exc.retry_after)} if exc.retry_after else None
        raise HTTPException(status_code=exc.status, detail=exc.detail, headers=headers)


# ------------------------------------------------------------------------------------------------ headset
@router.post("/assignments/{assignment_id}/runs/{run_id}/events")
def post_events(assignment_id: str, run_id: str, body: Any = Body(...), device: Dict[str, Any] = Depends(current_device)):
    return _run(svc.ingest_events, device, assignment_id, run_id, body)


@router.put("/assignments/{assignment_id}/runs/{run_id}/frame")
async def put_frame(assignment_id: str, run_id: str, request: Request, device: Dict[str, Any] = Depends(current_device)):
    # Refuse an oversized frame before reading it: the headset lowers quality for the next one.
    declared = request.headers.get("content-length")
    if declared and declared.isdigit() and int(declared) > lc.FRAME_MAX_BYTES:
        raise HTTPException(status_code=413, detail=f"frame is {declared} bytes; at most {lc.FRAME_MAX_BYTES} are accepted")
    jpeg = await request.body()
    headers = {k: v for k, v in request.headers.items()}
    # psycopg2 blocks; keep it off the event loop.
    return await run_in_threadpool(_run, svc.store_frame, device, assignment_id, run_id, headers, jpeg)


# ---------------------------------------------------------------------------------------------- dashboard
@router.get("/assignments/{assignment_id}/live")
def get_live(assignment_id: str, after: int = 0, current_user: UserProfile = Depends(get_current_user)):
    return _run(svc.read_live, current_user, assignment_id, after)


@router.get("/assignments/{assignment_id}/live/frame")
def get_frame(assignment_id: str, current_user: UserProfile = Depends(get_current_user)):
    frame = _run(svc.read_frame, current_user, assignment_id)
    if frame is None:
        raise HTTPException(status_code=404, detail="No frame yet.")
    return Response(
        content=frame["jpeg"], media_type="image/jpeg",
        headers={"Cache-Control": "no-store", "X-Frame-Seq": str(frame["seq"]),
                 "X-Frame-Width": str(frame["width"]), "X-Frame-Height": str(frame["height"])},
    )


@router.get("/live/active")
def get_active(current_user: UserProfile = Depends(get_current_user)):
    return _run(svc.active_runs, current_user)


# ---------------------------------------------------------------------------------------------- live stream
log = logging.getLogger("live_stream")
BOUNDARY = "mediverframe"


@router.websocket("/assignments/{assignment_id}/runs/{run_id}/stream")
async def stream_in(websocket: WebSocket, assignment_id: str, run_id: str):
    """The headset's stream. Auth is the same bearer token as every device call, read off the upgrade request
    (a .NET ClientWebSocket can set headers; a browser cannot, and no browser speaks this side). The run is
    checked ONCE here and again whenever a frame is kept to the database (about once a second), so a run that
    ends or is reported closes the stream within a second. A refused upgrade (403) is what the headset reads as
    'not available', and holds off for ten minutes, exactly as a 404 on the event path does."""
    authorization = websocket.headers.get("authorization") or ""
    token = authorization[7:].strip() if authorization.lower().startswith("bearer ") else ""

    def lookup():
        with devices.cursor() as cur:
            devices._require_tables(cur)
            return devices.authenticate_device(cur, token)

    try:
        device = await run_in_threadpool(lookup) if token else None
        if not device:
            await websocket.close(code=1008, reason="Re-pair to stream")
            return
        await run_in_threadpool(svc.open_stream, device, assignment_id, run_id)
    except svc.ConnectUnavailable:
        await websocket.close(code=1008, reason=NOT_SET_UP)
        return
    except svc.ConnectError as exc:
        await websocket.close(code=1008, reason=exc.detail[:120])
        return

    await websocket.accept()
    await relay.device_entered(assignment_id)
    last_control = None
    last_control_at = 0.0
    last_kept_at = 0.0
    frames_in = 0
    keep_task = None
    keep_error = None

    async def keep(meta, jpeg):
        # The database copy runs OFF the receive loop (a cloud round trip would stall the stream); one at a time.
        nonlocal keep_error
        try:
            await run_in_threadpool(svc.store_stream_frame, device, assignment_id, run_id, meta, jpeg)
        except svc.ConnectError as exc:
            keep_error = exc

    async def send_control(force: bool = False):
        nonlocal last_control, last_control_at
        control = lc.stream_control(relay.watchers(assignment_id))
        now = now_monotonic()
        if force or control != last_control or now - last_control_at >= lc.STREAM_CONTROL_EVERY_SECONDS:
            await websocket.send_text(json.dumps(control))
            last_control, last_control_at = control, now

    async def control_loop():
        while True:
            await asyncio.sleep(0.5)
            await send_control()

    ticker = asyncio.create_task(control_loop())
    try:
        await send_control(force=True)
        while True:
            message = await websocket.receive()
            if message.get("type") == "websocket.disconnect":
                break
            data = message.get("bytes")
            if data is None:
                continue                                      # a text message from the device is nothing we defined
            meta, jpeg, problems = lc.parse_stream_frame(data)
            if problems:
                await websocket.send_text(json.dumps({"error": "; ".join(problems)}))
                continue
            frames_in += 1
            await relay.publish(assignment_id, RelayFrame(meta["seq"], meta["width"], meta["height"], jpeg,
                                                          meta["capturedAt"], now_monotonic()))
            if keep_error is not None:
                # The last database keep said the run is over (ended, reported, cancelled): close within a second.
                await websocket.close(code=1008, reason=keep_error.detail[:120])
                break
            now = now_monotonic()
            if now - last_kept_at >= 1.0 and (keep_task is None or keep_task.done()):
                # The database copy (snapshot row) about once a second: keeps GET /live/frame and the polling
                # page honest for a viewer that is not on the stream, and re-checks that the run is still live.
                last_kept_at = now
                keep_task = asyncio.create_task(keep(meta, jpeg))
    except WebSocketDisconnect:
        pass
    except Exception as exc:                                  # noqa: BLE001 - the stream is advisory; say it and end
        log.warning("stream for %s/%s ended with %s", assignment_id, run_id, exc)
    finally:
        ticker.cancel()
        if keep_task is not None and not keep_task.done():
            keep_task.cancel()
        await relay.device_left(assignment_id)
        log.info("stream for %s/%s closed after %d frames", assignment_id, run_id, frames_in)


@router.get("/assignments/{assignment_id}/live/stream")
async def stream_out(assignment_id: str, current_user: UserProfile = Depends(get_current_user)):
    """The viewer's picture: an MJPEG multipart body that an <img> plays, one part per frame off the relay. Who
    may watch is the live page's rule (read_live). The response is never compressed or cached (a proxy that
    buffers it shows nothing), and a boundary-only part every few seconds keeps idle connections open."""
    await run_in_threadpool(_run, svc.may_watch, current_user, assignment_id)

    async def body():
        last_stamp = 0.0
        last_frame = None
        async for frame in relay.watch(assignment_id):
            now = now_monotonic()
            if now - last_stamp >= 3.0:
                # A watcher on the stream is a watcher for the snapshot path as well (old builds send only that).
                last_stamp = now
                try:
                    await run_in_threadpool(svc.stamp_viewed, assignment_id)
                except Exception:                             # noqa: BLE001 - a missed stamp costs a snapshot, never the stream
                    pass
            if frame is None:
                # Nothing new for a while: repeat the last picture so the connection carries bytes (a proxy
                # idle timeout) and the browser keeps a valid part; before any picture, nothing is sent.
                if last_frame is None:
                    continue
                frame = last_frame
            last_frame = frame
            head = (f"--{BOUNDARY}\r\nContent-Type: image/jpeg\r\nContent-Length: {len(frame.jpeg)}\r\n"
                    f"X-Frame-Seq: {frame.seq}\r\n\r\n").encode()
            yield head + frame.jpeg + b"\r\n"
        yield f"--{BOUNDARY}--\r\n".encode()

    return StreamingResponse(body(), media_type=f"multipart/x-mixed-replace; boundary={BOUNDARY}",
                             headers={"Cache-Control": "no-store", "Content-Encoding": "identity",
                                      "X-Accel-Buffering": "no"})


@router.get("/assignments/{assignment_id}/live/stream/status")
def stream_status(assignment_id: str, current_user: UserProfile = Depends(get_current_user)):
    """Is the headset on the stream right now, and is anyone watching? For the live page to choose its picture."""
    _run(svc.may_watch, current_user, assignment_id)
    ch = relay.peek(assignment_id)
    return {"deviceConnected": bool(ch and ch.device_connected), "watchers": ch.watchers if ch else 0,
            "frameSeq": ch.frame.seq if ch and ch.frame else None,
            "serverTimeUtc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")}

