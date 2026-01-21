import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const categories = await prisma.category.findMany();
    console.log('Categories in DB:');
    categories.forEach(cat => {
        console.log(`- ${cat.name} (ID: ${cat.id})`);
    });

    const tags = await prisma.tag.findMany();
    console.log('\nTags in DB:');
    tags.forEach(tag => {
        console.log(`- ${tag.name} (ID: ${tag.id})`);
    });
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
