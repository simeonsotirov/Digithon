from collections.abc import Iterator, Sequence
import os
from typing import Any

from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool


_pool: ConnectionPool | None = None


def database_url() -> str:
    url = os.getenv("DATABASE_URL")
    if not url:
        raise RuntimeError("DATABASE_URL is required")
    return url


def pool() -> ConnectionPool:
    global _pool
    if _pool is None:
        _pool = ConnectionPool(database_url(), kwargs={"row_factory": dict_row}, open=False)
        _pool.open()
    return _pool


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
