from typing import List, Set
from sqlalchemy.orm import Session

from app.core.exceptions import InstrumentNotFoundException
from app.models.instrument import Instrument
from app.models.watchlist import WatchlistItem
from app.schemas.watchlist import WatchlistItemResponse, WatchlistToggleResponse


class WatchlistService:
    def __init__(self, db: Session):
        self.db = db

    def _get_instrument(self, symbol: str) -> Instrument:
        symbol_upper = symbol.strip().upper()
        inst = self.db.query(Instrument).filter(Instrument.symbol == symbol_upper).first()
        if not inst:
            raise InstrumentNotFoundException(symbol_upper)
        return inst

    def get_user_watchlist(self, user_id: int) -> List[WatchlistItemResponse]:
        """Fetch all stocks saved to the user's watchlist with live price metadata."""
        items = (
            self.db.query(WatchlistItem)
            .filter(WatchlistItem.user_id == user_id)
            .order_by(WatchlistItem.created_at.desc())
            .all()
        )

        result: List[WatchlistItemResponse] = []
        for item in items:
            inst = self.db.query(Instrument).filter(Instrument.symbol == item.symbol).first()
            result.append(
                WatchlistItemResponse(
                    id=item.id,
                    user_id=item.user_id,
                    symbol=item.symbol,
                    company_name=inst.company_name if inst else item.symbol,
                    current_price=inst.current_price if inst else None,
                    created_at=item.created_at,
                )
            )
        return result

    def get_watched_symbols(self, user_id: int) -> List[str]:
        """Return simple list of ticker symbols saved by the user."""
        items = (
            self.db.query(WatchlistItem.symbol)
            .filter(WatchlistItem.user_id == user_id)
            .all()
        )
        return [item[0] for item in items]

    def add_to_watchlist(self, user_id: int, symbol: str) -> WatchlistItem:
        """Add stock to user's watchlist."""
        inst = self._get_instrument(symbol)
        existing = (
            self.db.query(WatchlistItem)
            .filter(WatchlistItem.user_id == user_id, WatchlistItem.symbol == inst.symbol)
            .first()
        )
        if existing:
            return existing

        item = WatchlistItem(user_id=user_id, symbol=inst.symbol)
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item

    def remove_from_watchlist(self, user_id: int, symbol: str) -> bool:
        """Remove stock from user's watchlist."""
        symbol_upper = symbol.strip().upper()
        existing = (
            self.db.query(WatchlistItem)
            .filter(WatchlistItem.user_id == user_id, WatchlistItem.symbol == symbol_upper)
            .first()
        )
        if existing:
            self.db.delete(existing)
            self.db.commit()
            return True
        return False

    def toggle_watchlist(self, user_id: int, symbol: str) -> WatchlistToggleResponse:
        """Toggle star/watchlist status for a stock."""
        inst = self._get_instrument(symbol)
        existing = (
            self.db.query(WatchlistItem)
            .filter(WatchlistItem.user_id == user_id, WatchlistItem.symbol == inst.symbol)
            .first()
        )

        if existing:
            self.db.delete(existing)
            self.db.commit()
            return WatchlistToggleResponse(
                symbol=inst.symbol,
                is_watched=False,
                message=f"Removed {inst.symbol} from your watchlist.",
            )
        else:
            item = WatchlistItem(user_id=user_id, symbol=inst.symbol)
            self.db.add(item)
            self.db.commit()
            return WatchlistToggleResponse(
                symbol=inst.symbol,
                is_watched=True,
                message=f"Added {inst.symbol} to your watchlist.",
            )
