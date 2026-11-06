"""
Live view: what the resident is doing and seeing, while they operate.

Headset (bearer token from pairing; the paths are the VR team's contract, VR_TEAM_PROMPT_live_view.md):
    POST /assignments/{id}/runs/{runId}/events   up to 50 small events, at most once a second; heartbeat every 5 s
    PUT  /assignments/{id}/runs/{runId}/frame    raw JPEG <= 640x360, <= 150 KB, only while the reply said wantFrames

Dashboard (signed-in user):
    GET /assignments/{id}/live?after=<seq>       state + events after seq + frame meta; stamps "someone is watching"
    GET /assignments/{id}/live/frame             the newest JPEG, never cached
    GET /live/active                             the runs live now that the caller may watch

Every path answers 404 "not set up" until migration 016 is applied: the headset switches live off for ten
minutes and carries on, the dashboard shows no live page. Design: mediver_documentation/25_LIVE_VIEW_AND_RUN_JOURNEY.md
"""
from typing import Any, Dict

from fastapi import APIRouter, Body, Depends, HTTPException, Request, Response
from fastapi.concurrency import run_in_threadpool

from api.v1.endpoints.connect import current_device
from core.connect import live_contract as lc
from core.security import get_current_active_user as get_current_user
from schemas.auth import UserProfile
from services import live_service as svc

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
