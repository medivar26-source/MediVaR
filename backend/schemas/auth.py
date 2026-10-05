"""
Pydantic schemas for authentication request/response shapes.
"""
from typing import Literal, Optional
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


class ChangePasswordRequest(BaseModel):
    """Request payload for changing an authenticated user's password."""
    current_password: str = Field(..., min_length=1, description="Current password for verification")
    new_password: str = Field(..., min_length=8, description="New password, minimum 8 characters")
    confirm_password: str = Field(..., min_length=8, description="Confirm new password")


class ChangePasswordResponse(BaseModel):
    """Response returned when password change succeeds."""
    message: str = "Password changed successfully"



class ForgotPasswordRequest(BaseModel):
    """Request a password-reset email. Instructor/admin accounts only (learners have no inbox)."""
    email: str = Field(..., min_length=3, max_length=254)


class ResetPasswordRequest(BaseModel):
    """Complete a reset using the recovery access token from the emailed link."""
    access_token: str = Field(..., min_length=10)
    new_password: str = Field(..., min_length=8, max_length=128)


class MessageResponse(BaseModel):
    message: str


class ProfileUpdate(BaseModel):
    """Self-service profile fields. Role, institution and status are never editable here."""
    display_name: str = Field(..., min_length=2, max_length=80)
    level: Optional[str] = Field(default=None, max_length=60)
    default_difficulty: Literal["beginner", "intermediate", "expert"]
