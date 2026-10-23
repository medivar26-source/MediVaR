"""
Case-list metadata: procedure, pathology and side on `GET /cases`.

The list queries are exercised against a fake connection (no database is touched), so the
tests cover what the service asks for and how the response schema treats populated and
missing values. A missing value must come back as null, never as a default.
"""

import unittest
from contextlib import contextmanager
from datetime import datetime, timezone
from unittest.mock import patch
from uuid import uuid4

from schemas.cases import CaseListItem
from services import cases_service


class _FakeCursor:
    def __init__(self, rows, log):
        self._rows = rows
        self._log = log

    def execute(self, sql, params=None):
        self._log.append((sql, params))

    def fetchall(self):
        return self._rows

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return False


class _FakeConn:
    def __init__(self, rows):
        self.rows = rows
        self.log = []
        self.closed = False

    def cursor(self):
        return _FakeCursor(self.rows, self.log)

    def close(self):
        self.closed = True


def _row(**over):
    now = datetime.now(timezone.utc)
    base = {
        "id": uuid4(),
        "name": "Case",
        "difficulty": "intermediate",
        "description": None,
        "learning_objective": None,
        "status": "active",
        "version": 1,
        "institution_id": uuid4(),
        "draft_version_id": None,
        "published_version_id": uuid4(),
        "procedure_id": uuid4(),
        "procedure_name": "Total Knee Replacement",
        "pathology_label": "Varus OA",
        "side": "left",
        "program_ids": [],
        "created_at": now,
        "updated_at": now,
    }
    base.update(over)
    return base


@contextmanager
def _patched(rows):
    conn = _FakeConn(rows)
    with patch.object(cases_service, "get_db_conn", return_value=conn):
        yield conn


class TestCaseListQueries(unittest.TestCase):
    def test_learner_list_asks_for_procedure_pathology_and_side_from_the_published_version(self):
        with _patched([_row()]) as conn:
            cases_service.get_learner_cases(uuid4())
        sql = conn.log[0][0]
        for needle in ("c.procedure_id", "pr.name AS procedure_name", "v.pathology_label", "v.side", "LEFT JOIN case_versions v", "LEFT JOIN procedures pr"):
            self.assertIn(needle, sql)
        self.assertIn("c.published_version_id", sql)
        self.assertNotIn("draft_version_id", sql.split("LEFT JOIN case_versions v")[1].split("\n")[0])
        self.assertTrue(conn.closed)

    def test_institution_list_falls_back_to_the_draft_version_when_nothing_is_published(self):
        with _patched([_row()]) as conn:
            cases_service.get_institution_cases(uuid4())
        sql = conn.log[0][0]
        self.assertIn("COALESCE(c.published_version_id, c.draft_version_id)", sql)
        self.assertIn("GROUP BY c.id, pr.name, v.pathology_label, v.side", sql)

    def test_the_existing_filters_are_unchanged(self):
        with _patched([]) as conn:
            cases_service.get_learner_cases(uuid4())
            cases_service.get_institution_cases(uuid4())
        learner_sql, institution_sql = conn.log[0][0], conn.log[1][0]
        self.assertIn("c.status = 'active'", learner_sql)
        self.assertIn("c.published_version_id IS NOT NULL", learner_sql)
        self.assertIn("cm.user_id = %s", learner_sql)
        self.assertIn("WHERE c.institution_id = %s", institution_sql)


class TestCaseListItemMetadata(unittest.TestCase):
    def test_populated_metadata_is_returned_as_recorded(self):
        item = CaseListItem.model_validate(_row(pathology_label="Valgus OA", side="right"))
        self.assertEqual(item.pathology_label, "Valgus OA")
        self.assertEqual(item.side, "right")
        self.assertIsNotNone(item.procedure_id)
        self.assertEqual(item.procedure_name, "Total Knee Replacement")

    def test_missing_metadata_is_null_not_a_default(self):
        row = _row()
        for key in ("pathology_label", "side", "procedure_id", "procedure_name"):
            row[key] = None
        item = CaseListItem.model_validate(row)
        self.assertIsNone(item.pathology_label)
        self.assertIsNone(item.side)
        self.assertIsNone(item.procedure_id)
        self.assertIsNone(item.procedure_name)

    def test_metadata_may_be_absent_from_the_row_altogether(self):
        row = _row()
        for key in ("pathology_label", "side", "procedure_id", "procedure_name"):
            del row[key]
        item = CaseListItem.model_validate(row)
        self.assertIsNone(item.pathology_label)
        self.assertIsNone(item.side)
        self.assertIsNone(item.procedure_id)
        self.assertIsNone(item.procedure_name)

    def test_the_serialised_response_carries_nulls_explicitly(self):
        row = _row(pathology_label=None, side=None, procedure_id=None)
        data = CaseListItem.model_validate(row).model_dump(mode="json")
        self.assertIn("pathology_label", data)
        self.assertIsNone(data["pathology_label"])
        self.assertIsNone(data["side"])


if __name__ == "__main__":
    unittest.main()
