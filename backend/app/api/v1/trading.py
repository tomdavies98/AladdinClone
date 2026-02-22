from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from datetime import datetime, timezone
from app.core.auth import get_current_user_id
from app.db import csv_store

router = APIRouter()


class OrderCreate(BaseModel):
    portfolio_id: str
    symbol: str
    side: str  # BUY / SELL
    quantity: str
    order_type: str = "MARKET"


class OrderUpdate(BaseModel):
    status: str | None = None


@router.get("/orders")
def list_orders(
    portfolio_id: str | None = None,
    user_id: str = Depends(get_current_user_id),
):
    rows = csv_store.get_by_user("orders", user_id)
    if portfolio_id:
        rows = [r for r in rows if r.get("portfolio_id") == portfolio_id]
    return rows


@router.post("/orders")
def create_order(
    body: OrderCreate,
    user_id: str = Depends(get_current_user_id),
):
    row = {
        "id": csv_store.generate_id(),
        "user_id": user_id,
        "portfolio_id": body.portfolio_id,
        "symbol": body.symbol,
        "side": body.side,
        "quantity": body.quantity,
        "order_type": body.order_type,
        "status": "NEW",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    csv_store.append_row("orders", row)
    return row


@router.get("/orders/{order_id}")
def get_order(
    order_id: str,
    user_id: str = Depends(get_current_user_id),
):
    rows = csv_store.get_by_user("orders", user_id)
    for r in rows:
        if r.get("id") == order_id:
            return r
    raise HTTPException(status_code=404, detail="Order not found")


@router.put("/orders/{order_id}")
def update_order(
    order_id: str,
    body: OrderUpdate,
    user_id: str = Depends(get_current_user_id),
):
    rows = csv_store.get_by_user("orders", user_id)
    if not any(r.get("id") == order_id for r in rows):
        raise HTTPException(status_code=404, detail="Order not found")
    updates = body.model_dump(exclude_unset=True)
    if updates:
        csv_store.update_row("orders", "id", order_id, updates)
    rows = csv_store.get_by_user("orders", user_id)
    return next(r for r in rows if r.get("id") == order_id)


@router.delete("/orders/{order_id}")
def delete_order(
    order_id: str,
    user_id: str = Depends(get_current_user_id),
):
    rows = csv_store.get_by_user("orders", user_id)
    if not any(r.get("id") == order_id for r in rows):
        raise HTTPException(status_code=404, detail="Order not found")
    csv_store.delete_row("orders", "id", order_id)
    return None
