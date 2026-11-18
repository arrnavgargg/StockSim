from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field

from app.schemas.paytm import PaytmStatusResponse, PaytmSyncResponse


class InstrumentBase(BaseModel):
    symbol: str = Field(..., min_length=1, max_length=10, description="Ticker symbol (e.g. RELIANCE, TCS)")
    company_name: str = Field(..., min_length=1, max_length=200, description="Company name")
    current_price: Decimal = Field(..., gt=0, description="Current market price per share")


class InstrumentCreate(InstrumentBase):
    pass


class InstrumentResponse(InstrumentBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    security_id: Optional[int] = None


class PriceUpdateRequest(BaseModel):
    price: Decimal = Field(..., gt=0, description="New market price per share")


class QuoteResponse(BaseModel):
    symbol: str
    company_name: str
    current_price: Decimal
    previous_close: Optional[Decimal] = None
    change: Optional[Decimal] = None
    change_percent: Optional[Decimal] = None
    day_high: Optional[Decimal] = None
    day_low: Optional[Decimal] = None
    bid_price: Optional[Decimal] = None
    ask_price: Optional[Decimal] = None
    volume: Optional[int] = None
    security_id: Optional[int] = None
    exchange: str = "NSE"
    currency: str = "INR"
    source: str = "simulated"  # "paytm", "paytm_ws", or "simulated"
    updated_at: Optional[datetime] = None


class BarItem(BaseModel):
    t: str = Field(..., description="Timestamp ISO string")
    o: Decimal = Field(..., description="Open price")
    h: Decimal = Field(..., description="High price")
    l: Decimal = Field(..., description="Low price")
    c: Decimal = Field(..., description="Close price")
    v: int = Field(0, description="Volume")


class HistoricalBarsResponse(BaseModel):
    symbol: str
    timeframe: str
    source: str
    bars: List[BarItem]


# Backward compatibility aliases
AlpacaStatusResponse = PaytmStatusResponse
AlpacaSyncResponse = PaytmSyncResponse
