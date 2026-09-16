"""
Authentication API endpoints.

POST /api/v1/auth/login  — instructor (email+password) or learner (learner_id+password)
GET  /api/v1/auth/me     — return current authenticated user profile
POST /api/v1/auth/logout — revoke the current session token
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from core.security import get_current_active_user
from schemas.auth import LoginRequest, LoginResponse, MeResponse, UserProfile
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

    try:
        if login_type == "instructor":
            result = auth_service.authenticate_instructor(
                email=payload.identifier.strip().lower(),
                password=payload.password,
            )
        else:
            result = auth_service.authenticate_learner(
                learner_id=payload.identifier.strip().upper(),
                password=payload.password,
            )
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


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Sign out and revoke the current session",
)
async def logout(
    current_user: UserProfile = Depends(get_current_active_user),
):
    """
    Sign the user out. The client must discard its local token copy.
    The backend revokes the session via Supabase Auth admin API.
    """
    from db.session import get_service_client
    client = get_service_client()
    try:
        client.auth.sign_out()
    except Exception as exc:
        # Log but don't fail — the client should discard the token regardless
        logger.warning("Error revoking session for user %s: %s", current_user.id, exc)
    return None
