from sqlalchemy import Column, Integer, Numeric, String, ForeignKey
from ..database import Base

class Holding(Base):
    __tablename__ = "holdings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    symbol = Column(String, ForeignKey("instruments.symbol"), nullable=False, index=True)
    quantity = Column(Integer, nullable=False)
    average_buy_price = Column(Numeric(12, 2), nullable=False)
