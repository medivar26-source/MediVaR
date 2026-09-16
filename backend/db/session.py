"""
Database session management.

Provides:
  - supabase_service_client: Supabase client with service_role key.
    Used for admin operations (create/delete auth users, bypass RLS).
  - get_db_conn(): Direct psycopg2 connection for application-level
    user lookups and inserts.

Two clients exist because:
  1. Supabase Python client handles Auth admin operations cleanly.
  2. psycopg2 is used for direct SQL against the users/institutions
     tables where ORM-style queries are cleaner and faster.
"""
import psycopg2
import psycopg2.extras
from supabase import create_client, Client
from core.config import settings


def _get_supabase_client(key: str) -> Client:
    url = settings.SUPABASE_URL or "http://localhost:8000"
    return create_client(url, key or "dummy-key")


def get_service_client() -> Client:
    """
    Supabase client authenticated with the service_role key.
    ONLY for server-side use. Never expose to the browser.
    """
    return _get_supabase_client(settings.SUPABASE_SERVICE_ROLE_KEY)


def get_anon_client() -> Client:
    """Supabase client with the anon key. Safe for client-side operations."""
    return _get_supabase_client(settings.SUPABASE_ANON_KEY)


def get_db_conn():
    """
    Return a raw psycopg2 connection to the Supabase PostgreSQL database.
    Callers must close the connection when done.
    Uses RealDictCursor so rows are returned as dicts.
    """
    conn = psycopg2.connect(
        settings.SUPABASE_DB_URL,
        cursor_factory=psycopg2.extras.RealDictCursor,
    )
    return conn


# Module-level singletons for convenience (re-created per import cycle)
# The service client is used by auth_service and provisioning scripts.
supabase: Client = get_anon_client()
