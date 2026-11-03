"""
GET /api/v1/results: signed-in only, 404 (not 500) while migration 013 is not applied, and the service's
bundle passed through unchanged. No live database: the service and the auth dependency are stubbed.
"""
import unittest
from unittest import mock

from fastapi.testclient import TestClient

from core.security import get_current_active_user
from main import app
from schemas.auth import UserProfile
from services import results_service

USER = UserProfile(id="u-1", first_name="A", last_name="B", display_name="A B", role="resident",
                   status="active", default_difficulty="intermediate")


class TestResultsEndpoint(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def tearDown(self):
        app.dependency_overrides.clear()

    def test_requires_sign_in(self):
        self.assertEqual(self.client.get("/api/v1/results").status_code, 401)

    def test_404_when_tables_missing(self):
        app.dependency_overrides[get_current_active_user] = lambda: USER
        with mock.patch.object(results_service, "results_for", side_effect=results_service.ResultsUnavailable()):
            r = self.client.get("/api/v1/results")
        self.assertEqual(r.status_code, 404)
        self.assertIn("013", r.json()["detail"])

    def test_returns_the_bundle(self):
        app.dependency_overrides[get_current_active_user] = lambda: USER
        bundle = {"learners": [], "cohorts": [], "attempts": [{"id": "a1", "result": {"overall_score": 72}}]}
        with mock.patch.object(results_service, "results_for", return_value=bundle) as svc:
            r = self.client.get("/api/v1/results")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json(), bundle)
        self.assertEqual(svc.call_args.args[0].id, "u-1")


if __name__ == "__main__":
    unittest.main()
