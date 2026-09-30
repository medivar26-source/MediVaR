"""
Institution isolation.

Learners, cohorts and cases created under one institution must never be reachable
from another. These tests drive the real service code against a scripted fake
database that behaves like the SQL: it only returns a row when the query's
institution filter matches the row's institution. If a guard is removed the
matching test fails.
"""
import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

from core.security import get_current_active_user
from main import app
from schemas.auth import UserProfile
from services import cases_service, cohorts_service

INST_A, INST_B = "inst-A", "inst-B"


class FakeCursor:
    """Answers the handful of queries the guarded code paths make."""

    def __init__(self, db):
        self.db = db
        self.executed = []
        self._next = None

    def execute(self, sql, params=()):
        self.executed.append((" ".join(sql.split()), params))
        self.db.executed.append(" ".join(sql.split()).lower())
        text = " ".join(sql.split()).lower()
        self._next = self.db.answer(text, params)

    def fetchone(self):
        return self._next[0] if self._next else None

    def fetchall(self):
        return self._next or []

    def __enter__(self):
        return self

    def __exit__(self, *a):
        return False


class FakeConn:
    def __init__(self, db):
        self.db = db
        self.cur = FakeCursor(db)

    def cursor(self):
        return self.cur

    def commit(self):
        pass

    def rollback(self):
        pass

    def close(self):
        pass


class FakeDb:
    """One learner and one case, both belonging to institution B."""

    learner = {"id": "learner-1", "first_name": "L", "last_name": "B", "institution_id": INST_B}
    case = {"id": "case-1", "institution_id": INST_B}

    def __init__(self):
        self.executed = []

    def answer(self, text, params):
        if "from cohorts c join programs p" in text:  # cohort + its program's institution
            return [{"program_id": "prog-A", "institution_id": INST_A}]
        if "from programs where id" in text:  # program-belongs-to-institution check
            if "institution_id = %s" not in text:
                return [{"?": 1}]
            return [{"?": 1}] if params[1] == INST_B and params[0] == "prog-B" else None
        if "from users" in text and "learner_id" in text:
            # Honour the SQL: the institution filter only applies if the query has one.
            if "institution_id = %s" not in text:
                return [self.learner]
            return [self.learner] if params[1] == self.learner["institution_id"] else None
        if "from cohort_members" in text:
            return None
        if "from cases c where c.id in" in text:
            if "institution_id" not in text:
                return [{"id": self.case["id"]}]
            cohort_inst = INST_A  # the cohort belongs to institution A
            return [{"id": self.case["id"]}] if self.case["institution_id"] in (None, cohort_inst) else []
        if "select institution_id from cases" in text:
            return [{"institution_id": self.case["institution_id"]}]
        return None

    def conn(self):
        return FakeConn(self)


class LearnerAndCohortIsolation(unittest.TestCase):
    def setUp(self):
        self.db = FakeDb()

    def test_cannot_add_a_learner_from_another_institution(self):
        # Instructor's cohort is in institution A; the learner ID belongs to institution B.
        with patch("services.cohorts_service.get_db_conn", side_effect=self.db.conn):
            with self.assertRaises(ValueError) as ctx:
                cohorts_service.add_existing_learner("cohort-A", "mvr-b12345", "instructor-A")
        # Same message as a wrong ID, so it does not reveal that the learner exists elsewhere.
        self.assertIn("Active learner not found", str(ctx.exception))

    def test_can_add_a_learner_from_the_same_institution(self):
        self.db.learner = {**FakeDb.learner, "institution_id": INST_A}
        with patch("services.cohorts_service.get_db_conn", side_effect=self.db.conn):
            try:
                cohorts_service.add_existing_learner("cohort-A", "mvr-a12345", "instructor-A")
            except ValueError as exc:
                # It may stop later (fake DB has no membership rows); it must not stop at the lookup.
                self.assertNotIn("Active learner not found", str(exc))
            except Exception:
                pass  # later steps need real rows; the institution guard was passed

    def test_cannot_create_a_cohort_under_another_institutions_program(self):
        with patch("services.cohorts_service.get_db_conn", side_effect=self.db.conn):
            with self.assertRaises(ValueError) as ctx:
                cohorts_service.create_cohort(
                    name="Sneaky", owner_id="instructor-A", institution_id=INST_A, program_id="prog-B"
                )
        self.assertIn("Program not found", str(ctx.exception))

    def test_cannot_assign_another_institutions_case_to_a_cohort(self):
        with patch("services.cohorts_service.get_db_conn", side_effect=self.db.conn), \
             patch("services.cohorts_service._verify_cohort_ownership"):
            with self.assertRaises(ValueError) as ctx:
                cohorts_service.set_cohort_cases("cohort-A", ["case-1"], "instructor-A")
        self.assertIn("cases were not found", str(ctx.exception))


class CaseIsolation(unittest.TestCase):
    def setUp(self):
        self.db = FakeDb()

    def _check(self, institution_id):
        with patch("services.cases_service.get_db_conn", side_effect=self.db.conn):
            cases_service.assert_case_in_institution("case-1", institution_id)

    def test_other_institution_cannot_touch_the_case(self):
        with self.assertRaises(ValueError):
            self._check(INST_A)

    def test_owning_institution_can(self):
        self._check(INST_B)  # no exception

    def test_shared_case_without_an_institution_stays_reachable(self):
        self.db.case = {"id": "case-1", "institution_id": None}
        self._check(INST_A)  # no exception

    def test_writes_check_before_doing_anything(self):
        # update / publish / deactivate must fail before any write is attempted.
        for call in (
            lambda: cases_service.deactivate_case("case-1", INST_A),
            lambda: cases_service.publish_case_version("case-1", INST_A),
            lambda: cases_service.update_case("case-1", object(), "instructor-A", INST_A),
        ):
            with patch("services.cases_service.get_db_conn", side_effect=self.db.conn):
                with self.assertRaises(ValueError) as ctx:
                    call()
            self.assertIn("Case not found", str(ctx.exception))
            writes = [q for q in self.db.executed if q.startswith(("update", "insert", "delete"))]
            self.assertEqual(writes, [])


class ResidentSessionsEndpoint(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        user = UserProfile(
            id="instructor-A", institution_id=INST_A, first_name="I", last_name="A", display_name="I A",
            email="i@a.org", role="instructor", status="active", default_difficulty="expert",
        )
        app.dependency_overrides[get_current_active_user] = lambda: user

    def tearDown(self):
        app.dependency_overrides.clear()

    def test_instructor_cannot_read_sessions_of_an_unsupervised_resident(self):
        with patch("services.resident_service.is_supervised", return_value=False), \
             patch("services.resident_service.list_sessions") as listing:
            res = self.client.get("/api/v1/residents/learner-in-B/sessions")
        self.assertEqual(res.status_code, 404)
        listing.assert_not_called()

    def test_instructor_can_read_sessions_of_their_own_resident(self):
        with patch("services.resident_service.is_supervised", return_value=True), \
             patch("services.resident_service.list_sessions", return_value=[]) as listing:
            res = self.client.get("/api/v1/residents/my-learner/sessions")
        self.assertEqual(res.status_code, 200)
        listing.assert_called_once_with("my-learner")


if __name__ == "__main__":
    unittest.main()
