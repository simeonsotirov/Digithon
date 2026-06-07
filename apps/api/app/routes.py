import logging
from uuid import uuid4

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse


from app import db
from app.schemas import DashboardResponse, Event, HealthResponse, IngestRequest, IngestRun


log = logging.getLogger(__name__)

router = APIRouter()


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


@router.get("/dashboard", response_model=DashboardResponse)
def dashboard() -> dict:
    kpis = db.row(
        """
        select
          (select count(*) from raw_data)::int as total_raw_rows,
          (select count(*) from normalized_data)::int as total_normalized_rows,
          (select count(*) from normalized_data where jsonb_array_length(quality_notes) > 0)::int as quality_issue_count,
          (select count(*) from normalized_data where reorder_signal = 'reorder')::int as reorder_count,
          (select count(*) from normalized_data where reorder_signal = 'stockout')::int as stockout_count
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
    return {"kpis": kpis, "runs": runs, "stores": stores, "records": records, "events": events}
