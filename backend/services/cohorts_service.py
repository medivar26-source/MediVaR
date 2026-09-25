import logging
import random
import string
from typing import List, Optional, Tuple
from schemas.cohorts import (
    CaseSummary, CohortCasesResponse, SessionSummary,
    SessionResidentSummary, SessionRosterResponse,
)
from db.session import get_db_conn
from datetime import datetime, timezone, timedelta
from schemas.cohorts import (
    CohortSummary, CohortDetail, LearnerSummary,
    CreateLearnerResponse, AddExistingLearnerResponse
)
from services.auth_service import provision_learner

logger = logging.getLogger(__name__)


def _get_or_create_default_program(institution_id: str) -> str:
    """Gets or creates a default program for the institution if none exists."""
    conn = get_db_conn()
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT id FROM programs WHERE institution_id = %s LIMIT 1",
            (institution_id,)
        )
        row = cur.fetchone()
        if row:
            return str(row["id"])
        
        cur.execute(
            """
            INSERT INTO programs (institution_id, name)
            VALUES (%s, 'Default Program')
            RETURNING id
            """,
            (institution_id,)
        )
        prog_id = str(cur.fetchone()["id"])
        conn.commit()
        return prog_id
    finally:
        conn.close()


def create_cohort(name: str, owner_id: str, institution_id: str, program_id: Optional[str] = None) -> CohortSummary:
    if not program_id:
        program_id = _get_or_create_default_program(institution_id)
        
    conn = get_db_conn()
    try:
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO cohorts (program_id, name, owner_id)
            VALUES (%s, %s, %s)
            RETURNING id, name, created_at
            """,
            (program_id, name, owner_id)
        )
        row = cur.fetchone()
        conn.commit()
        
        return CohortSummary(
            id=str(row["id"]),
            program_id=program_id,
            name=row["name"],
            owner_id=owner_id,
            created_at=row["created_at"],
            learners=0,
            mean_score=None,
            below_pass=0
        )
    except Exception as exc:
        conn.rollback()
        raise ValueError(f"Failed to create cohort: {exc}")
    finally:
        conn.close()


def get_instructor_cohorts(owner_id: str) -> List[CohortSummary]:
    conn = get_db_conn()
    try:
        cur = conn.cursor()
        cur.execute(
            """
            SELECT 
                c.id, c.program_id, c.name, c.owner_id, c.created_at,
                COUNT(cm.user_id) as learner_count
            FROM cohorts c
            LEFT JOIN cohort_members cm ON c.id = cm.cohort_id
            WHERE c.owner_id = %s
            GROUP BY c.id
            ORDER BY c.name
            """,
            (owner_id,)
        )
        
        cohorts = []
        for row in cur.fetchall():
            cohorts.append(CohortSummary(
                id=str(row["id"]),
                program_id=str(row["program_id"]),
                name=row["name"],
                owner_id=str(row["owner_id"]),
                created_at=row["created_at"],
                learners=row["learner_count"],
                mean_score=None,
                below_pass=0
            ))
        return cohorts
    finally:
        conn.close()


def get_cohort_detail(cohort_id: str, owner_id: str) -> Optional[CohortDetail]:
    conn = get_db_conn()
    try:
        cur = conn.cursor()
        # Verify ownership and get cohort info
        cur.execute(
            """
            SELECT id, program_id, name, owner_id, created_at
            FROM cohorts
            WHERE id = %s AND owner_id = %s
            """,
            (cohort_id, owner_id)
        )
        cohort_row = cur.fetchone()
        if not cohort_row:
            return None
            
        # Get learners
        cur.execute(
            """
            SELECT 
                u.id, u.first_name, u.last_name, u.role, u.learner_id,
                cm.joined_at
            FROM cohort_members cm
            JOIN users u ON cm.user_id = u.id
            WHERE cm.cohort_id = %s
            ORDER BY u.last_name, u.first_name
            """,
            (cohort_id,)
        )
        
        learners = []
        for row in cur.fetchall():
            learners.append(LearnerSummary(
                id=str(row["id"]),
                display_name=f"{row['first_name']} {row['last_name']}",
                role=row["role"],
                joined_at=row["joined_at"]
            ))
            
        cohort_summary = CohortSummary(
            id=str(cohort_row["id"]),
            program_id=str(cohort_row["program_id"]),
            name=cohort_row["name"],
            owner_id=str(cohort_row["owner_id"]),
            created_at=cohort_row["created_at"],
            learners=len(learners),
        )
        
        return CohortDetail(
            cohort=cohort_summary,
            learners=learners,
            categories=[],
            hotspots=[],
            presets=[]
        )
    finally:
        conn.close()


def _generate_temp_password(length: int = 12) -> str:
    chars = string.ascii_letters + string.digits
    return "".join(random.choices(chars, k=length))


def enroll_new_learner(
    cohort_id: str,
    first_name: str,
    last_name: str,
    role: str,
    institution_id: str,
    owner_id: str
) -> CreateLearnerResponse:
    # 1. Verify cohort ownership
    conn = get_db_conn()
    try:
        cur = conn.cursor()
        cur.execute("SELECT program_id FROM cohorts WHERE id = %s AND owner_id = %s", (cohort_id, owner_id))
        row = cur.fetchone()
        if not row:
            raise ValueError("Cohort not found or unauthorized.")
        program_id = str(row["program_id"])
    finally:
        conn.close()

    temp_password = _generate_temp_password()
    
    # 2. Provision Learner account
    profile, learner_id = provision_learner(
        first_name=first_name,
        last_name=last_name,
        institution_id=institution_id,
        temp_password=temp_password,
        role=role
    )
    
    # 3. Add to cohort_members
    conn = get_db_conn()
    try:
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO cohort_members (cohort_id, user_id)
            VALUES (%s, %s)
            RETURNING joined_at
            """,
            (cohort_id, profile.id)
        )
        joined_at = cur.fetchone()["joined_at"]
        conn.commit()
        
        return CreateLearnerResponse(
            id=profile.id,
            learner_id=learner_id,
            display_name=profile.display_name,
            temporary_password=temp_password,
            joined_at=joined_at
        )
    except Exception as exc:
        conn.rollback()
        raise ValueError(f"Failed to enroll learner: {exc}")
    finally:
        conn.close()


