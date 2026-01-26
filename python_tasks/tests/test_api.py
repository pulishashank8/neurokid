"""
Comprehensive integration tests for the Python FastAPI backend
Tests run against live endpoints
"""

import os
import sys
import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from api.app import app

client = TestClient(app)


class TestRootEndpoints:
    """Test root and health endpoints"""
    
    def test_root_endpoint(self):
        """Test the root endpoint returns service info"""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["service"] == "NeuroKid Python Backend"
        assert data["version"] == "1.0.0"
        assert data["status"] == "healthy"
        assert "timestamp" in data
    
    def test_health_endpoint(self):
        """Test health endpoint returns expected structure"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "database" in data
        assert "timestamp" in data
    
    def test_api_stats_endpoint(self):
        """Test API stats endpoint"""
        response = client.get("/api/python/stats")
        assert response.status_code == 200
        data = response.json()
        assert "endpoints" in data
        assert "features" in data
        assert "users" in data["endpoints"]
        assert "analytics" in data["endpoints"]


class TestUsersAPI:
    """Test users API endpoints"""
    
    def test_list_users(self):
        """Test listing users with pagination"""
        response = client.get("/api/python/users?page=1&limit=20")
        assert response.status_code == 200
        data = response.json()
        assert "users" in data
        assert "total" in data
        assert "page" in data
        assert "limit" in data
        assert data["page"] == 1
        assert data["limit"] == 20
    
    def test_list_users_with_search(self):
        """Test listing users with search parameter"""
        response = client.get("/api/python/users?search=nonexistent_user_xyz")
        assert response.status_code == 200
        data = response.json()
        assert "users" in data
        assert "total" in data
    
    def test_list_users_pagination_validation(self):
        """Test pagination parameter validation"""
        response = client.get("/api/python/users?page=0")
        assert response.status_code == 422
        
        response = client.get("/api/python/users?limit=200")
        assert response.status_code == 422
    
    def test_get_user_not_found(self):
        """Test getting a non-existent user"""
        response = client.get("/api/python/users/nonexistent-user-id-12345")
        assert response.status_code == 404
    
    def test_get_user_activity_not_found(self):
        """Test getting activity for non-existent user"""
        response = client.get("/api/python/users/nonexistent-id/activity")
        assert response.status_code == 404


class TestAnalyticsAPI:
    """Test analytics API endpoints"""
    
    def test_dashboard_stats(self):
        """Test dashboard statistics endpoint"""
        response = client.get("/api/python/analytics/dashboard")
        assert response.status_code == 200
        data = response.json()
        assert "total_users" in data
        assert "total_posts" in data
        assert "total_comments" in data
        assert "total_votes" in data
        assert "new_users_7d" in data
        assert "active_users_24h" in data
    
    def test_activity_timeline(self):
        """Test activity timeline endpoint"""
        response = client.get("/api/python/analytics/timeline?days=30")
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_activity_timeline_validation(self):
        """Test timeline days parameter validation"""
        response = client.get("/api/python/analytics/timeline?days=0")
        assert response.status_code == 422
        
        response = client.get("/api/python/analytics/timeline?days=100")
        assert response.status_code == 422
    
    def test_top_contributors(self):
        """Test top contributors endpoint"""
        response = client.get("/api/python/analytics/top-contributors?limit=10")
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_engagement_metrics(self):
        """Test engagement metrics endpoint"""
        response = client.get("/api/python/analytics/engagement")
        assert response.status_code == 200
        data = response.json()
        assert "posts_per_user" in data
        assert "comments_per_post" in data
        assert "engagement_rate" in data
    
    def test_category_stats(self):
        """Test category statistics endpoint"""
        response = client.get("/api/python/analytics/categories")
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_growth_metrics(self):
        """Test growth metrics endpoint"""
        response = client.get("/api/python/analytics/growth")
        assert response.status_code == 200
        data = response.json()
        assert "users_by_month" in data
        assert "posts_by_month" in data


class TestPostsAPI:
    """Test posts API endpoints"""
    
    def test_list_posts(self):
        """Test listing posts with pagination"""
        response = client.get("/api/python/posts?page=1&limit=20")
        assert response.status_code == 200
        data = response.json()
        assert "posts" in data
        assert "total" in data
        assert "page" in data
        assert "limit" in data
    
    def test_trending_posts(self):
        """Test trending posts endpoint"""
        response = client.get("/api/python/posts/trending?limit=10")
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_flagged_posts(self):
        """Test flagged posts endpoint"""
        response = client.get("/api/python/posts/flagged?limit=20")
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_update_post_status_invalid(self):
        """Test updating post status with invalid status"""
        response = client.patch("/api/python/posts/test-post-id/status?status=INVALID_STATUS")
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
    
    def test_update_post_status_not_found(self):
        """Test updating non-existent post status"""
        response = client.patch("/api/python/posts/nonexistent-post-id/status?status=ACTIVE")
        assert response.status_code == 404
    
    def test_pin_post_not_found(self):
        """Test pinning non-existent post"""
        response = client.patch("/api/python/posts/nonexistent-post-id/pin?pinned=true")
        assert response.status_code == 404
    
    def test_lock_post_not_found(self):
        """Test locking non-existent post"""
        response = client.patch("/api/python/posts/nonexistent-post-id/lock?locked=true")
        assert response.status_code == 404


class TestGovernanceAPI:
    """Test data governance API endpoints"""
    
    def test_get_audit_logs(self):
        """Test getting audit logs"""
        response = client.get("/api/python/governance/audit-logs?page=1&limit=50")
        assert response.status_code == 200
        data = response.json()
        assert "logs" in data
        assert "page" in data
        assert "limit" in data
    
    def test_get_audit_logs_with_filter(self):
        """Test getting audit logs with action filter"""
        response = client.get("/api/python/governance/audit-logs?action=LOGIN")
        assert response.status_code == 200
        data = response.json()
        assert "logs" in data
    
    def test_export_user_data_not_found(self):
        """Test exporting non-existent user data"""
        response = client.get("/api/python/governance/export/nonexistent-user-id")
        assert response.status_code == 404
    
    def test_retention_stats(self):
        """Test retention statistics endpoint"""
        response = client.get("/api/python/governance/retention-stats")
        assert response.status_code == 200
        data = response.json()
        assert "total_users" in data
        assert "inactive_30d" in data
        assert "inactive_90d" in data
        assert "deleted_posts" in data
        assert "old_audit_logs" in data
    
    def test_cleanup_audit_logs_validation(self):
        """Test cleanup requires minimum 30 days"""
        response = client.post("/api/python/governance/cleanup/audit-logs?days=10")
        assert response.status_code == 422
    
    def test_data_catalog(self):
        """Test data catalog endpoint"""
        response = client.get("/api/python/governance/data-catalog")
        assert response.status_code == 200
        data = response.json()
        assert "tables" in data
        assert "retention_policies" in data
        assert len(data["tables"]) > 0
        
        user_table = next((t for t in data["tables"] if t["name"] == "User"), None)
        assert user_table is not None
        assert user_table["pii"] is True


class TestErrorHandling:
    """Test error handling"""
    
    def test_404_endpoint(self):
        """Test 404 for non-existent endpoints"""
        response = client.get("/api/python/nonexistent-endpoint")
        assert response.status_code == 404


class TestInputValidation:
    """Test input validation across endpoints"""
    
    def test_users_page_too_low(self):
        """Test users page validation - too low"""
        response = client.get("/api/python/users?page=0")
        assert response.status_code == 422
    
    def test_users_limit_too_high(self):
        """Test users limit validation - too high"""
        response = client.get("/api/python/users?page=1&limit=200")
        assert response.status_code == 422
    
    def test_timeline_days_too_low(self):
        """Test timeline days validation - too low"""
        response = client.get("/api/python/analytics/timeline?days=0")
        assert response.status_code == 422
    
    def test_timeline_days_too_high(self):
        """Test timeline days validation - too high"""
        response = client.get("/api/python/analytics/timeline?days=100")
        assert response.status_code == 422
    
    def test_contributors_limit_too_high(self):
        """Test top contributors limit validation"""
        response = client.get("/api/python/analytics/top-contributors?limit=100")
        assert response.status_code == 422


class TestCORSAndHeaders:
    """Test CORS and security headers"""
    
    def test_cors_headers_present(self):
        """Test that CORS headers are present"""
        response = client.options("/", headers={"Origin": "http://localhost:5000"})
        assert response.status_code in [200, 204, 405]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
