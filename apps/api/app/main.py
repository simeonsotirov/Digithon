from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import anyio
import uvicorn

from app import db
from app.routes import router


log = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await anyio.to_thread.run_sync(db.ping)
        log.info("Startup: database connection OK")
    except Exception as exc:
        log.error("Startup: database connection FAILED — %s", exc)
        log.error("Set DATABASE_URL and ensure Postgres is running (docker compose up -d)")
    yield


app = FastAPI(title="Digithon API", version="0.1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(router)


def run() -> None:
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)


if __name__ == "__main__":
    run()
