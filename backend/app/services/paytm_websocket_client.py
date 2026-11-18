"""Paytm Money Live Broadcast WebSocket Client.

Connects to `wss://developer-ws.paytmmoney.com/broadcast/user/v1/data` using the daily
public_access_token. Subscribes to NSE/BSE preferences, parses incoming binary/JSON tick
packets, updates database instrument prices, evaluates limit orders, and relays ticks
to connected frontend WebSocket clients.
"""
import asyncio
from decimal import Decimal
import json
import logging
import random
from typing import Optional
import websockets

from app.core.config import settings
from app.database import SessionLocal
from app.models.instrument import Instrument
from app.services.paytm_service import INDIAN_EQUITIES, paytm_service
from app.services.paytm_token_store import token_store

logger = logging.getLogger(__name__)


class PaytmWebSocketClient:
    def __init__(self):
        self._running = False
        self._task: Optional[asyncio.Task] = None
        self._live_ws = None

    def start(self) -> None:
        """Start background broadcast worker."""
        if self._running:
            return
        self._running = True
        try:
            loop = asyncio.get_running_loop()
            self._task = loop.create_task(self._run_loop())
            logger.info("Paytm Money WebSocket broadcast worker started.")
        except RuntimeError:
            logger.info("No running event loop; Paytm WebSocket worker start deferred.")

    def stop(self) -> None:
        """Stop background broadcast worker."""
        self._running = False
        if self._task and not self._task.done():
            self._task.cancel()
        logger.info("Paytm Money WebSocket broadcast worker stopped.")

    async def _run_loop(self) -> None:
        """Main lifecycle loop handling live connection or simulated tick generation."""
        while self._running:
            try:
                public_token = token_store.get_public_access_token()

                if public_token and settings.is_paytm_configured:
                    # Live Paytm Money Broadcast WebSocket
                    await self._connect_and_stream(public_token)
                else:
                    # Simulation mode: emit gentle realistic micro-ticks for Indian equities
                    await self._emit_simulated_tick()
                    await asyncio.sleep(2.5)

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.warning("Paytm WebSocket loop error (reconnecting in 5s): %s", e)
                await asyncio.sleep(5.0)

    async def _connect_and_stream(self, public_token: str) -> None:
        """Connect to Paytm Money's official live broadcast server."""
        ws_url = f"{settings.PAYTM_WS_URL}?x_jwt_token={public_token}"
        logger.info("Connecting to Paytm Money Broadcast WebSocket...")

        # Note: Do not hardcode proxy bypasses; transparent proxying on Arch Linux / v2rayA works automatically
        async with websockets.connect(ws_url, ping_interval=20, ping_timeout=10) as ws:
            self._live_ws = ws
            logger.info("Connected to Paytm Money Broadcast WebSocket successfully!")

            try:
                # 1. Subscribe to Indian Equities
                subscribe_payload = [
                    {
                        "actionType": "ADD",
                        "modeType": "QUOTE",
                        "scripType": "EQUITY",
                        "exchangeType": "NSE",
                        "scripId": str(meta["security_id"]),
                    }
                    for sym, meta in INDIAN_EQUITIES.items()
                ]
                await ws.send(json.dumps(subscribe_payload))
                logger.info("Subscribed to %d Indian stocks on Paytm Broadcast.", len(subscribe_payload))

                # 2. Ingest stream packets
                while self._running:
                    message = await ws.recv()
                    ticks = paytm_service.parse_tick_packet(message)
                    for tick in ticks:
                        await self._process_tick(tick)
            finally:
                self._live_ws = None

    async def subscribe_symbol(self, sec_id: int, symbol: Optional[str] = None) -> None:
        """Dynamically subscribe to an Indian stock on Paytm Money live broadcast."""
        if not self._live_ws:
            logger.debug("Live broker WS not active; subscription registered for %s (ID: %s)", symbol, sec_id)
            return

        payload = [
            {
                "actionType": "ADD",
                "modeType": "QUOTE",
                "scripType": "EQUITY",
                "exchangeType": "NSE",
                "scripId": str(sec_id),
            }
        ]
        try:
            await self._live_ws.send(json.dumps(payload))
            logger.info("Sent dynamic subscription to Paytm broadcast for %s (sec_id: %s)", symbol, sec_id)
        except Exception as e:
            logger.warning("Failed to send dynamic subscription for %s: %s", symbol, e)

    async def _emit_simulated_tick(self) -> None:
        """Simulate realistic price movement when live Paytm token is not yet generated."""
        sym = random.choice(list(INDIAN_EQUITIES.keys()))
        meta = INDIAN_EQUITIES[sym]
        base_price = Decimal(str(meta["price"]))

        # Jitter +/- 0.15%
        jitter_pct = Decimal(str(random.uniform(-0.0015, 0.0015)))
        current_price = round(base_price * (Decimal("1.0") + jitter_pct), 2)
        prev_close = round(base_price * Decimal("0.995"), 2)
        chg = round(current_price - prev_close, 2)
        chg_pct = round((chg / prev_close) * Decimal("100"), 2)

        tick = {
            "type": "TICK",
            "exchange": "NSE",
            "symbol": sym,
            "security_id": meta["security_id"],
            "last_price": current_price,
            "change": chg,
            "change_percent": chg_pct,
            "volume": random.randint(150000, 3500000),
            "timestamp": int(asyncio.get_event_loop().time()),
            "source": "simulated_nse",
        }
        await self._process_tick(tick)

    async def _process_tick(self, tick: dict) -> None:
        """Update DB price, check limit orders, and broadcast to frontend."""
        sym = tick.get("symbol")
        new_price = tick.get("last_price")

        if sym and new_price:
            try:
                # Update instrument table with the latest tick price
                with SessionLocal() as db:
                    inst = db.query(Instrument).filter(Instrument.symbol == sym).first()
                    if inst and inst.current_price != new_price:
                        inst.current_price = new_price
                        db.commit()

                        # Evaluate limit orders for Indian stocks
                        from app.services.limit_order_service import LimitOrderService
                        LimitOrderService(db).check_and_trigger_all()
            except Exception as e:
                logger.debug("Failed saving tick to DB for %s: %s", sym, e)

        # Broadcast tick to frontend WebSocket subscribers
        await paytm_service.broadcast_tick(tick)


paytm_ws_client = PaytmWebSocketClient()
