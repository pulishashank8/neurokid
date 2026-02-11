
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
    try {
        // Try Python Service first (if running)
        try {
            const res = await fetch('http://127.0.0.1:8000/api/quality/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: AbortSignal.timeout(5000), // 5 second timeout
            });

            if (res.ok) {
                const data = await res.json();
                return NextResponse.json({ success: true, data, source: 'python' });
            }
        } catch {
            // Python service not available, use TypeScript fallback
        }

        // Fallback to TypeScript-based quality engine
        const rules = await prisma.dataQualityRule.findMany({
            where: { isActive: true },
            include: { dataset: true },
        });

        const results: Array<{
            ruleId: string;
            ruleName: string;
            status: string;
            recordsChecked: number;
            failuresFound: number;
        }> = [];

        for (const rule of rules) {
            const startTime = Date.now();
            let status = 'PASS';
            let recordsChecked = 0;
            let failuresFound = 0;

            try {
                const criteria = rule.criteria as Record<string, unknown>;

                switch (rule.ruleType) {
                    case 'NULL_CHECK': {
                        const fieldName = rule.fieldName;
                        if (fieldName) {
                            try {
                                const result = await prisma.$queryRawUnsafe<Array<{ total: bigint; nulls: bigint }>>(
                                    `SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE "${fieldName}" IS NULL) as nulls FROM "${rule.dataset.name}"`
                                );
                                recordsChecked = Number(result[0]?.total || 0);
                                failuresFound = Number(result[0]?.nulls || 0);
                                if (failuresFound > 0 && !criteria.allowNull) {
                                    status = 'FAIL';
                                }
                            } catch {
                                status = 'ERROR';
                            }
                        }
                        break;
                    }
                    case 'RANGE_CHECK': {
                        const fieldName = rule.fieldName;
                        const min = criteria.min as number | undefined;
                        const max = criteria.max as number | undefined;
                        if (fieldName && (min !== undefined || max !== undefined)) {
                            try {
                                let query = `SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE `;
                                const conditions: string[] = [];
                                if (min !== undefined) conditions.push(`"${fieldName}" < ${min}`);
                                if (max !== undefined) conditions.push(`"${fieldName}" > ${max}`);
                                query += conditions.join(' OR ') + `) as failures FROM "${rule.dataset.name}"`;
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
                                recordsChecked = 1;
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
                        recordsChecked = 0;
                }
            } catch {
                status = 'ERROR';
            }

            // Store result
            await prisma.dataQualityResult.create({
                data: {
                    ruleId: rule.id,
                    status,
                    recordsChecked,
                    failuresFound,
                    executionDurationMs: Date.now() - startTime,
                    runDate: new Date(),
                },
            });

            results.push({
                ruleId: rule.id,
                ruleName: rule.name,
                status,
                recordsChecked,
                failuresFound,
            });
        }

        const passed = results.filter(r => r.status === 'PASS').length;
        const qualityScore = results.length > 0 ? Math.round((passed / results.length) * 100) : 100;

        return NextResponse.json({
            success: true,
            source: 'typescript',
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
        console.error("Failed to trigger quality checks:", error);
        return NextResponse.json({ success: false, error: 'Failed to run quality checks' }, { status: 500 });
    }
}
