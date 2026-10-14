"""
Manual check that the Supabase REST endpoint answers.

Reads SUPABASE_URL and SUPABASE_ANON_KEY from the environment (the names the backend uses).
Nothing is hard-coded here, and the values are never printed.

    export SUPABASE_URL=... SUPABASE_ANON_KEY=...   # set them in your own shell; do not commit
    python test_supabase_http.py
"""
import os
import sys

from supabase import create_client, Client

url = os.environ.get("SUPABASE_URL", "").strip()
key = os.environ.get("SUPABASE_ANON_KEY", "").strip()
missing = [name for name, value in (("SUPABASE_URL", url), ("SUPABASE_ANON_KEY", key)) if not value]
if missing:
    print("Missing environment variable(s): " + ", ".join(missing) + ". Export them and run again.")
    sys.exit(2)

print("Testing Supabase HTTP Client...")
try:
    supabase: Client = create_client(url, key)
    # Perform a simple check that doesn't require auth/tables - like checking if the REST API root responds
    import requests
    response = requests.get(url + "/rest/v1/")
    print("HTTP Request to REST root returned:", response.status_code)
except Exception as e:
    print("Supabase HTTP connection error:", type(e).__name__)
    sys.exit(1)
