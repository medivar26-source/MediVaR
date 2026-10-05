"""
Authentication API endpoints.

POST /api/v1/auth/login           — instructor (email+password) or learner (learner_id+password)
GET  /api/v1/auth/me              — return current authenticated user profile
POST /api/v1/auth/logout          — revoke the current session token
POST /api/v1/auth/change-password — change password for current authenticated user
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from core.security import get_current_active_user
from schemas.auth import (
    ProfileUpdate,
    ForgotPasswordRequest,
    MessageResponse,
    ResetPasswordRequest,
    ChangePasswordRequest,
    ChangePasswordResponse,
    LoginRequest,
    LoginResponse,
    MeResponse,
    UserProfile,
)
from services import auth_service

logger = logging.getLogger(__name__)
router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login", auto_error=False)


@router.post(
    "/login",
    response_model=LoginResponse,
    summary="Authenticate instructor (email) or learner (Learner ID)",
)
async def login(payload: LoginRequest):
    """
    Authenticate a user and return a Supabase JWT access token.

    - **login_type** = "instructor" → authenticate with email + password
    - **login_type** = "learner"    → authenticate with Learner ID + password

    On success returns the access token and user profile.
    On failure returns a 401 with a safe generic error message.
    """
    login_type = payload.login_type.strip().lower()

    if login_type not in ("instructor", "learner"):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="login_type must be 'instructor' or 'learner'.",
        )

    ident = payload.identifier.strip()
    try:
        if login_type == "instructor":
            # If the user inadvertently entered a Learner ID on the Instructor tab
            if "@" not in ident and (ident.upper().startswith("MVR-") or auth_service.get_user_by_learner_id(ident.upper())):
                result = auth_service.authenticate_learner(
                    learner_id=ident.upper(),
                    password=payload.password,
                )
            else:
                try:
                    result = auth_service.authenticate_instructor(
                        email=ident.lower(),
                        password=payload.password,
                    )
                except ValueError as exc:
                    # Fallback to learner if user exists as learner
                    if auth_service.get_user_by_learner_id(ident.upper()):
                        result = auth_service.authenticate_learner(
                            learner_id=ident.upper(),
                            password=payload.password,
                        )
                    else:
                        raise exc
        else:
            # If the user inadvertently entered an email on the Learner tab
            if "@" in ident:
                result = auth_service.authenticate_instructor(
                    email=ident.lower(),
                    password=payload.password,
                )
            else:
                try:
                    result = auth_service.authenticate_learner(
                        learner_id=ident.upper(),
                        password=payload.password,
                    )
                except ValueError as exc:
                    if auth_service.get_user_by_email(ident.lower()):
                        result = auth_service.authenticate_instructor(
                            email=ident.lower(),
                            password=payload.password,
                        )
                    else:
                        raise exc
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as exc:
        logger.error("Unexpected auth error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service is temporarily unavailable.",
        )

    return LoginResponse(
        access_token=result["access_token"],
        token_type="bearer",
        user=result["user"],
    )


@router.get(
    "/me",
    response_model=MeResponse,
    summary="Return the current authenticated user profile",
)
async def me(current_user: UserProfile = Depends(get_current_active_user)):
    """
    Return the authenticated user's profile.
    Requires a valid Bearer token in the Authorization header.
    """
    return MeResponse(user=current_user)


@router.patch(
    "/me",
    response_model=MeResponse,
    summary="Update the current user's own display name, level and default difficulty",
)
async def update_me(
    payload: ProfileUpdate,
    current_user: UserProfile = Depends(get_current_active_user),
):
    try:
        updated = auth_service.update_own_profile(
            current_user, payload.display_name.strip(), payload.level, payload.default_difficulty
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    return MeResponse(user=updated)


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Sign out and revoke the current session",
)
async def logout(
    current_user: UserProfile = Depends(get_current_active_user),
    token: str = Depends(oauth2_scheme),
):
    """
    Sign the user out. The client must discard its local token copy.
    The backend revokes the session via Supabase Auth admin API.
    """
    from db.session import get_service_client
    client = get_service_client()
    try:
        # Revoke this specific access token's session; a bare sign_out() on the
        # service client has no user session to act on and revokes nothing.
        client.auth.admin.sign_out(token)
    except Exception as exc:
        # Log but don't fail — the client should discard the token regardless
        logger.warning("Error revoking session for user %s: %s", current_user.id, exc)
    return None


@router.post(
    "/change-password",
    response_model=ChangePasswordResponse,
    summary="Change the authenticated user's password",
)
async def change_password(
    payload: ChangePasswordRequest,
    current_user: UserProfile = Depends(get_current_active_user),
):
    """
    Change password for the authenticated user.
    Verifies current_password before updating.
    Works for both learners and instructors.
    """
    try:
        result = auth_service.change_user_password(
            user=current_user,
            current_password=payload.current_password,
            new_password=payload.new_password,
            confirm_password=payload.confirm_password,
        )
        return ChangePasswordResponse(message=result["message"])
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )
    except Exception as exc:
        logger.error("Unexpected error changing password for user %s: %s", current_user.id, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to change password. Please try again later.",
        )



@router.post(
    "/forgot-password",
    response_model=MessageResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Email a password-reset link (instructor/admin accounts)",
)
async def forgot_password(payload: ForgotPasswordRequest):
    """Always answers 202 with the same message, whether or not the address has an account."""
    auth_service.request_password_reset(payload.email)
    return MessageResponse(
        message="If an account exists for that address, a reset link is on its way."
    )


@router.post(
    "/reset-password",
    response_model=MessageResponse,
    summary="Set a new password using the emailed recovery token",
)
async def reset_password(payload: ResetPasswordRequest):
    try:
        auth_service.complete_password_reset(payload.access_token, payload.new_password)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    return MessageResponse(message="Password updated. You can now sign in.")
