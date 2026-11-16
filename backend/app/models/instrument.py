from sqlalchemy import Column, Integer, String, Numeric
from sqlalchemy.orm import relationship

from ..database import Base


class Instrument(Base):
    __tablename__ = "instruments"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, unique=True, index=True, nullable=False)
    company_name = Column(String, nullable=False)
    current_price = Column(Numeric(12, 2), nullable=False)

    # Relationships
    orders = relationship("Order", back_populates="instrument")
    holdings = relationship("Holding", back_populates="instrument")

    def __repr__(self) -> str:
        return f"<Instrument(symbol='{self.symbol}', company='{self.company_name}', price=${self.current_price})>"