def add_existing_learner(
    cohort_id: str,
    learner_id: str,
    owner_id: str
) -> AddExistingLearnerResponse:
    conn = get_db_conn()
    try:
        cur = conn.cursor()
        
        # 1. Verify cohort ownership and get program
        cur.execute("SELECT program_id FROM cohorts WHERE id = %s AND owner_id = %s", (cohort_id, owner_id))
        cohort_row = cur.fetchone()
        if not cohort_row:
            raise ValueError("Cohort not found or unauthorized.")
        program_id = str(cohort_row["program_id"])
        
        # 2. Find learner by Learner ID
        cur.execute(
            "SELECT id, first_name, last_name FROM users WHERE learner_id = %s AND status = 'active'",
            (learner_id.upper(),)
        )
        user_row = cur.fetchone()
        if not user_row:
            raise ValueError("Active learner not found with that ID.")
            
        user_uuid = str(user_row["id"])
        display_name = f"{user_row['first_name']} {user_row['last_name']}"
        
        # 3. Validate Program logic
        # Rule: A learner cannot belong to multiple active cohorts within the same program.
        cur.execute(
            """
            SELECT c.name 
            FROM cohort_members cm
            JOIN cohorts c ON cm.cohort_id = c.id
            WHERE cm.user_id = %s AND c.program_id = %s
            """,
            (user_uuid, program_id)
        )
        existing_in_program = cur.fetchone()
        if existing_in_program:
            raise ValueError(f"Learner is already enrolled in cohort '{existing_in_program['name']}' under this program.")
            
        # 4. Add to cohort_members
        try:
            cur.execute(
                """
                INSERT INTO cohort_members (cohort_id, user_id)
                VALUES (%s, %s)
                RETURNING joined_at
                """,
                (cohort_id, user_uuid)
            )
            joined_at = cur.fetchone()["joined_at"]
            conn.commit()
        except Exception as e:
            if "unique" in str(e).lower():
                raise ValueError("Learner is already a member of this cohort.")
            raise e
            
        return AddExistingLearnerResponse(
            id=user_uuid,
            learner_id=learner_id.upper(),
            display_name=display_name,
            joined_at=joined_at
        )
    finally:
        conn.close()

def _verify_cohort_ownership(cur, cohort_id: str, owner_id: str) -> None:
    cur.execute("SELECT id FROM cohorts WHERE id = %s AND owner_id = %s", (cohort_id, owner_id))
    if not cur.fetchone():
        raise ValueError("Cohort not found or unauthorized.")


