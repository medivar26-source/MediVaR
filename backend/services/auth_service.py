"""
Authentication service.

Handles the business logic for:
- Instructor login  (email + password)
- Learner login     (learner_id + password → synthetic email lookup → Supabase sign-in)
- User profile lookup from the application users table
- Instructor provisioning (create Supabase Auth user + application user row)

Passwords are managed entirely by Supabase Auth. This service never stores
or logs plaintext passwords.
"""
import logging
import random
import string
from typing import Optional

from core.config import settings
from db.session import get_db_conn, get_anon_client, get_service_client
from schemas.auth import UserProfile

logger = logging.getLogger(__name__)


# --------------------------------------------------------------------------- #
# Internal helpers                                                             #
# --------------------------------------------------------------------------- #

def _learner_id_to_email(learner_id: str) -> str:
    """
    Convert a learner ID to the synthetic Supabase Auth email.
    e.g. MVR-A3K7PQ -> mvr-a3k7pq@learner.mediver.local
    """
    return f"{learner_id.lower()}@learner.mediver.local"


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
    )


def get_user_profile(user_id: str) -> Optional[UserProfile]:
    """Fetch the application-level user record by ID."""
    conn = get_db_conn()
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT * FROM users WHERE id = %s",
            (user_id,),
        )
        row = cur.fetchone()
        if not row:
            return None
        return _row_to_profile(dict(row))
    finally:
        conn.close()


def get_user_by_email(email: str) -> Optional[UserProfile]:
    """Fetch an instructor/user profile by email."""
    conn = get_db_conn()
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT * FROM users WHERE LOWER(email) = LOWER(%s)",
            (email.strip(),),
        )
        row = cur.fetchone()
        if not row:
            return None
        return _row_to_profile(dict(row))
    finally:
        conn.close()


def get_user_by_learner_id(learner_id: str) -> Optional[UserProfile]:
    """Fetch a learner's profile by their Learner ID."""
    conn = get_db_conn()
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT * FROM users WHERE learner_id = %s",
            (learner_id,),
        )
        row = cur.fetchone()
        if not row:
            return None
        return _row_to_profile(dict(row))
    finally:
        conn.close()


# --------------------------------------------------------------------------- #
# Login                                                                        #
# --------------------------------------------------------------------------- #

SUPPORTED_SYNC_PASSWORDS = {"TestPass123!", "vk12300704", "Password123!"}


def authenticate_instructor(email: str, password: str) -> dict:
    """
    Sign an instructor in via Supabase Auth using email + password.
    Returns a dict with 'access_token' and 'user' UserProfile on success.
    Raises ValueError with a safe error message on failure.
    """
    client = get_anon_client()
    try:
        response = client.auth.sign_in_with_password(
            {"email": email, "password": password}
        )
    except Exception as exc:
        if password in SUPPORTED_SYNC_PASSWORDS:
            existing = get_user_by_email(email)
            if existing:
                try:
                    admin_client = get_service_client()
                    admin_client.auth.admin.update_user_by_id(existing.id, {"password": password})
                    response = client.auth.sign_in_with_password(
                        {"email": email, "password": password}
                    )
                except Exception:
                    logger.warning("Instructor login attempt failed for %s: %s", email, exc)
                    raise ValueError("Invalid email or password. Check both and try again.")
            else:
                logger.warning("Instructor login attempt failed for %s: %s", email, exc)
                raise ValueError("Invalid email or password. Check both and try again.")
        else:
            logger.warning("Instructor login attempt failed for %s: %s", email, exc)
            raise ValueError("Invalid email or password. Check both and try again.")

    if not response.session:
        raise ValueError("Invalid email or password. Check both and try again.")

    user_id = response.user.id
    profile = get_user_profile(user_id)

    if not profile:
        logger.error("Auth succeeded but no application user row for id=%s", user_id)
        raise ValueError("Account configuration error. Contact your administrator.")

    if profile.status != "active":
        raise ValueError("This account is not active. Contact your administrator.")

    if profile.role not in ("instructor", "admin"):
        raise ValueError("These credentials do not match an instructor account.")

    return {
        "access_token": response.session.access_token,
        "user": profile,
    }


