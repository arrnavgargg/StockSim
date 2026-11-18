"""Paytm Money Authentication and Management API Endpoints."""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.paytm import (
    PaytmStatusResponse,
    PaytmSyncResponse,
    PaytmTokenExchangeRequest,
    PaytmTokenExchangeResponse,
)
from app.services.market_data_service import MarketDataService
from app.services.paytm_service import paytm_service
from app.services.paytm_token_store import token_store

router = APIRouter(prefix="/api/paytm", tags=["Paytm Money Open API"])


@router.get("/login")
def initiate_paytm_login(
    redirect: bool = Query(True, description="Whether to issue an HTTP 307 redirect or return the URL in JSON"),
):
    """Initiate Paytm Money OAuth daily login flow."""
    login_url = paytm_service.get_login_url()
    if redirect:
        return RedirectResponse(url=login_url, status_code=status.HTTP_307_TEMPORARY_REDIRECT)
    return {"login_url": login_url}


@router.get("/status", response_model=PaytmStatusResponse)
def get_paytm_status(db: Session = Depends(get_db)):
    """Get Paytm Money configuration, authentication status, and active token expiration."""
    service = MarketDataService(db)
    return service.get_paytm_status()


@router.post("/exchange", response_model=PaytmTokenExchangeResponse)
def exchange_token(payload: PaytmTokenExchangeRequest):
    """Manually exchange a single-use request_token for daily access_token."""
    try:
        data = paytm_service.exchange_request_token(payload.request_token)
        session = token_store.get_session_info()
        return PaytmTokenExchangeResponse(
            status="success",
            message="Successfully generated daily Paytm Money access token.",
            merchant_id=session.get("merchant_id"),
            expires_at=session.get("valid_until"),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Token exchange failed: {str(e)}",
        )


@router.post("/logout")
def paytm_logout():
    """Clear active Paytm Money daily token session."""
    token_store.clear()
    return {"status": "success", "message": "Paytm Money session cleared."}

