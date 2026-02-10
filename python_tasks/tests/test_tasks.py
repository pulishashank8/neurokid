
"""
Tests for background tasks - Refactored for Async Architecture
"""

import os
import sys
import pytest
import asyncio
from unittest.mock import patch, AsyncMock, MagicMock

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Mocking database session context manager
class AsyncContextManagerMock:
    def __init__(self, session_mock):
        self.session = session_mock

    async def __aenter__(self):
        return self.session

    async def __aexit__(self, exc_type, exc, tb):
        pass

@pytest.mark.asyncio
class TestDatabaseTasks:
    """Test database maintenance tasks"""
    
    @patch('tasks.database.get_session')
    async def test_cleanup_audit_logs(self, mock_get_session):
        """Test audit log cleanup"""
        from tasks.database import cleanup_audit_logs
        
        # Setup Mock Session
        mock_session = AsyncMock()
        mock_result = MagicMock()
        mock_result.rowcount = 10
        mock_session.execute.return_value = mock_result
        
        mock_get_session.return_value = AsyncContextManagerMock(mock_session)
        
        result = await cleanup_audit_logs(days=90)
        
        assert result == 10
        mock_session.execute.assert_called()
    
    @patch('tasks.database.get_session')
    async def test_cleanup_expired_sessions(self, mock_get_session):
        """Test expired session cleanup"""
        from tasks.database import cleanup_expired_sessions
        
        mock_session = AsyncMock()
        mock_result = MagicMock()
        mock_result.rowcount = 5
        mock_session.execute.return_value = mock_result
        
        mock_get_session.return_value = AsyncContextManagerMock(mock_session)
        
        result = await cleanup_expired_sessions()
        
        assert result == 5
        mock_session.execute.assert_called()

class TestNotificationTasks:
    """Test notification tasks"""

    @pytest.mark.asyncio
    @patch('tasks.notifications.get_session')
    @patch('tasks.notifications.NotificationRepository')
    async def test_send_pending_emails(self, MockRepo, mock_get_session):
        """Test sending pending email notifications"""
        from tasks.notifications import send_pending_emails
        
        mock_session = AsyncMock()
        mock_get_session.return_value = AsyncContextManagerMock(mock_session)
        
        # Mock Repository behavior
        mock_repo_instance = MockRepo.return_value
        
        # Mock notification objects
        msg1 = MagicMock()
        msg1.id = "1"
        msg2 = MagicMock()
        msg2.id = "2"
        
        mock_repo_instance.get_pending_notifications = AsyncMock(return_value=[msg1, msg2])
        mock_repo_instance.mark_as_read = AsyncMock()
        
        result = await send_pending_emails()
        
        assert result == 2
        assert mock_repo_instance.mark_as_read.call_count == 2
    
    @patch('tasks.notifications.requests')
    def test_send_email(self, mock_requests):
        """Test sending an email (Sync function)"""
        from tasks.notifications import send_email
        
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_requests.post.return_value = mock_response
        
        with patch.dict(os.environ, {'RESEND_API_KEY': 'test_key'}):
            result = send_email("test@example.com", "Test Subject", "<p>Test</p>")
        
        assert result is True

@pytest.mark.asyncio
class TestAnalyticsTasks:
    """Test analytics processing tasks"""
    
    @patch('tasks.analytics.get_session')
    @patch('tasks.analytics.SnowflakeAdapter')
    async def test_process_daily_analytics(self, MockSnowflake, mock_get_session):
        """Test daily analytics processing"""
        from tasks.analytics import process_daily_analytics
        
        mock_session = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar.side_effect = [10, 5, 0, 0, 0, 0] # users, posts, drift checks...
        mock_session.execute.return_value = mock_result
        
        # Make check_data_drift return None (no drift) or mock the sub-calls
        # Alternatively, mocking session.execute covers the calls inside check_data_drift
        # For simple unit test, we just want to ensure it completes
        
        mock_get_session.return_value = AsyncContextManagerMock(mock_session)
        
        result = await process_daily_analytics()
        
        assert result is not None
        assert result['new_users'] == 10
        
        # Verify Snowflake Sync was attempted
        MockSnowflake.return_value.sync_table.assert_called()
