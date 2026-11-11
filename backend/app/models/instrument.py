from sqlalchemy import Column, Integer, String, Numeric
from ..database import Base

class Instrument(Base):
    __tablename__ = "instruments"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, unique=True, index=True, nullable=False)
    company_name = Column(String, nullable=False)
    current_price = Column(Numeric(12, 2), nullable=False)
