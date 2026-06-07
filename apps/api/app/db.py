from collections.abc import Iterator, Sequence
import logging
import os
from typing import Any

from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool


log = logging.getLogger(__name__)

_pool: ConnectionPool | None = None


def database_url() -> str:
    url = os.getenv("DATABASE_URL")
    if not url:
        log.error("DATABASE_URL environment variable is not set")
        raise RuntimeError("DATABASE_URL is required — set it before starting the API")
    return url


def pool() -> ConnectionPool:
    global _pool
    if _pool is None:
        url = database_url()
        log.info("Opening database connection pool")
        p = ConnectionPool(url, kwargs={"row_factory": dict_row}, open=False)
        p.open()  # assign only after open succeeds so a failed open doesn't poison _pool
        _pool = p
        log.info("Database connection pool ready")
    return _pool


def ping() -> None:
    """Run SELECT 1 to verify the pool can reach Postgres."""
    with pool().connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT 1")


def rows(sql: str, params: Sequence[Any] | dict[str, Any] | None = None) -> list[dict[str, Any]]:
    with pool().connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, params)
            return list(cur.fetchall())


def row(sql: str, params: Sequence[Any] | dict[str, Any] | None = None) -> dict[str, Any] | None:
    result = rows(sql, params)
    return result[0] if result else None


def execute(sql: str, params: Sequence[Any] | dict[str, Any] | None = None) -> None:
    with pool().connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, params)
        conn.commit()


def transaction() -> Iterator[Any]:
    return pool().connection()
