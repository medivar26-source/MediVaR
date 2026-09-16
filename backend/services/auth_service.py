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
from db.session import get_db_conn, get_service_client
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
        cohort_id=str(row["cohort_id"]) if row.get("cohort_id") else None,
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

def authenticate_instructor(email: str, password: str) -> dict:
    """
    Sign an instructor in via Supabase Auth using email + password.
    Returns a dict with 'access_token' and 'user' UserProfile on success.
    Raises ValueError with a safe error message on failure.
    """
    client = get_service_client()
    try:
        response = client.auth.sign_in_with_password(
            {"email": email, "password": password}
        )
    except Exception as exc:
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
    client = get_service_client()
    try:
        response = client.auth.sign_in_with_password(
            {"email": synthetic_email, "password": password}
        )
    except Exception as exc:
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
) -> UserProfile:
    """
    Provision an instructor account:
    1. Get or create institution.
    2. Create Supabase Auth user with email + temp_password.
    3. Create application users row with role='instructor'.

    Raises ValueError if the email already exists.
    Never logs the plaintext password.
    """
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
                "role": "instructor",
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
            VALUES (%s, %s, %s, %s, %s, 'instructor', 'active', 'expert')
            RETURNING *
            """,
            (auth_user_id, institution_id, first_name, last_name, email),
        )
        row = dict(cur.fetchone())
        conn.commit()
        profile = _row_to_profile(row)
        logger.info("Provisioned instructor: %s (%s)", email, auth_user_id)
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


def provision_learner(
    first_name: str,
    last_name: str,
    institution_id: str,
    temp_password: str,
    cohort_id: Optional[str] = None,
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
            INSERT INTO users (id, institution_id, first_name, last_name, learner_id, role, status, default_difficulty, cohort_id)
            VALUES (%s, %s, %s, %s, %s, %s, 'active', 'intermediate', %s)
            RETURNING *
            """,
            (auth_user_id, institution_id, first_name, last_name, learner_id, role, cohort_id),
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
