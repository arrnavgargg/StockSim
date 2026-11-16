from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.instrument import (
    InstrumentCreate,
    InstrumentResponse,
    QuoteResponse,
)
from app.services.market_data_service import MarketDataService

router = APIRouter(prefix="/api/instruments", tags=["Market Data & Instruments"])


@router.get("", response_model=List[InstrumentResponse])
def list_instruments(
    search: Optional[str] = Query(None, description="Search ticker symbol or company name"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """List available tradeable instruments with optional ticker search."""
    service = MarketDataService(db)
    return service.list_instruments(search=search, skip=skip, limit=limit)


@router.get("/{symbol}", response_model=InstrumentResponse)
def get_instrument_detail(
    symbol: str,
    db: Session = Depends(get_db),
):
    """Get stock instrument metadata and current price by symbol."""
    service = MarketDataService(db)
    return service.get_instrument(symbol)


@router.get("/{symbol}/quote", response_model=QuoteResponse)
def get_instrument_quote(
    symbol: str,
    db: Session = Depends(get_db),
):
    """Get real-time market quote including day change and intraday range."""
    service = MarketDataService(db)
    return service.get_quote(symbol)


@router.post("", response_model=InstrumentResponse, status_code=status.HTTP_201_CREATED)
def create_instrument(
    payload: InstrumentCreate,
    db: Session = Depends(get_db),
):
    """Add a new tradeable stock instrument to the catalog."""
    service = MarketDataService(db)
    return service.create_or_update_instrument(
        symbol=payload.symbol,
        company_name=payload.company_name,
        price=payload.current_price,
    )


@router.post("/seed", response_model=List[InstrumentResponse])
def seed_market_instruments(
    db: Session = Depends(get_db),
):
    """Seed standard blue-chip stock instruments (AAPL, MSFT, GOOGL, TSLA, NVDA, etc.)."""
    service = MarketDataService(db)
    return service.seed_default_instruments()
