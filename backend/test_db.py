"""
Manual connectivity check for the Postgres database.

Reads the connection string from the SUPABASE_DB_URL environment variable (the same name the
backend uses). Nothing is hard-coded here, and the value is never printed.

    export SUPABASE_DB_URL=...   # set it in your own shell; do not commit it
    python test_db.py
"""
import os
import sys

import psycopg2

db_url = os.environ.get("SUPABASE_DB_URL", "").strip()
if not db_url:
    print("SUPABASE_DB_URL is not set. Export it in your environment and run again.")
    sys.exit(2)

print('Connecting to DB...')
try:
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    cur.execute('SELECT version();')
    print('DB Connection Successful!')
    print('PostgreSQL Version:', cur.fetchone()[0])
    cur.close()
    conn.close()
except Exception as e:
    print('Failed to connect:', type(e).__name__)
    sys.exit(1)
