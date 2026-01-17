"""
Main FastAPI application for Prescription Management System
Following ERD specifications and architecture
"""
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import time
import logging
from pathlib import Path

from app.core.config import settings
from app.core.database import init_db, check_db_connection, check_redis_connection
from app.core.middleware import TenantMiddleware
from app.api.v1 import api_router


# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper()),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan events
    Handle startup and shutdown tasks
    """
    # Startup
    logger.info("🚀 Starting Prescription Management System...")
    
    # Initialize database
    try:
        init_db()
        logger.info("✅ Database initialized successfully")
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {e}")
        raise e
    
    # Check connections
    db_healthy = check_db_connection()
    redis_healthy = check_redis_connection()
    
    if not db_healthy:
        logger.error("❌ Database connection failed")
        raise Exception("Database connection failed")
    
    if not redis_healthy:
        logger.warning("⚠️ Redis connection failed - caching disabled")
    
    logger.info(f"✅ Application started on {settings.ENVIRONMENT} environment")
    
    yield
    
    # Shutdown
    logger.info("🛑 Shutting down Prescription Management System...")


# Create FastAPI application
app = FastAPI(
    title=settings.PROJECT_NAME,
    description=settings.DESCRIPTION,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json" if settings.DEBUG else None,
    docs_url=f"{settings.API_V1_STR}/docs" if settings.DEBUG else None,
    redoc_url=f"{settings.API_V1_STR}/redoc" if settings.DEBUG else None,
    lifespan=lifespan
)


# Middleware configuration

# CORS middleware - Allow Vercel preview URLs using regex
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app",  # Allow all Vercel preview URLs
    allow_credentials=True,
    allow_methods=settings.ALLOWED_METHODS,
    allow_headers=settings.ALLOWED_HEADERS,
)

# Compression middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Tenant middleware - Set database context for multi-tenancy
app.add_middleware(TenantMiddleware)
logger.info("✅ Tenant middleware registered - Multi-tenancy enabled")


# Static files - Mount uploads directory for serving uploaded files
uploads_dir = Path(settings.UPLOAD_DIR)
uploads_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")
logger.info(f"📁 Static files mounted at /uploads -> {uploads_dir}")


# Request/Response middleware for logging and audit
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """
    Log all requests for audit and monitoring
    Also ensures CORS headers are present on all responses (including errors)
    """
    start_time = time.time()

    # Extract request information
    client_ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")
    method = request.method
    url = str(request.url)
    origin = request.headers.get("origin")

    # Process request
    response = await call_next(request)

    # Calculate processing time
    process_time = time.time() - start_time

    # Log request
    logger.info(
        f"{method} {url} - "
        f"Status: {response.status_code} - "
        f"Time: {process_time:.3f}s - "
        f"IP: {client_ip} - "
        f"User-Agent: {user_agent[:100]}..."
    )

    # Add response headers
    response.headers["X-Process-Time"] = str(process_time)
    response.headers["X-API-Version"] = settings.VERSION

    # Ensure CORS headers are present on all responses (including error responses)
    # This fixes the issue where authentication errors don't include CORS headers
    if origin and origin in settings.ALLOWED_ORIGINS:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = ", ".join(settings.ALLOWED_METHODS)
        response.headers["Access-Control-Allow-Headers"] = ", ".join(settings.ALLOWED_HEADERS)

    return response


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Global exception handler for unhandled errors
    """
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    
    if settings.DEBUG:
        return JSONResponse(
            status_code=500,
            content={
                "error": "Internal server error",
                "detail": str(exc),
                "type": type(exc).__name__
            }
        )
    else:
        return JSONResponse(
            status_code=500,
            content={
                "error": "Internal server error",
                "message": "An unexpected error occurred"
            }
        )


# Health check endpoints
@app.get("/health")
async def health_check():
    """
    Basic health check endpoint
    """
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT
    }


@app.get("/health/detailed")
async def detailed_health_check():
    """
    Detailed health check with database and Redis status
    """
    db_healthy = check_db_connection()
    redis_healthy = check_redis_connection()
    
    return {
        "status": "healthy" if (db_healthy and redis_healthy) else "degraded",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "checks": {
            "database": "healthy" if db_healthy else "unhealthy",
            "redis": "healthy" if redis_healthy else "unhealthy"
        },
        "timestamp": time.time()
    }


# Root endpoint
@app.get("/")
async def root():
    """
    Root endpoint with API information
    """
    return {
        "message": "Prescription Management System API",
        "version": settings.VERSION,
        "documentation": f"{settings.API_V1_STR}/docs" if settings.DEBUG else None,
        "health": "/health",
        "api_prefix": settings.API_V1_STR
    }


# Include API routes
app.include_router(api_router, prefix=settings.API_V1_STR)


# Development server configuration
if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower(),
        access_log=True
    )