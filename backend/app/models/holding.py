from sqlalchemy import Column, Integer, Numeric, String, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship

from ..database import Base


class Holding(Base):
    __tablename__ = "holdings"
    __table_args__ = (
        UniqueConstraint("user_id", "symbol", name="uq_user_symbol"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    symbol = Column(String, ForeignKey("instruments.symbol"), nullable=False, index=True)
    quantity = Column(Integer, nullable=False)
    average_buy_price = Column(Numeric(12, 2), nullable=False)

    # Relationships
    user = relationship("User", back_populates="holdings")
    instrument = relationship("Instrument", back_populates="holdings")

    @property
    def total_cost_basis(self) -> float:
        return float(self.average_buy_price) * self.quantity

    def __repr__(self) -> str:
        return f"<Holding(id={self.id}, user_id={self.user_id}, {self.quantity} shares of {self.symbol} @ avg ${self.average_buy_price})>"