def set_cohort_cases(cohort_id: str, case_ids: List[str], owner_id: str) -> "CohortCasesResponse":
    """Full-sync: the cohort's assigned cases become exactly case_ids."""
    conn = get_db_conn()
    try:
        cur = conn.cursor()
        _verify_cohort_ownership(cur, cohort_id, owner_id)

        # Remove anything assigned that isn't in the new set.
        if case_ids:
            cur.execute(
                """
                DELETE FROM cohort_case_assignments
                WHERE cohort_id = %s AND case_id NOT IN %s
                """,
                (cohort_id, tuple(case_ids))
            )
        else:
            cur.execute(
                "DELETE FROM cohort_case_assignments WHERE cohort_id = %s",
                (cohort_id,)
            )

        # Add anything newly checked. ON CONFLICT DO NOTHING relies on the
        # unique (cohort_id, case_id) constraint from the migration.
        for case_id in case_ids:
            cur.execute(
                """
                INSERT INTO cohort_case_assignments (cohort_id, case_id)
                VALUES (%s, %s)
                ON CONFLICT (cohort_id, case_id) DO NOTHING
                """,
                (cohort_id, case_id)
            )

        conn.commit()
    except ValueError:
        conn.rollback()
        raise
    except Exception as exc:
        conn.rollback()
        raise ValueError(f"Failed to assign cases: {exc}")
    finally:
        conn.close()

    return get_cohort_cases(cohort_id, owner_id)


def get_cohort_cases(cohort_id: str, owner_id: str) -> "CohortCasesResponse":
    conn = get_db_conn()
    try:
        cur = conn.cursor()
        _verify_cohort_ownership(cur, cohort_id, owner_id)

        cur.execute(
            """
            SELECT c.id, c.name, c.difficulty
            FROM cohort_case_assignments cca
            JOIN cases c ON cca.case_id = c.id
            WHERE cca.cohort_id = %s
            ORDER BY c.name
            """,
            (cohort_id,)
        )

        cases = [
            CaseSummary(id=str(row["id"]), name=row["name"], difficulty=row["difficulty"])
            for row in cur.fetchall()
        ]
        return CohortCasesResponse(cohort_id=cohort_id, cases=cases)
    finally:
        conn.close()


#helper function
def _get_session_status(
    scheduled_at: datetime,
    duration: int,
    is_cancelled: bool,
) -> str:

    if is_cancelled:
        return "cancelled"

    now = datetime.now(timezone.utc)

    end_time = scheduled_at + timedelta(minutes=duration)

    if now < scheduled_at:
        return "scheduled"

    if now < end_time:
        return "in_progress"

    return "completed"

def _verify_case_assigned_to_cohort(cur, cohort_id: str, case_id: str) -> str:
    """Returns the case name, or raises if the case isn't one of the
    cohort's assigned cases (see set_cohort_cases/get_cohort_cases)."""
    cur.execute(
        """
        SELECT c.name
        FROM cohort_case_assignments cca
        JOIN cases c ON cca.case_id = c.id
        WHERE cca.cohort_id = %s AND cca.case_id = %s
        """,
        (cohort_id, case_id)
    )
    row = cur.fetchone()
    if not row:
        raise ValueError(
            "That case isn't assigned to this cohort yet. Assign it under "
            "Cases before scheduling a session for it."
        )
    return row["name"]


def _session_summary_with_roster(cur, row) -> SessionSummary:
    """Builds a SessionSummary from a `sessions` row (must include case_id,
    mode, instructor_id), looking up the case name and roster counts."""
    case_name = None
    if row["case_id"]:
        cur.execute("SELECT name FROM cases WHERE id = %s", (row["case_id"],))
        case_row = cur.fetchone()
        case_name = case_row["name"] if case_row else None

    cur.execute(
        """
        SELECT
            COUNT(*) AS resident_count,
            COUNT(*) FILTER (WHERE status = 'completed') AS completed_count
        FROM session_residents
        WHERE session_id = %s
        """,
        (row["id"],)
    )
    counts = cur.fetchone()

    return SessionSummary(
        id=str(row["id"]),
        cohort_id=str(row["cohort_id"]),
        name=row["name"],
        scheduled_at=row["scheduled_at"],
        duration=row["duration"],
        description=row["description"],
        status=_get_session_status(
            row["scheduled_at"],
            row["duration"],
            row["is_cancelled"],
        ),
        created_at=row["created_at"],
        case_id=str(row["case_id"]) if row["case_id"] else None,
        case_name=case_name,
        mode=row["mode"] or "training",
        instructor_id=str(row["instructor_id"]) if row["instructor_id"] else None,
        resident_count=counts["resident_count"],
        completed_count=counts["completed_count"],
    )


