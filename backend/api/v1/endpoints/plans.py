"""
Pre-operative plans, stored in the database so a restart loses nothing.

    POST  /plans                 start a draft for a case           {case_id, session_config:{mode,difficulty,...}}
    GET   /plans                 my plans (?case_id=), or ?supervised=true for staff
    GET   /plans/{id}            one plan with its sealed snapshot (owner, supervising instructor, institution admin)
    PATCH /plans/{id}            save planner work into a draft     {payload:{v1_assessment|v1_tibial|...}}
    POST  /plans/{id}/lock       seal a draft                       {vr_payload, session_config:{implant_design,fixation}}

(`POST /plans/locked` in the headset router is the older one-call "store an already sealed plan" and still works.)
Every path answers 404 "not set up" until migration 013 is applied.
"""
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from core.security import get_current_active_user as get_current_user
from schemas.auth import UserProfile
from services import plan_service as svc

router = APIRouter()

NOT_SET_UP = "Plans are not set up (migration 013 not applied)."


def _run(fn, *args, **kwargs):
    try:
        return fn(*args, **kwargs)
    except svc.PlanUnavailable:
        raise HTTPException(status_code=404, detail=NOT_SET_UP)
    except svc.PlanError as exc:
        raise HTTPException(status_code=exc.status, detail=exc.detail)


class PlanCreateIn(BaseModel):
    case_id: str
    session_config: Dict[str, Any] = Field(default_factory=dict)


class PlanUpdateIn(BaseModel):
    payload: Dict[str, Any]


class PlanLockIn(BaseModel):
    vr_payload: Dict[str, Any]
    session_config: Dict[str, Any] = Field(default_factory=dict)


@router.post("", status_code=201)
@router.post("/", status_code=201, include_in_schema=False)
def create_plan(body: PlanCreateIn, current_user: UserProfile = Depends(get_current_user)):
    return _run(svc.create_plan, current_user, body.case_id, body.session_config)


@router.get("")
@router.get("/", include_in_schema=False)
def list_plans(
    case_id: Optional[str] = None,
    supervised: bool = False,
    limit: int = svc.DEFAULT_LIMIT,
    current_user: UserProfile = Depends(get_current_user),
):
    return _run(svc.list_plans, current_user, case_id, supervised, limit)


@router.get("/{plan_id}")
def get_plan(plan_id: str, current_user: UserProfile = Depends(get_current_user)):
    return _run(svc.get_plan, current_user, plan_id)


@router.patch("/{plan_id}")
def update_plan(plan_id: str, body: PlanUpdateIn, current_user: UserProfile = Depends(get_current_user)):
    return _run(svc.update_plan, current_user, plan_id, body.payload)


@router.post("/{plan_id}/lock")
def lock_plan(plan_id: str, body: PlanLockIn, current_user: UserProfile = Depends(get_current_user)):
    return _run(svc.lock_plan, current_user, plan_id, body.vr_payload, body.session_config)
