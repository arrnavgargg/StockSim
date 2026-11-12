from decimal import Decimal
from typing import List
from sqlalchemy.orm import Session

from app.models.holding import Holding
from app.models.instrument import Instrument
from app.schemas.holding import PortfolioHoldingItem
from app.schemas.portfolio import PortfolioSummary
from app.services.wallet_service import WalletService


class PortfolioService:
    def __init__(self, db: Session):
        self.db = db
        self.wallet_service = WalletService(db)

    def get_portfolio_summary(self, user_id: int) -> PortfolioSummary:
        """Compute live portfolio mark-to-market valuation, profit/loss, and asset breakdown."""
        wallet = self.wallet_service.get_or_create_wallet(user_id)
        cash_balance = Decimal(str(wallet.balance))

        # Fetch all current holdings for user
        holdings = (
            self.db.query(Holding)
            .filter(Holding.user_id == user_id, Holding.quantity > 0)
            .all()
        )

        portfolio_items: List[PortfolioHoldingItem] = []
        total_invested = Decimal("0.00")
        current_portfolio_value = Decimal("0.00")

        for h in holdings:
            inst = self.db.query(Instrument).filter(Instrument.symbol == h.symbol).first()
            current_price = Decimal(str(inst.current_price)) if inst else Decimal(str(h.average_buy_price))
            company_name = inst.company_name if inst else h.symbol

            qty = Decimal(h.quantity)
            avg_price = Decimal(str(h.average_buy_price))

            holding_cost = qty * avg_price
            holding_value = qty * current_price
            unrealized_pnl = holding_value - holding_cost

            pnl_percent = (
                (unrealized_pnl / holding_cost) * Decimal("100")
                if holding_cost > 0
                else Decimal("0.00")
            )

            total_invested += holding_cost
            current_portfolio_value += holding_value

            portfolio_items.append(
                PortfolioHoldingItem(
                    symbol=h.symbol,
                    company_name=company_name,
                    quantity=h.quantity,
                    average_buy_price=round(avg_price, 2),
                    current_price=round(current_price, 2),
                    total_invested=round(holding_cost, 2),
                    current_value=round(holding_value, 2),
                    unrealized_pnl=round(unrealized_pnl, 2),
                    unrealized_pnl_percent=round(pnl_percent, 2),
                )
            )

        total_unrealized_pnl = current_portfolio_value - total_invested
        total_return_percent = (
            (total_unrealized_pnl / total_invested) * Decimal("100")
            if total_invested > 0
            else Decimal("0.00")
        )
        net_worth = cash_balance + current_portfolio_value

        return PortfolioSummary(
            cash_balance=round(cash_balance, 2),
            total_invested=round(total_invested, 2),
            current_portfolio_value=round(current_portfolio_value, 2),
            net_worth=round(net_worth, 2),
            total_unrealized_pnl=round(total_unrealized_pnl, 2),
            total_return_percent=round(total_return_percent, 2),
            holdings=portfolio_items,
        )

    def get_user_holdings(self, user_id: int) -> List[PortfolioHoldingItem]:
        """Get list of active holdings with live metrics."""
        summary = self.get_portfolio_summary(user_id)
        return summary.holdings
