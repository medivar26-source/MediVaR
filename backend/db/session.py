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

Connections come from a small pool. Opening one to the hosted database costs a
TCP, TLS and login round trip on every request, which was most of the time a
simple read took. Callers are unchanged: they still call `conn.close()`, which
now hands the connection back instead of dropping it.
"""
import logging
import threading
import time
from typing import Dict, Optional

import psycopg2
import psycopg2.extras
import psycopg2.pool
from supabase import ClientOptions, create_client, Client

from core.config import settings

logger = logging.getLogger(__name__)


def _client_options(**extra) -> ClientOptions:
    """Every outbound call to Supabase gets a deadline, so a slow upstream cannot hold a request forever."""
    return ClientOptions(
        postgrest_client_timeout=settings.SUPABASE_HTTP_TIMEOUT,
        storage_client_timeout=settings.SUPABASE_STORAGE_TIMEOUT,
        function_client_timeout=settings.SUPABASE_HTTP_TIMEOUT,
        **extra,
    )


def _get_supabase_client(key: str, **options) -> Client:
    url = settings.SUPABASE_URL or "http://localhost:8000"
    return create_client(url, key or "dummy-key", options=_client_options(**options))


def get_service_client() -> Client:
    """
    Supabase client authenticated with the service_role key.
    ONLY for server-side use. Never expose to the browser.
    """
    return _get_supabase_client(settings.SUPABASE_SERVICE_ROLE_KEY)


def get_anon_client() -> Client:
    """Supabase client with the anon key. Safe for client-side operations."""
    return _get_supabase_client(settings.SUPABASE_ANON_KEY)


_validator_client: Optional[Client] = None
_validator_lock = threading.Lock()


def get_token_validation_client() -> Client:
    """
    One shared anon client used only to check access tokens (`auth.get_user(jwt)`), which keeps no session.
    Every request used to build a fresh client just to do this. Sign-in and password flows keep using
    `get_anon_client()`, which does keep session state, so those are never shared.
    """
    global _validator_client
    if _validator_client is None:
        with _validator_lock:
            if _validator_client is None:
                _validator_client = _get_supabase_client(
                    settings.SUPABASE_ANON_KEY, auto_refresh_token=False, persist_session=False
                )
    return _validator_client


# ---------------------------------------------------------------------------
# Connection pool
# ---------------------------------------------------------------------------

#: A connection idle longer than this is checked with a cheap query before it is handed out, because the
#: hosted pooler closes idle connections.
_PING_AFTER_IDLE_SECONDS = 20.0

_pool: Optional[psycopg2.pool.ThreadedConnectionPool] = None
_pool_lock = threading.Lock()
_last_used: Dict[int, float] = {}


def _connect():
    return psycopg2.connect(
        settings.SUPABASE_DB_URL,
        cursor_factory=psycopg2.extras.RealDictCursor,
        connect_timeout=settings.DB_CONNECT_TIMEOUT,
    )


def _get_pool() -> Optional[psycopg2.pool.ThreadedConnectionPool]:
    """The process-wide pool, created on first use (after the server has forked its workers)."""
    global _pool
    if not settings.DB_POOL_ENABLED:
        return None
    if _pool is None:
        with _pool_lock:
            if _pool is None:
                _pool = psycopg2.pool.ThreadedConnectionPool(
                    settings.DB_POOL_MIN,
                    settings.DB_POOL_MAX,
                    settings.SUPABASE_DB_URL,
                    cursor_factory=psycopg2.extras.RealDictCursor,
                    connect_timeout=settings.DB_CONNECT_TIMEOUT,
                )
    return _pool


class PooledConnection:
    """
    Looks like a psycopg2 connection. `close()` returns it to the pool (rolling back anything left open), so
    the many `finally: conn.close()` call sites keep working. Everything else is passed straight through.
    """

    def __init__(self, conn, owner: Optional[psycopg2.pool.AbstractConnectionPool]):
        object.__setattr__(self, "_conn", conn)
        object.__setattr__(self, "_owner", owner)
        object.__setattr__(self, "_released", False)

    def __getattr__(self, name):
        return getattr(self._conn, name)

    def __setattr__(self, name, value):
        setattr(self._conn, name, value)

    def __enter__(self):
        self._conn.__enter__()
        return self

    def __exit__(self, exc_type, exc, tb):
        return self._conn.__exit__(exc_type, exc, tb)

    def close(self):
        if self._released:
            return
        object.__setattr__(self, "_released", True)
        conn, owner = self._conn, self._owner
        if owner is None:
            conn.close()
            return
        broken = bool(conn.closed)
        if not broken:
            try:
                # Nothing a request left half-done may leak into the next one.
                conn.rollback()
                if getattr(conn, "autocommit", False):
                    conn.autocommit = False
            except Exception:
                broken = True
        _last_used[id(conn)] = time.monotonic()
        try:
            owner.putconn(conn, close=broken)
        except Exception:
            logger.warning("Could not return a database connection to the pool", exc_info=True)
            try:
                conn.close()
            except Exception:
                pass


def _alive(conn) -> bool:
    if conn.closed:
        return False
    idle = time.monotonic() - _last_used.get(id(conn), 0.0)
    if idle < _PING_AFTER_IDLE_SECONDS:
        return True
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT 1")
        conn.rollback()
        return True
    except Exception:
        return False


def get_db_conn():
    """
    Return a psycopg2 connection to the Supabase PostgreSQL database, from the pool.
    Callers must close the connection when done (that hands it back to the pool).
    Uses RealDictCursor so rows are returned as dicts. If the pool is off or full, a direct connection is
    opened instead, exactly as before.
    """
    pool = _get_pool()
    if pool is None:
        return PooledConnection(_connect(), None)
    try:
        conn = pool.getconn()
    except psycopg2.pool.PoolError:
        logger.warning("Database pool exhausted; opening a direct connection")
        return PooledConnection(_connect(), None)
    if not _alive(conn):
        pool.putconn(conn, close=True)
        conn = pool.getconn()
    return PooledConnection(conn, pool)


# Module-level singletons for convenience (re-created per import cycle)
# The service client is used by auth_service and provisioning scripts.
supabase: Client = get_anon_client()
