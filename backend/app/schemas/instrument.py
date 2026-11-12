from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, Field


class InstrumentBase(BaseModel):
    symbol: str = Field(..., min_length=1, max_length=10, description="Ticker symbol (e.g. AAPL)")
    company_name: str = Field(..., min_length=1, max_length=200, description="Company name")
    current_price: Decimal = Field(..., gt=0, description="Current market price per share")


class InstrumentCreate(InstrumentBase):
    pass


class InstrumentResponse(InstrumentBase):
    id: int

    class Config:
        from_attributes = True


class QuoteResponse(BaseModel):
    symbol: str
    company_name: str
    current_price: Decimal
    previous_close: Optional[Decimal] = None
    change: Optional[Decimal] = None
    change_percent: Optional[Decimal] = None
    day_high: Optional[Decimal] = None
    day_low: Optional[Decimal] = None
