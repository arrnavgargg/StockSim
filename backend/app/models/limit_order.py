from sqlalchemy import Column, Integer, String, Enum, Numeric, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship

from ..database import Base


class LimitOrder(Base):
    __tablename__ = "limit_orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    symbol = Column(String, ForeignKey("instruments.symbol"), nullable=False, index=True)
    side = Column(Enum("buy", "sell", name="limit_order_side"), nullable=False)
    quantity = Column(Integer, nullable=False)
    target_price = Column(Numeric(12, 2), nullable=False)
    status = Column(
        String, default="active", nullable=False
    )  # active, triggered, cancelled, expired
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    triggered_at = Column(DateTime(timezone=True), nullable=True)
    executed_order_id = Column(Integer, ForeignKey("orders.id"), nullable=True)

    # Relationships
    user = relationship("User", back_populates="limit_orders")
    instrument = relationship("Instrument", back_populates="limit_orders")
    executed_order = relationship("Order", foreign_keys=[executed_order_id])

    def __repr__(self) -> str:
        return (
            f"<LimitOrder(id={self.id}, user_id={self.user_id}, "
            f"{self.side.upper()} {self.quantity} {self.symbol} @ ${self.target_price}, "
            f"status='{self.status}')>"
        )
