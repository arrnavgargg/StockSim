from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field


class WalletResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    balance: Decimal = Field(..., description="Available cash balance")
    currency: str = "INR"


class DepositRequest(BaseModel):
    amount: Decimal = Field(..., gt=0, le=1000000, description="Amount to deposit into wallet (positive)")


class WithdrawRequest(BaseModel):
    amount: Decimal = Field(..., gt=0, description="Amount to withdraw from wallet (positive)")
