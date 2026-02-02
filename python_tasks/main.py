import logging
import threading
import time
import schedule
import asyncio
import os
from dotenv import load_dotenv

# Try to load .env.local first, then .env
if os.path.exists('.env.local'):
    load_dotenv('.env.local')
else:
    load_dotenv()

from fastapi import FastAPI, BackgroundTasks
from contextlib import asynccontextmanager
import uvicorn
from pydantic import BaseModel

# Services
from services.quality import run_quality_checks
from services.jobs import run_daily_analytics_etl
from services.unstructured import scan_policies
from services.ingestion import router as ingestion_router
from services.ml_models import (
    run_content_moderation,
    run_community_health_analysis,
    run_user_engagement_check,
    ContentModerationModel,
    SentimentAnalyzer
)

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('neurokid_data_service')

# Helper for running Async jobs in Sync Scheduler
def run_async(job_func):
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(job_func())
        loop.close()
    except Exception as e:
        logger.error(f"Scheduler failed to run async job: {e}")

# Scheduler Logic
def run_scheduler():
    logger.info("Scheduler thread started")
    while True:
        schedule.run_pending()
        time.sleep(1)

def setup_schedule():
    # Schedule ETL to run every night at 2 AM
    schedule.every().day.at("02:00").do(lambda: run_async(run_daily_analytics_etl))
    # Run Quality Checks every 6 hours
    schedule.every(6).hours.do(lambda: run_async(run_quality_checks))
    # Scan policies daily
    schedule.every().day.at("04:00").do(lambda: run_async(scan_policies))

    # ML Automations
    # Content moderation runs every 2 hours to catch new posts quickly
    schedule.every(2).hours.do(lambda: run_async(run_content_moderation))
    # Community health analysis runs daily at 6 AM
    schedule.every().day.at("06:00").do(lambda: run_async(run_community_health_analysis))
    # User engagement check runs daily at 8 AM
    schedule.every().day.at("08:00").do(lambda: run_async(run_user_engagement_check))

    logger.info("Scheduled tasks configured (including ML automations)")

# FastAPI Lifespan
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting Data Operations Service...")
    setup_schedule()
    scheduler_thread = threading.Thread(target=run_scheduler, daemon=True)
    scheduler_thread.start()
    
    # Run an initial scan on startup
    # We can use asyncio.create_task because we are in an async context
    asyncio.create_task(scan_policies())
    
    yield
    # Shutdown
    logger.info("Shutting down Data Operations Service...")

app = FastAPI(title="NeuroKid Data Ops", lifespan=lifespan)

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "data-ops"}

app.include_router(ingestion_router, prefix="/api")

@app.post("/api/quality/run")
async def trigger_quality_checks(background_tasks: BackgroundTasks):
    background_tasks.add_task(run_quality_checks)
    return {"status": "triggered", "job": "quality_checks"}

@app.post("/api/jobs/etl/daily")
async def trigger_etl(background_tasks: BackgroundTasks):
    background_tasks.add_task(run_daily_analytics_etl)
    return {"status": "triggered", "job": "daily_analytics_etl"}

@app.post("/api/catalog/scan")
async def trigger_scan(background_tasks: BackgroundTasks):
    background_tasks.add_task(scan_policies)
    return {"status": "triggered", "job": "policy_scan"}


# =============================================================================
# ML AUTOMATION ENDPOINTS
# =============================================================================

class TextAnalysisRequest(BaseModel):
    """Request model for text analysis endpoints."""
    text: str


@app.post("/api/ml/moderate")
async def analyze_content(request: TextAnalysisRequest):
    """
    Analyze content for moderation using ML model.
    Purpose: Real-time content moderation for community safety.
    """
    moderator = ContentModerationModel()
    result = moderator.predict(request.text)
    return {
        "status": "success",
        "analysis": result,
        "purpose": "Protect NeuroKid community by flagging harmful or spam content"
    }


@app.post("/api/ml/sentiment")
async def analyze_sentiment(request: TextAnalysisRequest):
    """
    Analyze sentiment of text.
    Purpose: Monitor community emotional health and identify users needing support.
    """
    analyzer = SentimentAnalyzer()
    result = analyzer.analyze(request.text)
    return {
        "status": "success",
        "analysis": result,
        "purpose": "Identify community members who may need additional support"
    }


@app.post("/api/ml/moderation/run")
async def trigger_content_moderation(background_tasks: BackgroundTasks):
    """
    Trigger batch content moderation job.
    Purpose: Scan recent posts/comments and flag problematic content.
    """
    background_tasks.add_task(run_content_moderation)
    return {
        "status": "triggered",
        "job": "content_moderation",
        "purpose": "Automated safety screening for community content"
    }


@app.post("/api/ml/community-health/run")
async def trigger_community_health(background_tasks: BackgroundTasks):
    """
    Trigger community health analysis.
    Purpose: Generate sentiment report to monitor overall community wellbeing.
    """
    background_tasks.add_task(run_community_health_analysis)
    return {
        "status": "triggered",
        "job": "community_health_analysis",
        "purpose": "Track community emotional health and identify support needs"
    }


@app.post("/api/ml/engagement/run")
async def trigger_engagement_check(background_tasks: BackgroundTasks):
    """
    Trigger user engagement analysis.
    Purpose: Identify users at risk of disengagement to provide proactive support.
    """
    background_tasks.add_task(run_user_engagement_check)
    return {
        "status": "triggered",
        "job": "user_engagement_check",
        "purpose": "Identify and support users who may be disengaging"
    }


@app.get("/api/ml/status")
def ml_status():
    """
    Get ML services status and descriptions.
    Purpose: Documentation and health check for ML automation services.
    """
    return {
        "status": "healthy",
        "services": {
            "content_moderation": {
                "description": "ML-powered text classification to identify spam, harmful content, and posts needing review",
                "model": "TF-IDF + Naive Bayes",
                "schedule": "Every 2 hours",
                "purpose": "Protect autistic children and families from harmful content"
            },
            "sentiment_analysis": {
                "description": "Sentiment classification to monitor community emotional health",
                "model": "TF-IDF + Naive Bayes",
                "schedule": "Daily at 6 AM",
                "purpose": "Identify parents who may need additional support"
            },
            "user_engagement": {
                "description": "Predictive analytics for user churn risk",
                "model": "Random Forest + Heuristic Rules",
                "schedule": "Daily at 8 AM",
                "purpose": "Proactively engage users before they disengage"
            },
            "anomaly_detection": {
                "description": "Isolation Forest for detecting unusual data patterns",
                "model": "Isolation Forest",
                "schedule": "Every 6 hours (with quality checks)",
                "purpose": "Ensure data quality and detect potential abuse"
            }
        },
        "data_governance": {
            "framework": "HIPAA Safe Harbor compliant",
            "phi_detection": "Automatic PHI/PII scanning and redaction",
            "audit_logging": "Structured JSON audit trails for compliance"
        }
    }


if __name__ == "__main__":
    import os
    port = int(os.environ.get("PYTHON_API_PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
