"""
Hybrid caching layer for Python API
Supports Redis (distributed) with in-memory fallback
Production-ready for 100K+ users
"""

import os
import time
import json
import threading
import logging
from typing import Any, Optional, Dict
from functools import wraps

logger = logging.getLogger('python_api.cache')

REDIS_URL = os.environ.get('REDIS_URL', os.environ.get('KV_URL', ''))


class RedisCache:
    """Redis-based distributed cache"""
    
    def __init__(self, url: str, default_ttl: int = 300):
        self.default_ttl = default_ttl
        self._client = None
        self._hits = 0
        self._misses = 0
        self._connected = False
        
        if url:
            try:
                import redis
                self._client = redis.from_url(url, decode_responses=True)
                self._client.ping()
                self._connected = True
                logger.info("Redis cache connected successfully")
            except Exception as e:
                logger.warning(f"Redis connection failed, using in-memory cache: {e}")
                self._connected = False
    
    @property
    def is_connected(self) -> bool:
        return self._connected and self._client is not None
    
    def get(self, key: str) -> Optional[Any]:
        if not self.is_connected:
            return None
        try:
            value = self._client.get(f"neurokid:{key}")
            if value:
                self._hits += 1
                return json.loads(value)
            self._misses += 1
            return None
        except Exception as e:
            logger.error(f"Redis get error: {e}")
            self._misses += 1
            return None
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        if not self.is_connected:
            return False
        try:
            ttl = ttl or self.default_ttl
            self._client.setex(f"neurokid:{key}", ttl, json.dumps(value, default=str))
            return True
        except Exception as e:
            logger.error(f"Redis set error: {e}")
            return False
    
    def delete(self, key: str) -> bool:
        if not self.is_connected:
            return False
        try:
            self._client.delete(f"neurokid:{key}")
            return True
        except Exception as e:
            logger.error(f"Redis delete error: {e}")
            return False
    
    def clear(self, pattern: str = "*") -> int:
        if not self.is_connected:
            return 0
        try:
            count = 0
            cursor = 0
            while True:
                cursor, keys = self._client.scan(cursor, match=f"neurokid:{pattern}", count=100)
                if keys:
                    self._client.delete(*keys)
                    count += len(keys)
                if cursor == 0:
                    break
            return count
        except Exception as e:
            logger.error(f"Redis clear error: {e}")
            return 0
    
    def stats(self) -> dict:
        total = self._hits + self._misses
        hit_rate = (self._hits / total * 100) if total > 0 else 0
        return {
            "type": "redis",
            "connected": self.is_connected,
            "hits": self._hits,
            "misses": self._misses,
            "hit_rate": f"{hit_rate:.1f}%"
        }


class InMemoryCache:
    """Thread-safe in-memory cache with TTL support"""
    
    def __init__(self, max_size: int = 1000, default_ttl: int = 300):
        self._cache: Dict[str, tuple] = {}
        self._lock = threading.RLock()
        self.max_size = max_size
        self.default_ttl = default_ttl
        self._hits = 0
        self._misses = 0
    
    def get(self, key: str) -> Optional[Any]:
        with self._lock:
            if key in self._cache:
                value, expiry = self._cache[key]
                if time.time() < expiry:
                    self._hits += 1
                    return value
                else:
                    del self._cache[key]
            self._misses += 1
            return None
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        ttl = ttl or self.default_ttl
        expiry = time.time() + ttl
        
        with self._lock:
            if len(self._cache) >= self.max_size:
                self._evict_oldest()
            self._cache[key] = (value, expiry)
    
    def delete(self, key: str) -> bool:
        with self._lock:
            if key in self._cache:
                del self._cache[key]
                return True
            return False
    
    def clear(self) -> None:
        with self._lock:
            self._cache.clear()
            logger.info("In-memory cache cleared")
    
    def _evict_oldest(self) -> None:
        if not self._cache:
            return
        oldest_key = min(self._cache.keys(), key=lambda k: self._cache[k][1])
        del self._cache[oldest_key]
    
    def stats(self) -> dict:
        with self._lock:
            total = self._hits + self._misses
            hit_rate = (self._hits / total * 100) if total > 0 else 0
            return {
                "type": "in-memory",
                "size": len(self._cache),
                "max_size": self.max_size,
                "hits": self._hits,
                "misses": self._misses,
                "hit_rate": f"{hit_rate:.1f}%"
            }


class HybridCache:
    """Hybrid cache that uses Redis when available, falls back to in-memory"""
    
    def __init__(self, redis_url: str = "", max_memory_size: int = 1000, default_ttl: int = 300):
        self.default_ttl = default_ttl
        self._redis = RedisCache(redis_url, default_ttl) if redis_url else None
        self._memory = InMemoryCache(max_memory_size, default_ttl)
        
        if self._redis and self._redis.is_connected:
            logger.info("Using Redis cache (distributed)")
        else:
            logger.info("Using in-memory cache (local)")
    
    @property
    def is_distributed(self) -> bool:
        return self._redis is not None and self._redis.is_connected
    
    def get(self, key: str) -> Optional[Any]:
        if self.is_distributed:
            return self._redis.get(key)
        return self._memory.get(key)
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        if self.is_distributed:
            self._redis.set(key, value, ttl)
        else:
            self._memory.set(key, value, ttl)
    
    def delete(self, key: str) -> bool:
        if self.is_distributed:
            return self._redis.delete(key)
        return self._memory.delete(key)
    
    def clear(self, pattern: str = "") -> int:
        if self.is_distributed:
            return self._redis.clear(pattern or "*")
        self._memory.clear()
        return 0
    
    def stats(self) -> dict:
        if self.is_distributed:
            return self._redis.stats()
        return self._memory.stats()


cache = HybridCache(
    redis_url=REDIS_URL,
    max_memory_size=1000,
    default_ttl=300
)


def cached(ttl: int = 300, key_prefix: str = ""):
    """Decorator for caching function results"""
    import hashlib
    
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            key_data = f"{func.__module__}.{func.__name__}:{json.dumps(args, default=str, sort_keys=True)}:{json.dumps(kwargs, default=str, sort_keys=True)}"
            key_hash = hashlib.sha256(key_data.encode()).hexdigest()[:16]
            cache_key = f"{key_prefix}:{func.__name__}:{key_hash}"
            
            cached_value = cache.get(cache_key)
            if cached_value is not None:
                return cached_value
            
            result = func(*args, **kwargs)
            cache.set(cache_key, result, ttl)
            return result
        return wrapper
    return decorator


def invalidate_cache(pattern: str = "") -> int:
    """Invalidate cache entries matching pattern"""
    return cache.clear(pattern)