def create_session(
    cohort_id: str,
    name: str,
    scheduled_at: datetime,
    duration: int,
    description: Optional[str],
    case_id: str,
    mode: str,
    resident_ids: Optional[List[str]],
    owner_id: str,
) -> SessionSummary:
    conn = get_db_conn()
    try:
        cur = conn.cursor()

        _verify_cohort_ownership(cur, cohort_id, owner_id)
        case_name = _verify_case_assigned_to_cohort(cur, cohort_id, case_id)

        # Resolve the roster: explicit residents (must be cohort members) or
        # every current member of the cohort if none were given.
        if resident_ids:
            cur.execute(
                """
                SELECT user_id FROM cohort_members
                WHERE cohort_id = %s AND user_id IN %s
                """,
                (cohort_id, tuple(resident_ids))
            )
            valid_ids = {str(r["user_id"]) for r in cur.fetchall()}
            invalid = [rid for rid in resident_ids if rid not in valid_ids]
            if invalid:
                raise ValueError(
                    f"{len(invalid)} selected resident(s) are not members of this cohort."
                )
            roster_ids = list(valid_ids)
        else:
            cur.execute(
                "SELECT user_id FROM cohort_members WHERE cohort_id = %s",
                (cohort_id,)
            )
            roster_ids = [str(r["user_id"]) for r in cur.fetchall()]

        cur.execute(
            """
            INSERT INTO sessions (
                cohort_id,
                name,
                scheduled_at,
                duration,
                description,
                case_id,
                mode,
                instructor_id
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING
                id,
                cohort_id,
                name,
                scheduled_at,
                duration,
                description,
                is_cancelled,
                created_at,
                case_id,
                mode,
                instructor_id
            """,
            (
                cohort_id,
                name,
                scheduled_at,
                duration,
                description,
                case_id,
                mode,
                owner_id,
            )
        )

        row = cur.fetchone()
        session_id = row["id"]

        for resident_id in roster_ids:
            cur.execute(
                """
                INSERT INTO session_residents (session_id, resident_id)
                VALUES (%s, %s)
                ON CONFLICT (session_id, resident_id) DO NOTHING
                """,
                (session_id, resident_id)
            )

        conn.commit()

        return SessionSummary(
            id=str(row["id"]),
            cohort_id=str(row["cohort_id"]),
            name=row["name"],
            scheduled_at=row["scheduled_at"],
            duration=row["duration"],
            description=row["description"],
            status=_get_session_status(
                row["scheduled_at"],
                row["duration"],
                row["is_cancelled"],
            ),
            created_at=row["created_at"],
            case_id=str(row["case_id"]) if row["case_id"] else None,
            case_name=case_name,
            mode=row["mode"],
            instructor_id=str(row["instructor_id"]) if row["instructor_id"] else None,
            resident_count=len(roster_ids),
            completed_count=0,
        )

    except ValueError:
        conn.rollback()
        raise

    except Exception as exc:
        conn.rollback()
        raise ValueError(f"Failed to create session: {exc}")

    finally:
        conn.close()
def get_cohort_sessions(
    cohort_id: str,
    owner_id: str
) -> List[SessionSummary]:
    conn = get_db_conn()
    try:
        cur = conn.cursor()
        _verify_cohort_ownership(cur, cohort_id, owner_id)

        cur.execute(
            """
            SELECT
                s.id,
                s.cohort_id,
                s.name,
                s.scheduled_at,
                s.duration,
                s.description,
                s.is_cancelled,
                s.created_at,
                s.case_id,
                s.mode,
                s.instructor_id,
                c.name AS case_name,
                COUNT(sr.id) AS resident_count,
                COUNT(sr.id) FILTER (WHERE sr.status = 'completed') AS completed_count
            FROM sessions s
            LEFT JOIN cases c ON c.id = s.case_id
            LEFT JOIN session_residents sr ON sr.session_id = s.id
            WHERE s.cohort_id = %s
            GROUP BY s.id, c.name
            ORDER BY s.scheduled_at NULLS LAST, s.created_at
            """,
            (cohort_id,)
        )

        return [
            SessionSummary(
                id=str(row["id"]),
                cohort_id=str(row["cohort_id"]),
                name=row["name"],
                scheduled_at=row["scheduled_at"],
                duration=row["duration"],
                description=row["description"],
                status=_get_session_status(
                    row["scheduled_at"],
                    row["duration"],
                    row["is_cancelled"],
                ),
                created_at=row["created_at"],
                case_id=str(row["case_id"]) if row["case_id"] else None,
                case_name=row["case_name"],
                mode=row["mode"] or "training",
                instructor_id=str(row["instructor_id"]) if row["instructor_id"] else None,
                resident_count=row["resident_count"],
                completed_count=row["completed_count"],
            )
            for row in cur.fetchall()
        ]

    finally:
        conn.close()


