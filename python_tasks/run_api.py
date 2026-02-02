#!/usr/bin/env python3
"""
Run the FastAPI backend server
"""

import os
import sys
from dotenv import load_dotenv

# Try to load .env.local first, then .env
if os.path.exists('.env.local'):
    load_dotenv('.env.local')
else:
    load_dotenv()

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import uvicorn
from api.app import app

if __name__ == "__main__":
    port = int(os.environ.get("PYTHON_API_PORT", 8000))
    print(f"Starting Python API server on port {port}...")
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
