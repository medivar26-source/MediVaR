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

