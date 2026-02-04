/**
 * Script to sync all existing users to the UserFinder table
 * This makes existing users searchable in the "Find" feature in messages
 *
 * Run with: npx tsx scripts/sync-user-finder.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function syncAllUsersToFinder() {
  console.log("🔄 Starting UserFinder sync...\n");

  try {
    // Get all profiles that don't have a UserFinder entry
    const profiles = await prisma.profile.findMany({
      where: {
        user: {
          userFinder: null,
        },
      },
      select: {
        userId: true,
        username: true,
        displayName: true,
        avatarUrl: true,
      },
    });

    console.log(`📋 Found ${profiles.length} profiles without UserFinder entries\n`);

    if (profiles.length === 0) {
      console.log("✅ All users are already synced to UserFinder!");
      return;
    }

    let synced = 0;
    let errors = 0;

    for (const profile of profiles) {
      try {
        const keywords = `${profile.username.toLowerCase()} ${profile.displayName.toLowerCase()}`;

        await prisma.userFinder.upsert({
          where: { userId: profile.userId },
          update: {
            username: profile.username,
            displayName: profile.displayName,
            keywords,
            avatarUrl: profile.avatarUrl,
          },
          create: {
            userId: profile.userId,
            username: profile.username,
            displayName: profile.displayName,
            keywords,
            avatarUrl: profile.avatarUrl,
          },
        });

        synced++;
        console.log(`✓ Synced: @${profile.username} (${profile.displayName})`);
      } catch (err) {
        errors++;
        console.error(`✗ Failed to sync @${profile.username}:`, err);
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Synced: ${synced}`);
    console.log(`   Errors: ${errors}`);
    console.log(`   Total:  ${profiles.length}`);
  } catch (error) {
    console.error("❌ Error during sync:", error);
  } finally {
    await prisma.$disconnect();
  }
}

async function checkDatabaseHealth() {
  console.log("\n🏥 Checking database health...\n");

  try {
    // Check categories
    const categoryCount = await prisma.category.count();
    console.log(`📁 Categories: ${categoryCount}`);
    if (categoryCount === 0) {
      console.log("   ⚠️  WARNING: No categories exist! Posts cannot be created.");
      console.log("   💡 Run the SQL to seed categories (see documentation).");
    }

    // Check users
    const userCount = await prisma.user.count();
    console.log(`👤 Users: ${userCount}`);

    // Check profiles
    const profileCount = await prisma.profile.count();
    console.log(`📝 Profiles: ${profileCount}`);

    // Check UserFinder
    const finderCount = await prisma.userFinder.count();
    console.log(`🔍 UserFinder entries: ${finderCount}`);
    if (finderCount < profileCount) {
      console.log(`   ⚠️  WARNING: ${profileCount - finderCount} users are not searchable!`);
    }

    // Check posts
    const postCount = await prisma.post.count();
    const activePostCount = await prisma.post.count({ where: { status: "ACTIVE" } });
    console.log(`📰 Posts: ${postCount} total, ${activePostCount} active`);

    // Check messages
    const messageCount = await prisma.message.count();
    console.log(`💬 Messages: ${messageCount}`);

    // Check conversations
    const conversationCount = await prisma.conversation.count();
    console.log(`🗨️  Conversations: ${conversationCount}`);

    // Check connections
    const connectionCount = await prisma.connection.count();
    console.log(`🤝 Connections: ${connectionCount}`);

    // Check daily wins
    const dailyWinCount = await prisma.dailyWin.count();
    console.log(`🏆 Daily Wins: ${dailyWinCount}`);

    // Check therapy sessions
    const therapyCount = await prisma.therapySession.count();
    console.log(`🩺 Therapy Sessions: ${therapyCount}`);

    // Check votes
    const voteCount = await prisma.vote.count();
    console.log(`👍 Votes: ${voteCount}`);

    // Check bookmarks
    const bookmarkCount = await prisma.bookmark.count();
    console.log(`🔖 Bookmarks: ${bookmarkCount}`);

    console.log("\n✅ Database health check complete!");
  } catch (error) {
    console.error("❌ Error checking database:", error);
  }
}

async function main() {
  console.log("═══════════════════════════════════════════════════");
  console.log("        NEUROKIND DATA SYNC & HEALTH CHECK         ");
  console.log("═══════════════════════════════════════════════════\n");

  await checkDatabaseHealth();
  await syncAllUsersToFinder();

  console.log("\n═══════════════════════════════════════════════════");
  console.log("                    COMPLETE                        ");
  console.log("═══════════════════════════════════════════════════\n");
}

main();
