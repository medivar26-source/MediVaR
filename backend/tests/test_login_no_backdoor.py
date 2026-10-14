"""
Regression tests for the sign-in flows in services.auth_service.

Sign-in must verify the supplied password with Supabase Auth and nothing else. A failed
sign-in must never reach the administrative client, never reset a password, and never retry
with different credentials. No test here (or in the code under test) relies on any special
password value: every failure case uses an arbitrary wrong password.
"""
import inspect
import unittest
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from schemas.auth import UserProfile
from services import auth_service

INSTRUCTOR_ERROR = "Invalid email or password. Check both and try again."
LEARNER_ERROR = "Invalid Learner ID or password. Check both and try again."


def _profile(**overrides) -> UserProfile:
    base = dict(
        id="user-1",
        first_name="Test",
        last_name="User",
        display_name="Test User",
        role="instructor",
        status="active",
        default_difficulty="intermediate",
    )
    base.update(overrides)
    return UserProfile(**base)


def _signed_in(user_id: str):
    return SimpleNamespace(
        session=SimpleNamespace(access_token="token-abc"),
        user=SimpleNamespace(id=user_id),
    )


class TestNoHardCodedCredentialsInSignIn(unittest.TestCase):
    def test_module_has_no_fallback_password_set(self):
        self.assertFalse(hasattr(auth_service, "SUPPORTED_SYNC_PASSWORDS"))

    def test_module_has_no_collection_of_literal_strings(self):
        # A set/list/tuple of string literals at module level is how an allow-list of
        # "accepted" passwords would be reintroduced.
        for name, value in vars(auth_service).items():
            if name.startswith("__"):
                continue
            if isinstance(value, (set, frozenset, list, tuple)) and value:
                self.assertFalse(
                    all(isinstance(item, str) for item in value),
                    f"auth_service.{name} is a collection of string literals",
                )

    def test_sign_in_functions_never_touch_the_admin_api(self):
        for fn in (auth_service.authenticate_instructor, auth_service.authenticate_learner):
            source = inspect.getsource(fn)
            self.assertNotIn("update_user_by_id", source, fn.__name__)
            self.assertNotIn("get_service_client", source, fn.__name__)


class TestInstructorSignIn(unittest.TestCase):
    @patch("services.auth_service.get_user_profile")
    @patch("services.auth_service.get_service_client")
    @patch("services.auth_service.get_anon_client")
    def test_wrong_password_is_rejected_without_admin_reset(
        self, mock_anon_factory, mock_service_factory, mock_get_profile
    ):
        anon = MagicMock()
        anon.auth.sign_in_with_password.side_effect = Exception("Invalid login credentials")
        mock_anon_factory.return_value = anon

        for wrong in ("not-the-password", "Password1!", "", "x" * 40):
            with self.subTest(password=wrong):
                with self.assertRaises(ValueError) as ctx:
                    auth_service.authenticate_instructor("helen@example.test", wrong)
                self.assertEqual(str(ctx.exception), INSTRUCTOR_ERROR)

        mock_service_factory.assert_not_called()
        mock_get_profile.assert_not_called()
        anon.auth.admin.update_user_by_id.assert_not_called()

    @patch("services.auth_service.get_service_client")
    @patch("services.auth_service.get_anon_client")
    def test_failed_sign_in_is_not_retried(self, mock_anon_factory, mock_service_factory):
        anon = MagicMock()
        anon.auth.sign_in_with_password.side_effect = Exception("Invalid login credentials")
        mock_anon_factory.return_value = anon

        with self.assertRaises(ValueError):
            auth_service.authenticate_instructor("helen@example.test", "wrong-password")

        self.assertEqual(anon.auth.sign_in_with_password.call_count, 1)
        mock_service_factory.assert_not_called()

    @patch("services.auth_service.get_user_by_email")
    @patch("services.auth_service.get_service_client")
    @patch("services.auth_service.get_anon_client")
    def test_error_is_identical_for_unknown_and_known_email(
        self, mock_anon_factory, mock_service_factory, mock_by_email
    ):
        anon = MagicMock()
        anon.auth.sign_in_with_password.side_effect = Exception("Invalid login credentials")
        mock_anon_factory.return_value = anon

        messages = []
        for known in (True, False):
            mock_by_email.return_value = _profile() if known else None
            with self.assertRaises(ValueError) as ctx:
                auth_service.authenticate_instructor("someone@example.test", "wrong-password")
            messages.append(str(ctx.exception))

        self.assertEqual(messages, [INSTRUCTOR_ERROR, INSTRUCTOR_ERROR])
        mock_by_email.assert_not_called()
        mock_service_factory.assert_not_called()

    @patch("services.auth_service.get_user_profile")
    @patch("services.auth_service.get_service_client")
    @patch("services.auth_service.get_anon_client")
    def test_valid_credentials_use_supabase_sign_in(
        self, mock_anon_factory, mock_service_factory, mock_get_profile
    ):
        anon = MagicMock()
        anon.auth.sign_in_with_password.return_value = _signed_in("user-1")
        mock_anon_factory.return_value = anon
        mock_get_profile.return_value = _profile(email="helen@example.test", role="instructor")

        result = auth_service.authenticate_instructor("helen@example.test", "correct-password")

        anon.auth.sign_in_with_password.assert_called_once_with(
            {"email": "helen@example.test", "password": "correct-password"}
        )
        self.assertEqual(result["access_token"], "token-abc")
        self.assertEqual(result["user"].id, "user-1")
        mock_service_factory.assert_not_called()

    @patch("services.auth_service.get_user_profile")
    @patch("services.auth_service.get_anon_client")
    def test_valid_credentials_for_a_learner_account_are_refused_on_instructor_path(
        self, mock_anon_factory, mock_get_profile
    ):
        anon = MagicMock()
        anon.auth.sign_in_with_password.return_value = _signed_in("user-2")
        mock_anon_factory.return_value = anon
        mock_get_profile.return_value = _profile(id="user-2", role="resident")

        with self.assertRaises(ValueError):
            auth_service.authenticate_instructor("x@example.test", "correct-password")

    @patch("services.auth_service.get_user_profile")
    @patch("services.auth_service.get_anon_client")
    def test_inactive_instructor_is_refused(self, mock_anon_factory, mock_get_profile):
        anon = MagicMock()
        anon.auth.sign_in_with_password.return_value = _signed_in("user-1")
        mock_anon_factory.return_value = anon
        mock_get_profile.return_value = _profile(status="inactive")

        with self.assertRaises(ValueError):
            auth_service.authenticate_instructor("x@example.test", "correct-password")


