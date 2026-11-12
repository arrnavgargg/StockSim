from decimal import Decimal
from typing import Optional
from pydantic import BaseModel


class HoldingResponse(BaseModel):
    id: int
    user_id: int
    symbol: str
    quantity: int
    average_buy_price: Decimal

    class Config:
        from_attributes = True


class PortfolioHoldingItem(BaseModel):
    symbol: str
    company_name: str
    quantity: int
    average_buy_price: Decimal
    current_price: Decimal
    total_invested: Decimal
    current_value: Decimal
    unrealized_pnl: Decimal
    unrealized_pnl_percent: Decimal
