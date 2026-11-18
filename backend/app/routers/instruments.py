from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.instrument import (
    HistoricalBarsResponse,
    InstrumentCreate,
    InstrumentResponse,
    PriceUpdateRequest,
    QuoteResponse,
)
from app.schemas.paytm import (
    PaytmStatusResponse,
    PaytmSyncResponse,
)
from app.services.market_data_service import MarketDataService

router = APIRouter(prefix="/api/instruments", tags=["Market Data & Instruments"])


@router.get("", response_model=List[InstrumentResponse])
def list_instruments(
    search: Optional[str] = Query(None, description="Search ticker symbol or company name"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    """List available tradeable instruments with optional ticker search."""
    service = MarketDataService(db)
    return service.list_instruments(search=search, skip=skip, limit=limit)


@router.get("/paytm/status", response_model=PaytmStatusResponse)
def get_paytm_status(
    db: Session = Depends(get_db),
):
    """Check Paytm Money API configuration, daily token authentication, and active feed."""
    service = MarketDataService(db)
    return service.get_paytm_status()


# Backward compatibility route for alpaca status
@router.get("/alpaca/status", response_model=PaytmStatusResponse, include_in_schema=False)
def get_alpaca_status_compat(db: Session = Depends(get_db)):
    service = MarketDataService(db)
    return service.get_paytm_status()


@router.post("/sync-paytm", response_model=PaytmSyncResponse)
def sync_paytm_prices(
    symbols: Optional[str] = Query(
        None, description="Comma-separated symbols to sync (e.g. 'RELIANCE,TCS'). Omit to sync all instruments."
    ),
    db: Session = Depends(get_db),
):
    """Sync instrument prices against live Paytm Money Market Data and auto-evaluate limit orders."""
    service = MarketDataService(db)
    parsed_symbols = [s.strip().upper() for s in symbols.split(",")] if symbols else None
    return service.sync_prices_from_paytm(symbols=parsed_symbols)


# Backward compatibility route for alpaca sync
@router.post("/sync-alpaca", response_model=PaytmSyncResponse, include_in_schema=False)
def sync_alpaca_prices_compat(
    symbols: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    service = MarketDataService(db)
    parsed_symbols = [s.strip().upper() for s in symbols.split(",")] if symbols else None
    return service.sync_prices_from_paytm(symbols=parsed_symbols)


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
    """Get real-time market quote using Paytm Money Open API (or simulated fallback)."""
    service = MarketDataService(db)
    return service.get_quote(symbol)


@router.get("/{symbol}/bars", response_model=HistoricalBarsResponse)
def get_instrument_bars(
    symbol: str,
    timeframe: str = Query("1Day", description="Bar timeframe: '1Min', '5Min', '1Hour', '1Day'"),
    limit: int = Query(30, ge=5, le=100, description="Number of bars to return"),
    db: Session = Depends(get_db),
):
    """Get historical candlestick OHLCV bars from Paytm Money (or simulated fallback) for charting."""
    service = MarketDataService(db)
    return service.get_historical_bars(symbol=symbol, timeframe=timeframe, limit=limit)


@router.post("/{symbol}/price", response_model=QuoteResponse)
def update_instrument_price(
    symbol: str,
    payload: PriceUpdateRequest,
    db: Session = Depends(get_db),
):
    """Update stock market price manually and evaluate/trigger any active limit orders."""
    from app.services.limit_order_service import LimitOrderService
    market_service = MarketDataService(db)
    inst = market_service.get_instrument(symbol)
    inst.current_price = payload.price
    db.commit()
    db.refresh(inst)

    # Check and trigger any limit orders across all users for this price movement
    limit_service = LimitOrderService(db)
    limit_service.check_and_trigger_all()

    return market_service.get_quote(symbol)


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
    """Seed standard Indian blue-chip stock instruments (RELIANCE, TCS, INFY, HDFCBANK, etc.)."""
    service = MarketDataService(db)
    return service.seed_default_instruments()
