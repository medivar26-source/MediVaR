"""
Security utilities — JWT validation and FastAPI auth dependencies.

Validates Supabase-issued JWTs using the project JWT secret.
Maps the validated token's `sub` claim to the application user
(role, institution, status) from the users table.

Every protected endpoint depends on `get_current_active_user` or
one of the role-specific factories.
"""
import logging
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from core.config import settings
from db.session import get_db_conn, get_anon_client
from schemas.auth import UserProfile

logger = logging.getLogger(__name__)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login", auto_error=False)


def _get_supabase_user_id(token: str) -> str:
    """
    Validate a Supabase-issued JWT by fetching the user profile from Supabase.
    This handles any JWT signing algorithm (HS256/ES256) and ensures the token
    is not revoked.
    """
    client = get_anon_client()
    try:
        user_response = client.auth.get_user(token)
        if not user_response.user:
            raise ValueError("Token valid but user missing.")
        return user_response.user.id
    except Exception as exc:
        raise ValueError(f"Invalid token: {exc}")


def _row_to_profile(row: dict) -> UserProfile:
    return UserProfile(
        id=str(row["id"]),
        institution_id=str(row["institution_id"]) if row.get("institution_id") else None,
        first_name=row["first_name"],
        last_name=row["last_name"],
        display_name=f"{row['first_name']} {row['last_name']}",
        email=row.get("email"),
        learner_id=row.get("learner_id"),
        role=row["role"],
        status=row["status"],
        default_difficulty=row.get("default_difficulty", "intermediate"),
        level=row.get("level"),
        cohort_id=str(row["cohort_id"]) if row.get("cohort_id") else None,
    )


async def get_current_user(token: Optional[str] = Depends(oauth2_scheme)) -> Optional[UserProfile]:
    """
    Extract and validate the current user from the Bearer token.
    Returns None if no token is present (unauthenticated access to optional endpoints).
    """
    if not token:
        return None

    try:
        user_id = _get_supabase_user_id(token)
    except ValueError as exc:
        logger.warning("Token validation failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has expired or token is invalid. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    conn = get_db_conn()
    try:
        cur = conn.cursor()
        cur.execute("SELECT * FROM users WHERE id = %s", (user_id,))
        row = cur.fetchone()
    finally:
        conn.close()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authenticated user has no application account.",
        )

    return _row_to_profile(dict(row))


async def get_current_active_user(
    current_user: Optional[UserProfile] = Depends(get_current_user),
) -> UserProfile:
    """Require a valid, active session. Use this as the standard auth dependency."""
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if current_user.status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account is not active.",
        )
    return current_user


def require_role(*roles: str):
    """
    Factory that creates a FastAPI dependency requiring the user to have
    one of the specified roles.

    Usage:
        @router.get("/instructor-only")
        async def route(user = Depends(require_role("instructor", "admin"))):
            ...
    """
    async def _check(
        current_user: UserProfile = Depends(get_current_active_user),
    ) -> UserProfile:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access restricted. Required role(s): {', '.join(roles)}.",
            )
        return current_user

    return _check
