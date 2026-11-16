from decimal import Decimal
from typing import List, Optional
from sqlalchemy.orm import Session

from app.core.exceptions import (
    InsufficientFundsException,
    InsufficientSharesException,
    InvalidOrderException,
    OrderNotFoundException,
)
from app.models.holding import Holding
from app.models.order import Order
from app.models.transaction import Transaction
from app.schemas.order import OrderSide
from app.services.market_data_service import MarketDataService
from app.services.wallet_service import WalletService


class TradingService:
    def __init__(self, db: Session):
        self.db = db
        self.market_service = MarketDataService(db)
        self.wallet_service = WalletService(db)

    def execute_order(
        self,
        user_id: int,
        symbol: str,
        order_type: OrderSide,
        quantity: int,
    ) -> Order:
        """Execute a market order (BUY or SELL) atomically with financial ledger consistency."""
        if quantity <= 0:
            raise InvalidOrderException("Order quantity must be a positive integer.")

        symbol_upper = symbol.strip().upper()
        instrument = self.market_service.get_instrument(symbol_upper)
        execution_price = Decimal(str(instrument.current_price))

        wallet = self.wallet_service.get_or_create_wallet(user_id)
        wallet_balance = Decimal(str(wallet.balance))

        total_value = execution_price * quantity

        try:
            if order_type == OrderSide.BUY:
                # 1. Check Cash Balance
                if wallet_balance < total_value:
                    raise InsufficientFundsException(
                        required=float(total_value),
                        available=float(wallet_balance),
                        message=f"Cannot buy {quantity} shares of {symbol_upper} at ${execution_price:,.2f} (${total_value:,.2f} total). Available balance: ${wallet_balance:,.2f}",
                    )

                # 2. Deduct Funds from Wallet
                wallet.balance = wallet_balance - total_value

                # 3. Ledger Entry (Transaction)
                tx = Transaction(
                    wallet_id=wallet.id,
                    amount=total_value,
                    transaction_type="trade",
                )
                self.db.add(tx)

                # 4. Update / Insert Holding with Weighted Average Price
                holding = (
                    self.db.query(Holding)
                    .filter(Holding.user_id == user_id, Holding.symbol == symbol_upper)
                    .first()
                )

                if holding:
                    old_qty = holding.quantity
                    old_avg = Decimal(str(holding.average_buy_price))
                    new_qty = old_qty + quantity
                    # Weighted average: ((old_qty * old_avg) + (new_qty_bought * price)) / total_qty
                    new_avg = ((Decimal(old_qty) * old_avg) + total_value) / Decimal(new_qty)
                    holding.quantity = new_qty
                    holding.average_buy_price = round(new_avg, 2)
                else:
                    holding = Holding(
                        user_id=user_id,
                        symbol=symbol_upper,
                        quantity=quantity,
                        average_buy_price=round(execution_price, 2),
                    )
                    self.db.add(holding)

            elif order_type == OrderSide.SELL:
                # 1. Check User Holdings
                holding = (
                    self.db.query(Holding)
                    .filter(Holding.user_id == user_id, Holding.symbol == symbol_upper)
                    .first()
                )

                available_qty = holding.quantity if holding else 0
                if available_qty < quantity:
                    raise InsufficientSharesException(
                        symbol=symbol_upper,
                        requested=quantity,
                        available=available_qty,
                    )

                # 2. Credit Funds to Wallet
                wallet.balance = wallet_balance + total_value

                # 3. Ledger Entry (Transaction)
                tx = Transaction(
                    wallet_id=wallet.id,
                    amount=total_value,
                    transaction_type="trade",
                )
                self.db.add(tx)

                # 4. Update / Delete Holding
                holding.quantity -= quantity
                if holding.quantity == 0:
                    self.db.delete(holding)

            # 5. Record Order
            order = Order(
                user_id=user_id,
                symbol=symbol_upper,
                order_type=order_type.value,
                quantity=quantity,
                price=execution_price,
                status="executed",
            )
            self.db.add(order)

            # Commit all atomic updates together
            self.db.commit()
            self.db.refresh(order)
            return order

        except Exception:
            self.db.rollback()
            raise

    def get_user_orders(
        self,
        user_id: int,
        symbol: Optional[str] = None,
        limit: int = 100,
    ) -> List[Order]:
        """Fetch past order execution history for user."""
        query = self.db.query(Order).filter(Order.user_id == user_id)
        if symbol:
            query = query.filter(Order.symbol == symbol.strip().upper())
        return query.order_by(Order.timestamp.desc()).limit(limit).all()

    def get_order_by_id(self, user_id: int, order_id: int) -> Order:
        """Fetch single order by ID belonging to user."""
        order = (
            self.db.query(Order)
            .filter(Order.id == order_id, Order.user_id == user_id)
            .first()
        )
        if not order:
            raise OrderNotFoundException(order_id)
        return order
