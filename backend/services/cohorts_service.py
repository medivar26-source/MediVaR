import logging
import random
import string
from typing import List, Optional, Tuple

from db.session import get_db_conn
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
