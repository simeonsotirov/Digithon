import logging
from datetime import date
from uuid import uuid4

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse


from app import db
from app.schemas import (
    CalendarEvent,
    DashboardResponse,
    Event,
    IngestRequest,
    HealthResponse,
    IngestRun,
    InventoryPrediction,
)


log = logging.getLogger(__name__)

router = APIRouter()

ALLOWED_SEEDED_SOURCES = {"db/seed/messy_sales.csv"}


def _demo_user_id() -> str:
    user = db.row("select id from users order by created_at asc limit 1")
    if not user:
        raise HTTPException(status_code=500, detail="No user found. Run db/migrations/001_init.sql.")
    return str(user["id"])


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    try:
        db.ping()
        return HealthResponse(status="ok", db="ok")
    except Exception as exc:
        log.error("Health check: database unreachable — %s", exc)
        body = HealthResponse(status="degraded", db="error", detail=str(exc))
        return JSONResponse(status_code=503, content=body.model_dump())


@router.post("/ingest", response_model=IngestRun)
def create_ingest(request: IngestRequest) -> dict:
    if request.source_filename not in ALLOWED_SEEDED_SOURCES:
        raise HTTPException(status_code=400, detail="Unsupported ingest source")

    run_id = str(uuid4())
    user_id = request.user_id or _demo_user_id()
    created = db.row(
        """
        insert into ingest_runs (id, user_id, source_filename, status)
        values (%s, %s, %s, 'queued')
        returning *
        """,
        (run_id, user_id, request.source_filename),
    )
    if not created:
        raise HTTPException(status_code=500, detail="Failed to create ingest run")
    return created


@router.get("/runs", response_model=list[IngestRun])
def list_runs() -> list[dict]:
    return db.rows("select * from ingest_runs order by created_at desc limit 25")


@router.get("/runs/{run_id}", response_model=IngestRun)
def get_run(run_id: str) -> dict:
    run = db.row("select * from ingest_runs where id = %s", (run_id,))
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return run


@router.get("/events", response_model=list[Event])
def list_events(run_id: str | None = Query(default=None)) -> list[dict]:
    if run_id:
        return db.rows("select * from events where run_id = %s order by created_at asc", (run_id,))
    return db.rows("select * from events order by created_at desc limit 100")


@router.get("/calendar-events", response_model=list[CalendarEvent])
def list_calendar_events(
    from_date: date | None = Query(default=None),
    to_date: date | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=100),
) -> list[dict]:
    return db.rows(
        """
        select *
        from calendar_events
        where starts_on >= coalesce(%s::date, current_date)
          and (%s::date is null or starts_on <= %s::date)
        order by starts_on asc, impact_score desc, event_name asc
        limit %s
        """,
        (from_date, to_date, to_date, limit),
    )


@router.get("/predictions", response_model=list[InventoryPrediction])
def list_predictions(
    run_id: str | None = Query(default=None),
    store_id: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=100),
) -> list[dict]:
    return db.rows(
        """
        select p.*, s.display_name as store_name, c.event_name
        from inventory_predictions p
        join stores s on s.id = p.store_id
        join calendar_events c on c.id = p.calendar_event_id
        where (%s::uuid is null or p.run_id = %s::uuid)
          and (%s::uuid is null or p.store_id = %s::uuid)
        order by p.recommended_reorder_quantity desc, p.created_at desc
        limit %s
        """,
        (run_id, run_id, store_id, store_id, limit),
    )


@router.get("/dashboard", response_model=DashboardResponse)
def dashboard() -> dict:
    kpis = db.row(
        """
        select
          (select count(*) from raw_data)::int as total_raw_rows,
          (select count(*) from normalized_data)::int as total_normalized_rows,
          (select count(*) from normalized_data where jsonb_array_length(quality_notes) > 0)::int as quality_issue_count,
          (select count(*) from normalized_data where reorder_signal = 'reorder')::int as reorder_count,
          (select count(*) from normalized_data where reorder_signal = 'stockout')::int as stockout_count,
          (select count(*) from inventory_predictions)::int as prediction_count,
          coalesce((select sum(recommended_reorder_quantity) from inventory_predictions), 0)::int as recommended_reorder_quantity_total
        """
    )
    runs = db.rows("select * from ingest_runs order by created_at desc limit 10")
    stores = db.rows("select * from stores order by display_name asc")
    records = db.rows(
        """
        select n.*, s.display_name as store_name
        from normalized_data n
        join stores s on s.id = n.store_id
        order by n.created_at desc
        limit 100
        """
    )
    events = db.rows("select * from events order by created_at desc limit 100")
    upcoming_events = db.rows(
        """
        select *
        from calendar_events
        where starts_on >= current_date
        order by starts_on asc, impact_score desc, event_name asc
        limit 25
        """
    )
    predictions = db.rows(
        """
        select p.*, s.display_name as store_name, c.event_name
        from inventory_predictions p
        join stores s on s.id = p.store_id
        join calendar_events c on c.id = p.calendar_event_id
        order by p.recommended_reorder_quantity desc, p.created_at desc
        limit 50
        """
    )
    return {
        "kpis": kpis,
        "runs": runs,
        "stores": stores,
        "records": records,
        "upcoming_events": upcoming_events,
        "predictions": predictions,
        "events": events,
    }
