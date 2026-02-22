from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.core.auth import get_current_user_id
from app.db import csv_store

router = APIRouter()


class EsgCreate(BaseModel):
    portfolio_id: str
    score_type: str
    value: str
    as_of_date: str


class EsgUpdate(BaseModel):
    score_type: str | None = None
    value: str | None = None
    as_of_date: str | None = None


@router.get("")
def list_esg(user_id: str = Depends(get_current_user_id)):
    return csv_store.get_by_user("portfolio_esg", user_id)


@router.post("")
def create_esg(body: EsgCreate, user_id: str = Depends(get_current_user_id)):
    portfolios = csv_store.get_by_user("portfolios", user_id)
    if not any(p.get("id") == body.portfolio_id for p in portfolios):
        raise HTTPException(status_code=404, detail="Portfolio not found")
    row = {
        "id": csv_store.generate_id(),
        "user_id": user_id,
        "portfolio_id": body.portfolio_id,
        "score_type": body.score_type,
        "value": body.value,
        "as_of_date": body.as_of_date,
    }
    csv_store.append_row("portfolio_esg", row)
    return row


@router.get("/{esg_id}")
def get_esg(esg_id: str, user_id: str = Depends(get_current_user_id)):
    rows = csv_store.get_by_user("portfolio_esg", user_id)
    for r in rows:
        if r.get("id") == esg_id:
            return r
    raise HTTPException(status_code=404, detail="ESG record not found")


@router.put("/{esg_id}")
def update_esg(esg_id: str, body: EsgUpdate, user_id: str = Depends(get_current_user_id)):
    rows = csv_store.get_by_user("portfolio_esg", user_id)
    if not any(r.get("id") == esg_id for r in rows):
        raise HTTPException(status_code=404, detail="ESG record not found")
    updates = body.model_dump(exclude_unset=True)
    if updates:
        csv_store.update_row("portfolio_esg", "id", esg_id, updates)
    return next(r for r in csv_store.get_by_user("portfolio_esg", user_id) if r.get("id") == esg_id)


@router.delete("/{esg_id}")
def delete_esg(esg_id: str, user_id: str = Depends(get_current_user_id)):
    rows = csv_store.get_by_user("portfolio_esg", user_id)
    if not any(r.get("id") == esg_id for r in rows):
        raise HTTPException(status_code=404, detail="ESG record not found")
    csv_store.delete_row("portfolio_esg", "id", esg_id)
    return None
