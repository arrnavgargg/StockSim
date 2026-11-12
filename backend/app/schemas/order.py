from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class OrderSide(str, Enum):
    BUY = "buy"
    SELL = "sell"


class OrderStatus(str, Enum):
    PENDING = "pending"
    EXECUTED = "executed"
    CANCELLED = "cancelled"
    REJECTED = "rejected"


class OrderCreate(BaseModel):
    symbol: str = Field(..., min_length=1, max_length=10, description="Stock ticker symbol")
    order_type: OrderSide = Field(..., description="Action: 'buy' or 'sell'")
    quantity: int = Field(..., gt=0, description="Number of shares (must be a positive integer)")


class OrderResponse(BaseModel):
    id: int
    user_id: int
    symbol: str
    order_type: str
    quantity: int
    price: Decimal
    total_value: Optional[Decimal] = None
    status: str
    timestamp: datetime

    class Config:
        from_attributes = True
