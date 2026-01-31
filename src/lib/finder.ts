import { prisma } from "@/lib/prisma";

/**
 * Synchronizes a user's profile data to the UserFinder table for optimized searching.
 * This should be called whenever a user's profile is created or updated.
 */
export async function syncUserToFinder(userId: string) {
    try {
        const profile = await prisma.profile.findUnique({
            where: { userId },
            select: {
                username: true,
                displayName: true,
                avatarUrl: true,
            },
        });

        if (!profile) return;

        // Create a normalized keyword string for case-insensitive searching
        const keywords = `${profile.username.toLowerCase()} ${profile.displayName.toLowerCase()}`;

        await prisma.userFinder.upsert({
            where: { userId },
            update: {
                username: profile.username,
                displayName: profile.displayName,
                keywords,
                avatarUrl: profile.avatarUrl,
            },
            create: {
                userId,
                username: profile.username,
                displayName: profile.displayName,
                keywords,
                avatarUrl: profile.avatarUrl,
            },
        });
    } catch (error) {
        console.error(`Failed to sync user ${userId} to finder:`, error);
        // Non-blocking error - we don't want to fail the profile update if sync fails,
        // but we should log it. In a robust system, this might go to a queue.
    }
}
