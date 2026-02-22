from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.core.auth import get_current_user_id
from app.db import csv_store

router = APIRouter()


class ModelPortfolioCreate(BaseModel):
    name: str
    allocation_json: str = "{}"


class ModelPortfolioUpdate(BaseModel):
    name: str | None = None
    allocation_json: str | None = None


class ClientAccountCreate(BaseModel):
    model_id: str
    name: str


class ClientAccountUpdate(BaseModel):
    model_id: str | None = None
    name: str | None = None


@router.get("/models")
def list_models(user_id: str = Depends(get_current_user_id)):
    return csv_store.get_by_user("model_portfolios", user_id)


@router.post("/models")
def create_model(body: ModelPortfolioCreate, user_id: str = Depends(get_current_user_id)):
    row = {"id": csv_store.generate_id(), "user_id": user_id, "name": body.name, "allocation_json": body.allocation_json}
    csv_store.append_row("model_portfolios", row)
    return row


@router.get("/models/{model_id}")
def get_model(model_id: str, user_id: str = Depends(get_current_user_id)):
    rows = csv_store.get_by_user("model_portfolios", user_id)
    for r in rows:
        if r.get("id") == model_id:
            return r
    raise HTTPException(status_code=404, detail="Model portfolio not found")


@router.put("/models/{model_id}")
def update_model(model_id: str, body: ModelPortfolioUpdate, user_id: str = Depends(get_current_user_id)):
    rows = csv_store.get_by_user("model_portfolios", user_id)
    if not any(r.get("id") == model_id for r in rows):
        raise HTTPException(status_code=404, detail="Model portfolio not found")
    updates = body.model_dump(exclude_unset=True)
    if updates:
        csv_store.update_row("model_portfolios", "id", model_id, updates)
    return next(r for r in csv_store.get_by_user("model_portfolios", user_id) if r.get("id") == model_id)


@router.delete("/models/{model_id}")
def delete_model(model_id: str, user_id: str = Depends(get_current_user_id)):
    rows = csv_store.get_by_user("model_portfolios", user_id)
    if not any(r.get("id") == model_id for r in rows):
        raise HTTPException(status_code=404, detail="Model portfolio not found")
    csv_store.delete_row("model_portfolios", "id", model_id)
    for c in csv_store.get_by_user("client_accounts", user_id):
        if c.get("model_id") == model_id:
            csv_store.delete_row("client_accounts", "id", c["id"])
    return None


@router.get("/client-accounts")
def list_client_accounts(user_id: str = Depends(get_current_user_id)):
    return csv_store.get_by_user("client_accounts", user_id)


@router.post("/client-accounts")
def create_client_account(body: ClientAccountCreate, user_id: str = Depends(get_current_user_id)):
    models = csv_store.get_by_user("model_portfolios", user_id)
    if not any(m.get("id") == body.model_id for m in models):
        raise HTTPException(status_code=404, detail="Model portfolio not found")
    row = {"id": csv_store.generate_id(), "user_id": user_id, "model_id": body.model_id, "name": body.name}
    csv_store.append_row("client_accounts", row)
    return row


@router.get("/client-accounts/{account_id}")
def get_client_account(account_id: str, user_id: str = Depends(get_current_user_id)):
    rows = csv_store.get_by_user("client_accounts", user_id)
    for r in rows:
        if r.get("id") == account_id:
            return r
    raise HTTPException(status_code=404, detail="Client account not found")


@router.put("/client-accounts/{account_id}")
def update_client_account(account_id: str, body: ClientAccountUpdate, user_id: str = Depends(get_current_user_id)):
    rows = csv_store.get_by_user("client_accounts", user_id)
    if not any(r.get("id") == account_id for r in rows):
        raise HTTPException(status_code=404, detail="Client account not found")
    updates = body.model_dump(exclude_unset=True)
    if updates:
        csv_store.update_row("client_accounts", "id", account_id, updates)
    return next(r for r in csv_store.get_by_user("client_accounts", user_id) if r.get("id") == account_id)


@router.delete("/client-accounts/{account_id}")
def delete_client_account(account_id: str, user_id: str = Depends(get_current_user_id)):
    rows = csv_store.get_by_user("client_accounts", user_id)
    if not any(r.get("id") == account_id for r in rows):
        raise HTTPException(status_code=404, detail="Client account not found")
    csv_store.delete_row("client_accounts", "id", account_id)
    return None
