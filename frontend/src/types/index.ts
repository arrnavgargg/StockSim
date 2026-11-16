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
}

export type OrderSide = 'buy' | 'sell';
export type OrderStatus = 'pending' | 'executed' | 'cancelled' | 'rejected';

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
