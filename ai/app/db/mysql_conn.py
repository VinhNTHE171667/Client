import os
from functools import lru_cache
from typing import Any

from sqlalchemy import create_engine
from sqlalchemy.engine import URL, Engine


@lru_cache(maxsize=1)
def get_mysql_engine() -> Engine:
    host = os.getenv("MYSQL_HOST", "localhost")
    port = os.getenv("MYSQL_PORT", "3306")
    user = os.getenv("MYSQL_USER", "root")
    # Support both MYSQL_PASSWORD and MYSQL_PASS environment variable names
    # Default to 'root' to match dev environment if not provided
    password = os.getenv("MYSQL_PASSWORD", os.getenv("MYSQL_PASS", "root"))
    # Support MYSQL_DB or MYSQL_DATABASE
    # Default to 'gen_spa' (user's DB) if not provided
    database = os.getenv("MYSQL_DB", os.getenv("MYSQL_DATABASE", "gen_spa"))
    url = URL.create(
        drivername="mysql+mysqlconnector",
        username=user,
        password=password,
        host=host,
        port=int(port),
        database=database,
    )
    return create_engine(url, pool_pre_ping=True)


def run_healthcheck() -> dict[str, Any]:
    engine = get_mysql_engine()
    with engine.connect() as conn:
        conn.execute("SELECT 1")
    return {"mysql": "ok"}
