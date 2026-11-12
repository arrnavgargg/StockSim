from sqlalchemy import Column, Integer, String, Enum, Numeric, ForeignKey, DateTime, func
from ..database import Base

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    symbol = Column(String, ForeignKey("instruments.symbol"), nullable=False, index=True)
    order_type = Column(Enum("buy", "sell", name="order_type"), nullable=False)
    quantity = Column(Integer, nullable=False)
    price = Column(Numeric(12, 2), nullable=False)
    status = Column(String, default="pending", nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
