from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict


class WatchlistItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    symbol: str
    company_name: Optional[str] = None
    current_price: Optional[Decimal] = None
    security_id: Optional[int] = None
    created_at: datetime


class WatchlistToggleResponse(BaseModel):
    symbol: str
    is_watched: bool
    message: str