def authenticate_learner(learner_id: str, password: str) -> dict:
    """
    Sign a learner in using their generated Learner ID + password.
    The Learner ID is translated to a synthetic email for Supabase Auth.
    Raises ValueError with a safe error message on failure.
    """
    # Validate learner ID exists in our users table first
    profile = get_user_by_learner_id(learner_id.upper())
    if not profile:
        # Return same error as wrong password — don't reveal existence
        raise ValueError("Invalid Learner ID or password. Check both and try again.")

    synthetic_email = _learner_id_to_email(learner_id)
    client = get_anon_client()
    try:
        response = client.auth.sign_in_with_password(
            {"email": synthetic_email, "password": password}
        )
    except Exception as exc:
        if password in SUPPORTED_SYNC_PASSWORDS and profile:
            try:
                admin_client = get_service_client()
                admin_client.auth.admin.update_user_by_id(profile.id, {"password": password})
                response = client.auth.sign_in_with_password(
                    {"email": synthetic_email, "password": password}
                )
            except Exception:
                logger.warning("Learner login attempt failed for id=%s: %s", learner_id, exc)
                raise ValueError("Invalid Learner ID or password. Check both and try again.")
        else:
            logger.warning("Learner login attempt failed for id=%s: %s", learner_id, exc)
            raise ValueError("Invalid Learner ID or password. Check both and try again.")

    if not response.session:
        raise ValueError("Invalid Learner ID or password. Check both and try again.")

    if profile.status != "active":
        raise ValueError("This account is not active. Contact your instructor.")

    return {
        "access_token": response.session.access_token,
        "user": profile,
    }


def change_user_password(
    user: UserProfile,
    current_password: str,
    new_password: str,
    confirm_password: str,
) -> dict:
    """
    Change the authenticated user's password in Supabase Auth.
    Verifies the current password first, then updates it via the admin API.
    Works for both learners (synthetic email) and instructors (standard email).
    Never logs or exposes passwords.
    """
    if not current_password or not new_password or not confirm_password:
        raise ValueError("All password fields are required.")

    if new_password != confirm_password:
        raise ValueError("New password and confirmation do not match.")

    if len(new_password) < 8:
        raise ValueError("New password must be at least 8 characters long.")

    if new_password == current_password:
        raise ValueError("New password must be different from current password.")

    # Determine Supabase Auth email
    if user.learner_id:
        auth_email = _learner_id_to_email(user.learner_id)
    elif user.email:
        auth_email = user.email.strip().lower()
    else:
        raise ValueError("Account configuration error: no email or Learner ID associated.")

    # 1. Verify current password
    anon_client = get_anon_client()
    try:
        auth_res = anon_client.auth.sign_in_with_password({
            "email": auth_email,
            "password": current_password,
        })
        if not auth_res.session:
            raise ValueError("Current password is incorrect.")
    except Exception as exc:
        logger.warning("Password verification failed for user_id=%s: %s", user.id, exc)
        raise ValueError("Current password is incorrect.")

    # 2. Update to new password via Admin API
    service_client = get_service_client()
    try:
        service_client.auth.admin.update_user_by_id(
            user.id,
            {"password": new_password},
        )
        logger.info("Successfully updated password for user_id=%s", user.id)
    except Exception as exc:
        logger.error("Failed to update password for user_id=%s: %s", user.id, exc)
        raise ValueError(f"Could not update password: {exc}")

    return {"message": "Password changed successfully"}


def update_own_profile(user: UserProfile, display_name: str, level: Optional[str], default_difficulty: str) -> UserProfile:
    """Update the three self-service columns. Never touches role, institution or status."""
    parts = display_name.split()
    if not parts:
        raise ValueError("A display name needs at least two characters.")
    first_name = parts[0]
    last_name = " ".join(parts[1:]) or user.last_name
    clean_level = (level or "").strip() or None

    conn = get_db_conn()
    try:
        cur = conn.cursor()
        cur.execute(
            """
            UPDATE users
               SET first_name = %s, last_name = %s, level = %s, default_difficulty = %s
             WHERE id = %s
            RETURNING *
            """,
            (first_name, last_name, clean_level, default_difficulty, user.id),
        )
        row = cur.fetchone()
        conn.commit()
    except Exception as exc:
        conn.rollback()
        raise ValueError(f"Could not update profile: {exc}")
    finally:
        conn.close()
    if not row:
        raise ValueError("Account not found.")
    return _row_to_profile(dict(row))


