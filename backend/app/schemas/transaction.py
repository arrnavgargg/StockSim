from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel


class TransactionResponse(BaseModel):
    id: int
    wallet_id: int
    amount: Decimal
    transaction_type: str
    timestamp: datetime

    class Config:
        from_attributes = True
