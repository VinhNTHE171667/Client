"""Utility helpers for database connectivity and ETL."""
from __future__ import annotations

import json
import sys
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Optional

import pandas as pd
from sqlalchemy.engine import Engine
from sqlalchemy import create_engine
from sqlalchemy.engine import URL

try:
    from dotenv import load_dotenv
except ImportError:  # pragma: no cover - optional dependency
    load_dotenv = None  # type: ignore


PROJECT_ROOT = Path(__file__).resolve().parents[3]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from app.db.mysql_conn import get_mysql_engine as shared_mysql_engine  # noqa: E402


def _create_engine_from_env() -> Engine:
    """Create an engine from environment variables if present in recommendation/.env.

    This lets the recommendation service run standalone against a local MySQL
    instance (e.g. localhost:3306) without requiring edits to the main app
    connector. If the recommendation `.env` isn't present or variables are
    missing, caller should fallback to the shared engine.
    """
    # prefer python-dotenv to load local .env when available
    try:
        from dotenv import load_dotenv
    except Exception:
        load_dotenv = None

    env_path = PROJECT_ROOT / "recommendation" / ".env"
    if load_dotenv is not None and env_path.exists():
        load_dotenv(env_path)

    host = os.getenv("MYSQL_HOST")
    port = os.getenv("MYSQL_PORT")
    user = os.getenv("MYSQL_USER")
    # accept either MYSQL_PASSWORD or legacy MYSQL_PASS
    password = os.getenv("MYSQL_PASSWORD") or os.getenv("MYSQL_PASS")
    database = os.getenv("MYSQL_DB")

    # If minimal connection info is not set, return None to indicate fallback.
    if not (host and user and database):
        raise RuntimeError("Recommendation local DB env not configured")

    port = int(port) if port is not None else 3306
    url = URL.create(
        drivername="mysql+mysqlconnector",
        username=user,
        password=password or "",
        host=host,
        port=port,
        database=database,
    )
    return create_engine(url, pool_pre_ping=True)


@dataclass
class DataFrames:
    """Container for the denormalised tables used by the analytics modules."""

    appointment: pd.DataFrame
    invoice: pd.DataFrame
    invoice_detail: pd.DataFrame
    customer: pd.DataFrame
    service: pd.DataFrame


_DATA_CACHE: Optional[DataFrames] = None


def load_env() -> None:
    """Load environment variables from `.env` when python-dotenv is installed."""
    if load_dotenv is not None:
        env_path = PROJECT_ROOT / ".env"
        if env_path.exists():
            load_dotenv(env_path)
        else:
            load_dotenv()


def get_mysql_engine() -> Engine:
    """Get a usable MySQL engine for the recommendation module.

    Strategy:
    1. Try to create an engine from `recommendation/.env` (so the recommendation
       service can run against localhost without touching the main app).
    2. If that fails, fallback to the shared app engine from `app.db.mysql_conn`.
    """
    # load general env first (keeps previous behavior)
    load_env()
    try:
        return _create_engine_from_env()
    except Exception:
        # fallback to shared engine used by the main app
        return shared_mysql_engine()


def _fetch_table(engine: Engine, table_name: str) -> pd.DataFrame:
    query = f"SELECT * FROM {table_name}"
    return pd.read_sql(query, con=engine)


def _normalise_invoice(df: pd.DataFrame) -> pd.DataFrame:
    frame = df.copy()
    if "created_at" not in frame and "createdAt" in frame:
        frame["created_at"] = frame["createdAt"]
    if "customer_id" not in frame:
        if "customerId" in frame:
            frame["customer_id"] = frame["customerId"]
    if "id" not in frame and "ID" in frame:
        frame["id"] = frame["ID"]
    if "total" not in frame:
        for column in ("finalAmount", "total_amount", "totalAmount"):
            if column in frame:
                frame["total"] = frame[column]
                break
    return frame


def _normalise_appointment(df: pd.DataFrame) -> pd.DataFrame:
    frame = df.copy()
    mapping = {
        "appointment_date": "scheduled_date",
        "startTime": "start_time",
        "endTime": "end_time",
        "customerId": "customer_id",
        "note": "notes",
    }
    for original, alias in mapping.items():
        if alias not in frame and original in frame:
            frame[alias] = frame[original]
    if "status" in frame:
        frame["status"] = frame["status"].astype(str)
    return frame


def _normalise_service(df: pd.DataFrame) -> pd.DataFrame:
    frame = df.copy()
    if "duration_minutes" not in frame:
        frame["duration_minutes"] = 60
    if "is_active" not in frame and "isActive" in frame:
        frame["is_active"] = frame["isActive"]
    return frame


