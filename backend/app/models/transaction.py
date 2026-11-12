from sqlalchemy import Column, Integer, Numeric, String, ForeignKey, DateTime, func
from ..database import Base

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    wallet_id = Column(Integer, ForeignKey("wallets.id", ondelete="CASCADE"), nullable=False, index=True)
    amount = Column(Numeric(12, 2), nullable=False)
    transaction_type = Column(String, nullable=False)  # "deposit", "withdraw", "trade"
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
