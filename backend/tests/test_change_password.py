import unittest
from unittest.mock import MagicMock, patch

from schemas.auth import UserProfile
from services.auth_service import change_user_password


class TestChangePassword(unittest.TestCase):
    def setUp(self):
        self.learner_user = UserProfile(
            id="user-learner-123",
            first_name="Arjun",
            last_name="Mehta",
            display_name="Arjun Mehta",
            learner_id="MVR-TEST01",
            role="resident",
            status="active",
            default_difficulty="intermediate",
        )
        self.instructor_user = UserProfile(
            id="user-instructor-456",
            first_name="Helen",
            last_name="Ward",
            display_name="Helen Ward",
            email="helen.ward@mediver.local",
            role="instructor",
            status="active",
            default_difficulty="expert",
        )

    def test_empty_fields_raise_error(self):
        with self.assertRaises(ValueError) as ctx:
            change_user_password(self.learner_user, "", "new_secret_123", "new_secret_123")
        self.assertIn("All password fields are required", str(ctx.exception))

    def test_mismatched_confirmation_raises_error(self):
        with self.assertRaises(ValueError) as ctx:
            change_user_password(
                self.learner_user,
                "current_pass_123",
                "new_secret_123",
                "different_secret_123",
            )
        self.assertIn("do not match", str(ctx.exception))

    def test_short_password_raises_error(self):
        with self.assertRaises(ValueError) as ctx:
            change_user_password(
                self.learner_user,
                "current_pass_123",
                "short",
                "short",
            )
        self.assertIn("at least 8 characters", str(ctx.exception))

    def test_same_as_current_raises_error(self):
        with self.assertRaises(ValueError) as ctx:
            change_user_password(
                self.learner_user,
                "same_password_123",
                "same_password_123",
                "same_password_123",
            )
        self.assertIn("must be different", str(ctx.exception))

    @patch("services.auth_service.get_service_client")
    @patch("services.auth_service.get_anon_client")
    def test_incorrect_current_password_raises_error(self, mock_get_anon, mock_get_service):
        mock_anon = MagicMock()
        mock_anon.auth.sign_in_with_password.side_effect = Exception("Invalid login credentials")
        mock_get_anon.return_value = mock_anon

        mock_service = MagicMock()
        mock_get_service.return_value = mock_service

        with self.assertRaises(ValueError) as ctx:
            change_user_password(
                self.learner_user,
                "wrong_current_pass",
                "valid_new_password_123",
                "valid_new_password_123",
            )

        self.assertIn("Current password is incorrect", str(ctx.exception))
        # Ensure admin update is NEVER called when current password verification fails
        mock_service.auth.admin.update_user_by_id.assert_not_called()

    @patch("services.auth_service.get_service_client")
    @patch("services.auth_service.get_anon_client")
    def test_valid_password_change_for_learner(self, mock_get_anon, mock_get_service):
        mock_anon = MagicMock()
        mock_session_response = MagicMock()
        mock_session_response.session = MagicMock()
        mock_anon.auth.sign_in_with_password.return_value = mock_session_response
        mock_get_anon.return_value = mock_anon

        mock_service = MagicMock()
        mock_get_service.return_value = mock_service

        res = change_user_password(
            self.learner_user,
            "old_temp_pass_123",
            "new_secure_pass_456",
            "new_secure_pass_456",
        )

        self.assertEqual(res["message"], "Password changed successfully")

        # Verify current password was authenticated using synthetic email
        mock_anon.auth.sign_in_with_password.assert_called_once_with({
            "email": "mvr-test01@learner.mediver.local",
            "password": "old_temp_pass_123",
        })

        # Verify password update targeted ONLY the authenticated learner's id
        mock_service.auth.admin.update_user_by_id.assert_called_once_with(
            "user-learner-123",
            {"password": "new_secure_pass_456"},
        )

    @patch("services.auth_service.get_service_client")
    @patch("services.auth_service.get_anon_client")
    def test_valid_password_change_for_instructor(self, mock_get_anon, mock_get_service):
        mock_anon = MagicMock()
        mock_session_response = MagicMock()
        mock_session_response.session = MagicMock()
        mock_anon.auth.sign_in_with_password.return_value = mock_session_response
        mock_get_anon.return_value = mock_anon

        mock_service = MagicMock()
        mock_get_service.return_value = mock_service

        res = change_user_password(
            self.instructor_user,
            "old_instructor_pass",
            "new_instructor_pass_789",
            "new_instructor_pass_789",
        )

        self.assertEqual(res["message"], "Password changed successfully")

        # Verify current password was authenticated using instructor email
        mock_anon.auth.sign_in_with_password.assert_called_once_with({
            "email": "helen.ward@mediver.local",
            "password": "old_instructor_pass",
        })

        # Verify password update targeted ONLY the authenticated instructor's id
        mock_service.auth.admin.update_user_by_id.assert_called_once_with(
            "user-instructor-456",
            {"password": "new_instructor_pass_789"},
        )


if __name__ == "__main__":
    unittest.main()
