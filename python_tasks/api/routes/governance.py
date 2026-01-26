"""Data governance API routes"""

from fastapi import APIRouter, Query, HTTPException
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime
import json

router = APIRouter(prefix="/governance", tags=["governance"])


class AuditLogResponse(BaseModel):
    id: str
    action: str
    userId: Optional[str] = None
    resource: Optional[str] = None
    resourceId: Optional[str] = None
    details: Optional[dict] = None
    createdAt: datetime
    username: Optional[str] = None

    class Config:
        from_attributes = True


class AuditLogListResponse(BaseModel):
    logs: List[AuditLogResponse]
    page: int
    limit: int


class DataExportResponse(BaseModel):
    user: dict
    posts: List[dict]
    comments: List[dict]
    votes: List[dict]
    exportedAt: datetime


class RetentionStats(BaseModel):
    total_users: int
    inactive_30d: int
    inactive_90d: int
    deleted_posts: int
    old_audit_logs: int


@router.get("/audit-logs", response_model=AuditLogListResponse)
async def get_audit_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    action: Optional[str] = None,
    user_id: Optional[str] = None
):
    """Get audit logs with filtering"""
    from api.database import AuditRepository
    
    offset = (page - 1) * limit
    logs = AuditRepository.get_logs(limit=limit, offset=offset, action=action, user_id=user_id)
    
    for log in logs:
        if log.get('details') and isinstance(log['details'], str):
            try:
                log['details'] = json.loads(log['details'])
            except:
                pass
    
    return {
        "logs": logs,
        "page": page,
        "limit": limit
    }


@router.get("/export/{user_id}", response_model=DataExportResponse)
async def export_user_data(user_id: str):
    """Export all data for a specific user (GDPR compliance)"""
    from api.database import execute_query, AuditRepository
    
    user = execute_query('''
        SELECT u.id, u.email, u."createdAt", u."lastLoginAt",
               p.username, p."displayName", p.bio, p.location,
               (SELECT r.role FROM "UserRole" r WHERE r."userId" = u.id LIMIT 1) as role
        FROM "User" u
        LEFT JOIN "Profile" p ON u.id = p."userId"
        WHERE u.id = %s
    ''', (user_id,), fetch_one=True)
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    posts = execute_query('''
        SELECT id, title, content, "createdAt", "updatedAt", status
        FROM "Post" WHERE "authorId" = %s
    ''', (user_id,))
    
    comments = execute_query('''
        SELECT c.id, c.content, c."createdAt", p.title as "postTitle"
        FROM "Comment" c
        JOIN "Post" p ON c."postId" = p.id
        WHERE c."authorId" = %s
    ''', (user_id,))
    
    votes = execute_query('''
        SELECT "targetType", "targetId", value, "createdAt"
        FROM "Vote" WHERE "userId" = %s
    ''', (user_id,))
    
    AuditRepository.create_log(
        action="DATA_EXPORT",
        user_id=user_id,
        resource="user",
        resource_id=user_id,
        details={"action": "full_data_export"}
    )
    
    return {
        "user": user,
        "posts": posts,
        "comments": comments,
        "votes": votes,
        "exportedAt": datetime.now()
    }


@router.get("/retention-stats", response_model=RetentionStats)
async def get_retention_stats():
    """Get data retention statistics"""
    from api.database import execute_query
    
    total = execute_query('SELECT COUNT(*) as count FROM "User"', fetch_one=True)
    inactive_30 = execute_query('''
        SELECT COUNT(*) as count FROM "User" 
        WHERE "lastLoginAt" < NOW() - INTERVAL '30 days'
    ''', fetch_one=True)
    inactive_90 = execute_query('''
        SELECT COUNT(*) as count FROM "User" 
        WHERE "lastLoginAt" < NOW() - INTERVAL '90 days'
    ''', fetch_one=True)
    deleted = execute_query('''
        SELECT COUNT(*) as count FROM "Post" WHERE status = 'REMOVED'
    ''', fetch_one=True)
    old_logs = execute_query('''
        SELECT COUNT(*) as count FROM "AuditLog" 
        WHERE "createdAt" < NOW() - INTERVAL '90 days'
    ''', fetch_one=True)
    
    return {
        "total_users": total['count'] if total else 0,
        "inactive_30d": inactive_30['count'] if inactive_30 else 0,
        "inactive_90d": inactive_90['count'] if inactive_90 else 0,
        "deleted_posts": deleted['count'] if deleted else 0,
        "old_audit_logs": old_logs['count'] if old_logs else 0
    }


@router.post("/cleanup/audit-logs")
async def cleanup_audit_logs(days: int = Query(365, ge=30)):
    """Clean up old audit logs"""
    from api.database import execute_write, AuditRepository
    
    deleted = execute_write('''
        DELETE FROM "AuditLog" WHERE "createdAt" < NOW() - INTERVAL '%s days'
    ''', (days,))
    
    AuditRepository.create_log(
        action="DATA_CLEANUP",
        resource="audit_log",
        details={"deleted_count": deleted, "older_than_days": days}
    )
    
    return {"success": True, "deleted_count": deleted}


@router.post("/cleanup/sessions")
async def cleanup_expired_sessions():
    """Clean up expired sessions"""
    from api.database import execute_write
    
    deleted = execute_write('''
        DELETE FROM "Session" WHERE "expires" < NOW()
    ''')
    
    return {"success": True, "deleted_count": deleted}


@router.get("/data-catalog")
async def get_data_catalog():
    """Get data catalog - list of all tables and their purposes"""
    return {
        "tables": [
            {"name": "User", "purpose": "User accounts and authentication", "pii": True},
            {"name": "Profile", "purpose": "User profile information", "pii": True},
            {"name": "Post", "purpose": "Forum posts and discussions", "pii": False},
            {"name": "Comment", "purpose": "Comments on posts", "pii": False},
            {"name": "Vote", "purpose": "User votes on content", "pii": False},
            {"name": "Category", "purpose": "Post categories", "pii": False},
            {"name": "Tag", "purpose": "Post tags", "pii": False},
            {"name": "Provider", "purpose": "Healthcare providers directory", "pii": False},
            {"name": "Resource", "purpose": "Educational resources", "pii": False},
            {"name": "AuditLog", "purpose": "Security and activity audit trail", "pii": True},
            {"name": "Session", "purpose": "User sessions", "pii": True},
            {"name": "DirectMessage", "purpose": "Private messages between users", "pii": True},
        ],
        "retention_policies": {
            "audit_logs": "1 year",
            "sessions": "30 days after expiry",
            "deleted_content": "Anonymized, retained indefinitely",
            "user_data": "Until deletion request"
        }
    }
