/**
 * Data Quality API
 *
 * Provides access to data quality rules and results:
 * - List quality rules by dataset
 * - Get quality check results
 * - Run quality checks manually
 * - Quality score metrics
 *
 * This demonstrates data quality monitoring for enterprise governance.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

const querySchema = z.object({
  datasetId: z.string().optional(),
  ruleType: z.enum(['NULL_CHECK', 'REGEX_MATCH', 'RANGE_CHECK', 'FOREIGN_KEY', 'ANOMALY_DETECTION', 'CUSTOM_SQL']).optional(),
  severity: z.enum(['WARNING', 'CRITICAL']).optional(),
  includeResults: z.coerce.boolean().default(false),
  limit: z.coerce.number().default(100),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const query = querySchema.parse(searchParams);

    // Build where clause
    const where: Prisma.DataQualityRuleWhereInput = { isActive: true };

    if (query.datasetId) {
      where.datasetId = query.datasetId;
    }

    if (query.ruleType) {
      where.ruleType = query.ruleType;
    }

    if (query.severity) {
      where.severity = query.severity;
    }

    // Fetch rules with optional results
    const rules = await prisma.dataQualityRule.findMany({
      where,
      include: {
        dataset: {
          select: {
            id: true,
            name: true,
            sensitivity: true,
          },
        },
        executions: query.includeResults ? {
          take: 10,
          orderBy: { runDate: 'desc' },
        } : false,
      },
      take: query.limit,
      orderBy: [
        { severity: 'desc' },
        { name: 'asc' },
      ],
    });

    // Get latest results for summary
    const latestResults = await prisma.dataQualityResult.findMany({
      take: 100,
      orderBy: { runDate: 'desc' },
      distinct: ['ruleId'],
      include: {
        rule: {
          select: {
            name: true,
            severity: true,
            datasetId: true,
          },
        },
      },
    });

    // Calculate summary stats
    const passCount = latestResults.filter(r => r.status === 'PASS').length;
    const failCount = latestResults.filter(r => r.status === 'FAIL').length;
    const errorCount = latestResults.filter(r => r.status === 'ERROR').length;
    const total = latestResults.length;

    const qualityScore = total > 0 ? Math.round((passCount / total) * 100) : 100;

    // Critical failures
    const criticalFailures = latestResults.filter(
      r => r.status === 'FAIL' && r.rule.severity === 'CRITICAL'
    );

    return NextResponse.json({
      success: true,
      data: {
        rules,
        summary: {
          totalRules: rules.length,
          qualityScore,
          latestResults: {
            passed: passCount,
            failed: failCount,
            errors: errorCount,
            total,
          },
          criticalFailures: criticalFailures.map(f => ({
            ruleName: f.rule.name,
            failuresFound: f.failuresFound,
            runDate: f.runDate,
          })),
        },
      },
    });
  } catch (error) {
    console.error('[API] Quality error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'QUALITY_ERROR', message: 'Failed to fetch quality data' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/governance/quality
 * Run quality checks for a specific dataset
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { datasetId, ruleIds } = body;

    // Get rules to execute
    const where: Prisma.DataQualityRuleWhereInput = { isActive: true };
    if (datasetId) where.datasetId = datasetId;
    if (ruleIds) where.id = { in: ruleIds };

    const rules = await prisma.dataQualityRule.findMany({
      where,
      include: { dataset: true },
    });

    const results: Array<{
      ruleId: string;
      ruleName: string;
      status: string;
      recordsChecked: number;
      failuresFound: number;
      executionTimeMs: number;
    }> = [];

    // Execute each rule
    for (const rule of rules) {
      const startTime = Date.now();
      let status = 'PASS';
      let recordsChecked = 0;
      let failuresFound = 0;

      try {
        const criteria = rule.criteria as Record<string, unknown>;

        // Execute based on rule type
        switch (rule.ruleType) {
          case 'NULL_CHECK': {
            const tableName = rule.dataset.name;
            const fieldName = rule.fieldName;
            if (fieldName) {
              try {
                const result = await prisma.$queryRawUnsafe<Array<{ total: bigint; nulls: bigint }>>(
                  `SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE "${fieldName}" IS NULL) as nulls FROM "${tableName}"`
                );
                recordsChecked = Number(result[0]?.total || 0);
                failuresFound = Number(result[0]?.nulls || 0);
                if (failuresFound > 0 && !criteria.allowNull) {
                  status = 'FAIL';
                }
              } catch {
                // Table might not exist yet
                status = 'ERROR';
              }
            }
            break;
          }

          case 'RANGE_CHECK': {
            const tableName = rule.dataset.name;
            const fieldName = rule.fieldName;
            const min = criteria.min as number | undefined;
            const max = criteria.max as number | undefined;

            if (fieldName && (min !== undefined || max !== undefined)) {
              try {
                let query = `SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE `;
                const conditions: string[] = [];
                if (min !== undefined) conditions.push(`"${fieldName}" < ${min}`);
                if (max !== undefined) conditions.push(`"${fieldName}" > ${max}`);
                query += conditions.join(' OR ');
                query += `) as failures FROM "${tableName}"`;

                const result = await prisma.$queryRawUnsafe<Array<{ total: bigint; failures: bigint }>>(query);
                recordsChecked = Number(result[0]?.total || 0);
                failuresFound = Number(result[0]?.failures || 0);
                if (failuresFound > 0) status = 'FAIL';
              } catch {
                status = 'ERROR';
              }
            }
            break;
          }

          case 'CUSTOM_SQL': {
            const sql = criteria.sql as string;
            if (sql) {
              try {
                const result = await prisma.$queryRawUnsafe<Array<{ failures: bigint }>>(sql);
                failuresFound = Number(result[0]?.failures || 0);
                recordsChecked = 1; // Custom SQL
                if (failuresFound > (criteria.expectedValue as number || 0)) {
                  status = 'FAIL';
                }
              } catch {
                status = 'ERROR';
              }
            }
            break;
          }

          default:
            // Other rule types would be implemented similarly
            recordsChecked = 0;
        }
      } catch (error) {
        console.error(`[Quality] Rule ${rule.name} error:`, error);
        status = 'ERROR';
      }

      const executionTimeMs = Date.now() - startTime;

      // Store result
      await prisma.dataQualityResult.create({
        data: {
          ruleId: rule.id,
          status,
          recordsChecked,
          failuresFound,
          executionDurationMs: executionTimeMs,
          runDate: new Date(),
        },
      });

      results.push({
        ruleId: rule.id,
        ruleName: rule.name,
        status,
        recordsChecked,
        failuresFound,
        executionTimeMs,
      });
    }

    // Calculate overall score
    const passed = results.filter(r => r.status === 'PASS').length;
    const qualityScore = results.length > 0 ? Math.round((passed / results.length) * 100) : 100;

    return NextResponse.json({
      success: true,
      data: {
        results,
        summary: {
          totalRules: results.length,
          passed,
          failed: results.filter(r => r.status === 'FAIL').length,
          errors: results.filter(r => r.status === 'ERROR').length,
          qualityScore,
        },
      },
    });
  } catch (error) {
    console.error('[API] Quality execution error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'QUALITY_EXECUTION_ERROR', message: 'Failed to execute quality checks' } },
      { status: 500 }
    );
  }
}
