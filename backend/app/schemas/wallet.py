from decimal import Decimal
from pydantic import BaseModel, Field


class WalletResponse(BaseModel):
    id: int
    user_id: int
    balance: Decimal = Field(..., description="Available cash balance")
    currency: str = "USD"

    class Config:
        from_attributes = True


class DepositRequest(BaseModel):
    amount: Decimal = Field(..., gt=0, le=1000000, description="Amount to deposit into wallet (positive)")


class WithdrawRequest(BaseModel):
    amount: Decimal = Field(..., gt=0, description="Amount to withdraw from wallet (positive)")
