/**
 * Script to seed the optional tags for posts
 *
 * Run with: npx tsx scripts/seed-tags.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const tags = [
  { name: "Tips", slug: "tips", description: "Helpful tips and advice", color: "#10B981" },
  { name: "Question", slug: "question", description: "Asking for help or advice", color: "#3B82F6" },
  { name: "Experience", slug: "experience", description: "Personal experiences and stories", color: "#8B5CF6" },
  { name: "Resource", slug: "resource", description: "Useful resources and links", color: "#F59E0B" },
  { name: "Success Story", slug: "success-story", description: "Celebrating wins and progress", color: "#EC4899" },
  { name: "Research", slug: "research", description: "Studies and research findings", color: "#6366F1" },
  { name: "DIY", slug: "diy", description: "Do-it-yourself projects and ideas", color: "#14B8A6" },
  { name: "Recommendation", slug: "recommendation", description: "Product or service recommendations", color: "#F97316" },
  { name: "Vent", slug: "vent", description: "Needing to express frustration", color: "#EF4444" },
  { name: "Celebration", slug: "celebration", description: "Celebrating achievements", color: "#FBBF24" },
];

async function seedTags() {
  console.log("🏷️  Seeding tags...\n");

  let created = 0;
  let skipped = 0;

  for (const tag of tags) {
    try {
      const existing = await prisma.tag.findUnique({
        where: { slug: tag.slug },
      });

      if (existing) {
        console.log(`⏭️  Skipping "${tag.name}" (already exists)`);
        skipped++;
        continue;
      }

      await prisma.tag.create({
        data: tag,
      });

      console.log(`✅ Created: ${tag.name}`);
      created++;
    } catch (error) {
      console.error(`❌ Failed to create "${tag.name}":`, error);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Created: ${created}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Total:   ${tags.length}`);
}

async function main() {
  console.log("═══════════════════════════════════════════════════");
  console.log("              TAG SEED SCRIPT                      ");
  console.log("═══════════════════════════════════════════════════\n");

  try {
    await seedTags();
    console.log("\n✅ Tags seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding tags:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
