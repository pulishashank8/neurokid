
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUser() {
    const username = "hari12345";
    console.log(`Checking for user: ${username}`);

    // 1. Check Profile
    const profile = await prisma.profile.findFirst({
        where: { username: { contains: "hari", mode: 'insensitive' } }
    });
    console.log("Profile found:", profile ? "YES" : "NO");
    if (profile) console.log("Profile Data:", profile);

    if (!profile) return;

    // 2. Check UserFinder
    const finder = await prisma.userFinder.findUnique({
        where: { userId: profile.userId }
    });
    console.log("UserFinder Entry found:", finder ? "YES" : "NO");
    if (finder) console.log("Finder Data:", finder);
}

checkUser()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
