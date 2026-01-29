import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { subDays } from 'date-fns';

export async function POST() {
    if (!(await isAdminAuthenticated())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create a job execution record
    const job = await prisma.jobExecution.create({
        data: {
            jobName: 'Daily Analytics ETL',
            status: 'RUNNING',
            source: 'NextJS',
            recordsProcessed: 0,
        }
    });

    try {
        // Run analytics aggregation
        const thirtyDaysAgo = subDays(new Date(), 30);

        // Count various metrics
        const [userCount, postCount, commentCount, voteCount, loginCount] = await Promise.all([
            prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
            prisma.post.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
            prisma.comment.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
            prisma.vote.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
            prisma.user.count({ where: { lastLoginAt: { gte: thirtyDaysAgo } } }),
        ]);

        const totalProcessed = userCount + postCount + commentCount + voteCount;

        // Update job as successful
        await prisma.jobExecution.update({
            where: { id: job.id },
            data: {
                status: 'SUCCESS',
                recordsProcessed: totalProcessed,
                completedAt: new Date(),
                metadata: {
                    newUsers: userCount,
                    newPosts: postCount,
                    newComments: commentCount,
                    newVotes: voteCount,
                    activeUsers: loginCount,
                    period: '30 days',
                }
            }
        });

        return NextResponse.json({
            success: true,
            data: {
                jobId: job.id,
                recordsProcessed: totalProcessed,
                metrics: { userCount, postCount, commentCount, voteCount, loginCount }
            }
        });
    } catch (error) {
        console.error("ETL job failed:", error);

        // Mark job as failed
        await prisma.jobExecution.update({
            where: { id: job.id },
            data: {
                status: 'FAILED',
                completedAt: new Date(),
                errorLog: error instanceof Error ? error.message : 'Unknown error',
            }
        });

        return NextResponse.json({ success: false, error: 'ETL job failed' }, { status: 500 });
    }
}
