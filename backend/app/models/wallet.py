from sqlalchemy import Column, Integer, Numeric, String, ForeignKey, func
from ..database import Base

class Wallet(Base):
    __tablename__ = "wallets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    balance = Column(Numeric(12, 2), default=0, nullable=False)
    currency = Column(String, default="USD", nullable=False)
