"""
Tests for the Session implementation: schema validation and the
DB-independent parts of the session business logic (status derivation,
case-assignment gating). No live database is required.
"""
import unittest
from datetime import datetime, timezone, timedelta

from pydantic import ValidationError

from schemas.cohorts import SessionCreate, SessionUpdate, SessionSummary
from services.cohorts_service import _get_session_status


class TestSessionSchemas(unittest.TestCase):
    def test_session_create_requires_case_id(self):
        with self.assertRaises(ValidationError):
            SessionCreate(
                name="Week 4 TKA",
                scheduled_at=datetime.now(timezone.utc),
                duration=60,
            )

    def test_session_create_rejects_unknown_mode(self):
        with self.assertRaises(ValidationError):
            SessionCreate(
                name="Week 4 TKA",
                scheduled_at=datetime.now(timezone.utc),
                duration=60,
                case_id="00000000-0000-0000-0000-000000000001",
                mode="not-a-real-mode",
            )

    def test_session_create_defaults_mode_to_training(self):
        session = SessionCreate(
            name="Week 4 TKA",
            scheduled_at=datetime.now(timezone.utc),
            duration=60,
            case_id="00000000-0000-0000-0000-000000000001",
        )
        self.assertEqual(session.mode, "training")
        self.assertIsNone(session.resident_ids)

    def test_session_create_accepts_explicit_resident_ids(self):
        session = SessionCreate(
            name="Week 4 TKA",
            scheduled_at=datetime.now(timezone.utc),
            duration=60,
            case_id="00000000-0000-0000-0000-000000000001",
            mode="assessment",
            resident_ids=["r1", "r2"],
        )
        self.assertEqual(session.resident_ids, ["r1", "r2"])

    def test_session_update_has_no_case_or_roster_fields(self):
        """A session's case/mode/roster are pinned at creation — editing a
        session must not be able to silently reassign them."""
        update = SessionUpdate(
            name="Renamed",
            scheduled_at=datetime.now(timezone.utc),
            duration=90,
        )
        fields = SessionUpdate.model_fields
        self.assertNotIn("case_id", fields)
        self.assertNotIn("mode", fields)
        self.assertNotIn("resident_ids", fields)
        self.assertIsNotNone(update)

    def test_session_summary_defaults_roster_counts_to_zero(self):
        summary = SessionSummary(
            id="s1",
            cohort_id="c1",
            name="Week 4 TKA",
            scheduled_at=datetime.now(timezone.utc),
            duration=60,
            status="scheduled",
            created_at=datetime.now(timezone.utc),
        )
        self.assertEqual(summary.resident_count, 0)
        self.assertEqual(summary.completed_count, 0)
        self.assertEqual(summary.mode, "training")


class TestSessionStatusDerivation(unittest.TestCase):
    """`_get_session_status` computes status from the clock rather than
    storing it (see 008_sessions_update.sql, which dropped the stored
    `status` column) — this is the one piece of session logic that's pure
    and safe to unit test without a database."""

    def test_future_session_is_scheduled(self):
        future = datetime.now(timezone.utc) + timedelta(days=1)
        self.assertEqual(_get_session_status(future, 60, False), "scheduled")

    def test_session_within_its_window_is_in_progress(self):
        started = datetime.now(timezone.utc) - timedelta(minutes=10)
        self.assertEqual(_get_session_status(started, 60, False), "in_progress")

    def test_session_past_its_window_is_completed(self):
        started = datetime.now(timezone.utc) - timedelta(hours=3)
        self.assertEqual(_get_session_status(started, 60, False), "completed")

    def test_cancelled_overrides_everything(self):
        future = datetime.now(timezone.utc) + timedelta(days=1)
        self.assertEqual(_get_session_status(future, 60, True), "cancelled")

        past = datetime.now(timezone.utc) - timedelta(days=1)
        self.assertEqual(_get_session_status(past, 60, True), "cancelled")


if __name__ == "__main__":
    unittest.main()
