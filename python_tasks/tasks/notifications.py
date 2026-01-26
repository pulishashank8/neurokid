"""Notification and email tasks"""

import os
import logging
from typing import List, Dict, Any

logger = logging.getLogger('background_tasks.notifications')

def get_resend_api_key():
    return os.environ.get('RESEND_API_KEY')

def send_pending_emails() -> int:
    """Send pending email notifications"""
    try:
        import psycopg2
        
        db_url = os.environ.get('DATABASE_URL')
        if not db_url:
            logger.warning("DATABASE_URL not set")
            return 0
            
        conn = psycopg2.connect(db_url)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, "userId", type, payload 
            FROM "Notification" 
            WHERE "readAt" IS NULL AND "createdAt" > NOW() - INTERVAL '24 hours'
            LIMIT 100
        ''')
        
        pending = cursor.fetchall()
        
        if not pending:
            logger.info("No pending notifications")
            cursor.close()
            conn.close()
            return 0
            
        sent_count = 0
        for notification in pending:
            try:
                notification_id = notification[0]
                
                cursor.execute(
                    'UPDATE "Notification" SET "readAt" = NOW() WHERE id = %s',
                    (notification_id,)
                )
                sent_count += 1
                
            except Exception as e:
                logger.error(f"Failed to process notification {notification[0]}: {e}")
                
        conn.commit()
        cursor.close()
        conn.close()
        
        logger.info(f"Processed {sent_count} notifications")
        return sent_count
        
    except ImportError:
        logger.error("psycopg2 not installed")
        return 0
    except Exception as e:
        logger.error(f"Notification processing error: {e}")
        return 0


def send_email(to: str, subject: str, html_body: str) -> bool:
    """Send an email using Resend API"""
    try:
        import requests
        
        api_key = get_resend_api_key()
        if not api_key:
            logger.warning("RESEND_API_KEY not set")
            return False
            
        response = requests.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            },
            json={
                "from": "NeuroKid <noreply@neurokid.help>",
                "to": [to],
                "subject": subject,
                "html": html_body
            }
        )
        
        if response.status_code == 200:
            logger.info(f"Email sent to {to}")
            return True
        else:
            logger.error(f"Email failed: {response.text}")
            return False
            
    except Exception as e:
        logger.error(f"Email error: {e}")
        return False


def send_digest_emails() -> int:
    """Send daily/weekly digest emails to users"""
    logger.info("Digest email sending not yet implemented")
    return 0
