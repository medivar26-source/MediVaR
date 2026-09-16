"""
Pydantic schemas for authentication request/response shapes.
"""
from typing import Optional
from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    """
    POST /api/v1/auth/login

    login_type distinguishes instructor (email+password) from learner (learner_id+password).
    identifier is either the email address or the Learner ID depending on login_type.
    """
    login_type: str = Field(..., description="'instructor' or 'learner'")
    identifier: str = Field(..., description="Email for instructor, Learner ID for learner")
    password: str = Field(..., min_length=1)


class UserProfile(BaseModel):
    """Application-level user profile returned to authenticated clients."""
    id: str
    institution_id: Optional[str] = None
    first_name: str
    last_name: str
    display_name: str          # Computed: first_name + last_name
    email: Optional[str] = None
    learner_id: Optional[str] = None
    role: str
    status: str
    default_difficulty: str
    level: Optional[str] = None
    cohort_id: Optional[str] = None


class LoginResponse(BaseModel):
    """Successful login response."""
    access_token: str
    token_type: str = "bearer"
    user: UserProfile


class MeResponse(BaseModel):
    """Response for GET /api/v1/auth/me"""
    user: UserProfile


class LogoutRequest(BaseModel):
    """Optional body for logout (token can also come from Authorization header)."""
    pass
