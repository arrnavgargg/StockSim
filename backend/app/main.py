import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.exceptions import StockSimException
from app.routers import auth, instruments, limit_orders, orders, portfolio, wallet, watchlist


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure all tables exist on startup
    from app.database import Base, engine, SessionLocal
    import app.models
    Base.metadata.create_all(bind=engine)

    # Background runner to check limit order triggers
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
    try:
        yield
    finally:
        stop_event.set()
        checker_task.cancel()
        try:
            await checker_task
        except asyncio.CancelledError:
            pass


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="High-performance virtual stock trading and portfolio management backend API.",
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
app.include_router(orders.router)
app.include_router(limit_orders.router)
app.include_router(watchlist.router)
app.include_router(portfolio.router)


@app.get("/", tags=["Health"])
def root():
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs": "/docs",
        "status": "online",
    }


@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
    }
