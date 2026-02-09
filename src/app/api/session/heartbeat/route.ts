import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.config';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const userId = session.user.id;
        const userAgent = request.headers.get('user-agent');
        const forwarded = request.headers.get('x-forwarded-for');
        const ipAddress = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || 'unknown';

        // Create a unique session token based on user + user agent (simplified)
        const sessionToken = `${userId}-${Buffer.from(userAgent || 'unknown').toString('base64').slice(0, 20)}`;

        // Upsert the session - create if not exists, update lastActiveAt if exists
        await prisma.userSession.upsert({
            where: { sessionToken },
            create: {
                userId,
                sessionToken,
                userAgent,
                ipAddress,
                lastActiveAt: new Date(),
            },
            update: {
                lastActiveAt: new Date(),
                ipAddress, // Update IP in case it changed
            },
        });

        // Also update the User's main lastActiveAt
        await prisma.user.update({
            where: { id: userId },
            data: { lastActiveAt: new Date() }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Session heartbeat error:', error);
        return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
    }
}

// Clean up old sessions (called occasionally)
export async function DELETE() {
    try {
        const fiveMinutesAgo = new Date();
        fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 30);

        // Delete sessions inactive for more than 30 minutes
        await prisma.userSession.deleteMany({
            where: { lastActiveAt: { lt: fiveMinutesAgo } }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Session cleanup error:', error);
        return NextResponse.json({ error: 'Failed to clean sessions' }, { status: 500 });
    }
}
