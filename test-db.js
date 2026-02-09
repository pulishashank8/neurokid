
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Testing database connection...');
        const result = await prisma.$queryRaw`SELECT 1 as connected`;
        console.log('Database connected:', result);

        const postCount = await prisma.post.count();
        console.log('Post count:', postCount);

        const posts = await prisma.post.findMany({ take: 1 });
        console.log('First post:', JSON.stringify(posts, null, 2));

    } catch (error) {
        console.error('Database error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
