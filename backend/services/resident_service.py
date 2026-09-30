"""
Resident Detail / Case Review persistence.

Identity and cohort membership are real queries against `users` and
`cohort_members`. Notes and feedback are real queries against the two
tables added in migration 006. Performance (competency, skill breakdown,
recent cases, critical errors) has no backing table yet — no `attempts`,
`assessment_results` or `skill_scores` exist in this database — so this
service does not compute or fabricate it. See resident.py's module
docstring: the frontend sources those figures from the existing
seed-backed accessors that already power /performance and
/sessions/[id]/report, the same way for every resident.

Tenant boundary: every query here is scoped to cohorts the calling
instructor owns, via cohort_members -> cohorts.owner_id. An instructor
cannot read or write notes/feedback for a resident who isn't in one of
their own cohorts.
"""
from contextlib import contextmanager
from typing import Any, Dict, List, Optional

from db.session import get_db_conn


@contextmanager
def _cursor():
    conn = get_db_conn()
    try:
        yield conn.cursor()
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def _is_supervised(cur, resident_id: str, instructor_id: str) -> bool:
    """Is this resident in a cohort the instructor owns?"""
    cur.execute(
        """
        SELECT 1
        FROM cohort_members cm
        JOIN cohorts c ON c.id = cm.cohort_id
        WHERE cm.user_id = %s AND c.owner_id = %s
        LIMIT 1
        """,
        (resident_id, instructor_id),
    )
    return cur.fetchone() is not None


def is_supervised(resident_id: str, instructor_id: str) -> bool:
    """Public form of the supervision check, for endpoints that need only that."""
    with _cursor() as cur:
        return _is_supervised(cur, resident_id, instructor_id)


def get_resident_summary(resident_id: str, instructor_id: str) -> Optional[Dict[str, Any]]:
    with _cursor() as cur:
        if not _is_supervised(cur, resident_id, instructor_id):
            return None

        cur.execute(
            """
            SELECT u.id, u.first_name, u.last_name, u.role,
                   c.id AS cohort_id, c.name AS cohort_name, cm.joined_at
            FROM users u
            JOIN cohort_members cm ON cm.user_id = u.id
            JOIN cohorts c ON c.id = cm.cohort_id
            WHERE u.id = %s AND c.owner_id = %s
            ORDER BY cm.joined_at DESC
            LIMIT 1
            """,
            (resident_id, instructor_id),
        )
        row = cur.fetchone()
        if not row:
            return None
        return {
            "id": str(row["id"]),
            "display_name": f"{row['first_name']} {row['last_name']}",
            "role": row["role"],
            "cohort_id": str(row["cohort_id"]),
            "cohort_name": row["cohort_name"],
            "joined_at": row["joined_at"],
        }