def get_session_roster(session_id: str, owner_id: str) -> SessionRosterResponse:
    conn = get_db_conn()
    try:
        cur = conn.cursor()

        cur.execute("SELECT cohort_id FROM sessions WHERE id = %s", (session_id,))
        row = cur.fetchone()
        if not row:
            raise ValueError("Session not found")

        _verify_cohort_ownership(cur, str(row["cohort_id"]), owner_id)

        cur.execute(
            """
            SELECT
                sr.id, sr.resident_id, sr.status, sr.joined_at, sr.completed_at,
                u.first_name, u.last_name
            FROM session_residents sr
            JOIN users u ON u.id = sr.resident_id
            WHERE sr.session_id = %s
            ORDER BY u.last_name, u.first_name
            """,
            (session_id,)
        )

        residents = [
            SessionResidentSummary(
                id=str(r["id"]),
                resident_id=str(r["resident_id"]),
                display_name=f"{r['first_name']} {r['last_name']}",
                status=r["status"],
                joined_at=r["joined_at"],
                completed_at=r["completed_at"],
            )
            for r in cur.fetchall()
        ]

        return SessionRosterResponse(session_id=session_id, residents=residents)

    finally:
        conn.close()
def update_session(
    session_id: str,
    name: str,
    scheduled_at: datetime,
    duration: int,
    description: Optional[str],
    owner_id: str,
) -> SessionSummary:
    conn = get_db_conn()
    try:
        cur = conn.cursor()

        cur.execute(
            """
            SELECT cohort_id
            FROM sessions
            WHERE id = %s
            """,
            (session_id,)
        )

        row = cur.fetchone()

        if not row:
            raise ValueError("Session not found")

        cohort_id = str(row["cohort_id"])

        _verify_cohort_ownership(cur, cohort_id, owner_id)

        cur.execute(
            """
            UPDATE sessions
            SET
                name = %s,
                scheduled_at = %s,
                duration = %s,
                description = %s,
                updated_at = now()
            WHERE id = %s
            RETURNING
                id,
                cohort_id,
                name,
                scheduled_at,
                duration,
                description,
                is_cancelled,
                created_at,
                case_id,
                mode,
                instructor_id
            """,
            (
                name,
                scheduled_at,
                duration,
                description,
                session_id,
            )
        )

        row = cur.fetchone()
        conn.commit()

        return _session_summary_with_roster(cur, row)

    except ValueError:
        conn.rollback()
        raise
    except Exception as exc:
        conn.rollback()
        raise ValueError(f"Failed to update session: {exc}")
    finally:
        conn.close()
def cancel_session(
    session_id: str,
    owner_id: str,
) -> SessionSummary:
    conn = get_db_conn()
    try:
        cur = conn.cursor()

        # Get the session
        cur.execute(
            """
            SELECT
                cohort_id,
                scheduled_at,
                duration,
                is_cancelled
            FROM sessions
            WHERE id = %s
            """,
            (session_id,)
        )

        row = cur.fetchone()

        if not row:
            raise ValueError("Session not found")

        # Check that the instructor owns the cohort
        cohort_id = str(row["cohort_id"])
        _verify_cohort_ownership(cur, cohort_id, owner_id)

        # Calculate the session's current status
        current_status = _get_session_status(
            row["scheduled_at"],
            row["duration"],
            row["is_cancelled"],
        )

        # Completed sessions cannot be cancelled
        if current_status == "completed":
            raise ValueError("Completed sessions cannot be cancelled")

        # Already cancelled sessions cannot be cancelled again
        if current_status == "cancelled":
            raise ValueError("Session is already cancelled")

        # Mark the session as cancelled
        cur.execute(
            """
            UPDATE sessions
            SET
                is_cancelled = true,
                updated_at = now()
            WHERE id = %s
            RETURNING
                id,
                cohort_id,
                name,
                scheduled_at,
                duration,
                description,
                is_cancelled,
                created_at,
                case_id,
                mode,
                instructor_id
            """,
            (session_id,)
        )

        row = cur.fetchone()
        conn.commit()

        # Return the updated session
        return _session_summary_with_roster(cur, row)

    except ValueError:
        conn.rollback()
        raise

    except Exception as exc:
        conn.rollback()
        raise ValueError(f"Failed to cancel session: {exc}")

    finally:
        conn.close()