class TestLearnerSignIn(unittest.TestCase):
    def setUp(self):
        self.learner = _profile(
            id="learner-1", role="resident", learner_id="MVR-TEST01", email=None
        )

    @patch("services.auth_service.get_user_by_learner_id")
    @patch("services.auth_service.get_service_client")
    @patch("services.auth_service.get_anon_client")
    def test_wrong_password_is_rejected_without_admin_reset(
        self, mock_anon_factory, mock_service_factory, mock_by_learner
    ):
        mock_by_learner.return_value = self.learner
        anon = MagicMock()
        anon.auth.sign_in_with_password.side_effect = Exception("Invalid login credentials")
        mock_anon_factory.return_value = anon

        for wrong in ("not-the-password", "Password1!", "", "x" * 40):
            with self.subTest(password=wrong):
                with self.assertRaises(ValueError) as ctx:
                    auth_service.authenticate_learner("MVR-TEST01", wrong)
                self.assertEqual(str(ctx.exception), LEARNER_ERROR)

        mock_service_factory.assert_not_called()
        anon.auth.admin.update_user_by_id.assert_not_called()

    @patch("services.auth_service.get_user_by_learner_id")
    @patch("services.auth_service.get_service_client")
    @patch("services.auth_service.get_anon_client")
    def test_failed_sign_in_is_not_retried(
        self, mock_anon_factory, mock_service_factory, mock_by_learner
    ):
        mock_by_learner.return_value = self.learner
        anon = MagicMock()
        anon.auth.sign_in_with_password.side_effect = Exception("Invalid login credentials")
        mock_anon_factory.return_value = anon

        with self.assertRaises(ValueError):
            auth_service.authenticate_learner("MVR-TEST01", "wrong-password")

        self.assertEqual(anon.auth.sign_in_with_password.call_count, 1)
        mock_service_factory.assert_not_called()

    @patch("services.auth_service.get_user_by_learner_id")
    @patch("services.auth_service.get_service_client")
    @patch("services.auth_service.get_anon_client")
    def test_error_is_identical_for_unknown_and_known_learner_id(
        self, mock_anon_factory, mock_service_factory, mock_by_learner
    ):
        anon = MagicMock()
        anon.auth.sign_in_with_password.side_effect = Exception("Invalid login credentials")
        mock_anon_factory.return_value = anon

        messages = []
        for known in (True, False):
            mock_by_learner.return_value = self.learner if known else None
            with self.assertRaises(ValueError) as ctx:
                auth_service.authenticate_learner("MVR-TEST01", "wrong-password")
            messages.append(str(ctx.exception))

        self.assertEqual(messages, [LEARNER_ERROR, LEARNER_ERROR])
        mock_service_factory.assert_not_called()

    @patch("services.auth_service.get_user_by_learner_id")
    @patch("services.auth_service.get_service_client")
    @patch("services.auth_service.get_anon_client")
    def test_valid_credentials_use_supabase_sign_in(
        self, mock_anon_factory, mock_service_factory, mock_by_learner
    ):
        mock_by_learner.return_value = self.learner
        anon = MagicMock()
        anon.auth.sign_in_with_password.return_value = _signed_in("learner-1")
        mock_anon_factory.return_value = anon

        result = auth_service.authenticate_learner("mvr-test01", "correct-password")

        anon.auth.sign_in_with_password.assert_called_once_with(
            {"email": "mvr-test01@learner.mediver.local", "password": "correct-password"}
        )
        self.assertEqual(result["access_token"], "token-abc")
        self.assertEqual(result["user"].id, "learner-1")
        mock_service_factory.assert_not_called()

    @patch("services.auth_service.get_user_by_learner_id")
    @patch("services.auth_service.get_anon_client")
    def test_inactive_learner_is_refused(self, mock_anon_factory, mock_by_learner):
        mock_by_learner.return_value = _profile(
            id="learner-1", role="resident", learner_id="MVR-TEST01", status="inactive"
        )
        anon = MagicMock()
        anon.auth.sign_in_with_password.return_value = _signed_in("learner-1")
        mock_anon_factory.return_value = anon

        with self.assertRaises(ValueError):
            auth_service.authenticate_learner("MVR-TEST01", "correct-password")


if __name__ == "__main__":
    unittest.main()
