from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.routers.deps import get_current_user
from app.schemas.holding import PortfolioHoldingItem
from app.schemas.portfolio import PortfolioSummary
from app.services.portfolio_service import PortfolioService

router = APIRouter(prefix="/api/portfolio", tags=["Portfolio & Performance"])


@router.get("/summary", response_model=PortfolioSummary)
def get_portfolio_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve full portfolio metrics, cash balance, and mark-to-market performance."""
    service = PortfolioService(db)
    return service.get_portfolio_summary(current_user.id)


@router.get("/holdings", response_model=List[PortfolioHoldingItem])
def get_portfolio_holdings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve active stock holdings with purchase price, market price, and unrealized return."""
    service = PortfolioService(db)
    return service.get_user_holdings(current_user.id)
