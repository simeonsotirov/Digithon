from datetime import date, datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


RunStatus = Literal["queued", "running", "completed", "failed"]
EventStatus = Literal["started", "succeeded", "failed", "skipped"]
ReorderSignal = Literal["ok", "watch", "reorder", "stockout"]


class IngestRequest(BaseModel):
    source_filename: str = Field(default="db/seed/messy_sales.csv")
    user_id: str | None = None


class IngestRun(BaseModel):
    id: str
    user_id: str
    source_filename: str
    status: RunStatus
    started_at: datetime | None = None
    completed_at: datetime | None = None
    error_message: str | None = None
    created_at: datetime


class Store(BaseModel):
    id: str
    canonical_name: str
    display_name: str
    created_at: datetime


class Event(BaseModel):
    id: str
    run_id: str
    workflow_id: str
    step_name: str
    event_type: str
    status: EventStatus
    payload: dict[str, Any]
    created_at: datetime


class NormalizedRecord(BaseModel):
    id: str
    raw_data_id: str
    run_id: str
    store_id: str
    store_name: str
    product_name: str
    quantity: int
    price: float
    sale_date: date
    normalized_payload: dict[str, Any]
    quality_notes: list[str]
    reorder_signal: ReorderSignal
    created_at: datetime


class DashboardKpis(BaseModel):
    total_raw_rows: int
    total_normalized_rows: int
    quality_issue_count: int
    reorder_count: int
    stockout_count: int


class DashboardResponse(BaseModel):
    kpis: DashboardKpis
    runs: list[IngestRun]
    stores: list[Store]
    records: list[NormalizedRecord]
    events: list[Event]
