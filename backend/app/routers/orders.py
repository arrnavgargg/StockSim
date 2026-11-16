from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.routers.deps import get_current_user
from app.schemas.order import OrderCreate, OrderResponse
from app.services.trading_service import TradingService

router = APIRouter(prefix="/api/orders", tags=["Trading & Orders"])


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def place_order(
    payload: OrderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Place and atomically execute a market order (BUY or SELL)."""
    service = TradingService(db)
    order = service.execute_order(
        user_id=current_user.id,
        symbol=payload.symbol,
        order_type=payload.order_type,
        quantity=payload.quantity,
    )
    return order


@router.get("", response_model=List[OrderResponse])
def get_order_history(
    symbol: Optional[str] = Query(None, description="Filter orders by stock ticker symbol"),
    limit: int = Query(100, ge=1, le=500, description="Max number of orders to return"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve execution history of user's trade orders."""
    service = TradingService(db)
    return service.get_user_orders(user_id=current_user.id, symbol=symbol, limit=limit)


@router.get("/{order_id}", response_model=OrderResponse)
def get_order_details(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve details of a specific executed order."""
    service = TradingService(db)
    return service.get_order_by_id(user_id=current_user.id, order_id=order_id)
