/**
 * Data Catalog API
 *
 * Provides access to the data governance catalog:
 * - List all datasets with metadata
 * - Filter by sensitivity, domain
 * - Get field-level details
 *
 * This demonstrates data cataloging capabilities for enterprise governance.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Prisma, DataSensitivity } from '@prisma/client';

const querySchema = z.object({
  sensitivity: z.enum(['PUBLIC', 'INTERNAL', 'SENSITIVE', 'PII', 'PHI']).optional(),
  domain: z.string().optional(),
  search: z.string().optional(),
  includeFields: z.coerce.boolean().default(false),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const query = querySchema.parse(searchParams);

    // Build where clause
    const where: Prisma.DatasetWhereInput = {};

    if (query.sensitivity) {
      where.sensitivity = query.sensitivity;
    }

    if (query.domain) {
      where.domain = query.domain;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    // Fetch datasets
    const datasets = await prisma.dataset.findMany({
      where,
      include: {
        owner: true,
        fields: query.includeFields,
        qualityRules: {
          select: {
            id: true,
            name: true,
            severity: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            fields: true,
            qualityRules: true,
          },
        },
      },
      orderBy: [
        { sensitivity: 'desc' },
        { name: 'asc' },
      ],
    });

    // Get summary statistics
    const stats = await prisma.dataset.groupBy({
      by: ['sensitivity'],
      _count: true,
    });

    const domainStats = await prisma.dataset.groupBy({
      by: ['domain'],
      _count: true,
    });

    return NextResponse.json({
      success: true,
      data: {
        datasets,
        summary: {
          total: datasets.length,
          bySensitivity: stats.reduce((acc, s) => {
            acc[s.sensitivity] = s._count;
            return acc;
          }, {} as Record<string, number>),
          byDomain: domainStats.reduce((acc, d) => {
            acc[d.domain] = d._count;
            return acc;
          }, {} as Record<string, number>),
        },
      },
    });
  } catch (error) {
    console.error('[API] Catalog error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'CATALOG_ERROR', message: 'Failed to fetch catalog' } },
      { status: 500 }
    );
  }
}
