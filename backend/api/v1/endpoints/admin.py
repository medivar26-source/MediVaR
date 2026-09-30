"""
Administrator API — account provisioning for staff, across institutions.

GET  /api/v1/admin/institutions  — every institution
GET  /api/v1/admin/instructors   — instructors and admins (optionally one institution)
POST /api/v1/admin/instructors   — create an instructor login in a chosen institution

The `admin` role is the platform administrator: it creates instructors for any
institution, existing or new. It does not read learner, cohort or case data:
those endpoints are scoped to the instructor and institution that own them, so an
instructor only ever sees the learners of their own institution.
"""
import logging
import re
import secrets
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field

from core.security import require_role
from schemas.auth import UserProfile
from services import auth_service

logger = logging.getLogger(__name__)
router = APIRouter()

_EMAIL = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class Institution(BaseModel):
    id: str
    name: str


class StaffMember(BaseModel):
    id: str
    first_name: str
    last_name: str
    email: Optional[str] = None
    role: str
    status: str
    institution_id: Optional[str] = None
    institution_name: Optional[str] = None
    created_at: Optional[str] = None


class InstructorCreate(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=80)
    last_name: str = Field(..., min_length=1, max_length=80)
    email: str = Field(..., max_length=254)
    # Exactly one of these: an existing institution, or the name of a new one.
    institution_id: Optional[str] = Field(default=None, max_length=64)
    institution_name: Optional[str] = Field(default=None, max_length=120)
    # Optional: when omitted the server generates one.
    temp_password: Optional[str] = Field(default=None, min_length=8, max_length=128)


class InstructorCreated(BaseModel):
    user: StaffMember
    # Returned once, at creation. It is never stored or logged in plain text.
    temp_password: str


def _member(row: dict) -> StaffMember:
    created = row.get("created_at")
    return StaffMember(
        id=str(row["id"]),
        first_name=row["first_name"],
        last_name=row["last_name"],
        email=row.get("email"),
        role=row["role"],
        status=row["status"],
        institution_id=str(row["institution_id"]) if row.get("institution_id") else None,
        institution_name=row.get("institution_name"),
        created_at=created.isoformat() if hasattr(created, "isoformat") else created,
    )


def _generate_password() -> str:
    # 12 url-safe characters, well above the 8-character minimum.
    return secrets.token_urlsafe(9)


@router.get("/institutions", response_model=List[Institution])
def list_institutions(current_user: UserProfile = Depends(require_role("admin"))):
    return [Institution(id=str(r["id"]), name=r["name"]) for r in auth_service.list_institutions()]


@router.get("/instructors", response_model=List[StaffMember])
def list_instructors(
    institution_id: Optional[str] = Query(default=None),
    current_user: UserProfile = Depends(require_role("admin")),
):
    return [_member(r) for r in auth_service.list_staff(institution_id)]


@router.post(
    "/instructors",
    response_model=InstructorCreated,
    status_code=status.HTTP_201_CREATED,
)
def create_instructor(
    payload: InstructorCreate,
    current_user: UserProfile = Depends(require_role("admin")),
):
    email = payload.email.strip().lower()
    if not _EMAIL.match(email):
        raise HTTPException(status_code=422, detail="Enter a valid email address.")

    chosen_id = (payload.institution_id or "").strip()
    typed_name = (payload.institution_name or "").strip()
    if bool(chosen_id) == bool(typed_name):
        raise HTTPException(
            status_code=422,
            detail="Choose an existing institution, or enter the name of a new one.",
        )

    if chosen_id:
        institution = auth_service.get_institution_name(chosen_id)
        if not institution:
            raise HTTPException(status_code=404, detail="Institution not found.")
    else:
        if len(typed_name) < 2:
            raise HTTPException(status_code=422, detail="Enter the institution's full name.")
        # Reuse an existing institution spelled differently in case only.
        existing = auth_service.find_institution_by_name(typed_name)
        institution = existing["name"] if existing else typed_name

    password = payload.temp_password or _generate_password()
    try:
        profile = auth_service.provision_instructor(
            email=email,
            first_name=payload.first_name.strip(),
            last_name=payload.last_name.strip(),
            institution_name=institution,
            temp_password=password,
        )
    except ValueError as exc:
        message = str(exc)
        code = 409 if "already exists" in message else 400
        raise HTTPException(status_code=code, detail=message)

    logger.info("Admin %s created instructor %s in %s", current_user.id, profile.id, institution)
    return InstructorCreated(
        user=StaffMember(
            id=profile.id,
            first_name=profile.first_name,
            last_name=profile.last_name,
            email=profile.email,
            role=profile.role,
            status=profile.status,
            institution_id=profile.institution_id,
            institution_name=institution,
        ),
        temp_password=password,
    )
