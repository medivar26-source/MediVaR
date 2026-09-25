from typing import List
from uuid import UUID
from db.session import get_db_conn

def get_institution_programs(institution_id: UUID) -> List[dict]:
    conn = get_db_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, institution_id, name, description, status, created_at, updated_at
                FROM programs
                WHERE institution_id = %s
                ORDER BY created_at DESC
                """,
                (str(institution_id),)
            )
            return [dict(row) for row in cur.fetchall()]
    finally:
        conn.close()


def create_program(institution_id: UUID, name: str, description: str = None, status: str = "active") -> dict:
    conn = get_db_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO programs (institution_id, name, description, status)
                VALUES (%s, %s, %s, %s)
                RETURNING id, institution_id, name, description, status, created_at, updated_at
                """,
                (str(institution_id), name, description, status)
            )
            row = cur.fetchone()
            conn.commit()
            return dict(row)
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def get_program_detail(program_id: str, institution_id: UUID) -> dict:
    conn = get_db_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, institution_id, name, description, status, created_at, updated_at
                FROM programs
                WHERE id = %s AND institution_id = %s
                """,
                (program_id, str(institution_id))
            )
            row = cur.fetchone()
            if not row:
                return None
            return dict(row)
    finally:
        conn.close()


def get_learner_programs(user_id: str) -> List[dict]:
    """Retrieve all programs that the learner is actively enrolled in, with cohort metadata."""
    conn = get_db_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT 
                    p.id, p.institution_id, p.name, p.description, p.status, p.created_at, p.updated_at,
                    c.id AS cohort_id, c.name AS cohort_name
                FROM programs p
                JOIN cohorts c ON c.program_id = p.id
                JOIN cohort_members cm ON cm.cohort_id = c.id
                WHERE cm.user_id = %s
                ORDER BY p.name ASC
                """,
                (str(user_id),)
            )
            return [dict(row) for row in cur.fetchall()]
    finally:
        conn.close()


def get_learner_program_detail(program_id: str, user_id: str) -> dict:
    """Retrieve a specific program detail for an enrolled learner, including their cohort metadata."""
    conn = get_db_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT 
                    p.id, p.institution_id, p.name, p.description, p.status, p.created_at, p.updated_at,
                    c.id AS cohort_id, c.name AS cohort_name
                FROM programs p
                JOIN cohorts c ON c.program_id = p.id
                JOIN cohort_members cm ON cm.cohort_id = c.id
                WHERE p.id = %s AND cm.user_id = %s
                """,
                (str(program_id), str(user_id))
            )
            row = cur.fetchone()
            if not row:
                return None
            return dict(row)
    finally:
        conn.close()


