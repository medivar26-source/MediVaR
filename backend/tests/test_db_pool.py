"""
The connection pool behind `get_db_conn()`. Everything here uses fake connections and a fake pool, so no
database is touched.

What must hold:
  - `close()` returns a connection to the pool, rolling back anything left open, and does so only once;
  - a connection that is already closed is discarded, not reused;
  - a connection idle for a while is checked before it is handed out, and replaced if it has died;
  - a full pool falls back to a direct connection rather than failing the request.
"""

import unittest
from unittest.mock import patch

import psycopg2.pool

from db import session


class FakeCursor:
    def __init__(self, conn):
        self.conn = conn

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return False

    def execute(self, sql, params=None):
        if self.conn.dead:
            raise RuntimeError("connection is dead")
        self.conn.queries.append(sql)


class FakeConn:
    def __init__(self):
        self.closed = 0
        self.autocommit = False
        self.dead = False
        self.queries = []
        self.rollbacks = 0

    def cursor(self):
        return FakeCursor(self)

    def rollback(self):
        self.rollbacks += 1

    def commit(self):
        pass

    def close(self):
        self.closed = 1


class FakePool:
    def __init__(self, conns=None, full=False):
        self.free = list(conns or [])
        self.full = full
        self.returned = []

    def getconn(self):
        if self.full:
            raise psycopg2.pool.PoolError("connection pool exhausted")
        return self.free.pop(0) if self.free else FakeConn()

    def putconn(self, conn, close=False):
        self.returned.append((conn, close))


class PoolTests(unittest.TestCase):
    def setUp(self):
        session._last_used.clear()

    def test_close_returns_the_connection_and_rolls_back(self):
        pool = FakePool()
        conn = FakeConn()
        wrapped = session.PooledConnection(conn, pool)
        wrapped.close()
        self.assertEqual(conn.rollbacks, 1)
        self.assertEqual(pool.returned, [(conn, False)])
        self.assertEqual(conn.closed, 0, "a pooled connection must stay open")

    def test_close_twice_returns_it_once(self):
        pool = FakePool()
        wrapped = session.PooledConnection(FakeConn(), pool)
        wrapped.close()
        wrapped.close()
        self.assertEqual(len(pool.returned), 1)

    def test_autocommit_is_reset_for_the_next_user(self):
        pool = FakePool()
        conn = FakeConn()
        conn.autocommit = True
        session.PooledConnection(conn, pool).close()
        self.assertFalse(conn.autocommit)

    def test_a_closed_connection_is_discarded(self):
        pool = FakePool()
        conn = FakeConn()
        conn.closed = 2
        session.PooledConnection(conn, pool).close()
        self.assertEqual(pool.returned, [(conn, True)])

    def test_a_direct_connection_is_really_closed(self):
        conn = FakeConn()
        session.PooledConnection(conn, None).close()
        self.assertEqual(conn.closed, 1)

    def test_attributes_pass_through(self):
        conn = FakeConn()
        wrapped = session.PooledConnection(conn, FakePool())
        wrapped.autocommit = True
        self.assertTrue(conn.autocommit)
        self.assertEqual(wrapped.queries, [])

    def test_a_recently_used_connection_is_not_pinged(self):
        conn = FakeConn()
        session._last_used[id(conn)] = session.time.monotonic()
        pool = FakePool([conn])
        with patch.object(session, "_get_pool", return_value=pool):
            got = session.get_db_conn()
        self.assertIs(got._conn, conn)
        self.assertEqual(conn.queries, [])

    def test_an_idle_connection_is_pinged_and_a_dead_one_replaced(self):
        dead, fresh = FakeConn(), FakeConn()
        dead.dead = True
        session._last_used[id(dead)] = session.time.monotonic() - 3600
        pool = FakePool([dead, fresh])
        with patch.object(session, "_get_pool", return_value=pool):
            got = session.get_db_conn()
        self.assertIs(got._conn, fresh)
        self.assertEqual(pool.returned, [(dead, True)], "the dead connection is dropped, not reused")

    def test_a_full_pool_falls_back_to_a_direct_connection(self):
        direct = FakeConn()
        with patch.object(session, "_get_pool", return_value=FakePool(full=True)), patch.object(
            session, "_connect", return_value=direct
        ):
            got = session.get_db_conn()
        self.assertIs(got._conn, direct)
        self.assertIsNone(got._owner)

    def test_the_pool_can_be_switched_off(self):
        direct = FakeConn()
        with patch.object(session.settings, "DB_POOL_ENABLED", False), patch.object(
            session, "_connect", return_value=direct
        ):
            got = session.get_db_conn()
        self.assertIs(got._conn, direct)
        self.assertIsNone(got._owner)


if __name__ == "__main__":
    unittest.main()
