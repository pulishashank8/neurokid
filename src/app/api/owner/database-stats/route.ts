// src/app/api/owner/database-stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.config';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/owner/database-stats
 *
 * Returns comprehensive database statistics including:
 * - Unused indexes (candidates for removal)
 * - Most-used indexes
 * - Index cache hit ratio
 * - Table sizes with index bloat
 *
 * Requires OWNER role.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Require OWNER role
    if (!session?.user?.roles?.includes('OWNER' as any)) {
      return NextResponse.json(
        { error: 'Unauthorized - OWNER role required' },
        { status: 403 }
      );
    }

    // Query 1: Unused indexes (candidates for removal)
    const unusedIndexes = await prisma.$queryRaw<Array<{
      schemaname: string;
      tablename: string;
      indexname: string;
      times_used: bigint;
      index_size: string;
    }>>`
      SELECT
        schemaname,
        tablename,
        indexname,
        idx_scan as times_used,
        pg_size_pretty(pg_relation_size(indexrelid)) as index_size
      FROM pg_stat_user_indexes
      WHERE idx_scan = 0
        AND indexrelname NOT LIKE '%pkey%'
      ORDER BY pg_relation_size(indexrelid) DESC
      LIMIT 50
    `;

    // Query 2: Most-used indexes
    const popularIndexes = await prisma.$queryRaw<Array<{
      schemaname: string;
      tablename: string;
      indexname: string;
      times_used: bigint;
      tuples_read: bigint;
      tuples_fetched: bigint;
      index_size: string;
    }>>`
      SELECT
        schemaname,
        tablename,
        indexname,
        idx_scan as times_used,
        idx_tup_read as tuples_read,
        idx_tup_fetch as tuples_fetched,
        pg_size_pretty(pg_relation_size(indexrelid)) as index_size
      FROM pg_stat_user_indexes
      ORDER BY idx_scan DESC
      LIMIT 20
    `;

    // Query 3: Index cache hit ratio (should be > 99%)
    const cacheHitRatio = await prisma.$queryRaw<Array<{ ratio: number }>>`
      SELECT
        COALESCE(
          sum(idx_blks_hit)::float / NULLIF(sum(idx_blks_hit + idx_blks_read), 0)::float * 100,
          0
        ) as ratio
      FROM pg_statio_user_indexes
    `;

    // Query 4: Table sizes with index bloat
    const tableSizes = await prisma.$queryRaw<Array<{
      schemaname: string;
      tablename: string;
      total_size: string;
      table_size: string;
      index_size: string;
    }>>`
      SELECT
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
        pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      LIMIT 20
    `;

    // Convert bigints to numbers for JSON serialization
    const serializedUnusedIndexes = unusedIndexes.map(idx => ({
      ...idx,
      times_used: Number(idx.times_used)
    }));

    const serializedPopularIndexes = popularIndexes.map(idx => ({
      ...idx,
      times_used: Number(idx.times_used),
      tuples_read: Number(idx.tuples_read),
      tuples_fetched: Number(idx.tuples_fetched)
    }));

    return NextResponse.json({
      success: true,
      data: {
        unusedIndexes: serializedUnusedIndexes,
        popularIndexes: serializedPopularIndexes,
        cacheHitRatio: cacheHitRatio[0]?.ratio || 0,
        tableSizes,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Database stats error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch database stats',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
