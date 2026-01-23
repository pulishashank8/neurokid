const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const posts = await prisma.post.findMany({
            take: 5,
            select: { id: true, title: true }
        });
        console.log("JSON_START");
        console.log(JSON.stringify(posts));
        console.log("JSON_END");
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
