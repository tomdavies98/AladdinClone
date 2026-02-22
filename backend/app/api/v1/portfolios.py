from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.core.auth import get_current_user_id
from app.db import csv_store

router = APIRouter()


class PortfolioCreate(BaseModel):
    name: str
    currency: str = "USD"


class PortfolioUpdate(BaseModel):
    name: str | None = None
    currency: str | None = None


class HoldingCreate(BaseModel):
    symbol: str
    asset_class: str
    quantity: str
    avg_cost: str


class HoldingUpdate(BaseModel):
    symbol: str | None = None
    asset_class: str | None = None
    quantity: str | None = None
    avg_cost: str | None = None


@router.get("")
def list_portfolios(user_id: str = Depends(get_current_user_id)):
    return csv_store.get_by_user("portfolios", user_id)


@router.post("")
def create_portfolio(
    body: PortfolioCreate,
    user_id: str = Depends(get_current_user_id),
):
    from datetime import datetime, timezone
    row = {
        "id": csv_store.generate_id(),
        "user_id": user_id,
        "name": body.name,
        "currency": body.currency,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    csv_store.append_row("portfolios", row)
    return row


@router.get("/{portfolio_id}")
def get_portfolio(
    portfolio_id: str,
    user_id: str = Depends(get_current_user_id),
):
    rows = csv_store.get_by_user("portfolios", user_id)
    for r in rows:
        if r.get("id") == portfolio_id:
            return r
    raise HTTPException(status_code=404, detail="Portfolio not found")


@router.put("/{portfolio_id}")
def update_portfolio(
    portfolio_id: str,
    body: PortfolioUpdate,
    user_id: str = Depends(get_current_user_id),
):
    rows = csv_store.get_by_user("portfolios", user_id)
    if not any(r.get("id") == portfolio_id for r in rows):
        raise HTTPException(status_code=404, detail="Portfolio not found")
    updates = body.model_dump(exclude_unset=True)
    if updates:
        csv_store.update_row("portfolios", "id", portfolio_id, updates)
    rows = csv_store.get_by_user("portfolios", user_id)
    return next(r for r in rows if r.get("id") == portfolio_id)


@router.delete("/{portfolio_id}")
def delete_portfolio(
    portfolio_id: str,
    user_id: str = Depends(get_current_user_id),
):
    rows = csv_store.get_by_user("portfolios", user_id)
    if not any(r.get("id") == portfolio_id for r in rows):
        raise HTTPException(status_code=404, detail="Portfolio not found")
    csv_store.delete_row("portfolios", "id", portfolio_id)
    # Delete holdings for this portfolio
    all_holdings = csv_store.get_by_user("holdings", user_id)
    for h in all_holdings:
        if h.get("portfolio_id") == portfolio_id:
            csv_store.delete_row("holdings", "id", h["id"])
    return None


@router.get("/{portfolio_id}/holdings")
def list_holdings(
    portfolio_id: str,
    user_id: str = Depends(get_current_user_id),
):
    portfolios = csv_store.get_by_user("portfolios", user_id)
    if not any(p.get("id") == portfolio_id for p in portfolios):
        raise HTTPException(status_code=404, detail="Portfolio not found")
    holdings = csv_store.get_by_user("holdings", user_id)
    return [h for h in holdings if h.get("portfolio_id") == portfolio_id]


@router.post("/{portfolio_id}/holdings")
def create_holding(
    portfolio_id: str,
    body: HoldingCreate,
    user_id: str = Depends(get_current_user_id),
):
    portfolios = csv_store.get_by_user("portfolios", user_id)
    if not any(p.get("id") == portfolio_id for p in portfolios):
        raise HTTPException(status_code=404, detail="Portfolio not found")
    row = {
        "id": csv_store.generate_id(),
        "portfolio_id": portfolio_id,
        "user_id": user_id,
        "symbol": body.symbol,
        "asset_class": body.asset_class,
        "quantity": body.quantity,
        "avg_cost": body.avg_cost,
    }
    csv_store.append_row("holdings", row)
    return row


@router.put("/{portfolio_id}/holdings/{holding_id}")
def update_holding(
    portfolio_id: str,
    holding_id: str,
    body: HoldingUpdate,
    user_id: str = Depends(get_current_user_id),
):
    holdings = csv_store.get_by_user("holdings", user_id)
    target = next((h for h in holdings if h.get("id") == holding_id and h.get("portfolio_id") == portfolio_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="Holding not found")
    updates = body.model_dump(exclude_unset=True)
    if updates:
        csv_store.update_row("holdings", "id", holding_id, updates)
    rows = csv_store.get_by_user("holdings", user_id)
    return next(r for r in rows if r.get("id") == holding_id)


@router.delete("/{portfolio_id}/holdings/{holding_id}")
def delete_holding(
    portfolio_id: str,
    holding_id: str,
    user_id: str = Depends(get_current_user_id),
):
    holdings = csv_store.get_by_user("holdings", user_id)
    if not any(h.get("id") == holding_id and h.get("portfolio_id") == portfolio_id for h in holdings):
        raise HTTPException(status_code=404, detail="Holding not found")
    csv_store.delete_row("holdings", "id", holding_id)
    return None
