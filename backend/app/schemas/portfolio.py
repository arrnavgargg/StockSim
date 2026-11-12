from decimal import Decimal
from typing import List
from pydantic import BaseModel
from .holding import PortfolioHoldingItem


class PortfolioSummary(BaseModel):
    cash_balance: Decimal
    total_invested: Decimal
    current_portfolio_value: Decimal
    net_worth: Decimal
    total_unrealized_pnl: Decimal
    total_return_percent: Decimal
    holdings: List[PortfolioHoldingItem]
