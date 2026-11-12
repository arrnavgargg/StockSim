"""Custom domain exceptions for StockSim."""
from typing import Any, Optional


class StockSimException(Exception):
    """Base exception for all StockSim domain errors."""

    def __init__(
        self,
        message: str,
        status_code: int = 400,
        error_code: str = "BAD_REQUEST",
        details: Optional[Any] = None,
    ):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        self.details = details


class InsufficientFundsException(StockSimException):
    """Raised when a user attempts a trade or withdrawal without enough cash."""

    def __init__(
        self,
        required: float,
        available: float,
        message: Optional[str] = None,
    ):
        msg = message or f"Insufficient funds: required ${required:,.2f}, available ${available:,.2f}"
        super().__init__(
            message=msg,
            status_code=400,
            error_code="INSUFFICIENT_FUNDS",
            details={"required": required, "available": available},
        )


class InsufficientSharesException(StockSimException):
    """Raised when a user attempts to sell more shares than they own."""

    def __init__(
        self,
        symbol: str,
        requested: int,
        available: int,
        message: Optional[str] = None,
    ):
        msg = (
            message
            or f"Insufficient shares for {symbol}: requested to sell {requested}, but only hold {available}"
        )
        super().__init__(
            message=msg,
            status_code=400,
            error_code="INSUFFICIENT_SHARES",
            details={"symbol": symbol, "requested": requested, "available": available},
        )


class InstrumentNotFoundException(StockSimException):
    """Raised when a queried stock instrument symbol does not exist."""

    def __init__(self, symbol: str):
        super().__init__(
            message=f"Stock instrument '{symbol}' was not found in the market catalog.",
            status_code=404,
            error_code="INSTRUMENT_NOT_FOUND",
            details={"symbol": symbol},
        )


class WalletNotFoundException(StockSimException):
    """Raised when a wallet cannot be found for the specified user."""

    def __init__(self, user_id: int):
        super().__init__(
            message=f"No active wallet found for user ID {user_id}.",
            status_code=404,
            error_code="WALLET_NOT_FOUND",
            details={"user_id": user_id},
        )


class OrderNotFoundException(StockSimException):
    """Raised when an order lookup fails."""

    def __init__(self, order_id: int):
        super().__init__(
            message=f"Order ID {order_id} not found.",
            status_code=404,
            error_code="ORDER_NOT_FOUND",
            details={"order_id": order_id},
        )


class InvalidOrderException(StockSimException):
    """Raised when order parameters violate business constraints."""

    def __init__(self, reason: str):
        super().__init__(
            message=f"Invalid order: {reason}",
            status_code=400,
            error_code="INVALID_ORDER",
            details={"reason": reason},
        )


class DuplicateResourceException(StockSimException):
    """Raised when creating a resource that already exists (e.g. duplicate username/email)."""

    def __init__(self, resource: str, field: str, value: str):
        super().__init__(
            message=f"{resource} with {field} '{value}' already exists.",
            status_code=409,
            error_code="DUPLICATE_RESOURCE",
            details={"resource": resource, "field": field, "value": value},
        )
