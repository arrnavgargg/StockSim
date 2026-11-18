from datetime import datetime, timezone, timedelta
from decimal import Decimal
import math
import random
from typing import List, Optional
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import InstrumentNotFoundException
from app.models.instrument import Instrument
from app.schemas.instrument import (
    BarItem,
    HistoricalBarsResponse,
    QuoteResponse,
)
from app.schemas.paytm import (
    PaytmStatusResponse,
    PaytmSyncResponse,
)
from app.services.paytm_service import INDIAN_EQUITIES, paytm_service
from app.services.paytm_token_store import token_store
from app.services.scrip_master_service import scrip_master


DEFAULT_INSTRUMENTS = [
    # Top Indian Blue-Chips (Paytm Money NSE/BSE) with accurate market baselines
    {"symbol": "RELIANCE", "company_name": "Reliance Industries Ltd.", "current_price": Decimal("1363.00")},
    {"symbol": "TCS", "company_name": "Tata Consultancy Services Ltd.", "current_price": Decimal("2380.00")},
    {"symbol": "INFY", "company_name": "Infosys Ltd.", "current_price": Decimal("1108.80")},
    {"symbol": "HDFCBANK", "company_name": "HDFC Bank Ltd.", "current_price": Decimal("808.15")},
    {"symbol": "ICICIBANK", "company_name": "ICICI Bank Ltd.", "current_price": Decimal("1602.80")},
    {"symbol": "TATAMOTORS", "company_name": "Tata Motors Ltd.", "current_price": Decimal("443.80")},
    {"symbol": "SBIN", "company_name": "State Bank of India", "current_price": Decimal("1135.00")},
    {"symbol": "BHARTIARTL", "company_name": "Bharti Airtel Ltd.", "current_price": Decimal("2132.00")},
    {"symbol": "ITC", "company_name": "ITC Ltd.", "current_price": Decimal("296.60")},
    {"symbol": "LT", "company_name": "Larsen & Toubro Ltd.", "current_price": Decimal("4159.00")},
]

