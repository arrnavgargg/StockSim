from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.exceptions import StockSimException
from app.routers import auth, instruments, orders, portfolio, wallet

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="High-performance virtual stock trading and portfolio management backend API.",
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
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
