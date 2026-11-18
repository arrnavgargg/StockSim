import { LiveTick } from '../types';

type TickListener = (tick: LiveTick) => void;

class MarketWebSocketService {
  private ws: WebSocket | null = null;
  private listeners: Set<TickListener> = new Set();
  private subscribedSymbols: Map<string, number | undefined> = new Map();
  private reconnectTimeout: number | null = null;
  private pingInterval: number | null = null;
  private isConnected = false;

  constructor() {
    this.connect();
  }

  private getWebSocketUrl(): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Use host (proxied via Vite on 5173 to backend 8000) or fallback
    return `${protocol}//${window.location.host}/api/ws/market-data`;
  }

  public connect(): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      const url = this.getWebSocketUrl();
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.isConnected = true;
        // Resubscribe all active symbols with their security_ids
        for (const [symbol, secId] of this.subscribedSymbols.entries()) {
          this.sendSubscription(symbol, secId);
        }

        // Start heartbeat ping
        if (this.pingInterval) clearInterval(this.pingInterval);
        this.pingInterval = window.setInterval(() => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send('ping');
          }
        }, 25000);
      };

      this.ws.onmessage = (event) => {
        if (event.data === 'pong') return;
        try {
          const data = JSON.parse(event.data);
          if (data && data.type === 'TICK' && data.symbol) {
            const tick: LiveTick = {
              type: 'TICK',
              exchange: data.exchange || 'NSE',
              symbol: data.symbol,
              security_id: data.security_id,
              last_price: Number(data.last_price),
              change: data.change !== undefined ? Number(data.change) : undefined,
              change_percent: data.change_percent !== undefined ? Number(data.change_percent) : undefined,
              volume: data.volume !== undefined ? Number(data.volume) : undefined,
              timestamp: data.timestamp,
              source: data.source,
            };
            this.listeners.forEach((listener) => listener(tick));
          }
        } catch {
          // Ignore non-json frames
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        if (this.pingInterval) clearInterval(this.pingInterval);
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.ws?.close();
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.reconnectTimeout = window.setTimeout(() => {
      this.connect();
    }, 3000);
  }

  /**
   * Subscribe to live market data stream for an Indian equity.
   * Sends both the string ticker symbol and numeric Paytm security_id token.
   */
  public subscribe(symbol: string, securityId?: number): void {
    const symUpper = symbol.toUpperCase();
    this.subscribedSymbols.set(symUpper, securityId);
    if (this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.sendSubscription(symUpper, securityId);
    }
  }

  private sendSubscription(symbol: string, securityId?: number): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    const payload = {
      action: 'subscribe',
      symbol: symbol,
      security_id: securityId,
      instrument_token: securityId,
    };
    this.ws.send(JSON.stringify(payload));
  }

  public addListener(listener: TickListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getIsConnected(): boolean {
    return this.isConnected;
  }
}

export const marketWs = new MarketWebSocketService();