# US symbols that must be purged from the database when seeding
_US_SYMBOLS_TO_REMOVE = {"AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "NVDA", "META", "NFLX"}


class MarketDataService:
    def __init__(self, db: Session):
        self.db = db
        self.paytm = paytm_service

    def get_instrument(self, symbol: str) -> Instrument:
        """Fetch instrument by ticker symbol (case-insensitive) or auto-seed from Scrip Master."""
        sym_upper = symbol.strip().upper()
        inst = self.db.query(Instrument).filter(Instrument.symbol == sym_upper).first()
        if not inst:
            # Check on-demand against 3,000+ NSE stocks in Scrip Master
            master_item = scrip_master.get_by_symbol(sym_upper)
            if master_item:
                inst = Instrument(
                    symbol=master_item["symbol"],
                    company_name=master_item["name"],
                    current_price=master_item["price"],
                )
                self.db.add(inst)
                self.db.commit()
                self.db.refresh(inst)
            else:
                raise InstrumentNotFoundException(sym_upper)

        meta = INDIAN_EQUITIES.get(inst.symbol.upper())
        inst.security_id = meta["security_id"] if meta else None
        return inst

    def list_instruments(
        self, search: Optional[str] = None, skip: int = 0, limit: int = 50
    ) -> List[Instrument]:
        """List instruments with optional search across database and on-demand NSE Scrip Master."""
        if search and search.strip():
            query_str = search.strip().upper()

            # 1. On-demand search matching 3,000+ NSE stocks in Scrip Master and ingest matches
            master_matches = scrip_master.search(query_str, limit=limit)
            for m in master_matches:
                existing = self.db.query(Instrument).filter(Instrument.symbol == m["symbol"]).first()
                if not existing:
                    new_inst = Instrument(
                        symbol=m["symbol"],
                        company_name=m["name"],
                        current_price=m["price"],
                    )
                    self.db.add(new_inst)
            if master_matches:
                self.db.commit()

            # 2. Query DB matching symbol or company name
            search_pattern = f"%{search.strip()}%"
            query = self.db.query(Instrument).filter(
                (Instrument.symbol.ilike(search_pattern))
                | (Instrument.company_name.ilike(search_pattern))
            )
            instruments = query.all()

            # Sort: exact symbol first, then prefix, then name/contains
            instruments.sort(
                key=lambda x: (
                    0 if x.symbol.upper() == query_str else
                    1 if x.symbol.upper().startswith(query_str) else
                    2 if query_str in x.symbol.upper() else 3,
                    x.symbol,
                )
            )
            instruments = instruments[skip : skip + limit]
        else:
            instruments = (
                self.db.query(Instrument)
                .order_by(Instrument.symbol)
                .offset(skip)
                .limit(limit)
                .all()
            )

        for inst in instruments:
            meta = INDIAN_EQUITIES.get(inst.symbol.upper())
            inst.security_id = meta["security_id"] if meta else None
        return instruments

    def get_quote(self, symbol: str) -> QuoteResponse:
        """Get real-time market quote using Paytm Money Open API if active, or realistic simulation fallback."""
        inst = self.get_instrument(symbol)
        sym = inst.symbol

        # 1. Attempt live snapshot from Paytm Money REST
        if self.paytm.is_authenticated:
            snap = self.paytm.get_live_quote(sym)
            if snap:
                # Update DB price so orders and portfolios use live NSE/BSE market value
                if inst.current_price != snap["current_price"]:
                    inst.current_price = snap["current_price"]
                    self.db.commit()

                return QuoteResponse(
                    symbol=sym,
                    company_name=inst.company_name,
                    current_price=snap["current_price"],
                    previous_close=snap.get("previous_close"),
                    change=snap.get("change"),
                    change_percent=snap.get("change_percent"),
                    day_high=snap.get("day_high"),
                    day_low=snap.get("day_low"),
                    bid_price=round(snap["current_price"] * Decimal("0.9995"), 2),
                    ask_price=round(snap["current_price"] * Decimal("1.0005"), 2),
                    volume=snap.get("volume", 1500000),
                    security_id=INDIAN_EQUITIES.get(sym, {}).get("security_id"),
                    exchange="NSE",
                    currency="INR",
                    source="paytm",
                    updated_at=datetime.now(timezone.utc),
                )

        # 2. Simulation engine for Indian equities
        price = Decimal(str(inst.current_price))
        prev_close = round(price * Decimal("0.992"), 2)
        change = round(price - prev_close, 2)
        change_pct = round((change / prev_close) * Decimal("100"), 2) if prev_close > 0 else Decimal("0.00")
        day_high = round(price * Decimal("1.012"), 2)
        day_low = round(price * Decimal("0.988"), 2)

        return QuoteResponse(
            symbol=sym,
            company_name=inst.company_name,
            current_price=price,
            previous_close=prev_close,
            change=change,
            change_percent=change_pct,
            day_high=day_high,
            day_low=day_low,
            bid_price=round(price * Decimal("0.9995"), 2),
            ask_price=round(price * Decimal("1.0005"), 2),
            volume=1845000,
            security_id=INDIAN_EQUITIES.get(sym, {}).get("security_id"),
            exchange="NSE",
            currency="INR",
            source="simulated",
            updated_at=datetime.now(timezone.utc),
        )

    def get_historical_bars(
        self, symbol: str, timeframe: str = "1Day", limit: int = 30
    ) -> HistoricalBarsResponse:
        """Fetch historical candlestick bars from Paytm Money or generate realistic NSE bars."""
        inst = self.get_instrument(symbol)
        sym = inst.symbol

        bars_data = self.paytm.get_historical_bars(sym, timeframe=timeframe, limit=limit)
        bars = [
            BarItem(
                t=str(b["t"]),
                o=b["o"],
                h=b["h"],
                l=b["l"],
                c=b["c"],
                v=b["v"],
            )
            for b in bars_data
        ]
        source = "paytm" if self.paytm.is_authenticated else "simulated"
        return HistoricalBarsResponse(
            symbol=sym,
            timeframe=timeframe,
            source=source,
            bars=bars,
        )

    def sync_prices_from_paytm(self, symbols: Optional[List[str]] = None) -> PaytmSyncResponse:
        """Batch-sync instrument prices with Paytm Money Market Data (or realistic seed rates)."""
        query = self.db.query(Instrument)
        if symbols:
            query = query.filter(Instrument.symbol.in_([s.upper() for s in symbols]))
        instruments = query.all()

        updated_symbols = []
        source = "paytm" if self.paytm.is_authenticated else "simulated"

        for inst in instruments:
            quote = None
            if self.paytm.is_authenticated:
                quote = self.paytm.get_live_quote(inst.symbol)

            if quote and quote.get("current_price"):
                inst.current_price = quote["current_price"]
                updated_symbols.append(inst.symbol)
            else:
                # Slight micro-jitter around baseline
                meta = INDIAN_EQUITIES.get(inst.symbol)
                base = meta["price"] if meta else inst.current_price
                jitter = Decimal(str(random.choice([-0.005, -0.002, 0.001, 0.003, 0.006])))
                inst.current_price = round(base * (Decimal("1.0") + jitter), 2)
                updated_symbols.append(inst.symbol)

        self.db.commit()

        # Trigger limit order engine for updated prices
        from app.services.limit_order_service import LimitOrderService
        LimitOrderService(self.db).check_and_trigger_all()

        return PaytmSyncResponse(
            synced_count=len(updated_symbols),
            updated_instruments=updated_symbols,
            source=source,
            timestamp=datetime.now(timezone.utc),
        )

    # Backward compatibility alias
    def sync_prices_from_alpaca(self, symbols: Optional[List[str]] = None) -> PaytmSyncResponse:
        return self.sync_prices_from_paytm(symbols=symbols)

    def get_paytm_status(self) -> PaytmStatusResponse:
        """Get Paytm Money Open API configuration and daily token status."""
        session = token_store.get_session_info()
        configured = self.paytm.is_configured
        authenticated = session["is_valid"]
        valid_until = session.get("valid_until")
        merchant_id = session.get("merchant_id")
        login_url = self.paytm.get_login_url()

        if not configured:
            message = "Paytm Money API credentials not configured in backend/.env. Running in simulated NSE/BSE mode."
        elif not authenticated:
            message = "Paytm Money credentials configured. Daily login required to obtain access token."
        else:
            message = f"Connected to Paytm Money Open API (NSE/BSE). Daily token valid until {valid_until} IST."

        return PaytmStatusResponse(
            configured=configured,
            authenticated=authenticated,
            merchant_id=merchant_id,
            token_valid_until=valid_until,
            feed="NSE/BSE",
            login_url=login_url,
            message=message,
        )

    # Backward compatibility alias
    def get_alpaca_status(self) -> PaytmStatusResponse:
        return self.get_paytm_status()

    def create_or_update_instrument(
        self, symbol: str, company_name: str, price: Decimal
    ) -> Instrument:
        """Create new instrument or update current price."""
        symbol_upper = symbol.strip().upper()
        inst = self.db.query(Instrument).filter(Instrument.symbol == symbol_upper).first()
        if inst:
            inst.company_name = company_name
            inst.current_price = price
        else:
            inst = Instrument(symbol=symbol_upper, company_name=company_name, current_price=price)
            self.db.add(inst)
        self.db.commit()
        self.db.refresh(inst)
        return inst

    def seed_default_instruments(self) -> List[Instrument]:
        """Seed a standard portfolio of top Indian blue-chip stocks (NSE).

        Also removes any legacy US stock instruments (AAPL, MSFT, etc.)
        that were seeded in earlier versions of the app.
        """
        # 1. Remove legacy US stocks that no longer belong in an Indian market app
        self.db.query(Instrument).filter(
            Instrument.symbol.in_(_US_SYMBOLS_TO_REMOVE)
        ).delete(synchronize_session="fetch")

        # 2. Upsert the Indian blue-chip instruments
        seeded = []
        for item in DEFAULT_INSTRUMENTS:
            inst = self.db.query(Instrument).filter(Instrument.symbol == item["symbol"]).first()
            if not inst:
                inst = Instrument(
                    symbol=item["symbol"],
                    company_name=item["company_name"],
                    current_price=item["current_price"],
                )
                self.db.add(inst)
            else:
                inst.company_name = item["company_name"]
                inst.current_price = item["current_price"]
            seeded.append(inst)
        self.db.commit()
        return seeded
