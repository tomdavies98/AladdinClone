from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.core.auth import get_current_user_id
from app.db import csv_store

router = APIRouter()


class AccountCreate(BaseModel):
    name: str
    account_type: str = "general"
    currency: str = "USD"


class AccountUpdate(BaseModel):
    name: str | None = None
    account_type: str | None = None
    currency: str | None = None


class TransactionCreate(BaseModel):
    account_id: str
    type: str  # e.g. buy, sell, dividend, fee
    amount: str
    date: str
    description: str = ""


class TransactionUpdate(BaseModel):
    type: str | None = None
    amount: str | None = None
    date: str | None = None
    description: str | None = None


@router.get("/accounts")
def list_accounts(user_id: str = Depends(get_current_user_id)):
    return csv_store.get_by_user("accounts", user_id)


@router.post("/accounts")
def create_account(
    body: AccountCreate,
    user_id: str = Depends(get_current_user_id),
):
    row = {
        "id": csv_store.generate_id(),
        "user_id": user_id,
        "name": body.name,
        "account_type": body.account_type,
        "currency": body.currency,
    }
    csv_store.append_row("accounts", row)
    return row


@router.get("/accounts/{account_id}")
def get_account(
    account_id: str,
    user_id: str = Depends(get_current_user_id),
):
    rows = csv_store.get_by_user("accounts", user_id)
    for r in rows:
        if r.get("id") == account_id:
            return r
    raise HTTPException(status_code=404, detail="Account not found")


@router.put("/accounts/{account_id}")
def update_account(
    account_id: str,
    body: AccountUpdate,
    user_id: str = Depends(get_current_user_id),
):
    rows = csv_store.get_by_user("accounts", user_id)
    if not any(r.get("id") == account_id for r in rows):
        raise HTTPException(status_code=404, detail="Account not found")
    updates = body.model_dump(exclude_unset=True)
    if updates:
        csv_store.update_row("accounts", "id", account_id, updates)
    rows = csv_store.get_by_user("accounts", user_id)
    return next(r for r in rows if r.get("id") == account_id)


@router.delete("/accounts/{account_id}")
def delete_account(
    account_id: str,
    user_id: str = Depends(get_current_user_id),
):
    rows = csv_store.get_by_user("accounts", user_id)
    if not any(r.get("id") == account_id for r in rows):
        raise HTTPException(status_code=404, detail="Account not found")
    csv_store.delete_row("accounts", "id", account_id)
    transactions = csv_store.get_by_user("transactions", user_id)
    for t in transactions:
        if t.get("account_id") == account_id:
            csv_store.delete_row("transactions", "id", t["id"])
    return None


@router.get("/accounts/{account_id}/transactions")
def list_transactions(
    account_id: str,
    user_id: str = Depends(get_current_user_id),
):
    accounts = csv_store.get_by_user("accounts", user_id)
    if not any(a.get("id") == account_id for a in accounts):
        raise HTTPException(status_code=404, detail="Account not found")
    transactions = csv_store.get_by_user("transactions", user_id)
    return [t for t in transactions if t.get("account_id") == account_id]


@router.post("/transactions")
def create_transaction(
    body: TransactionCreate,
    user_id: str = Depends(get_current_user_id),
):
    accounts = csv_store.get_by_user("accounts", user_id)
    if not any(a.get("id") == body.account_id for a in accounts):
        raise HTTPException(status_code=404, detail="Account not found")
    row = {
        "id": csv_store.generate_id(),
        "user_id": user_id,
        "account_id": body.account_id,
        "type": body.type,
        "amount": body.amount,
        "date": body.date,
        "description": body.description,
    }
    csv_store.append_row("transactions", row)
    return row


@router.put("/transactions/{transaction_id}")
def update_transaction(
    transaction_id: str,
    body: TransactionUpdate,
    user_id: str = Depends(get_current_user_id),
):
    rows = csv_store.get_by_user("transactions", user_id)
    if not any(r.get("id") == transaction_id for r in rows):
        raise HTTPException(status_code=404, detail="Transaction not found")
    updates = body.model_dump(exclude_unset=True)
    if updates:
        csv_store.update_row("transactions", "id", transaction_id, updates)
    return next(r for r in csv_store.get_by_user("transactions", user_id) if r.get("id") == transaction_id)


@router.delete("/transactions/{transaction_id}")
def delete_transaction(
    transaction_id: str,
    user_id: str = Depends(get_current_user_id),
):
    rows = csv_store.get_by_user("transactions", user_id)
    if not any(r.get("id") == transaction_id for r in rows):
        raise HTTPException(status_code=404, detail="Transaction not found")
    csv_store.delete_row("transactions", "id", transaction_id)
    return None
