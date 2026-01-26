"""Database connection and models for FastAPI"""

import os
from contextlib import contextmanager
from typing import Optional, List, Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

DATABASE_URL = os.environ.get('DATABASE_URL', '')

def get_connection():
    """Get a database connection"""
    return psycopg2.connect(DATABASE_URL)

@contextmanager
def get_db():
    """Database connection context manager"""
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def execute_query(query: str, params: tuple = None, fetch_one: bool = False) -> Any:
    """Execute a query and return results"""
    with get_db() as conn:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute(query, params)
        if fetch_one:
            return dict(cursor.fetchone()) if cursor.rowcount > 0 else None
        return [dict(row) for row in cursor.fetchall()]

def execute_write(query: str, params: tuple = None) -> int:
    """Execute a write query and return affected rows"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(query, params)
        return cursor.rowcount


class UserRepository:
    @staticmethod
    def get_all(limit: int = 50, offset: int = 0, search: str = None) -> List[Dict]:
        query = '''
            SELECT u.id, u.email, u."createdAt", u."lastLoginAt",
                   p.username, p."displayName", p."avatarUrl",
                   (SELECT r.role FROM "UserRole" r WHERE r."userId" = u.id LIMIT 1) as role
            FROM "User" u
            LEFT JOIN "Profile" p ON u.id = p."userId"
        '''
        params = []
        if search:
            query += ' WHERE u.email ILIKE %s OR p.username ILIKE %s'
            params.extend([f'%{search}%', f'%{search}%'])
        query += ' ORDER BY u."createdAt" DESC LIMIT %s OFFSET %s'
        params.extend([limit, offset])
        return execute_query(query, tuple(params))

    @staticmethod
    def get_by_id(user_id: str) -> Optional[Dict]:
        query = '''
            SELECT u.id, u.email, u."createdAt", u."lastLoginAt",
                   p.username, p."displayName", p.bio, p."avatarUrl", p.location,
                   (SELECT r.role FROM "UserRole" r WHERE r."userId" = u.id LIMIT 1) as role
            FROM "User" u
            LEFT JOIN "Profile" p ON u.id = p."userId"
            WHERE u.id = %s
        '''
        return execute_query(query, (user_id,), fetch_one=True)

    @staticmethod
    def get_count(search: str = None) -> int:
        query = 'SELECT COUNT(*) as count FROM "User" u'
        params = []
        if search:
            query += ' LEFT JOIN "Profile" p ON u.id = p."userId" WHERE u.email ILIKE %s OR p.username ILIKE %s'
            params.extend([f'%{search}%', f'%{search}%'])
        result = execute_query(query, tuple(params) if params else None, fetch_one=True)
        return result['count'] if result else 0

    @staticmethod
    def get_user_posts(user_id: str, limit: int = 20) -> List[Dict]:
        query = '''
            SELECT id, title, "createdAt", "voteScore", status
            FROM "Post"
            WHERE "authorId" = %s
            ORDER BY "createdAt" DESC
            LIMIT %s
        '''
        return execute_query(query, (user_id, limit))

    @staticmethod
    def get_user_comments(user_id: str, limit: int = 20) -> List[Dict]:
        query = '''
            SELECT c.id, c.content, c."createdAt", c."voteScore", p.title as "postTitle"
            FROM "Comment" c
            JOIN "Post" p ON c."postId" = p.id
            WHERE c."authorId" = %s
            ORDER BY c."createdAt" DESC
            LIMIT %s
        '''
        return execute_query(query, (user_id, limit))


class PostRepository:
    @staticmethod
    def get_all(limit: int = 50, offset: int = 0, category_id: str = None) -> List[Dict]:
        query = '''
            SELECT p.id, p.title, p."createdAt", p."voteScore", p.status, p."isPinned",
                   c.name as "categoryName", pr.username as "authorUsername"
            FROM "Post" p
            LEFT JOIN "Category" c ON p."categoryId" = c.id
            LEFT JOIN "User" u ON p."authorId" = u.id
            LEFT JOIN "Profile" pr ON u.id = pr."userId"
        '''
        params = []
        if category_id:
            query += ' WHERE p."categoryId" = %s'
            params.append(category_id)
        query += ' ORDER BY p."createdAt" DESC LIMIT %s OFFSET %s'
        params.extend([limit, offset])
        return execute_query(query, tuple(params))

    @staticmethod
    def get_count(category_id: str = None) -> int:
        query = 'SELECT COUNT(*) as count FROM "Post"'
        params = []
        if category_id:
            query += ' WHERE "categoryId" = %s'
            params.append(category_id)
        result = execute_query(query, tuple(params) if params else None, fetch_one=True)
        return result['count'] if result else 0


class CommentRepository:
    @staticmethod
    def get_all(limit: int = 50, offset: int = 0) -> List[Dict]:
        query = '''
            SELECT c.id, c.content, c."createdAt", c."voteScore",
                   p.title as "postTitle", pr.username as "authorUsername"
            FROM "Comment" c
            JOIN "Post" p ON c."postId" = p.id
            LEFT JOIN "User" u ON c."authorId" = u.id
            LEFT JOIN "Profile" pr ON u.id = pr."userId"
            ORDER BY c."createdAt" DESC
            LIMIT %s OFFSET %s
        '''
        return execute_query(query, (limit, offset))

    @staticmethod
    def get_count() -> int:
        result = execute_query('SELECT COUNT(*) as count FROM "Comment"', fetch_one=True)
        return result['count'] if result else 0


class AnalyticsRepository:
    @staticmethod
    def get_dashboard_stats() -> Dict:
        stats = {}
        
        result = execute_query('SELECT COUNT(*) as count FROM "User"', fetch_one=True)
        stats['total_users'] = result['count'] if result else 0
        
        result = execute_query('SELECT COUNT(*) as count FROM "Post"', fetch_one=True)
        stats['total_posts'] = result['count'] if result else 0
        
        result = execute_query('SELECT COUNT(*) as count FROM "Comment"', fetch_one=True)
        stats['total_comments'] = result['count'] if result else 0
        
        result = execute_query('SELECT COUNT(*) as count FROM "Vote"', fetch_one=True)
        stats['total_votes'] = result['count'] if result else 0
        
        result = execute_query('''
            SELECT COUNT(*) as count FROM "User" 
            WHERE "createdAt" > NOW() - INTERVAL '7 days'
        ''', fetch_one=True)
        stats['new_users_7d'] = result['count'] if result else 0
        
        result = execute_query('''
            SELECT COUNT(*) as count FROM "User" 
            WHERE "lastLoginAt" > NOW() - INTERVAL '24 hours'
        ''', fetch_one=True)
        stats['active_users_24h'] = result['count'] if result else 0
        
        return stats

    @staticmethod
    def get_activity_timeline(days: int = 30) -> List[Dict]:
        query = '''
            SELECT DATE("createdAt") as date,
                   COUNT(*) FILTER (WHERE type = 'post') as posts,
                   COUNT(*) FILTER (WHERE type = 'comment') as comments,
                   COUNT(*) FILTER (WHERE type = 'user') as new_users
            FROM (
                SELECT "createdAt", 'post' as type FROM "Post"
                UNION ALL
                SELECT "createdAt", 'comment' as type FROM "Comment"
                UNION ALL
                SELECT "createdAt", 'user' as type FROM "User"
            ) activity
            WHERE "createdAt" > NOW() - INTERVAL '%s days'
            GROUP BY DATE("createdAt")
            ORDER BY date DESC
        '''
        return execute_query(query, (days,))

    @staticmethod
    def get_top_contributors(limit: int = 10) -> List[Dict]:
        query = '''
            SELECT u.id, p.username, p."displayName",
                   COUNT(DISTINCT po.id) as "postCount",
                   COUNT(DISTINCT c.id) as "commentCount",
                   COALESCE(SUM(po."voteScore"), 0) as "totalScore"
            FROM "User" u
            LEFT JOIN "Profile" p ON u.id = p."userId"
            LEFT JOIN "Post" po ON u.id = po."authorId"
            LEFT JOIN "Comment" c ON u.id = c."authorId"
            GROUP BY u.id, p.username, p."displayName"
            ORDER BY COUNT(DISTINCT po.id) + COUNT(DISTINCT c.id) DESC
            LIMIT %s
        '''
        return execute_query(query, (limit,))


class AuditRepository:
    @staticmethod
    def get_logs(limit: int = 100, offset: int = 0, action: str = None, user_id: str = None) -> List[Dict]:
        query = '''
            SELECT a.id, a.action, a."userId", a."targetType" as resource, a."targetId" as "resourceId", 
                   a.changes as details, a."createdAt", p.username
            FROM "AuditLog" a
            LEFT JOIN "User" u ON a."userId" = u.id
            LEFT JOIN "Profile" p ON u.id = p."userId"
            WHERE 1=1
        '''
        params = []
        if action:
            query += ' AND a.action = %s'
            params.append(action)
        if user_id:
            query += ' AND a."userId" = %s'
            params.append(user_id)
        query += ' ORDER BY a."createdAt" DESC LIMIT %s OFFSET %s'
        params.extend([limit, offset])
        return execute_query(query, tuple(params))

    @staticmethod
    def create_log(action: str, user_id: str = None, resource: str = None, 
                   resource_id: str = None, details: dict = None) -> None:
        import json
        query = '''
            INSERT INTO "AuditLog" (id, action, "userId", "targetType", "targetId", changes, "createdAt")
            VALUES (gen_random_uuid(), %s, %s, %s, %s, %s, NOW())
        '''
        execute_write(query, (action, user_id, resource, resource_id, json.dumps(details) if details else None))
