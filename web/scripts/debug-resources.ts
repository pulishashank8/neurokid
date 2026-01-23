import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
    try {
        const resources = await prisma.resource.findMany({
            select: { id: true, status: true, category: true }
        });
        console.log(`Total resources: ${resources.length}`);
        const statusCounts = resources.reduce((acc: any, r) => {
            acc[r.status] = (acc[r.status] || 0) + 1;
            return acc;
        }, {});
        console.log('Status counts:', statusCounts);

        const categories = Array.from(new Set(resources.map(r => r.category)));
        console.log('Categories found:', categories);
    } catch (err) {
        console.error(err);
    } finally {
        await prisma.$disconnect();
    }
}

check();