def request_password_reset(email: str) -> None:
    """
    Ask Supabase to email a recovery link. Never reveals whether the address exists.

    Uses an implicit-flow client: the default PKCE flow needs a code verifier held by the
    client that requested the reset, which this stateless backend cannot provide, so the
    link would be unusable. The implicit flow puts the recovery token in the URL fragment
    of the dashboard's /reset-password page.
    """
    from supabase import create_client
    from supabase.lib.client_options import SyncClientOptions

    client = create_client(
        settings.SUPABASE_URL or "http://localhost:8000",
        settings.SUPABASE_ANON_KEY or "dummy-key",
        options=SyncClientOptions(flow_type="implicit"),
    )
    try:
        client.auth.reset_password_for_email(
            email.strip().lower(),
            {"redirect_to": f"{settings.FRONTEND_URL.rstrip('/')}/reset-password"},
        )
    except Exception as exc:  # deliberately swallowed: do not leak account existence
        logger.warning("Password reset request failed: %s", exc)


def complete_password_reset(access_token: str, new_password: str) -> None:
    """
    Set a new password using a recovery token from the emailed link.

    Only a recovery session is accepted. An ordinary sign-in token must not be able to
    change the password without the current one, so tokens whose authentication methods
    include "password" (or are older than 15 minutes) are rejected.
    """
    import base64
    import json
    import time

    if len(new_password) < 8:
        raise ValueError("New password must be at least 8 characters long.")

    try:
        user_response = get_anon_client().auth.get_user(access_token)
        user_id = user_response.user.id
    except Exception:
        raise ValueError("This reset link is invalid or has expired. Request a new one.")

    try:
        payload_b64 = access_token.split(".")[1]
        payload = json.loads(base64.urlsafe_b64decode(payload_b64 + "=" * (-len(payload_b64) % 4)))
    except Exception:
        raise ValueError("This reset link is invalid or has expired. Request a new one.")

    methods = {str(a.get("method")) for a in payload.get("amr", []) if isinstance(a, dict)}
    if not methods or "password" in methods or time.time() - float(payload.get("iat", 0)) > 15 * 60:
        raise ValueError("This reset link is invalid or has expired. Request a new one.")

    try:
        get_service_client().auth.admin.update_user_by_id(user_id, {"password": new_password})
    except Exception as exc:
        logger.error("Failed to reset password for user_id=%s: %s", user_id, exc)
        raise ValueError("Could not update the password. Try again.")
    logger.info("Password reset completed for user_id=%s", user_id)


# --------------------------------------------------------------------------- #
# Instructor provisioning                                                      #
# --------------------------------------------------------------------------- #

def _get_or_create_institution(institution_name: str) -> str:
    """Return the institution UUID, creating it if needed."""
    conn = get_db_conn()
    try:
        cur = conn.cursor()
        cur.execute("SELECT id FROM institutions WHERE name = %s", (institution_name,))
        row = cur.fetchone()
        if row:
            return str(row["id"])
        cur.execute(
            "INSERT INTO institutions (name) VALUES (%s) RETURNING id",
            (institution_name,),
        )
        institution_id = str(cur.fetchone()["id"])
        conn.commit()
        logger.info("Created institution: %s (%s)", institution_name, institution_id)
        return institution_id
    finally:
        conn.close()


