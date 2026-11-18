from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict


class TransactionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    wallet_id: int
    amount: Decimal
    transaction_type: str
    timestamp: datetime
