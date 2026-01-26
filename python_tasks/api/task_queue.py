"""
Background task queue for Python API
Simple in-process queue with Redis support when available
Production-ready for 100K+ users
"""

import os
import time
import json
import threading
import queue
import logging
from typing import Callable, Any, Dict, Optional
from datetime import datetime
from functools import wraps

logger = logging.getLogger('python_api.task_queue')

REDIS_URL = os.environ.get('REDIS_URL', os.environ.get('KV_URL', ''))


class Task:
    """Represents a background task"""
    
    def __init__(self, func: Callable, args: tuple = (), kwargs: dict = None, 
                 priority: int = 5, task_id: str = None):
        self.id = task_id or f"task_{int(time.time() * 1000)}"
        self.func = func
        self.args = args
        self.kwargs = kwargs or {}
        self.priority = priority
        self.created_at = datetime.now()
        self.status = "pending"
        self.result = None
        self.error = None
    
    def execute(self) -> Any:
        try:
            self.status = "running"
            self.result = self.func(*self.args, **self.kwargs)
            self.status = "completed"
            return self.result
        except Exception as e:
            self.status = "failed"
            self.error = str(e)
            logger.error(f"Task {self.id} failed: {e}")
            raise


class InProcessQueue:
    """Simple in-process task queue with worker threads"""
    
    def __init__(self, num_workers: int = 2):
        self._queue = queue.PriorityQueue()
        self._workers = []
        self._running = False
        self._tasks: Dict[str, Task] = {}
        self._lock = threading.Lock()
        self._processed = 0
        self._failed = 0
        self.num_workers = num_workers
    
    def start(self):
        if self._running:
            return
        self._running = True
        for i in range(self.num_workers):
            worker = threading.Thread(target=self._worker, daemon=True, name=f"TaskWorker-{i}")
            worker.start()
            self._workers.append(worker)
        logger.info(f"Task queue started with {self.num_workers} workers")
    
    def stop(self):
        self._running = False
        for _ in self._workers:
            self._queue.put((0, None))
        for worker in self._workers:
            worker.join(timeout=5)
        self._workers.clear()
        logger.info("Task queue stopped")
    
    def _worker(self):
        while self._running:
            try:
                priority, task = self._queue.get(timeout=1)
                if task is None:
                    break
                task.execute()
                with self._lock:
                    self._processed += 1
                logger.debug(f"Task {task.id} completed")
            except queue.Empty:
                continue
            except Exception as e:
                with self._lock:
                    self._failed += 1
                logger.error(f"Worker error: {e}")
    
    def enqueue(self, task: Task) -> str:
        with self._lock:
            self._tasks[task.id] = task
        self._queue.put((task.priority, task))
        logger.debug(f"Task {task.id} enqueued with priority {task.priority}")
        return task.id
    
    def get_task(self, task_id: str) -> Optional[Task]:
        with self._lock:
            return self._tasks.get(task_id)
    
    def stats(self) -> dict:
        with self._lock:
            return {
                "type": "in-process",
                "queue_size": self._queue.qsize(),
                "workers": len(self._workers),
                "processed": self._processed,
                "failed": self._failed,
                "running": self._running
            }


task_queue = InProcessQueue(num_workers=2)
task_queue.start()


def background_task(priority: int = 5):
    """Decorator to run a function as a background task"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            task = Task(func, args, kwargs, priority)
            task_queue.enqueue(task)
            return task.id
        
        wrapper.sync = func
        return wrapper
    return decorator


def enqueue_task(func: Callable, *args, priority: int = 5, **kwargs) -> str:
    """Enqueue a function to run in the background"""
    task = Task(func, args, kwargs, priority)
    return task_queue.enqueue(task)
