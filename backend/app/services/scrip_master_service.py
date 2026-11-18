"""Paytm Money NSE / BSE Scrip Master Service.

Loads and indexes the complete official Paytm Money Security Master (3,000+ NSE listed stocks)
to support on-demand search, dynamic ticker registration, and accurate token mapping.
"""
import csv
from decimal import Decimal
import logging
import os
from pathlib import Path
from typing import Any, Dict, List, Optional
import httpx

logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
MASTER_CSV_PATH = DATA_DIR / "equity_security_master.csv"
REMOTE_MASTER_URL = "https://developer.paytmmoney.com/data/v1/scrips/equity_security_master.csv"


class ScripMasterService:
    def __init__(self, csv_path: Optional[Path] = None):
        self.csv_path = csv_path or MASTER_CSV_PATH
        self.by_symbol: Dict[str, Dict[str, Any]] = {}
        self.by_security_id: Dict[int, Dict[str, Any]] = {}
        self._load_master()

    def _load_master(self) -> None:
        """Load equity security master from local CSV."""
        if not self.csv_path.exists():
            logger.warning("Scrip master CSV not found at %s. Attempting remote download...", self.csv_path)
            self.download_latest_master()

        if not self.csv_path.exists():
            logger.error("Could not load Scrip Master CSV: file does not exist.")
            return

        count = 0
        try:
            with open(self.csv_path, "r", encoding="utf-8", errors="replace") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    # Focus on NSE equities (EQ, BE, SM series)
                    exchange = (row.get("exchange") or "").strip().upper()
                    series = (row.get("series") or "").strip().upper()
                    if exchange != "NSE":
                        continue
                    if series and series not in ("EQ", "BE", "SM", "BZ"):
                        continue

                    sym = (row.get("symbol") or "").strip().upper()
                    sec_id_str = (row.get("security_id") or "").strip()
                    if not sym or not sec_id_str:
                        continue

                    try:
                        sec_id = int(sec_id_str)
                    except ValueError:
                        continue

                    name = (row.get("name") or sym).strip()

                    # Estimate baseline price from circuit bands if available
                    price = Decimal("100.00")
                    try:
                        upper = float(row.get("upper_limit", 0) or 0)
                        lower = float(row.get("lower_limit", 0) or 0)
                        if upper > 0 and lower > 0:
                            price = round(Decimal(str((upper + lower) / 2.0)), 2)
                        elif upper > 0:
                            price = round(Decimal(str(upper * 0.9)), 2)
                    except Exception:
                        pass

                    entry = {
                        "symbol": sym,
                        "name": name,
                        "security_id": sec_id,
                        "price": price,
                        "exchange": "NSE",
                        "series": series,
                        "lot_size": int(row.get("lot_size", 1) or 1),
                        "tick_size": float(row.get("tick_size", 0.05) or 0.05),
                    }
                    self.by_symbol[sym] = entry
                    self.by_security_id[sec_id] = entry
                    count += 1

            logger.info("ScripMaster loaded %d NSE equity instruments.", count)
        except Exception as e:
            logger.error("Failed to parse Scrip Master CSV: %s", e)

    def download_latest_master(self) -> bool:
        """Download latest daily equity security master from developer.paytmmoney.com."""
        try:
            DATA_DIR.mkdir(parents=True, exist_ok=True)
            with httpx.Client(timeout=30.0) as client:
                res = client.get(REMOTE_MASTER_URL)
                if res.status_code == 200 and len(res.content) > 10000:
                    with open(self.csv_path, "wb") as f:
                        f.write(res.content)
                    logger.info("Successfully downloaded new Paytm Money Scrip Master (%d bytes).", len(res.content))
                    return True
        except Exception as e:
            logger.debug("Could not download remote scrip master: %s", e)
        return False

    def get_by_symbol(self, symbol: str) -> Optional[Dict[str, Any]]:
        """Lookup instrument by symbol (case-insensitive)."""
        return self.by_symbol.get(symbol.strip().upper())

    def get_by_security_id(self, sec_id: int) -> Optional[Dict[str, Any]]:
        """Lookup instrument by Paytm numeric security ID."""
        return self.by_security_id.get(sec_id)

    def search(self, query: str, limit: int = 20) -> List[Dict[str, Any]]:
        """Search instruments across all 3,000+ NSE stocks with relevance ranking."""
        q = query.strip().upper()
        if not q:
            return list(self.by_symbol.values())[:limit]

        exact: List[Dict[str, Any]] = []
        prefix: List[Dict[str, Any]] = []
        contains_sym: List[Dict[str, Any]] = []
        contains_name: List[Dict[str, Any]] = []

        for sym, item in self.by_symbol.items():
            name_upper = item["name"].upper()
            if sym == q:
                exact.append(item)
            elif sym.startswith(q):
                prefix.append(item)
            elif q in sym:
                contains_sym.append(item)
            elif q in name_upper:
                contains_name.append(item)

        results = exact + prefix + contains_sym + contains_name
        return results[:limit]


# Global singleton instance
scrip_master = ScripMasterService()

