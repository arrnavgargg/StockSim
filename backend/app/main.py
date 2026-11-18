import asyncio
from contextlib import asynccontextmanager
from typing import Optional
from fastapi import FastAPI, Query, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse

from app.core.config import settings
from app.core.exceptions import StockSimException
from app.routers import auth, instruments, limit_orders, orders, paytm, portfolio, wallet, watchlist
from app.services.paytm_service import paytm_service
from app.services.paytm_websocket_client import paytm_ws_client


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure all tables exist on startup
    from app.database import Base, engine, SessionLocal
    import app.models
    Base.metadata.create_all(bind=engine)

    # 1. Start background runner to check limit order triggers
    stop_event = asyncio.Event()

    async def background_limit_checker():
        while not stop_event.is_set():
            try:
                await asyncio.sleep(4)
                with SessionLocal() as db:
                    from app.services.limit_order_service import LimitOrderService
                    service = LimitOrderService(db)
                    service.check_and_trigger_all()
            except asyncio.CancelledError:
                break
            except Exception:
                pass

    checker_task = asyncio.create_task(background_limit_checker())

    # 2. Start Paytm Money Live Broadcast background worker
    paytm_ws_client.start()

    try:
        yield
    finally:
        paytm_ws_client.stop()
        stop_event.set()
        checker_task.cancel()
        try:
            await checker_task
        except asyncio.CancelledError:
            pass


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="High-performance virtual stock trading and portfolio management backend API (Paytm Money NSE/BSE).",
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global Domain Exception Handler
@app.exception_handler(StockSimException)
async def stocksim_exception_handler(request: Request, exc: StockSimException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.message,
            "error_code": exc.error_code,
            "details": exc.details,
        },
    )


# Include Routers
app.include_router(auth.router)
app.include_router(wallet.router)
app.include_router(instruments.router)
app.include_router(paytm.router)
app.include_router(orders.router)
app.include_router(limit_orders.router)
app.include_router(watchlist.router)
app.include_router(portfolio.router)


