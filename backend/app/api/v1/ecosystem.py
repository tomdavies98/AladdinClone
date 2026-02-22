from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.core.auth import get_current_user_id
from app.db import csv_store

router = APIRouter()


class IntegrationCreate(BaseModel):
    provider: str
    integration_type: str = "custodian"
    status: str = "active"
    config_json: str = "{}"


class IntegrationUpdate(BaseModel):
    provider: str | None = None
    integration_type: str | None = None
    status: str | None = None
    config_json: str | None = None


@router.get("/integrations")
def list_integrations(user_id: str = Depends(get_current_user_id)):
    return csv_store.get_by_user("integrations", user_id)


@router.post("/integrations")
def create_integration(body: IntegrationCreate, user_id: str = Depends(get_current_user_id)):
    row = {
        "id": csv_store.generate_id(),
        "user_id": user_id,
        "provider": body.provider,
        "integration_type": body.integration_type,
        "status": body.status,
        "config_json": body.config_json,
    }
    csv_store.append_row("integrations", row)
    return row


@router.get("/integrations/{integration_id}")
def get_integration(integration_id: str, user_id: str = Depends(get_current_user_id)):
    rows = csv_store.get_by_user("integrations", user_id)
    for r in rows:
        if r.get("id") == integration_id:
            return r
    raise HTTPException(status_code=404, detail="Integration not found")


@router.put("/integrations/{integration_id}")
def update_integration(integration_id: str, body: IntegrationUpdate, user_id: str = Depends(get_current_user_id)):
    rows = csv_store.get_by_user("integrations", user_id)
    if not any(r.get("id") == integration_id for r in rows):
        raise HTTPException(status_code=404, detail="Integration not found")
    updates = body.model_dump(exclude_unset=True)
    if updates:
        csv_store.update_row("integrations", "id", integration_id, updates)
    return next(r for r in csv_store.get_by_user("integrations", user_id) if r.get("id") == integration_id)


@router.delete("/integrations/{integration_id}")
def delete_integration(integration_id: str, user_id: str = Depends(get_current_user_id)):
    rows = csv_store.get_by_user("integrations", user_id)
    if not any(r.get("id") == integration_id for r in rows):
        raise HTTPException(status_code=404, detail="Integration not found")
    csv_store.delete_row("integrations", "id", integration_id)
    return None
