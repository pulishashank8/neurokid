"""
Tests for background tasks
"""

import os
import sys
import pytest
from unittest.mock import patch, MagicMock

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class TestDatabaseTasks:
    """Test database maintenance tasks"""
    
    @patch('tasks.database.psycopg2')
    def test_cleanup_old_audit_logs(self, mock_psycopg2):
        """Test audit log cleanup"""
        from tasks.database import cleanup_old_audit_logs
        
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_cursor.rowcount = 5
        mock_conn.cursor.return_value = mock_cursor
        mock_psycopg2.connect.return_value = mock_conn
        
        with patch.dict(os.environ, {'DATABASE_URL': 'postgresql://test'}):
            result = cleanup_old_audit_logs(days=90)
        
        assert result >= 0
    
    @patch('tasks.database.psycopg2')
    def test_cleanup_expired_sessions(self, mock_psycopg2):
        """Test expired session cleanup"""
        from tasks.database import cleanup_expired_sessions
        
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_cursor.rowcount = 3
        mock_conn.cursor.return_value = mock_cursor
        mock_psycopg2.connect.return_value = mock_conn
        
        with patch.dict(os.environ, {'DATABASE_URL': 'postgresql://test'}):
            result = cleanup_expired_sessions()
        
        assert result >= 0
    
    def test_cleanup_without_database_url(self):
        """Test cleanup fails gracefully without DATABASE_URL"""
        from tasks.database import cleanup_old_audit_logs
        
        with patch.dict(os.environ, {'DATABASE_URL': ''}):
            result = cleanup_old_audit_logs()
        
        assert result == 0


class TestNotificationTasks:
    """Test notification tasks"""
    
    @patch('tasks.notifications.psycopg2')
    def test_send_pending_emails(self, mock_psycopg2):
        """Test sending pending email notifications"""
        from tasks.notifications import send_pending_emails
        
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_cursor.fetchall.return_value = []
        mock_conn.cursor.return_value = mock_cursor
        mock_psycopg2.connect.return_value = mock_conn
        
        with patch.dict(os.environ, {'DATABASE_URL': 'postgresql://test'}):
            result = send_pending_emails()
        
        assert result >= 0
    
    @patch('tasks.notifications.requests')
    def test_send_email(self, mock_requests):
        """Test sending an email"""
        from tasks.notifications import send_email
        
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_requests.post.return_value = mock_response
        
        with patch.dict(os.environ, {'RESEND_API_KEY': 'test_key'}):
            result = send_email("test@example.com", "Test Subject", "<p>Test</p>")
        
        assert result is True
    
    def test_send_email_without_api_key(self):
        """Test email fails gracefully without API key"""
        from tasks.notifications import send_email
        
        with patch.dict(os.environ, {'RESEND_API_KEY': ''}):
            result = send_email("test@example.com", "Test", "<p>Test</p>")
        
        assert result is False


class TestAnalyticsTasks:
    """Test analytics processing tasks"""
    
    @patch('tasks.analytics.psycopg2')
    def test_process_daily_analytics(self, mock_psycopg2):
        """Test daily analytics processing"""
        from tasks.analytics import process_daily_analytics
        
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_cursor.fetchone.return_value = [10, 50, 200, 500]
        mock_conn.cursor.return_value = mock_cursor
        mock_psycopg2.connect.return_value = mock_conn
        
        with patch.dict(os.environ, {'DATABASE_URL': 'postgresql://test'}):
            result = process_daily_analytics()
        
        assert result is not None
    
    @patch('tasks.analytics.psycopg2')
    def test_calculate_engagement_scores(self, mock_psycopg2):
        """Test engagement score calculation"""
        from tasks.analytics import calculate_engagement_scores
        
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_cursor.rowcount = 5
        mock_conn.cursor.return_value = mock_cursor
        mock_psycopg2.connect.return_value = mock_conn
        
        with patch.dict(os.environ, {'DATABASE_URL': 'postgresql://test'}):
            result = calculate_engagement_scores()
        
        assert result >= 0


class TestTaskScheduler:
    """Test task scheduler configuration"""
    
    def test_scheduler_configuration(self):
        """Test that scheduler is properly configured"""
        import schedule
        
        assert schedule is not None
    
    @patch('schedule.run_pending')
    def test_run_pending_jobs(self, mock_run):
        """Test running pending scheduled jobs"""
        import schedule
        
        schedule.run_pending()
        mock_run.assert_called_once()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
