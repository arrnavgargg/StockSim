from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.routers.deps import get_current_user
from app.schemas.watchlist import WatchlistItemResponse, WatchlistToggleResponse
from app.services.watchlist_service import WatchlistService

router = APIRouter(prefix="/api/watchlist", tags=["Watchlist"])


@router.get("", response_model=List[WatchlistItemResponse])
def get_user_watchlist(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Fetch user's saved watchlist of stocks."""
    service = WatchlistService(db)
    return service.get_user_watchlist(current_user.id)


@router.get("/symbols", response_model=List[str])
def get_watched_symbols(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Fetch array of ticker symbols saved in the user's watchlist."""
    service = WatchlistService(db)
    return service.get_watched_symbols(current_user.id)


@router.post("/{symbol}/toggle", response_model=WatchlistToggleResponse)
def toggle_stock_watchlist(
    symbol: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Toggle star / watchlist status for a stock instrument."""
    service = WatchlistService(db)
    return service.toggle_watchlist(current_user.id, symbol)


@router.post("/{symbol}", response_model=WatchlistItemResponse, status_code=status.HTTP_201_CREATED)
def add_to_watchlist(
    symbol: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Add a stock instrument to the user's saved watchlist."""
    service = WatchlistService(db)
    item = service.add_to_watchlist(current_user.id, symbol)
    items = service.get_user_watchlist(current_user.id)
    return next((i for i in items if i.symbol == item.symbol), items[0])


@router.delete("/{symbol}")
def remove_from_watchlist(
    symbol: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Remove a stock instrument from the user's watchlist."""
    service = WatchlistService(db)
    removed = service.remove_from_watchlist(current_user.id, symbol)
    return {"symbol": symbol.upper(), "removed": removed}
