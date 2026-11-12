from sqlalchemy import Column, Integer, Numeric, String, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship

from ..database import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    wallet_id = Column(Integer, ForeignKey("wallets.id", ondelete="CASCADE"), nullable=False, index=True)
    amount = Column(Numeric(12, 2), nullable=False)
    transaction_type = Column(String, nullable=False)  # "deposit", "withdraw", "trade"
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    wallet = relationship("Wallet", back_populates="transactions")

    def __repr__(self) -> str:
        return f"<Transaction(id={self.id}, wallet_id={self.wallet_id}, type='{self.transaction_type}', amount=${self.amount})>"
