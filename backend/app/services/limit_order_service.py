"""Limit Order Service — creates, monitors, and auto-executes price-triggered orders."""
import logging
from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional

from sqlalchemy.orm import Session

from app.core.exceptions import (
    InstrumentNotFoundException,
    InvalidOrderException,
    StockSimException,
)
from app.models.holding import Holding
from app.models.instrument import Instrument
from app.models.limit_order import LimitOrder
from app.schemas.limit_order import LimitOrderSide
from app.services.market_data_service import MarketDataService
from app.services.trading_service import TradingService
from app.schemas.order import OrderSide

logger = logging.getLogger(__name__)


class LimitOrderService:
    def __init__(self, db: Session):
        self.db = db
        self.market_service = MarketDataService(db)
        self.trading_service = TradingService(db)

    # ------------------------------------------------------------------ #
    #  CRUD
    # ------------------------------------------------------------------ #

    def create_limit_order(
        self,
        user_id: int,
        symbol: str,
        side: LimitOrderSide,
        quantity: int,
        target_price: Decimal,
    ) -> LimitOrder:
        """Create a new limit order that will auto-trigger when the market price
        crosses the target price threshold.

        Rules:
        - BUY limit: triggers when market price <= target_price
          ("I want to buy if it drops to $50")
        - SELL limit: triggers when market price >= target_price
          ("I want to sell if it rises to $80")
        """
        if quantity <= 0:
            raise InvalidOrderException("Quantity must be a positive integer.")
        if target_price <= 0:
            raise InvalidOrderException("Target price must be greater than zero.")

        symbol_upper = symbol.strip().upper()

        # Validate instrument exists
        self.market_service.get_instrument(symbol_upper)

        # For SELL limits — user must already own enough shares
        if side == LimitOrderSide.SELL:
            holding = (
                self.db.query(Holding)
                .filter(Holding.user_id == user_id, Holding.symbol == symbol_upper)
                .first()
            )
            owned = holding.quantity if holding else 0
            # Sum existing active sell limits for same symbol
            active_sell_reserved = (
                self.db.query(LimitOrder)
                .filter(
                    LimitOrder.user_id == user_id,
                    LimitOrder.symbol == symbol_upper,
                    LimitOrder.side == "sell",
                    LimitOrder.status == "active",
                )
                .all()
            )
            reserved_qty = sum(lo.quantity for lo in active_sell_reserved)
            if owned - reserved_qty < quantity:
                raise InvalidOrderException(
                    f"Cannot create sell limit: you own {owned} shares of {symbol_upper}, "
                    f"{reserved_qty} already reserved by active sell limits, "
                    f"only {max(0, owned - reserved_qty)} available."
                )

        limit_order = LimitOrder(
            user_id=user_id,
            symbol=symbol_upper,
            side=side.value,
            quantity=quantity,
            target_price=target_price,
            status="active",
        )
        self.db.add(limit_order)
        self.db.commit()
        self.db.refresh(limit_order)

        # Immediately check if it should trigger right now
        self._try_trigger_single(limit_order)

        return limit_order

    def get_user_limit_orders(
        self,
        user_id: int,
        status: Optional[str] = None,
    ) -> List[LimitOrder]:
        """List all limit orders for a user, optionally filtered by status."""
        query = self.db.query(LimitOrder).filter(LimitOrder.user_id == user_id)
        if status:
            query = query.filter(LimitOrder.status == status.lower())
        return query.order_by(LimitOrder.created_at.desc()).all()

    def get_limit_order_by_id(self, user_id: int, limit_order_id: int) -> LimitOrder:
        lo = (
            self.db.query(LimitOrder)
            .filter(LimitOrder.id == limit_order_id, LimitOrder.user_id == user_id)
            .first()
        )
        if not lo:
            raise StockSimException(
                message=f"Limit order #{limit_order_id} not found.",
                status_code=404,
                error_code="LIMIT_ORDER_NOT_FOUND",
            )
        return lo

    def cancel_limit_order(self, user_id: int, limit_order_id: int) -> LimitOrder:
        """Cancel an active limit order."""
        lo = self.get_limit_order_by_id(user_id, limit_order_id)
        if lo.status != "active":
            raise InvalidOrderException(
                f"Cannot cancel limit order #{limit_order_id}: "
                f"current status is '{lo.status}' (only 'active' orders can be cancelled)."
            )
        lo.status = "cancelled"
        self.db.commit()
        self.db.refresh(lo)
        return lo

    # ------------------------------------------------------------------ #
    #  Price-matching engine
    # ------------------------------------------------------------------ #

    def check_and_trigger_all(self) -> List[LimitOrder]:
        """Scan ALL active limit orders and execute any whose trigger condition
        is now satisfied at current market prices.

        Called periodically by the background price checker.
        Returns the list of limit orders that were triggered in this run.
        """
        active_orders = (
            self.db.query(LimitOrder)
            .filter(LimitOrder.status == "active")
            .all()
        )

        triggered: List[LimitOrder] = []
        for lo in active_orders:
            was_triggered = self._try_trigger_single(lo)
            if was_triggered:
                triggered.append(lo)

        return triggered

    def _try_trigger_single(self, lo: LimitOrder) -> bool:
        """Check whether a single limit order's trigger condition is met and
        execute it if so. Returns True if the order was triggered."""
        if lo.status != "active":
            return False

        try:
            instrument = self.market_service.get_instrument(lo.symbol)
        except InstrumentNotFoundException:
            return False

        current_price = Decimal(str(instrument.current_price))
        target = Decimal(str(lo.target_price))

        should_trigger = False
        if lo.side == "buy" and current_price <= target:
            should_trigger = True
        elif lo.side == "sell" and current_price >= target:
            should_trigger = True

        if not should_trigger:
            return False

        # Execute the trade via the existing trading service
        try:
            order_side = OrderSide.BUY if lo.side == "buy" else OrderSide.SELL
            executed_order = self.trading_service.execute_order(
                user_id=lo.user_id,
                symbol=lo.symbol,
                order_type=order_side,
                quantity=lo.quantity,
            )

            lo.status = "triggered"
            lo.triggered_at = datetime.now(timezone.utc)
            lo.executed_order_id = executed_order.id
            self.db.commit()
            self.db.refresh(lo)

            logger.info(
                "Limit order #%d TRIGGERED: %s %d %s @ $%s (market $%s)",
                lo.id, lo.side.upper(), lo.quantity, lo.symbol,
                lo.target_price, current_price,
            )
            return True

        except StockSimException as exc:
            logger.warning(
                "Limit order #%d trigger failed: %s", lo.id, exc.message
            )
            return False
