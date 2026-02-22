from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.core.auth import get_current_user_id
from app.db import csv_store

router = APIRouter()


class FundCreate(BaseModel):
    name: str
    strategy: str = ""
    vintage_year: str = ""


class FundUpdate(BaseModel):
    name: str | None = None
    strategy: str | None = None
    vintage_year: str | None = None


class CommitmentCreate(BaseModel):
    fund_id: str
    amount: str
    currency: str = "USD"
    date: str


class CommitmentUpdate(BaseModel):
    amount: str | None = None
    currency: str | None = None
    date: str | None = None


@router.get("/funds")
def list_funds(user_id: str = Depends(get_current_user_id)):
    return csv_store.get_by_user("funds", user_id)


@router.post("/funds")
def create_fund(body: FundCreate, user_id: str = Depends(get_current_user_id)):
    row = {"id": csv_store.generate_id(), "user_id": user_id, "name": body.name, "strategy": body.strategy, "vintage_year": body.vintage_year}
    csv_store.append_row("funds", row)
    return row


@router.get("/funds/{fund_id}")
def get_fund(fund_id: str, user_id: str = Depends(get_current_user_id)):
    rows = csv_store.get_by_user("funds", user_id)
    for r in rows:
        if r.get("id") == fund_id:
            return r
    raise HTTPException(status_code=404, detail="Fund not found")


@router.put("/funds/{fund_id}")
def update_fund(fund_id: str, body: FundUpdate, user_id: str = Depends(get_current_user_id)):
    rows = csv_store.get_by_user("funds", user_id)
    if not any(r.get("id") == fund_id for r in rows):
        raise HTTPException(status_code=404, detail="Fund not found")
    updates = body.model_dump(exclude_unset=True)
    if updates:
        csv_store.update_row("funds", "id", fund_id, updates)
    return next(r for r in csv_store.get_by_user("funds", user_id) if r.get("id") == fund_id)


@router.delete("/funds/{fund_id}")
def delete_fund(fund_id: str, user_id: str = Depends(get_current_user_id)):
    rows = csv_store.get_by_user("funds", user_id)
    if not any(r.get("id") == fund_id for r in rows):
        raise HTTPException(status_code=404, detail="Fund not found")
    csv_store.delete_row("funds", "id", fund_id)
    for c in csv_store.get_by_user("commitments", user_id):
        if c.get("fund_id") == fund_id:
            csv_store.delete_row("commitments", "id", c["id"])
    return None


@router.get("/funds/{fund_id}/commitments")
def list_commitments(fund_id: str, user_id: str = Depends(get_current_user_id)):
    funds = csv_store.get_by_user("funds", user_id)
    if not any(f.get("id") == fund_id for f in funds):
        raise HTTPException(status_code=404, detail="Fund not found")
    commitments = csv_store.get_by_user("commitments", user_id)
    return [c for c in commitments if c.get("fund_id") == fund_id]


@router.post("/commitments")
def create_commitment(body: CommitmentCreate, user_id: str = Depends(get_current_user_id)):
    funds = csv_store.get_by_user("funds", user_id)
    if not any(f.get("id") == body.fund_id for f in funds):
        raise HTTPException(status_code=404, detail="Fund not found")
    row = {"id": csv_store.generate_id(), "user_id": user_id, "fund_id": body.fund_id, "amount": body.amount, "currency": body.currency, "date": body.date}
    csv_store.append_row("commitments", row)
    return row


@router.put("/commitments/{commitment_id}")
def update_commitment(commitment_id: str, body: CommitmentUpdate, user_id: str = Depends(get_current_user_id)):
    rows = csv_store.get_by_user("commitments", user_id)
    if not any(r.get("id") == commitment_id for r in rows):
        raise HTTPException(status_code=404, detail="Commitment not found")
    updates = body.model_dump(exclude_unset=True)
    if updates:
        csv_store.update_row("commitments", "id", commitment_id, updates)
    return next(r for r in csv_store.get_by_user("commitments", user_id) if r.get("id") == commitment_id)


@router.delete("/commitments/{commitment_id}")
def delete_commitment(commitment_id: str, user_id: str = Depends(get_current_user_id)):
    rows = csv_store.get_by_user("commitments", user_id)
    if not any(r.get("id") == commitment_id for r in rows):
        raise HTTPException(status_code=404, detail="Commitment not found")
    csv_store.delete_row("commitments", "id", commitment_id)
    return None
