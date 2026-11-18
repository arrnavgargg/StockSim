from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel


class WatchlistItemResponse(BaseModel):
    id: int
    user_id: int
    symbol: str
    company_name: Optional[str] = None
    current_price: Optional[Decimal] = None
    created_at: datetime

    class Config:
        from_attributes = True


class WatchlistToggleResponse(BaseModel):
    symbol: str
    is_watched: bool
    message: str
