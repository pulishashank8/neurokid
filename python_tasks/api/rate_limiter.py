"""
Rate limiting for Python API
Token bucket algorithm with in-memory storage
Production-ready for 100K+ users
"""

import time
import threading
import logging
from typing import Dict, Optional
from functools import wraps
from fastapi import Request, HTTPException

logger = logging.getLogger('python_api.rate_limiter')


class TokenBucket:
    """Token bucket rate limiter"""
    
    def __init__(self, capacity: int, refill_rate: float):
        self.capacity = capacity
        self.refill_rate = refill_rate
        self.tokens = capacity
        self.last_refill = time.time()
        self._lock = threading.Lock()
    
    def consume(self, tokens: int = 1) -> bool:
        with self._lock:
            now = time.time()
            elapsed = now - self.last_refill
            self.tokens = min(self.capacity, self.tokens + elapsed * self.refill_rate)
            self.last_refill = now
            
            if self.tokens >= tokens:
                self.tokens -= tokens
                return True
            return False


class RateLimiter:
    """Rate limiter with per-key buckets"""
    
    def __init__(self, default_capacity: int = 100, default_refill_rate: float = 10):
        self._buckets: Dict[str, TokenBucket] = {}
        self._lock = threading.Lock()
        self.default_capacity = default_capacity
        self.default_refill_rate = default_refill_rate
        self._blocked = 0
        self._allowed = 0
    
    def is_allowed(self, key: str, tokens: int = 1, 
                   capacity: Optional[int] = None, 
                   refill_rate: Optional[float] = None) -> bool:
        capacity = capacity or self.default_capacity
        refill_rate = refill_rate or self.default_refill_rate
        
        with self._lock:
            if key not in self._buckets:
                self._buckets[key] = TokenBucket(capacity, refill_rate)
        
        bucket = self._buckets[key]
        allowed = bucket.consume(tokens)
        
        with self._lock:
            if allowed:
                self._allowed += 1
            else:
                self._blocked += 1
                logger.warning(f"Rate limit exceeded for key: {key}")
        
        return allowed
    
    def cleanup(self, max_age: float = 3600):
        """Remove old buckets to free memory"""
        now = time.time()
        with self._lock:
            keys_to_remove = [
                key for key, bucket in self._buckets.items()
                if now - bucket.last_refill > max_age
            ]
            for key in keys_to_remove:
                del self._buckets[key]
        if keys_to_remove:
            logger.info(f"Cleaned up {len(keys_to_remove)} old rate limit buckets")
    
    def stats(self) -> dict:
        with self._lock:
            return {
                "buckets": len(self._buckets),
                "allowed": self._allowed,
                "blocked": self._blocked,
                "block_rate": f"{(self._blocked / max(1, self._allowed + self._blocked) * 100):.1f}%"
            }


rate_limiter = RateLimiter(default_capacity=100, default_refill_rate=10)


def get_client_ip(request: Request) -> str:
    """Extract client IP from request"""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def rate_limit(capacity: int = 60, refill_rate: float = 1, key_func=None):
    """Decorator for rate limiting endpoints"""
    def decorator(func):
        @wraps(func)
        async def wrapper(request: Request, *args, **kwargs):
            if key_func:
                key = key_func(request)
            else:
                key = f"{get_client_ip(request)}:{request.url.path}"
            
            if not rate_limiter.is_allowed(key, capacity=capacity, refill_rate=refill_rate):
                raise HTTPException(
                    status_code=429,
                    detail={
                        "error": "Too many requests",
                        "message": "Rate limit exceeded. Please try again later."
                    }
                )
            
            return await func(request, *args, **kwargs)
        return wrapper
    return decorator
