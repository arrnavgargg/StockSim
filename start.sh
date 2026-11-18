#!/usr/bin/env bash
# ================================================================
# StockSim - Unified Local Startup Script
# ================================================================

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=================================================="
echo "🚀 Starting StockSim Platform"
echo "=================================================="

# Function to shut down both processes gracefully on Ctrl+C
cleanup() {
    echo ""
    echo "🛑 Shutting down StockSim servers..."
    if [ -n "$BACKEND_PID" ]; then
        kill "$BACKEND_PID" 2>/dev/null || true
    fi
    if [ -n "$FRONTEND_PID" ]; then
        kill "$FRONTEND_PID" 2>/dev/null || true
    fi
    wait 2>/dev/null || true
    echo "✅ All servers stopped."
    exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# 1. Start Backend API Server
echo ""
echo "[1/2] Launching Backend API on http://localhost:8000..."
cd "$ROOT_DIR/backend"

if [ -d "venv" ]; then
    source venv/bin/activate
fi

python3 -m uvicorn app.main:app --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!

# Wait briefly for backend to initialize
sleep 1.5

# 2. Start Frontend Dev Server
echo ""
echo "[2/2] Launching Frontend Desk on http://localhost:5173..."
cd "$ROOT_DIR/frontend"

npx vite --host 127.0.0.1 --port 5173 &
FRONTEND_PID=$!

echo ""
echo "=================================================="
echo "🎉 StockSim is running!"
echo "   - Web App:      http://localhost:5173"
echo "   - API Docs:     http://localhost:8000/docs"
echo "   (Press Ctrl+C to stop both servers anytime)"
echo "=================================================="

wait
