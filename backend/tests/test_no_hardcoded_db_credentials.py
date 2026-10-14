"""
The manual database diagnostics must take their configuration from the environment only.

Static checks plus a run with the variables missing, and a run against an unreachable local
address with a sentinel password to prove nothing sensitive is echoed. No external service is
contacted.
"""
import os
import re
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[1]
SCRIPTS = [BACKEND / "test_db.py", BACKEND / "test_supabase_http.py"]

CONNECTION_STRING_WITH_PASSWORD = re.compile(r"postgres(?:ql)?://[^:/\s\"']+:[^@\s\"']+@")
EMBEDDED_PROJECT_URL = re.compile(r"https://[a-z0-9]{20}\.supabase\.co")
EMBEDDED_KEY = re.compile(r"sb_(?:publishable|secret)_[A-Za-z0-9_-]+|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}")
SENTINEL = "sentinel-secret-9f3a"


def _run(script: Path, env_extra: dict) -> subprocess.CompletedProcess:
    env = {k: v for k, v in os.environ.items() if not k.startswith("SUPABASE_")}
    env.update(env_extra)
    with tempfile.TemporaryDirectory() as cwd:
        return subprocess.run(
            [sys.executable, str(script)], cwd=cwd, env=env,
            capture_output=True, text=True, timeout=60,
        )


class TestNoHardCodedDatabaseCredentials(unittest.TestCase):
    def test_scripts_contain_no_embedded_connection_details(self):
        for script in SCRIPTS:
            text = script.read_text(encoding="utf-8")
            with self.subTest(script=script.name):
                self.assertIsNone(CONNECTION_STRING_WITH_PASSWORD.search(text))
                self.assertIsNone(EMBEDDED_PROJECT_URL.search(text))
                self.assertIsNone(EMBEDDED_KEY.search(text))

    def test_db_script_fails_clearly_when_url_is_missing(self):
        result = _run(BACKEND / "test_db.py", {})
        self.assertEqual(result.returncode, 2)
        self.assertIn("SUPABASE_DB_URL is not set", result.stdout)

    def test_http_script_fails_clearly_when_configuration_is_missing(self):
        result = _run(BACKEND / "test_supabase_http.py", {})
        self.assertEqual(result.returncode, 2)
        self.assertIn("SUPABASE_URL", result.stdout)
        self.assertIn("SUPABASE_ANON_KEY", result.stdout)

    def test_db_script_does_not_echo_the_connection_string(self):
        # Port 1 on the loopback address refuses immediately; nothing external is contacted.
        url = f"postgresql://someuser:{SENTINEL}@127.0.0.1:1/db"
        result = _run(BACKEND / "test_db.py", {"SUPABASE_DB_URL": url})
        self.assertEqual(result.returncode, 1)
        self.assertNotIn(SENTINEL, result.stdout + result.stderr)
        self.assertNotIn("127.0.0.1", result.stdout + result.stderr)


if __name__ == "__main__":
    unittest.main()
