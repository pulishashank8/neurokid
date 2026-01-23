const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Connecting to database...");
        const posts = await prisma.post.findMany({
            take: 5,
            select: { id: true, title: true, status: true }
        });
        console.log("Posts found:", JSON.stringify(posts, null, 2));
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