def _note_row(row: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": str(row["id"]),
        "resident_id": str(row["resident_id"]),
        "instructor_id": str(row["instructor_id"]),
        "instructor_name": row["instructor_name"],
        "note": row["note"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


def list_notes(resident_id: str, instructor_id: str) -> List[Dict[str, Any]]:
    with _cursor() as cur:
        if not _is_supervised(cur, resident_id, instructor_id):
            return []
        cur.execute(
            """
            SELECT n.id, n.resident_id, n.instructor_id, n.note, n.created_at, n.updated_at,
                   u.first_name || ' ' || u.last_name AS instructor_name
            FROM instructor_notes n
            JOIN users u ON u.id = n.instructor_id
            WHERE n.resident_id = %s
            ORDER BY n.created_at DESC
            """,
            (resident_id,),
        )
        return [_note_row(r) for r in cur.fetchall()]


def add_note(resident_id: str, instructor_id: str, note: str) -> Dict[str, Any]:
    with _cursor() as cur:
        if not _is_supervised(cur, resident_id, instructor_id):
            raise ValueError("Resident not found in a cohort you supervise.")
        cur.execute(
            "INSERT INTO instructor_notes (resident_id, instructor_id, note) VALUES (%s, %s, %s) RETURNING id",
            (resident_id, instructor_id, note),
        )
        new_id = cur.fetchone()["id"]
        cur.execute(
            """
            SELECT n.id, n.resident_id, n.instructor_id, n.note, n.created_at, n.updated_at,
                   u.first_name || ' ' || u.last_name AS instructor_name
            FROM instructor_notes n JOIN users u ON u.id = n.instructor_id
            WHERE n.id = %s
            """,
            (str(new_id),),
        )
        return _note_row(cur.fetchone())


def _feedback_row(row: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": str(row["id"]),
        "resident_id": str(row["resident_id"]),
        "attempt_id": str(row["attempt_id"]) if row["attempt_id"] else None,
        "instructor_id": str(row["instructor_id"]),
        "instructor_name": row["instructor_name"],
        "feedback": row["feedback"],
        "created_at": row["created_at"],
    }


def list_feedback(
    resident_id: str, instructor_id: str, attempt_id: Optional[str] = None
) -> List[Dict[str, Any]]:
    with _cursor() as cur:
        if not _is_supervised(cur, resident_id, instructor_id):
            return []
        if attempt_id:
            cur.execute(
                """
                SELECT f.id, f.resident_id, f.attempt_id, f.instructor_id, f.feedback, f.created_at,
                       u.first_name || ' ' || u.last_name AS instructor_name
                FROM instructor_feedback f JOIN users u ON u.id = f.instructor_id
                WHERE f.resident_id = %s AND f.attempt_id = %s
                ORDER BY f.created_at DESC
                """,
                (resident_id, attempt_id),
            )
        else:
            cur.execute(
                """
                SELECT f.id, f.resident_id, f.attempt_id, f.instructor_id, f.feedback, f.created_at,
                       u.first_name || ' ' || u.last_name AS instructor_name
                FROM instructor_feedback f JOIN users u ON u.id = f.instructor_id
                WHERE f.resident_id = %s
                ORDER BY f.created_at DESC
                """,
                (resident_id,),
            )
        return [_feedback_row(r) for r in cur.fetchall()]


def _assignment_row(row: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": str(row["id"]),
        "resident_id": str(row["resident_id"]),
        "case_id": row["case_id"],
        "case_title": row["case_title"],
        "mode": row["mode"],
        "status": row["status"],
        "assigned_by": str(row["assigned_by"]),
        "assigned_by_name": row["assigned_by_name"],
        "due_at": row["due_at"],
        "created_at": row["created_at"],
        "completed_at": row["completed_at"],
    }


def list_assignments(resident_id: str, instructor_id: str) -> List[Dict[str, Any]]:
    with _cursor() as cur:
        if not _is_supervised(cur, resident_id, instructor_id):
            return []
        cur.execute(
            """
            SELECT a.id, a.resident_id, a.case_id, a.case_title, a.mode, a.status,
                   a.assigned_by, a.due_at, a.created_at, a.completed_at,
                   u.first_name || ' ' || u.last_name AS assigned_by_name
            FROM training_assignments a
            JOIN users u ON u.id = a.assigned_by
            WHERE a.resident_id = %s
            ORDER BY a.created_at DESC
            """,
            (resident_id,),
        )
        return [_assignment_row(r) for r in cur.fetchall()]


def list_sessions(resident_id: str) -> List[Dict[str, Any]]:
    from services.cohorts_service import _get_session_status
    with _cursor() as cur:
        cur.execute(
            """
            SELECT s.id, s.cohort_id, s.name, s.scheduled_at, s.duration, s.description,
                   s.is_cancelled, s.created_at, s.case_id, s.mode, s.instructor_id,
                   c.name as case_name,
                   (SELECT COUNT(*) FROM session_residents WHERE session_id = s.id) as resident_count,
                   (SELECT COUNT(*) FROM session_residents WHERE session_id = s.id AND status = 'completed') as completed_count
            FROM sessions s
            JOIN session_residents sr ON s.id = sr.session_id
            LEFT JOIN cases c ON c.id = s.case_id
            WHERE sr.resident_id = %s
            ORDER BY s.scheduled_at ASC
            """,
            (resident_id,)
        )
        
        sessions = []
        for row in cur.fetchall():
            sessions.append({
                "id": str(row["id"]),
                "cohort_id": str(row["cohort_id"]),
                "name": row["name"],
                "scheduled_at": row["scheduled_at"],
                "duration": row["duration"],
                "description": row["description"],
                "status": _get_session_status(row["scheduled_at"], row["duration"], row["is_cancelled"]),
                "created_at": row["created_at"],
                "case_id": str(row["case_id"]) if row["case_id"] else None,
                "case_name": row["case_name"],
                "mode": row["mode"] or "training",
                "instructor_id": str(row["instructor_id"]) if row["instructor_id"] else None,
                "resident_count": row["resident_count"],
                "completed_count": row["completed_count"]
            })
        return sessions

def add_assignment(
    resident_id: str,
    instructor_id: str,
    case_id: str,
    case_title: str,
    mode: str = "training",
    due_at: Optional[str] = None,
) -> Dict[str, Any]:
    with _cursor() as cur:
        if not _is_supervised(cur, resident_id, instructor_id):
            raise ValueError("Resident not found in a cohort you supervise.")
        cur.execute(
            """
            INSERT INTO training_assignments (resident_id, case_id, case_title, mode, due_at, assigned_by)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id
            """,
            (resident_id, case_id, case_title, mode, due_at, instructor_id),
        )
        new_id = cur.fetchone()["id"]
        cur.execute(
            """
            SELECT a.id, a.resident_id, a.case_id, a.case_title, a.mode, a.status,
                   a.assigned_by, a.due_at, a.created_at, a.completed_at,
                   u.first_name || ' ' || u.last_name AS assigned_by_name
            FROM training_assignments a JOIN users u ON u.id = a.assigned_by
            WHERE a.id = %s
            """,
            (str(new_id),),
        )
        return _assignment_row(cur.fetchone())


def add_feedback(
    resident_id: str, instructor_id: str, feedback: str, attempt_id: Optional[str] = None
) -> Dict[str, Any]:
    with _cursor() as cur:
        if not _is_supervised(cur, resident_id, instructor_id):
            raise ValueError("Resident not found in a cohort you supervise.")
        cur.execute(
            "INSERT INTO instructor_feedback (resident_id, instructor_id, feedback, attempt_id) VALUES (%s, %s, %s, %s) RETURNING id",
            (resident_id, instructor_id, feedback, attempt_id),
        )
        new_id = cur.fetchone()["id"]
        cur.execute(
            """
            SELECT f.id, f.resident_id, f.attempt_id, f.instructor_id, f.feedback, f.created_at,
                   u.first_name || ' ' || u.last_name AS instructor_name
            FROM instructor_feedback f JOIN users u ON u.id = f.instructor_id
            WHERE f.id = %s
            """,
            (str(new_id),),
        )
        return _feedback_row(cur.fetchone())
