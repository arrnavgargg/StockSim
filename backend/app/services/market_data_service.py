from decimal import Decimal
from typing import List, Optional
from sqlalchemy.orm import Session

from app.core.exceptions import InstrumentNotFoundException
from app.models.instrument import Instrument
from app.schemas.instrument import QuoteResponse


DEFAULT_INSTRUMENTS = [
    {"symbol": "AAPL", "company_name": "Apple Inc.", "current_price": Decimal("182.50")},
    {"symbol": "MSFT", "company_name": "Microsoft Corporation", "current_price": Decimal("415.20")},
    {"symbol": "GOOGL", "company_name": "Alphabet Inc.", "current_price": Decimal("175.80")},
    {"symbol": "AMZN", "company_name": "Amazon.com Inc.", "current_price": Decimal("185.30")},
    {"symbol": "TSLA", "company_name": "Tesla Inc.", "current_price": Decimal("248.90")},
    {"symbol": "NVDA", "company_name": "NVIDIA Corporation", "current_price": Decimal("128.40")},
    {"symbol": "META", "company_name": "Meta Platforms Inc.", "current_price": Decimal("505.60")},
    {"symbol": "NFLX", "company_name": "Netflix Inc.", "current_price": Decimal("640.10")},
    {"symbol": "JPM", "company_name": "JPMorgan Chase & Co.", "current_price": Decimal("198.75")},
    {"symbol": "V", "company_name": "Visa Inc.", "current_price": Decimal("274.60")},
]


class MarketDataService:
    def __init__(self, db: Session):
        self.db = db

    def get_instrument(self, symbol: str) -> Instrument:
        """Fetch instrument by ticker symbol (case-insensitive) or raise 404."""
        inst = self.db.query(Instrument).filter(Instrument.symbol == symbol.upper()).first()
        if not inst:
            raise InstrumentNotFoundException(symbol.upper())
        return inst

    def list_instruments(
        self, search: Optional[str] = None, skip: int = 0, limit: int = 50
    ) -> List[Instrument]:
        """List instruments with optional search by symbol or company name."""
        query = self.db.query(Instrument)
        if search:
            search_pattern = f"%{search.strip()}%"
            query = query.filter(
                (Instrument.symbol.ilike(search_pattern))
                | (Instrument.company_name.ilike(search_pattern))
            )
        return query.order_by(Instrument.symbol).offset(skip).limit(limit).all()

    def get_quote(self, symbol: str) -> QuoteResponse:
        """Get live/simulated market quote for a stock."""
        inst = self.get_instrument(symbol)
        price = Decimal(str(inst.current_price))

        # Simulated intraday stats for rich frontend UI display
        prev_close = round(price * Decimal("0.985"), 2)
        change = round(price - prev_close, 2)
        change_pct = round((change / prev_close) * Decimal("100"), 2)
        day_high = round(price * Decimal("1.015"), 2)
        day_low = round(price * Decimal("0.980"), 2)

        return QuoteResponse(
            symbol=inst.symbol,
            company_name=inst.company_name,
            current_price=price,
            previous_close=prev_close,
            change=change,
            change_percent=change_pct,
            day_high=day_high,
            day_low=day_low,
        )

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
        """Seed a standard portfolio of blue-chip stock instruments."""
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
            seeded.append(inst)
        self.db.commit()
        return seeded
