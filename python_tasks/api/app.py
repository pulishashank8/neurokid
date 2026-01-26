"""
NeuroKid Python Backend API
FastAPI-based backend service handling analytics, data governance, and admin features
Production-ready with security hardening for 100K+ users
"""

import os
import logging
import uuid
from datetime import datetime
from fastapi import FastAPI, Request, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import Optional

IS_PRODUCTION = os.environ.get('NODE_ENV') == 'production'

logging.basicConfig(
    level=logging.INFO if IS_PRODUCTION else logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('python_api')

REPLIT_DOMAIN = os.environ.get('REPLIT_DOMAINS', '')

ALLOWED_ORIGINS = [
    "https://neurokid.help",
    "https://www.neurokid.help",
    "http://localhost:5000",
    "http://localhost:3000",
]

if REPLIT_DOMAIN:
    ALLOWED_ORIGINS.append(f"https://{REPLIT_DOMAIN}")

app = FastAPI(
    title="NeuroKid Python Backend",
    description="Python backend API for analytics, data governance, and admin features",
    version="1.0.0",
    docs_url=None if IS_PRODUCTION else "/docs",
    redoc_url=None if IS_PRODUCTION else "/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS if IS_PRODUCTION else ["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
    allow_origin_regex=r"https://.*\.replit\.dev" if IS_PRODUCTION else None,
)


@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    """Global rate limiting middleware"""
    from api.rate_limiter import rate_limiter, get_client_ip
    
    excluded_paths = ["/", "/health", "/docs", "/redoc", "/openapi.json"]
    if request.url.path in excluded_paths:
        return await call_next(request)
    
    client_ip = get_client_ip(request)
    rate_key = f"{client_ip}:{request.url.path}"
    
    if not rate_limiter.is_allowed(rate_key, capacity=100, refill_rate=10):
        return JSONResponse(
            status_code=429,
            content={
                "success": False,
                "error": {
                    "code": "RATE_LIMITED",
                    "message": "Too many requests. Please try again later."
                }
            }
        )
    
    return await call_next(request)


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4())[:8])
    start_time = datetime.now()
    
    response = await call_next(request)
    
    duration = (datetime.now() - start_time).total_seconds() * 1000
    logger.info(f"[{request_id}] {request.method} {request.url.path} - {response.status_code} - {duration:.2f}ms")
    
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Cache-Control"] = "no-store, max-age=0"
    
    return response


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    request_id = request.headers.get("X-Request-ID", "unknown")
    logger.error(f"[{request_id}] Unhandled exception: {exc}", exc_info=True)
    
    if IS_PRODUCTION:
        return JSONResponse(
            status_code=500,
            content={
                "success": False, 
                "error": {
                    "code": "INTERNAL_ERROR", 
                    "message": "An unexpected error occurred. Please try again later.",
                    "requestId": request_id
                }
            }
        )
    else:
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": {"code": "INTERNAL_ERROR", "message": str(exc)}}
        )


from api.routes import users_router, analytics_router, posts_router, governance_router

app.include_router(users_router, prefix="/api/python")
app.include_router(analytics_router, prefix="/api/python")
app.include_router(posts_router, prefix="/api/python")
app.include_router(governance_router, prefix="/api/python")


@app.get("/")
async def root():
    return {
        "service": "NeuroKid Python Backend",
        "version": "1.0.0",
        "status": "healthy",
        "timestamp": datetime.now().isoformat()
    }


@app.get("/health")
async def health_check():
    from api.database import execute_query
    
    try:
        result = execute_query("SELECT 1 as check", fetch_one=True)
        db_status = "connected" if result else "disconnected"
    except Exception as e:
        logger.error(f"Health check DB error: {e}")
        db_status = "disconnected"
    
    status = "healthy" if db_status == "connected" else "degraded"
    
    return {
        "status": status,
        "database": db_status,
        "timestamp": datetime.now().isoformat()
    }


@app.get("/api/python/stats")
async def api_stats():
    """Get API usage statistics"""
    from api.cache import cache
    from api.task_queue import task_queue
    from api.rate_limiter import rate_limiter
    
    return {
        "endpoints": {
            "users": "/api/python/users",
            "analytics": "/api/python/analytics",
            "posts": "/api/python/posts",
            "governance": "/api/python/governance"
        },
        "features": [
            "User management and activity tracking",
            "Dashboard analytics and metrics",
            "Content moderation tools",
            "Data governance and GDPR compliance",
            "Audit logging and retention"
        ],
        "cache": cache.stats(),
        "task_queue": task_queue.stats(),
        "rate_limiter": rate_limiter.stats()
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PYTHON_API_PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
