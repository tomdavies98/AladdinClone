from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import api_router
from app.core.config import settings
from app.db import csv_store
from app.core.auth import hash_password


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings.data_dir.mkdir(parents=True, exist_ok=True)
    # Seed default user if no users exist
    users = csv_store.read_table("users")
    if not users:
        csv_store.append_row("users", {
            "id": csv_store.generate_id(),
            "username": "demo",
            "password_hash": hash_password("demo"),
            "display_name": "Demo User",
        })
    yield


app = FastAPI(
    title="Aladdin Clone API",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(api_router)
