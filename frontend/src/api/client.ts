import {
  AuthResponse,
  Instrument,
  Order,
  OrderSide,
  PortfolioHoldingItem,
  PortfolioSummary,
  Quote,
  Transaction,
  User,
  Wallet,
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '';

class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem('stocksim_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Default to JSON unless sending FormData or URLSearchParams
    if (
      !(options.body instanceof FormData) &&
      !(options.body instanceof URLSearchParams) &&
      !headers['Content-Type']
    ) {
      headers['Content-Type'] = 'application/json';
    }

    const url = `${API_BASE}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        let errorData: any = {};
        try {
          errorData = await response.json();
        } catch {
          errorData = { detail: response.statusText || 'Unknown server error' };
        }

        const message =
          errorData.detail ||
          (errorData.message ? errorData.message : `Request failed with status ${response.status}`);
        
        const error: any = new Error(
          typeof message === 'object' ? JSON.stringify(message) : message
        );
        error.status = response.status;
        error.error_code = errorData.error_code;
        error.details = errorData.details;
        throw error;
      }

      return (await response.json()) as T;
    } catch (err: any) {
      // If server is not running or network fails
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        throw new Error(
          'Unable to connect to StockSim backend. Please ensure the backend server is running on port 8000.'
        );
      }
      throw err;
    }
  }

  // --- Auth Endpoints ---
  async register(username: string, email: string, password: string): Promise<User> {
    return this.request<User>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
  }

  async login(username: string, password: string): Promise<AuthResponse> {
    const body = new URLSearchParams();
    body.append('username', username);
    body.append('password', password);

    return this.request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });
  }

  async getMe(): Promise<User> {
    return this.request<User>('/api/auth/me');
  }

  // --- Instruments / Market Data Endpoints ---
  async listInstruments(search?: string): Promise<Instrument[]> {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return this.request<Instrument[]>(`/api/instruments${query}`);
  }

  async getInstrument(symbol: string): Promise<Instrument> {
    return this.request<Instrument>(`/api/instruments/${encodeURIComponent(symbol)}`);
  }

  async getQuote(symbol: string): Promise<Quote> {
    return this.request<Quote>(`/api/instruments/${encodeURIComponent(symbol)}/quote`);
  }

  async seedInstruments(): Promise<Instrument[]> {
    return this.request<Instrument[]>('/api/instruments/seed', {
      method: 'POST',
    });
  }

  // --- Trading / Orders Endpoints ---
  async placeOrder(
    symbol: string,
    order_type: OrderSide,
    quantity: number
  ): Promise<Order> {
    return this.request<Order>('/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        symbol: symbol.toUpperCase(),
        order_type,
        quantity,
      }),
    });
  }

  async getOrders(symbol?: string): Promise<Order[]> {
    const query = symbol ? `?symbol=${encodeURIComponent(symbol)}` : '';
    return this.request<Order[]>(`/api/orders${query}`);
  }

  async getOrder(orderId: number): Promise<Order> {
    return this.request<Order>(`/api/orders/${orderId}`);
  }

  // --- Portfolio Endpoints ---
  async getPortfolioSummary(): Promise<PortfolioSummary> {
    return this.request<PortfolioSummary>('/api/portfolio/summary');
  }

  async getPortfolioHoldings(): Promise<PortfolioHoldingItem[]> {
    return this.request<PortfolioHoldingItem[]>('/api/portfolio/holdings');
  }

  // --- Wallet Endpoints ---
  async getWallet(): Promise<Wallet> {
    return this.request<Wallet>('/api/wallet/me');
  }

  async deposit(amount: number): Promise<Wallet> {
    return this.request<Wallet>('/api/wallet/deposit', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  }

  async withdraw(amount: number): Promise<Wallet> {
    return this.request<Wallet>('/api/wallet/withdraw', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  }

  async getTransactions(limit: number = 50): Promise<Transaction[]> {
    return this.request<Transaction[]>(`/api/wallet/transactions?limit=${limit}`);
  }
}

export const api = new ApiClient();
