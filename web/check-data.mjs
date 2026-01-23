import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkData() {
    try {
        console.log('\n📊 Checking your database data...\n');

        // Count users
        const userCount = await prisma.user.count();
        console.log(`👥 Users: ${userCount}`);

        // Count posts
        const postCount = await prisma.post.count();
        console.log(`📝 Posts: ${postCount}`);

        // Count comments
        const commentCount = await prisma.comment.count();
        console.log(`💬 Comments: ${commentCount}`);

        // Count providers
        const providerCount = await prisma.provider.count();
        console.log(`🏥 Providers: ${providerCount}`);

        // Count AI conversations
        const aiConvCount = await prisma.aIConversation.count();
        console.log(`🤖 AI Conversations: ${aiConvCount}`);

        // Show recent users (last 5)
        console.log('\n📋 Recent Users:');
        const recentUsers = await prisma.user.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: {
                email: true,
                createdAt: true,
                profile: {
                    select: {
                        username: true,
                        displayName: true
                    }
                }
            }
        });

        recentUsers.forEach((user, i) => {
            console.log(`  ${i + 1}. ${user.email} (${user.profile?.username || 'no username'}) - Created: ${user.createdAt.toLocaleDateString()}`);
        });

        // Show recent posts (last 5)
        if (postCount > 0) {
            console.log('\n📰 Recent Posts:');
            const recentPosts = await prisma.post.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                select: {
                    title: true,
                    createdAt: true,
                    author: {
                        select: {
                            email: true
                        }
                    }
                }
            });

            recentPosts.forEach((post, i) => {
                console.log(`  ${i + 1}. "${post.title}" by ${post.author.email} - ${post.createdAt.toLocaleDateString()}`);
            });
        }

        console.log('\n✅ Database connection successful!\n');

    } catch (error) {
        console.error('❌ Error connecting to database:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkData();