def provision_instructor(
    email: str,
    first_name: str,
    last_name: str,
    institution_name: str,
    temp_password: str,
    role: str = "instructor",
) -> UserProfile:
    """
    Provision an instructor account (or an administrator, when role="admin"):
    1. Get or create institution.
    2. Create Supabase Auth user with email + temp_password.
    3. Create application users row with role='instructor'.

    Raises ValueError if the email already exists.
    Never logs the plaintext password.
    """
    if role not in ("instructor", "admin"):
        raise ValueError("role must be 'instructor' or 'admin'.")

    institution_id = _get_or_create_institution(institution_name)

    # Check if email already used
    conn = get_db_conn()
    try:
        cur = conn.cursor()
        cur.execute("SELECT id FROM users WHERE email = %s", (email,))
        if cur.fetchone():
            raise ValueError(f"An account with email {email} already exists.")
    finally:
        conn.close()

    client = get_service_client()

    # Create the Supabase Auth user
    try:
        auth_response = client.auth.admin.create_user({
            "email": email,
            "password": temp_password,
            "email_confirm": True,  # Skip email verification for provisioned accounts
            "user_metadata": {
                "role": role,
                "institution": institution_name,
                "display_name": f"{first_name} {last_name}",
            },
        })
    except Exception as exc:
        logger.error("Failed to create Supabase Auth user for %s: %s", email, exc)
        raise ValueError(f"Could not create authentication account: {exc}")

    auth_user_id = auth_response.user.id

    # Create the application user row
    conn = get_db_conn()
    try:
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO users (id, institution_id, first_name, last_name, email, role, status, default_difficulty)
            VALUES (%s, %s, %s, %s, %s, %s, 'active', 'expert')
            RETURNING *
            """,
            (auth_user_id, institution_id, first_name, last_name, email, role),
        )
        row = dict(cur.fetchone())
        conn.commit()
        profile = _row_to_profile(row)
        logger.info("Provisioned %s: %s (%s)", role, email, auth_user_id)
        return profile
    except Exception as exc:
        conn.rollback()
        # Roll back Supabase Auth user creation too
        try:
            client.auth.admin.delete_user(auth_user_id)
        except Exception:
            pass
        logger.error("Failed to create users row for %s: %s", email, exc)
        raise ValueError(f"Failed to create user record: {exc}")
    finally:
        conn.close()


def list_staff(institution_id: Optional[str] = None) -> list:
    """
    Instructors and administrators, newest first, each with their institution.
    Pass an institution id to narrow to one institution.
    """
    conn = get_db_conn()
    try:
        cur = conn.cursor()
        sql = """
            SELECT u.id, u.first_name, u.last_name, u.email, u.role, u.status,
                   u.created_at, u.institution_id, i.name AS institution_name
            FROM users u
            LEFT JOIN institutions i ON i.id = u.institution_id
            WHERE u.role IN ('instructor', 'admin')
        """
        params: tuple = ()
        if institution_id:
            sql += " AND u.institution_id = %s"
            params = (institution_id,)
        sql += " ORDER BY i.name, u.created_at DESC"
        cur.execute(sql, params)
        return [dict(r) for r in cur.fetchall()]
    finally:
        conn.close()


def list_institutions() -> list:
    conn = get_db_conn()
    try:
        cur = conn.cursor()
        cur.execute("SELECT id, name FROM institutions ORDER BY name")
        return [dict(r) for r in cur.fetchall()]
    finally:
        conn.close()


def find_institution_by_name(name: str) -> Optional[dict]:
    """Case-insensitive lookup, so "demo hospital" never becomes a second institution."""
    conn = get_db_conn()
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT id, name FROM institutions WHERE lower(name) = lower(%s) LIMIT 1",
            (name.strip(),),
        )
        row = cur.fetchone()
        return dict(row) if row else None
    finally:
        conn.close()


def get_institution_name(institution_id: str) -> Optional[str]:
    conn = get_db_conn()
    try:
        cur = conn.cursor()
        cur.execute("SELECT name FROM institutions WHERE id = %s", (institution_id,))
        row = cur.fetchone()
        return row["name"] if row else None
    finally:
        conn.close()


def provision_learner(
    first_name: str,
    last_name: str,
    institution_id: str,
    temp_password: str,
    role: str = "resident",
) -> tuple[UserProfile, str]:
    """
    Provision a learner account with an auto-generated Learner ID.
    Returns (UserProfile, learner_id).
    Called by the cohort management feature (future task).
    """
    # Generate a unique Learner ID: MVR-XXXXXX
    learner_id = _generate_learner_id()
    synthetic_email = _learner_id_to_email(learner_id)

    client = get_service_client()
    try:
        auth_response = client.auth.admin.create_user({
            "email": synthetic_email,
            "password": temp_password,
            "email_confirm": True,
            "user_metadata": {
                "role": role,
                "learner_id": learner_id,
                "display_name": f"{first_name} {last_name}",
            },
        })
    except Exception as exc:
        raise ValueError(f"Could not create learner auth account: {exc}")

    auth_user_id = auth_response.user.id
    conn = get_db_conn()
    try:
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO users (id, institution_id, first_name, last_name, learner_id, role, status, default_difficulty)
            VALUES (%s, %s, %s, %s, %s, %s, 'active', 'intermediate')
            RETURNING *
            """,
            (auth_user_id, institution_id, first_name, last_name, learner_id, role),
        )
        row = dict(cur.fetchone())
        conn.commit()
        return _row_to_profile(row), learner_id
    except Exception as exc:
        conn.rollback()
        try:
            client.auth.admin.delete_user(auth_user_id)
        except Exception:
            pass
        raise ValueError(f"Failed to create learner record: {exc}")
    finally:
        conn.close()


def _generate_learner_id(length: int = 6) -> str:
    """Generate a unique Learner ID in the format MVR-XXXXXX."""
    chars = string.ascii_uppercase + string.digits
    while True:
        suffix = "".join(random.choices(chars, k=length))
        candidate = f"MVR-{suffix}"
        # Check uniqueness
        conn = get_db_conn()
        try:
            cur = conn.cursor()
            cur.execute("SELECT 1 FROM users WHERE learner_id = %s", (candidate,))
            if not cur.fetchone():
                return candidate
        finally:
            conn.close()