def _normalise_invoice_detail(df: pd.DataFrame) -> pd.DataFrame:
    frame = df.copy()
    if "invoice_id" not in frame and "invoiceId" in frame:
        frame["invoice_id"] = frame["invoiceId"]
    if "service_id" not in frame and "serviceId" in frame:
        frame["service_id"] = frame["serviceId"]
    if "unit_price" not in frame:
        for column in ("unitPrice", "price", "unit_price"):
            if column in frame:
                frame["unit_price"] = frame[column]
                break
    return frame


def _generate_sample_data() -> DataFrames:
    """Return an in-memory synthetic dataset so the API can run without MySQL."""
    customer = pd.DataFrame(
        [
            {"id": 1, "full_name": "Nguyen Thi Anh", "email": "anh@example.com", "phone": "0909000001"},
            {"id": 2, "full_name": "Tran Van Binh", "email": "binh@example.com", "phone": "0909000002"},
            {"id": 3, "full_name": "Le Hoai Thu", "email": "thu@example.com", "phone": "0909000003"},
        ]
    )

    service = pd.DataFrame(
        [
            {"id": 1, "name": "Massage Thư Giãn", "price": 450000, "duration_minutes": 60},
            {"id": 2, "name": "Chăm Sóc Da Mặt", "price": 520000, "duration_minutes": 75},
            {"id": 3, "name": "Gội Đầu Thảo Dược", "price": 220000, "duration_minutes": 45},
            {"id": 4, "name": "Detox Body", "price": 650000, "duration_minutes": 90},
        ]
    )

    appointment = pd.DataFrame(
        [
            {
                "id": 101,
                "customer_id": 1,
                "scheduled_date": "2025-10-01",
                "start_time": "10:00",
                "end_time": "11:15",
                "status": "completed",
            },
            {
                "id": 102,
                "customer_id": 2,
                "scheduled_date": "2025-10-02",
                "start_time": "14:00",
                "end_time": "15:00",
                "status": "completed",
            },
            {
                "id": 103,
                "customer_id": 3,
                "scheduled_date": "2025-10-02",
                "start_time": "16:30",
                "end_time": "17:30",
                "status": "cancelled",
            },
            {
                "id": 104,
                "customer_id": 1,
                "scheduled_date": "2025-10-03",
                "start_time": "09:00",
                "end_time": "10:00",
                "status": "completed",
            },
        ]
    )

    invoice = pd.DataFrame(
        [
            {"id": 201, "appointment_id": 101, "customer_id": 1, "total": 970000, "created_at": "2025-10-01"},
            {"id": 202, "appointment_id": 102, "customer_id": 2, "total": 450000, "created_at": "2025-10-02"},
            {"id": 203, "appointment_id": 104, "customer_id": 1, "total": 650000, "created_at": "2025-10-03"},
        ]
    )

    invoice_detail = pd.DataFrame(
        [
            {"invoice_id": 201, "service_id": 1, "quantity": 1, "unit_price": 450000},
            {"invoice_id": 201, "service_id": 2, "quantity": 1, "unit_price": 520000},
            {"invoice_id": 202, "service_id": 1, "quantity": 1, "unit_price": 450000},
            {"invoice_id": 203, "service_id": 4, "quantity": 1, "unit_price": 650000},
        ]
    )

    return DataFrames(
        appointment=appointment,
        invoice=invoice,
        invoice_detail=invoice_detail,
        customer=customer,
        service=service,
    )


def load_dataframes(force_refresh: bool = False) -> DataFrames:
    """Load data either from MySQL or the synthetic fallback cache."""
    global _DATA_CACHE
    if _DATA_CACHE is not None and not force_refresh:
        return _DATA_CACHE

    try:
        engine = get_mysql_engine()
        appointment_df = _normalise_appointment(_fetch_table(engine, "appointment"))
        invoice_df = _normalise_invoice(_fetch_table(engine, "invoice"))
        invoice_detail_df = _normalise_invoice_detail(_fetch_table(engine, "invoice_detail"))
        customer_df = _fetch_table(engine, "customer")
        service_df = _normalise_service(_fetch_table(engine, "service"))

        tables = DataFrames(
            appointment=appointment_df,
            invoice=invoice_df,
            invoice_detail=invoice_detail_df,
            customer=customer_df,
            service=service_df,
        )
    except Exception:  # noqa: BLE001 - fallback to demo data
        tables = _generate_sample_data()

    _DATA_CACHE = tables
    return tables


def export_to_json(data: Dict[str, Any], relative_path: str) -> None:
    """Persist helper output relative to the project root for demo purposes."""
    project_root = Path(__file__).resolve().parents[2]
    target = project_root / relative_path
    target.parent.mkdir(parents=True, exist_ok=True)
    with target.open("w", encoding="utf-8") as handle:
        json.dump(data, handle, ensure_ascii=False, indent=2)
