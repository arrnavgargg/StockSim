from sqlalchemy import Column, Integer, String, Enum, Numeric, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship

from ..database import Base


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    symbol = Column(String, ForeignKey("instruments.symbol"), nullable=False, index=True)
    order_type = Column(Enum("buy", "sell", name="order_type"), nullable=False)
    quantity = Column(Integer, nullable=False)
    price = Column(Numeric(12, 2), nullable=False)
    status = Column(String, default="executed", nullable=False)  # pending, executed, cancelled, rejected
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="orders")
    instrument = relationship("Instrument", back_populates="orders")

    @property
    def total_value(self) -> float:
        return float(self.price) * self.quantity

    def __repr__(self) -> str:
        return f"<Order(id={self.id}, user_id={self.user_id}, {self.order_type.upper()} {self.quantity} {self.symbol} @ ${self.price}, status='{self.status}')>"
