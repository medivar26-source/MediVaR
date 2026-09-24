"""
Run a SQL migration file against the Supabase PostgreSQL database.

Usage:
    python -m backend.migrations.apply_migration 001_auth_tables.sql
    # or run all pending:
    python -m backend.migrations.apply_migration --all
"""
import sys
import os
import psycopg2

# Support running from root of project
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from backend.core.config import settings  # noqa: E402


def apply(migration_file: str):
    migration_path = os.path.join(os.path.dirname(__file__), migration_file)
    if not os.path.exists(migration_path):
        print(f"Migration file not found: {migration_path}")
        sys.exit(1)

    with open(migration_path, "r") as f:
        sql = f.read()

    print(f"Applying migration: {migration_file}")
    conn = psycopg2.connect(settings.SUPABASE_DB_URL)
    conn.autocommit = False
    try:
        cur = conn.cursor()
        cur.execute(sql)
        conn.commit()
        print(f"Migration applied: {migration_file}")
    except Exception as e:
        conn.rollback()
        print(f"Migration failed: {e}")
        sys.exit(1)
    finally:
        conn.close()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python -m backend.migrations.apply_migration <filename.sql>")
        sys.exit(1)

    apply(sys.argv[1])