# ------------------------------------------------------------------ #
# Paytm Money OAuth Callback Route
# ------------------------------------------------------------------ #
@app.get("/callback", tags=["Paytm Money Callback"])
async def paytm_callback(
    request_token: str = Query(..., description="Single-use request token sent by Paytm Money"),
    state: Optional[str] = Query(None, description="OAuth state tracking"),
):
    """Receive request_token from Paytm Money redirect, exchange for daily access_token."""
    try:
        data = paytm_service.exchange_request_token(request_token)
        session = paytm_service.token_store.get_session_info()
        valid_until = session.get("valid_until", "Midnight IST")
        merchant_id = session.get("merchant_id", "MER_STOCKSIM")

        html_content = f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta http-equiv="refresh" content="3;url=http://localhost:5173" />
            <title>StockSim - Paytm Money Auth Successful</title>
            <style>
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                    background-color: #0B0E14;
                    color: #F3F4F6;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    margin: 0;
                }}
                .card {{
                    background: #151A23;
                    border: 1px solid #1F2937;
                    border-radius: 12px;
                    padding: 32px 40px;
                    max-width: 480px;
                    text-align: center;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.5);
                }}
                .badge {{
                    background: #10B981;
                    color: #064E3B;
                    padding: 6px 14px;
                    font-weight: 700;
                    border-radius: 9999px;
                    font-size: 13px;
                    display: inline-block;
                    margin-bottom: 16px;
                }}
                h1 {{ font-size: 24px; margin: 0 0 12px; }}
                p {{ color: #9CA3AF; font-size: 14px; line-height: 1.5; margin: 8px 0; }}
                .meta {{
                    background: #0B0E14;
                    border-radius: 8px;
                    padding: 12px;
                    margin: 20px 0;
                    text-align: left;
                    font-size: 13px;
                }}
                .meta div {{ margin: 4px 0; display: flex; justify-content: space-between; }}
                .meta span.label {{ color: #6B7280; }}
                .btn {{
                    display: inline-block;
                    background: #2563EB;
                    color: white;
                    text-decoration: none;
                    padding: 10px 24px;
                    border-radius: 8px;
                    font-weight: 600;
                    margin-top: 12px;
                }}
            </style>
        </head>
        <body>
            <div class="card">
                <div class="badge">AUTH SUCCESSFUL</div>
                <h1>Paytm Money Connected</h1>
                <p>Your daily session token has been securely generated and saved. Live market data feeds are active.</p>
                <div class="meta">
                    <div><span class="label">Merchant ID:</span> <span>{merchant_id}</span></div>
                    <div><span class="label">Token Valid Until:</span> <span>{valid_until}</span></div>
                    <div><span class="label">Feed:</span> <span>NSE/BSE Equities</span></div>
                </div>
                <p>Redirecting back to dashboard in 3 seconds...</p>
                <a href="http://localhost:5173" class="btn">Return to StockSim</a>
            </div>
        </body>
        </html>
        """
        return HTMLResponse(content=html_content, status_code=200)
    except Exception as e:
        error_html = f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>StockSim - Auth Failed</title>
            <style>
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                    background-color: #0B0E14;
                    color: #F3F4F6;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    margin: 0;
                }}
                .card {{
                    background: #151A23;
                    border: 1px solid #7F1D1D;
                    border-radius: 12px;
                    padding: 32px 40px;
                    max-width: 480px;
                    text-align: center;
                }}
                .badge {{
                    background: #EF4444;
                    color: #FFF;
                    padding: 6px 14px;
                    font-weight: 700;
                    border-radius: 9999px;
                    font-size: 13px;
                    display: inline-block;
                    margin-bottom: 16px;
                }}
                h1 {{ font-size: 22px; margin: 0 0 12px; }}
                p {{ color: #9CA3AF; font-size: 14px; }}
                .btn {{
                    display: inline-block;
                    background: #374151;
                    color: white;
                    text-decoration: none;
                    padding: 10px 24px;
                    border-radius: 8px;
                    margin-top: 16px;
                }}
            </style>
        </head>
        <body>
            <div class="card">
                <div class="badge">AUTH ERROR</div>
                <h1>Token Exchange Failed</h1>
                <p>{str(e)}</p>
                <a href="http://localhost:5173" class="btn">Return to Dashboard</a>
            </div>
        </body>
        </html>
        """
        return HTMLResponse(content=error_html, status_code=400)


# ------------------------------------------------------------------ #
# Live WebSocket Streaming Relay for Frontend
# ------------------------------------------------------------------ #
@app.websocket("/api/ws/market-data")
@app.websocket("/api/ws/ticks")
async def websocket_market_data_endpoint(websocket: WebSocket):
    """Frontend WebSocket subscription endpoint for real-time tick streaming."""
    import json
    await websocket.accept()
    paytm_service.register_frontend_client(websocket)
    try:
        while True:
            msg = await websocket.receive_text()
            if msg == "ping":
                await websocket.send_text("pong")
                continue

            try:
                data = json.loads(msg)
                action = data.get("action")
                if action in ("subscribe", "sub"):
                    symbol = data.get("symbol")
                    sec_id = data.get("security_id") or data.get("instrument_token")
                    # Translate string ticker to Paytm numeric security_id if not supplied
                    if not sec_id and symbol:
                        from app.services.paytm_service import INDIAN_EQUITIES
                        meta = INDIAN_EQUITIES.get(symbol.upper())
                        if meta:
                            sec_id = meta["security_id"]

                    if sec_id:
                        await paytm_ws_client.subscribe_symbol(sec_id=int(sec_id), symbol=symbol)
                        await websocket.send_text(
                            json.dumps(
                                {
                                    "type": "SUBSCRIPTION_SUCCESS",
                                    "symbol": symbol,
                                    "security_id": int(sec_id),
                                    "status": "subscribed",
                                }
                            )
                        )
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        paytm_service.unregister_frontend_client(websocket)
    except Exception:
        paytm_service.unregister_frontend_client(websocket)


@app.get("/", tags=["Health"])
def root():
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs": "/docs",
        "market": "NSE/BSE (Paytm Money Open API)",
        "status": "online",
    }


@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "market": "NSE/BSE (Paytm Money Open API)",
    }
