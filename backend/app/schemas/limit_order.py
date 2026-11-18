from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class LimitOrderSide(str, Enum):
    BUY = "buy"
    SELL = "sell"


class LimitOrderStatus(str, Enum):
    ACTIVE = "active"
    TRIGGERED = "triggered"
    CANCELLED = "cancelled"
    EXPIRED = "expired"


class LimitOrderCreate(BaseModel):
    symbol: str = Field(..., min_length=1, max_length=10, description="Stock ticker symbol")
    side: LimitOrderSide = Field(..., description="Action: 'buy' when price drops to target, 'sell' when price rises to target")
    quantity: int = Field(..., gt=0, description="Number of shares (must be a positive integer)")
    target_price: Decimal = Field(..., gt=0, description="Target price at which the order should auto-execute")


class LimitOrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    symbol: str
    side: str
    quantity: int
    target_price: Decimal
    status: str
    created_at: datetime
    triggered_at: Optional[datetime] = None
    executed_order_id: Optional[int] = None
