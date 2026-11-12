from decimal import Decimal
from typing import List
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import InsufficientFundsException, WalletNotFoundException
from app.models.wallet import Wallet
from app.models.transaction import Transaction


class WalletService:
    def __init__(self, db: Session):
        self.db = db

    def get_or_create_wallet(self, user_id: int) -> Wallet:
        """Retrieve user's wallet or provision one with default virtual balance."""
        wallet = self.db.query(Wallet).filter(Wallet.user_id == user_id).first()
        if not wallet:
            starting_balance = Decimal(str(settings.STARTING_WALLET_BALANCE))
            wallet = Wallet(
                user_id=user_id,
                balance=starting_balance,
                currency=settings.STARTING_WALLET_CURRENCY,
            )
            self.db.add(wallet)
            self.db.commit()
            self.db.refresh(wallet)

            # Record initial starter capital transaction
            initial_tx = Transaction(
                wallet_id=wallet.id,
                amount=starting_balance,
                transaction_type="deposit",
            )
            self.db.add(initial_tx)
            self.db.commit()
            self.db.refresh(wallet)

        return wallet

    def get_wallet(self, user_id: int) -> Wallet:
        """Get wallet for user or raise 404."""
        wallet = self.db.query(Wallet).filter(Wallet.user_id == user_id).first()
        if not wallet:
            return self.get_or_create_wallet(user_id)
        return wallet

    def deposit(self, user_id: int, amount: Decimal) -> Wallet:
        """Deposit funds into wallet and record transaction."""
        if amount <= 0:
            raise ValueError("Deposit amount must be positive.")

        wallet = self.get_or_create_wallet(user_id)
        wallet.balance = Decimal(str(wallet.balance)) + amount

        tx = Transaction(
            wallet_id=wallet.id,
            amount=amount,
            transaction_type="deposit",
        )
        self.db.add(tx)
        self.db.commit()
        self.db.refresh(wallet)
        return wallet

    def withdraw(self, user_id: int, amount: Decimal) -> Wallet:
        """Withdraw funds from wallet if sufficient balance exists."""
        if amount <= 0:
            raise ValueError("Withdrawal amount must be positive.")

        wallet = self.get_or_create_wallet(user_id)
        current_balance = Decimal(str(wallet.balance))

        if current_balance < amount:
            raise InsufficientFundsException(
                required=float(amount),
                available=float(current_balance),
                message=f"Cannot withdraw ${amount:,.2f}: available balance is only ${current_balance:,.2f}",
            )

        wallet.balance = current_balance - amount
        tx = Transaction(
            wallet_id=wallet.id,
            amount=amount,
            transaction_type="withdraw",
        )
        self.db.add(tx)
        self.db.commit()
        self.db.refresh(wallet)
        return wallet

    def get_transactions(self, user_id: int, limit: int = 50) -> List[Transaction]:
        """Fetch transaction history for user's wallet."""
        wallet = self.get_or_create_wallet(user_id)
        return (
            self.db.query(Transaction)
            .filter(Transaction.wallet_id == wallet.id)
            .order_by(Transaction.timestamp.desc())
            .limit(limit)
            .all()
        )
