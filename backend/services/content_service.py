"""
Content / Case Library persistence — cases and procedures.

Tenant boundary: `cases` has no institution column. A case belongs to a
program and a program belongs to an institution, so every query here joins
through `programs` and filters on the caller's institution. A client-supplied
id is never trusted on its own.
"""
import logging
from contextlib import contextmanager
from typing import Any, Dict, List, Optional
from uuid import UUID

import psycopg2.errors

from db.session import get_db_conn
from services.cohorts_service import _get_or_create_default_program

logger = logging.getLogger(__name__)


class ContentStorageUnavailable(Exception):
    """The content tables have not been created in this database yet."""


@contextmanager
def _cursor():
    """Yield a cursor; commit on success, roll back on error, always close.

    A missing table (migration 004 not applied) is translated into
    ContentStorageUnavailable so the API can answer 503 without leaking SQL.
    """
    conn = get_db_conn()
    try:
        yield conn.cursor()
        conn.commit()
    except psycopg2.errors.UndefinedTable as exc:
        conn.rollback()
        logger.error("Content tables missing: %s", exc)
        raise ContentStorageUnavailable() from exc
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def _is_uuid(value: str) -> bool:
    try:
        UUID(str(value))
        return True
    except (ValueError, AttributeError):
        return False


_CASE_SELECT = """
    SELECT c.id, c.program_id, c.procedure_id, p.name AS procedure_name,
           c.name, c.difficulty, c.description, c.learning_objective,
           c.status, c.version, c.created_at, c.updated_at
    FROM cases c
    JOIN programs pr ON pr.id = c.program_id
    JOIN procedures p ON p.id = c.procedure_id
"""


def _case_row(row: Dict[str, Any]) -> Dict[str, Any]:
    out = dict(row)
    for key in ("id", "program_id", "procedure_id"):
        out[key] = str(out[key])
    return out


def list_cases(institution_id: str) -> List[Dict[str, Any]]:
    with _cursor() as cur:
        cur.execute(
            _CASE_SELECT + " WHERE pr.institution_id = %s ORDER BY c.name",
            (str(institution_id),),
        )
        return [_case_row(r) for r in cur.fetchall()]


def get_case(case_id: str, institution_id: str) -> Optional[Dict[str, Any]]:
    if not _is_uuid(case_id):
        return None
    with _cursor() as cur:
        cur.execute(
            _CASE_SELECT + " WHERE c.id = %s AND pr.institution_id = %s",
            (case_id, str(institution_id)),
        )
        row = cur.fetchone()
        return _case_row(row) if row else None


def _procedure_exists(cur, procedure_id: str) -> bool:
    if not _is_uuid(procedure_id):
        return False
    cur.execute("SELECT 1 FROM procedures WHERE id = %s", (procedure_id,))
    return cur.fetchone() is not None


def _program_in_institution(cur, program_id: str, institution_id: str) -> bool:
    if not _is_uuid(program_id):
        return False
    cur.execute(
        "SELECT 1 FROM programs WHERE id = %s AND institution_id = %s",
        (program_id, str(institution_id)),
    )
    return cur.fetchone() is not None


def create_case(
    institution_id: str,
    name: str,
    procedure_id: str,
    difficulty: str,
    learning_objective: str,
    description: Optional[str] = None,
    program_id: Optional[str] = None,
) -> Dict[str, Any]:
    if program_id is None:
        program_id = _get_or_create_default_program(str(institution_id))

    with _cursor() as cur:
        if not _program_in_institution(cur, program_id, institution_id):
            raise ValueError("Program not found.")
        if not _procedure_exists(cur, procedure_id):
            raise ValueError("Procedure not found.")

        cur.execute(
            """
            INSERT INTO cases
                (program_id, procedure_id, name, difficulty, description, learning_objective)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id
            """,
            (program_id, procedure_id, name, difficulty, description, learning_objective),
        )
        new_id = str(cur.fetchone()["id"])

    created = get_case(new_id, institution_id)
    assert created is not None
    return created


# Editing any of these changes what a resident sees or is assessed on, so it
# starts a new content version. Flipping status does not — retiring a case is
# not an edit to it, and historical attempts keep pointing at the version they ran.
_VERSIONED_FIELDS = ("name", "procedure_id", "difficulty", "description", "learning_objective")
_UPDATABLE_FIELDS = _VERSIONED_FIELDS + ("status",)


def update_case(
    case_id: str, institution_id: str, changes: Dict[str, Any]
) -> Optional[Dict[str, Any]]:
    if not _is_uuid(case_id):
        return None
    fields = {k: v for k, v in changes.items() if k in _UPDATABLE_FIELDS}

    with _cursor() as cur:
        cur.execute(
            _CASE_SELECT + " WHERE c.id = %s AND pr.institution_id = %s FOR UPDATE OF c",
            (case_id, str(institution_id)),
        )
        current = cur.fetchone()
        if not current:
            return None

        if "procedure_id" in fields and not _procedure_exists(cur, fields["procedure_id"]):
            raise ValueError("Procedure not found.")

        changed = {k: v for k, v in fields.items() if str(current[k]) != str(v)}
        if changed:
            # Column names come from the fixed whitelist above, never from input.
            assignments = [f"{col} = %s" for col in changed]
            values = list(changed.values())
            if any(col in _VERSIONED_FIELDS for col in changed):
                assignments.append("version = version + 1")
            cur.execute(
                f"UPDATE cases SET {', '.join(assignments)} WHERE id = %s",
                (*values, case_id),
            )

    return get_case(case_id, institution_id)


def list_procedures() -> List[Dict[str, Any]]:
    """Procedures are shared reference data — the schema gives them no program."""
    with _cursor() as cur:
        cur.execute(
            """
            SELECT p.id, p.name, p.description, p.version,
                   COUNT(s.id) AS step_count
            FROM procedures p
            LEFT JOIN procedure_steps s ON s.procedure_id = p.id
            GROUP BY p.id
            ORDER BY p.name
            """
        )
        return [{**dict(r), "id": str(r["id"])} for r in cur.fetchall()]
