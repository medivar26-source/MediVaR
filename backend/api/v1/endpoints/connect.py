"""
Dashboard <-> Quest 3 over HTTPS. Two audiences, two kinds of caller, one router.

Dashboard (the signed-in user, Supabase token):
    POST /plans/locked              keep the planner's sealed plan
    POST /assignments               "Send to headset": returns the one-time code, shown once
    GET  /assignments               what was sent, and where each has got to

Headset (a bearer token it got by pairing; paths and shapes are the headset plan's contract):
    POST /devices/pair              {code, deviceId, deviceName, appVersion, schemaVersion} -> token + CasePlan
    GET  /assignments/{id}/plan     re-fetch the CasePlan
    PUT  /assignments/{id}/runs/{runId}/report    RunReport; idempotent on runId, a higher reportRevision replaces

Every path answers 404 "not set up" until migration 015 is applied, which the dashboard reads as "no headset
link yet" and shows no "Send to headset" button. Design: mediver_documentation/23_VR_CONNECTIVITY_DESIGN.md
"""
from typing import Any, Dict, Optional

from fastapi import APIRouter, Body, Depends, Header, HTTPException, Request
from pydantic import BaseModel

from core.security import get_current_active_user as get_current_user
from schemas.auth import UserProfile
from services import connect_service as svc

router = APIRouter()

NOT_SET_UP = "VR connectivity is not set up (migration 015 not applied)."


def _run(fn, *args, **kwargs):
    """Call the service; turn its two errors into the HTTP answers the contract names."""
    try:
        return fn(*args, **kwargs)
    except svc.ConnectUnavailable:
        raise HTTPException(status_code=404, detail=NOT_SET_UP)
    except svc.ConnectError as exc:
        headers = {"Retry-After": str(exc.retry_after)} if exc.retry_after else None
        raise HTTPException(status_code=exc.status, detail=exc.detail, headers=headers)


# ----------------------------------------------------------------------------------------------- dashboard
@router.post("/plans/locked")
def store_locked_plan(body: Dict[str, Any] = Body(...), current_user: UserProfile = Depends(get_current_user)):
    return _run(svc.store_locked_plan, current_user, body)


class AssignmentIn(BaseModel):
    plan_id: str
    mode: Optional[str] = None          # Guided | Practice | Exam; defaults from the plan's own mode
    session_id: Optional[str] = None


@router.post("/assignments", status_code=201)
def create_assignment(body: AssignmentIn, current_user: UserProfile = Depends(get_current_user)):
    return _run(svc.create_assignment, current_user, body.plan_id, body.mode, body.session_id)


@router.get("/assignments")
def list_assignments(plan_id: Optional[str] = None, current_user: UserProfile = Depends(get_current_user)):
    return _run(svc.list_assignments, current_user, plan_id)


# ------------------------------------------------------------------------------------------------ headset
class PairIn(BaseModel):
    code: str
    deviceId: str
    deviceName: str = ""
    appVersion: str = ""
    schemaVersion: int = 1


@router.post("/devices/pair")
def pair_device(body: PairIn, request: Request):
    client = f"{request.client.host if request.client else 'unknown'}|{body.deviceId}"
    return _run(svc.pair_device, body.model_dump(), client)


def current_device(authorization: Optional[str] = Header(default=None)) -> Dict[str, Any]:
    token = authorization[7:].strip() if authorization and authorization.lower().startswith("bearer ") else ""
    if not token:
        # No credentials at all: refuse without touching the database.
        raise HTTPException(status_code=401, detail="Re-pair to upload", headers={"WWW-Authenticate": "Bearer"})
    def lookup():
        with svc.cursor() as cur:
            svc._require_tables(cur)
            return svc.authenticate_device(cur, token)
    device = _run(lookup)
    if not device:
        # The headset reads 401 as "re-pair": its reports stay queued until it has a valid token again.
        raise HTTPException(status_code=401, detail="Re-pair to upload", headers={"WWW-Authenticate": "Bearer"})
    return device


@router.get("/assignments/{assignment_id}/plan")
def get_plan(assignment_id: str, device: Dict[str, Any] = Depends(current_device)):
    return _run(svc.device_plan, device, assignment_id)


@router.put("/assignments/{assignment_id}/runs/{run_id}/report")
def put_report(assignment_id: str, run_id: str, body: Any = Body(...), device: Dict[str, Any] = Depends(current_device)):
    return _run(svc.ingest_report, device, assignment_id, run_id, body)
