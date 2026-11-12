from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.routers.deps import get_current_user
from app.schemas.transaction import TransactionResponse
from app.schemas.wallet import DepositRequest, WalletResponse, WithdrawRequest
from app.services.wallet_service import WalletService

router = APIRouter(prefix="/api/wallet", tags=["Wallet & Cash"])


@router.get("/me", response_model=WalletResponse)
def get_my_wallet(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve the current user's virtual cash wallet."""
    service = WalletService(db)
    return service.get_or_create_wallet(current_user.id)


@router.post("/deposit", response_model=WalletResponse)
def deposit_funds(
    payload: DepositRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Deposit simulated virtual funds into the user's wallet."""
    service = WalletService(db)
    return service.deposit(current_user.id, payload.amount)


@router.post("/withdraw", response_model=WalletResponse)
def withdraw_funds(
    payload: WithdrawRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Withdraw funds from the user's wallet."""
    service = WalletService(db)
    return service.withdraw(current_user.id, payload.amount)


@router.get("/transactions", response_model=List[TransactionResponse])
def get_wallet_transactions(
    limit: int = Query(50, ge=1, le=200, description="Number of transactions to return"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve recent wallet transaction entries (deposits, withdrawals, trades)."""
    service = WalletService(db)
    return service.get_transactions(current_user.id, limit=limit)
