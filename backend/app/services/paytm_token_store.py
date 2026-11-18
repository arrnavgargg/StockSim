"""Paytm Money Token Store.

Manages the daily session tokens (access_token, public_access_token) with thread safety
and lightweight persistence across server restarts during the trading day.
"""
from datetime import datetime, time, timezone, timedelta
import json
import logging
import os
import threading
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)


class PaytmTokenStore:
    _instance: Optional["PaytmTokenStore"] = None
    _lock = threading.Lock()

    def __init__(self, cache_file: Optional[str] = None, session_file: Optional[str] = None):
        self.cache_file = session_file or cache_file or ".paytm_session.json"
        self._access_token: Optional[str] = None
        self._public_access_token: Optional[str] = None
        self._read_access_token: Optional[str] = None
        self._merchant_id: Optional[str] = None
        self._updated_at: Optional[datetime] = None
        self._load_from_cache()

    @classmethod
    def get_instance(cls) -> "PaytmTokenStore":
        with cls._lock:
            if cls._instance is None:
                cls._instance = PaytmTokenStore()
            return cls._instance

    def _get_midnight_ist_today(self) -> datetime:
        """Paytm Money tokens expire at midnight (11:59:59 PM) IST."""
        # IST is UTC+5:30
        ist = timezone(timedelta(hours=5, minutes=30))
        now_ist = datetime.now(ist)
        midnight_ist = datetime.combine(now_ist.date(), time(23, 59, 59), tzinfo=ist)
        return midnight_ist

    def _load_from_cache(self) -> None:
        """Load cached daily token from local file if valid."""
        if not os.path.exists(self.cache_file):
            return

        try:
            with open(self.cache_file, "r", encoding="utf-8") as f:
                data = json.load(f)

            updated_str = data.get("updated_at")
            if updated_str:
                updated_at = datetime.fromisoformat(updated_str)
                # Check if token is from today's date in IST
                ist = timezone(timedelta(hours=5, minutes=30))
                now_ist = datetime.now(ist)
                if updated_at.astimezone(ist).date() == now_ist.date():
                    self._access_token = data.get("access_token")
                    self._public_access_token = data.get("public_access_token")
                    self._read_access_token = data.get("read_access_token")
                    self._merchant_id = data.get("merchant_id")
                    self._updated_at = updated_at
                    logger.info("Loaded active Paytm Money session token from cache (merchant=%s)", self._merchant_id)
                else:
                    logger.info("Cached Paytm Money session expired (different trading day).")
        except Exception as e:
            logger.warning("Could not read Paytm session cache: %s", e)

    def _save_to_cache(self) -> None:
        """Persist session token to cache file."""
        try:
            payload = {
                "access_token": self._access_token,
                "public_access_token": self._public_access_token,
                "read_access_token": self._read_access_token,
                "merchant_id": self._merchant_id,
                "updated_at": self._updated_at.isoformat() if self._updated_at else None,
            }
            with open(self.cache_file, "w", encoding="utf-8") as f:
                json.dump(payload, f, indent=2)
        except Exception as e:
            logger.warning("Could not write Paytm session cache: %s", e)

    def set_tokens(
        self,
        access_token: str,
        public_access_token: Optional[str] = None,
        read_access_token: Optional[str] = None,
        merchant_id: Optional[str] = None,
    ) -> None:
        """Store freshly generated access tokens."""
        with self._lock:
            self._access_token = access_token
            self._public_access_token = public_access_token or access_token
            self._read_access_token = read_access_token
            self._merchant_id = merchant_id
            self._updated_at = datetime.now(timezone.utc)
            self._save_to_cache()
            logger.info("Paytm Money daily session tokens successfully stored.")

    def get_access_token(self) -> Optional[str]:
        """Return valid access_token or None if unauthenticated/expired."""
        with self._lock:
            if not self.is_authenticated():
                return None
            return self._access_token

    def get_public_access_token(self) -> Optional[str]:
        """Return valid public_access_token for WebSocket streaming."""
        with self._lock:
            if not self.is_authenticated():
                return None
            return self._public_access_token

    def is_authenticated(self) -> bool:
        """Check if active token exists and is valid for today."""
        if not self._access_token or not self._updated_at:
            return False

        ist = timezone(timedelta(hours=5, minutes=30))
        now_ist = datetime.now(ist)
        token_date_ist = self._updated_at.astimezone(ist).date()
        return token_date_ist == now_ist.date()

    def clear(self) -> None:
        """Clear session tokens."""
        with self._lock:
            self._access_token = None
            self._public_access_token = None
            self._read_access_token = None
            self._merchant_id = None
            self._updated_at = None
            if os.path.exists(self.cache_file):
                try:
                    os.remove(self.cache_file)
                except OSError:
                    pass
            logger.info("Paytm Money session cleared.")

    def get_status(self) -> Dict[str, Any]:
        """Return current authentication state for API responses."""
        with self._lock:
            authed = self.is_authenticated()
            expires_at = self._get_midnight_ist_today().isoformat() if authed else None
            return {
                "authenticated": authed,
                "merchant_id": self._merchant_id,
                "token_issued_at": self._updated_at.isoformat() if self._updated_at else None,
                "token_valid_until": expires_at,
                "has_websocket_token": bool(self._public_access_token),
            }

    def get_session_info(self) -> Dict[str, Any]:
        """Return current session status and validity until midnight IST."""
        with self._lock:
            authed = self.is_authenticated()
            midnight = self._get_midnight_ist_today()
            return {
                "is_valid": authed,
                "authenticated": authed,
                "merchant_id": self._merchant_id,
                "token_issued_at": self._updated_at.isoformat() if self._updated_at else None,
                "valid_until": midnight.strftime("%Y-%m-%d %H:%M:%S IST"),
                "token_valid_until": midnight.strftime("%Y-%m-%d %H:%M:%S IST"),
                "has_websocket_token": bool(self._public_access_token),
            }


token_store = PaytmTokenStore.get_instance()
