from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.routers.deps import get_current_user
from app.schemas.limit_order import LimitOrderCreate, LimitOrderResponse
from app.services.limit_order_service import LimitOrderService

router = APIRouter(prefix="/api/limit-orders", tags=["Limit Orders (Auto-Trade)"])


@router.post("", response_model=LimitOrderResponse, status_code=status.HTTP_201_CREATED)
def create_limit_order(
    payload: LimitOrderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a price-triggered limit order.

    - **BUY limit**: auto-buys when market price drops to or below target_price.
    - **SELL limit**: auto-sells when market price rises to or above target_price.

    If the trigger condition is already met at the current market price, the order
    executes immediately.
    """
    service = LimitOrderService(db)
    return service.create_limit_order(
        user_id=current_user.id,
        symbol=payload.symbol,
        side=payload.side,
        quantity=payload.quantity,
        target_price=payload.target_price,
    )


@router.get("", response_model=List[LimitOrderResponse])
def list_limit_orders(
    status_filter: Optional[str] = Query(
        None,
        alias="status",
        description="Filter by status: active, triggered, cancelled",
    ),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all of the authenticated user's limit orders, optionally filtered by status."""
    service = LimitOrderService(db)
    return service.get_user_limit_orders(user_id=current_user.id, status=status_filter)


@router.get("/{limit_order_id}", response_model=LimitOrderResponse)
def get_limit_order(
    limit_order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get details of a specific limit order."""
    service = LimitOrderService(db)
    return service.get_limit_order_by_id(user_id=current_user.id, limit_order_id=limit_order_id)


@router.post("/{limit_order_id}/cancel", response_model=LimitOrderResponse)
def cancel_limit_order(
    limit_order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Cancel an active limit order. Only 'active' orders can be cancelled."""
    service = LimitOrderService(db)
    return service.cancel_limit_order(user_id=current_user.id, limit_order_id=limit_order_id)


@router.post("/check-triggers", response_model=List[LimitOrderResponse])
def manually_check_triggers(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Manually trigger the price-matching engine to scan and execute any limit
    orders whose target prices are now met by the current market prices.

    In production this runs automatically on a background timer.
    """
    service = LimitOrderService(db)
    return service.check_and_trigger_all()
