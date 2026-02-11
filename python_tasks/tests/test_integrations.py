
import pytest
from integrations.snowflake_adapter import SnowflakeAdapter
from unittest.mock import MagicMock

class TestSnowflakeAdapter:
    
    def test_mock_mode(self):
        # Should default to mock mode if config missing
        adapter = SnowflakeAdapter()
        assert adapter.is_mock is True
        
        success = adapter.sync_table("TEST_TABLE", [{"id": 1}], ["id"])
        assert success is True

    def test_real_connection_attempt_mock_fallback(self):
        """When Snowflake connector/config is unavailable, adapter uses mock mode and operations succeed."""
        adapter = SnowflakeAdapter()
        # Adapter defaults to mock when config missing - verify sync works
        assert adapter.is_mock is True
        success = adapter.sync_table("TEST_TABLE", [{"id": 1}, {"id": 2}], ["id"])
        assert success is True
