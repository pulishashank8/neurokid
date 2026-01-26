"""User management API routes"""

from fastapi import APIRouter, Query, HTTPException
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from datetime import datetime

router = APIRouter(prefix="/users", tags=["users"])


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    email: str
    createdAt: datetime
    lastLoginAt: Optional[datetime] = None
    role: Optional[str] = None
    username: Optional[str] = None
    displayName: Optional[str] = None
    avatarUrl: Optional[str] = None


class UserDetailResponse(UserResponse):
    bio: Optional[str] = None
    location: Optional[str] = None


class UserListResponse(BaseModel):
    users: List[UserResponse]
    total: int
    page: int
    limit: int


class UserActivityResponse(BaseModel):
    posts: List[dict]
    comments: List[dict]


@router.get("", response_model=UserListResponse)
async def list_users(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None
):
    """List all users with pagination"""
    from api.database import UserRepository
    
    offset = (page - 1) * limit
    users = UserRepository.get_all(limit=limit, offset=offset, search=search)
    total = UserRepository.get_count(search=search)
    
    return {
        "users": users,
        "total": total,
        "page": page,
        "limit": limit
    }


@router.get("/{user_id}", response_model=UserDetailResponse)
async def get_user(user_id: str):
    """Get user details by ID"""
    from api.database import UserRepository
    
    user = UserRepository.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/{user_id}/activity", response_model=UserActivityResponse)
async def get_user_activity(user_id: str, limit: int = Query(20, ge=1, le=50)):
    """Get user's posts and comments"""
    from api.database import UserRepository
    
    user = UserRepository.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    posts = UserRepository.get_user_posts(user_id, limit=limit)
    comments = UserRepository.get_user_comments(user_id, limit=limit)
    
    return {
        "posts": posts,
        "comments": comments
    }


@router.delete("/{user_id}")
async def delete_user(user_id: str, anonymize: bool = Query(True)):
    """Delete or anonymize a user"""
    from api.database import UserRepository, execute_write, AuditRepository
    
    user = UserRepository.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if anonymize:
        execute_write('''
            UPDATE "Post" SET "isAnonymous" = true WHERE "authorId" = %s
        ''', (user_id,))
        execute_write('''
            UPDATE "Comment" SET "isAnonymous" = true WHERE "authorId" = %s
        ''', (user_id,))
        execute_write('''
            UPDATE "User" SET email = %s, "hashedPassword" = NULL WHERE id = %s
        ''', (f'deleted_{user_id}@deleted.neurokid.help', user_id))
        action = "user_anonymized"
    else:
        execute_write('DELETE FROM "User" WHERE id = %s', (user_id,))
        action = "user_deleted"
    
    AuditRepository.create_log(
        action="ACCOUNT_DELETED",
        user_id=user_id,
        resource="user",
        resource_id=user_id,
        details={"action": action}
    )
    
    return {"success": True, "action": action}
