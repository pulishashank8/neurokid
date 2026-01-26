"""Posts management API routes"""

from fastapi import APIRouter, Query, HTTPException
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from datetime import datetime

router = APIRouter(prefix="/posts", tags=["posts"])


class PostResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    title: str
    createdAt: datetime
    voteScore: int
    status: str
    isPinned: bool
    categoryName: Optional[str] = None
    authorUsername: Optional[str] = None


class PostListResponse(BaseModel):
    posts: List[PostResponse]
    total: int
    page: int
    limit: int


@router.get("", response_model=PostListResponse)
async def list_posts(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    category_id: Optional[str] = None
):
    """List all posts with pagination"""
    from api.database import PostRepository
    
    offset = (page - 1) * limit
    posts = PostRepository.get_all(limit=limit, offset=offset, category_id=category_id)
    total = PostRepository.get_count(category_id=category_id)
    
    return {
        "posts": posts,
        "total": total,
        "page": page,
        "limit": limit
    }


@router.get("/trending")
async def get_trending_posts(limit: int = Query(10, ge=1, le=50)):
    """Get trending posts by recent vote activity"""
    from api.database import execute_query
    
    query = '''
        SELECT p.id, p.title, p."createdAt", p."voteScore", p.status,
               c.name as "categoryName", pr.username as "authorUsername",
               COUNT(v.id) as "recentVotes"
        FROM "Post" p
        LEFT JOIN "Category" c ON p."categoryId" = c.id
        LEFT JOIN "User" u ON p."authorId" = u.id
        LEFT JOIN "Profile" pr ON u.id = pr."userId"
        LEFT JOIN "Vote" v ON p.id = v."targetId" AND v."targetType" = 'POST'
            AND v."createdAt" > NOW() - INTERVAL '24 hours'
        WHERE p.status = 'ACTIVE'
        GROUP BY p.id, p.title, p."createdAt", p."voteScore", p.status,
                 c.name, pr.username
        ORDER BY "recentVotes" DESC, p."voteScore" DESC
        LIMIT %s
    '''
    return execute_query(query, (limit,))


@router.get("/flagged")
async def get_flagged_posts(limit: int = Query(20, ge=1, le=100)):
    """Get posts that have been reported/flagged"""
    from api.database import execute_query
    
    query = '''
        SELECT p.id, p.title, p."createdAt", p."voteScore", p.status,
               c.name as "categoryName", pr.username as "authorUsername",
               COUNT(r.id) as "reportCount"
        FROM "Post" p
        LEFT JOIN "Category" c ON p."categoryId" = c.id
        LEFT JOIN "User" u ON p."authorId" = u.id
        LEFT JOIN "Profile" pr ON u.id = pr."userId"
        LEFT JOIN "Report" r ON p.id = r."targetId" AND r."targetType" = 'POST'
        WHERE r.id IS NOT NULL
        GROUP BY p.id, p.title, p."createdAt", p."voteScore", p.status,
                 c.name, pr.username
        ORDER BY "reportCount" DESC
        LIMIT %s
    '''
    return execute_query(query, (limit,))


@router.patch("/{post_id}/status")
async def update_post_status(post_id: str, status: str):
    """Update post status (moderate)"""
    from api.database import execute_write, AuditRepository
    
    valid_statuses = ['ACTIVE', 'HIDDEN', 'REMOVED', 'FLAGGED']
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    
    rows = execute_write('UPDATE "Post" SET status = %s WHERE id = %s', (status, post_id))
    
    if rows == 0:
        raise HTTPException(status_code=404, detail="Post not found")
    
    AuditRepository.create_log(
        action="CONTENT_MODERATION",
        resource="post",
        resource_id=post_id,
        details={"new_status": status}
    )
    
    return {"success": True, "post_id": post_id, "status": status}


@router.patch("/{post_id}/pin")
async def toggle_pin_post(post_id: str, pinned: bool):
    """Pin or unpin a post"""
    from api.database import execute_write
    
    rows = execute_write('UPDATE "Post" SET "isPinned" = %s WHERE id = %s', (pinned, post_id))
    
    if rows == 0:
        raise HTTPException(status_code=404, detail="Post not found")
    
    return {"success": True, "post_id": post_id, "isPinned": pinned}


@router.patch("/{post_id}/lock")
async def toggle_lock_post(post_id: str, locked: bool):
    """Lock or unlock a post"""
    from api.database import execute_write
    
    rows = execute_write('UPDATE "Post" SET "isLocked" = %s WHERE id = %s', (locked, post_id))
    
    if rows == 0:
        raise HTTPException(status_code=404, detail="Post not found")
    
    return {"success": True, "post_id": post_id, "isLocked": locked}
