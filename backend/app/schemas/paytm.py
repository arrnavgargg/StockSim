from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class PaytmStatusResponse(BaseModel):
    configured: bool = Field(..., description="Whether Paytm API credentials are set")
    authenticated: bool = Field(..., description="Whether a valid daily access token exists")
    merchant_id: Optional[str] = Field(None, description="Paytm merchant identifier")
    token_valid_until: Optional[str] = Field(None, description="ISO timestamp until daily token expires (midnight IST)")
    feed: str = Field("NSE/BSE", description="Active exchange feed")
    login_url: str = Field(..., description="OAuth login URL to generate request_token")
    message: str = Field(..., description="Status summary message")


class PaytmSyncResponse(BaseModel):
    synced_count: int = Field(..., description="Number of instruments synced")
    updated_instruments: List[str] = Field(..., description="List of updated symbols")
    source: str = Field("paytm", description="Data source used")
    timestamp: datetime = Field(..., description="Sync timestamp")


class PaytmTokenExchangeRequest(BaseModel):
    request_token: str = Field(..., min_length=1, description="Single-use request token from Paytm redirect")


class PaytmTokenExchangeResponse(BaseModel):
    status: str
    message: str
    merchant_id: Optional[str] = None
    expires_at: Optional[str] = None

