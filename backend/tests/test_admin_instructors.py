"""
Admin instructor-provisioning endpoints (multi-institution).

Supabase and the database are mocked: these tests check who is allowed in and
what the endpoint does with the request, and they create no real accounts.
"""
import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

from core.security import get_current_active_user
from main import app
from schemas.auth import UserProfile

client = TestClient(app)
BODY = {"first_name": "Helen", "last_name": "Ward", "email": "helen@example.org"}


def _user(role: str, institution_id: str = "inst-admin") -> UserProfile:
    return UserProfile(
        id="u-1",
        institution_id=institution_id,
        first_name="Ada",
        last_name="Admin",
        display_name="Ada Admin",
        email="ada@example.org",
        role=role,
        status="active",
        default_difficulty="expert",
    )


def _as(role: str):
    app.dependency_overrides[get_current_active_user] = lambda: _user(role)


def _created(institution_id="inst-b"):
    u = _user("instructor", institution_id)
    u.id, u.first_name, u.last_name, u.email = "u-2", "Helen", "Ward", "helen@example.org"
    return u


class AdminAccessTests(unittest.TestCase):
    def tearDown(self):
        app.dependency_overrides.clear()

    def test_only_admins_reach_any_admin_endpoint(self):
        for role in ("instructor", "resident"):
            _as(role)
            self.assertEqual(client.get("/api/v1/admin/instructors").status_code, 403)
            self.assertEqual(client.get("/api/v1/admin/institutions").status_code, 403)
            self.assertEqual(
                client.post("/api/v1/admin/instructors", json={**BODY, "institution_name": "X Hospital"}).status_code,
                403,
            )

    def test_unauthenticated_is_rejected(self):
        self.assertEqual(client.get("/api/v1/admin/instructors").status_code, 401)
        self.assertEqual(client.get("/api/v1/admin/institutions").status_code, 401)


class AdminCreateTests(unittest.TestCase):
    def setUp(self):
        _as("admin")

    def tearDown(self):
        app.dependency_overrides.clear()

    def test_create_in_a_chosen_existing_institution(self):
        with patch("services.auth_service.get_institution_name", return_value="North Hospital") as lookup, \
             patch("services.auth_service.provision_instructor", return_value=_created()) as provision:
            res = client.post("/api/v1/admin/instructors", json={**BODY, "institution_id": "inst-b"})
        self.assertEqual(res.status_code, 201)
        lookup.assert_called_once_with("inst-b")
        kwargs = provision.call_args.kwargs
        self.assertEqual(kwargs["institution_name"], "North Hospital")
        self.assertGreaterEqual(len(res.json()["temp_password"]), 8)
        self.assertNotIn("role", kwargs)  # always an instructor from this endpoint

    def test_admin_is_not_limited_to_their_own_institution(self):
        # The admin belongs to "inst-admin"; the instructor goes elsewhere.
        with patch("services.auth_service.get_institution_name", return_value="South Clinic"), \
             patch("services.auth_service.provision_instructor", return_value=_created("inst-c")) as provision:
            client.post("/api/v1/admin/instructors", json={**BODY, "institution_id": "inst-c"})
        self.assertEqual(provision.call_args.kwargs["institution_name"], "South Clinic")

    def test_create_in_a_new_institution(self):
        with patch("services.auth_service.find_institution_by_name", return_value=None), \
             patch("services.auth_service.provision_instructor", return_value=_created()) as provision:
            res = client.post("/api/v1/admin/instructors", json={**BODY, "institution_name": "  East Hospital "})
        self.assertEqual(res.status_code, 201)
        self.assertEqual(provision.call_args.kwargs["institution_name"], "East Hospital")

    def test_new_institution_name_reuses_existing_spelling(self):
        existing = {"id": "inst-1", "name": "Demo Hospital"}
        with patch("services.auth_service.find_institution_by_name", return_value=existing), \
             patch("services.auth_service.provision_instructor", return_value=_created()) as provision:
            client.post("/api/v1/admin/instructors", json={**BODY, "institution_name": "demo hospital"})
        self.assertEqual(provision.call_args.kwargs["institution_name"], "Demo Hospital")

    def test_must_name_exactly_one_institution(self):
        neither = client.post("/api/v1/admin/instructors", json=BODY)
        both = client.post(
            "/api/v1/admin/instructors",
            json={**BODY, "institution_id": "inst-b", "institution_name": "X Hospital"},
        )
        self.assertEqual(neither.status_code, 422)
        self.assertEqual(both.status_code, 422)

    def test_unknown_institution_id_is_404(self):
        with patch("services.auth_service.get_institution_name", return_value=None):
            res = client.post("/api/v1/admin/instructors", json={**BODY, "institution_id": "nope"})
        self.assertEqual(res.status_code, 404)

    def test_supplied_password_is_used(self):
        with patch("services.auth_service.get_institution_name", return_value="North Hospital"), \
             patch("services.auth_service.provision_instructor", return_value=_created()) as provision:
            res = client.post(
                "/api/v1/admin/instructors",
                json={**BODY, "institution_id": "inst-b", "temp_password": "Chosen-pass-1"},
            )
        self.assertEqual(res.json()["temp_password"], "Chosen-pass-1")
        self.assertEqual(provision.call_args.kwargs["temp_password"], "Chosen-pass-1")

    def test_duplicate_email_is_a_409(self):
        with patch("services.auth_service.get_institution_name", return_value="North Hospital"), \
             patch("services.auth_service.provision_instructor",
                   side_effect=ValueError("An account with email helen@example.org already exists.")):
            res = client.post("/api/v1/admin/instructors", json={**BODY, "institution_id": "inst-b"})
        self.assertEqual(res.status_code, 409)

    def test_bad_email_and_short_password_are_rejected(self):
        bad = {**BODY, "email": "not-an-email", "institution_id": "inst-b"}
        short = {**BODY, "institution_id": "inst-b", "temp_password": "short"}
        self.assertEqual(client.post("/api/v1/admin/instructors", json=bad).status_code, 422)
        self.assertEqual(client.post("/api/v1/admin/instructors", json=short).status_code, 422)


class AdminListTests(unittest.TestCase):
    def setUp(self):
        _as("admin")

    def tearDown(self):
        app.dependency_overrides.clear()

    def test_lists_institutions(self):
        with patch("services.auth_service.list_institutions",
                   return_value=[{"id": "i1", "name": "A"}, {"id": "i2", "name": "B"}]):
            res = client.get("/api/v1/admin/institutions")
        self.assertEqual([i["name"] for i in res.json()], ["A", "B"])

    def test_lists_staff_across_institutions_with_names(self):
        rows = [{"id": "u-3", "first_name": "H", "last_name": "W", "email": "h@w.org", "role": "instructor",
                 "status": "active", "created_at": None, "institution_id": "i2", "institution_name": "B"}]
        with patch("services.auth_service.list_staff", return_value=rows) as listing:
            res = client.get("/api/v1/admin/instructors")
        self.assertEqual(res.json()[0]["institution_name"], "B")
        listing.assert_called_once_with(None)

    def test_list_can_filter_to_one_institution(self):
        with patch("services.auth_service.list_staff", return_value=[]) as listing:
            client.get("/api/v1/admin/instructors?institution_id=i2")
        listing.assert_called_once_with("i2")


if __name__ == "__main__":
    unittest.main()
