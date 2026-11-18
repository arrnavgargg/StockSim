export interface User {
  id: number;
  username: string;
  email: string;
  created_at?: string;
  wallet_balance?: number;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Instrument {
  id: number;
  symbol: string;
  company_name: string;
  current_price: number | string;
  security_id?: number;
}

export interface Quote {
  symbol: string;
  company_name: string;
  current_price: number;
  previous_close?: number;
  change?: number;
  change_percent?: number;
  day_high?: number;
  day_low?: number;
  bid_price?: number;
  ask_price?: number;
  volume?: number;
  exchange?: string;
  currency?: string;
  security_id?: number;
  source?: 'paytm' | 'paytm_ws' | 'alpaca' | 'simulated' | string;
  updated_at?: string;
}

export interface LiveTick {
  type: string;
  exchange?: string;
  symbol: string;
  security_id?: number;
  last_price: number;
  change?: number;
  change_percent?: number;
  volume?: number;
  timestamp?: number;
  source?: string;
}

export interface BarItem {
  t: string;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

export interface HistoricalBarsResponse {
  symbol: string;
  timeframe: string;
  source: string;
  bars: BarItem[];
}

export interface PaytmStatus {
  configured: boolean;
  authenticated: boolean;
  merchant_id?: string;
  token_valid_until?: string;
  feed: string;
  login_url: string;
  message: string;
}

export interface PaytmSyncResponse {
  synced_count: number;
  updated_instruments: string[];
  source: string;
  timestamp: string;
}

export type AlpacaStatus = PaytmStatus;
export type AlpacaSyncResponse = PaytmSyncResponse;

export type OrderSide = 'buy' | 'sell';
export type OrderStatus = 'pending' | 'executed' | 'cancelled' | 'rejected';

export type LimitOrderSide = 'buy' | 'sell';
export type LimitOrderStatus = 'active' | 'triggered' | 'cancelled' | 'expired';

export interface LimitOrder {
  id: number;
  user_id: number;
  symbol: string;
  side: LimitOrderSide;
  quantity: number;
  target_price: number | string;
  status: LimitOrderStatus | string;
  created_at: string;
  triggered_at?: string;
  executed_order_id?: number;
}

export interface WatchlistItem {
  id: number;
  user_id: number;
  symbol: string;
  company_name?: string;
  current_price?: number | string;
  security_id?: number;
  created_at: string;
}

export interface WatchlistToggleResponse {
  symbol: string;
  is_watched: boolean;
  message: string;
}

export interface Order {
  id: number;
  user_id: number;
  symbol: string;
  order_type: OrderSide;
  quantity: number;
  price: number | string;
  total_value?: number | string;
  status: OrderStatus | string;
  timestamp: string;
}

export interface PortfolioHoldingItem {
  symbol: string;
  company_name: string;
  quantity: number;
  average_buy_price: number | string;
  current_price: number | string;
  total_invested: number | string;
  current_value: number | string;
  unrealized_pnl: number | string;
  unrealized_pnl_percent: number | string;
}

export interface PortfolioSummary {
  cash_balance: number | string;
  total_invested: number | string;
  current_portfolio_value: number | string;
  net_worth: number | string;
  total_unrealized_pnl: number | string;
  total_return_percent: number | string;
  holdings: PortfolioHoldingItem[];
}

export interface Wallet {
  id: number;
  user_id: number;
  balance: number | string;
  currency: string;
}

export interface Transaction {
  id: number;
  wallet_id: number;
  amount: number | string;
  transaction_type: 'deposit' | 'withdraw' | 'trade' | string;
  timestamp: string;
}

export interface ApiError {
  detail: string;
  error_code?: string;
  details?: Record<string, any>;
}
