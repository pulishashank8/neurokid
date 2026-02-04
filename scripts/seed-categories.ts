/**
 * Script to seed the required categories for posts
 * Posts REQUIRE a category to be created
 *
 * Run with: npx tsx scripts/seed-categories.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categories = [
  {
    name: "ABA Therapy",
    slug: "aba-therapy",
    description: "Discuss ABA therapy experiences, techniques, and progress",
    icon: "🧩",
    order: 1,
  },
  {
    name: "School & IEPs",
    slug: "school-ieps",
    description: "School-related discussions, IEP planning, and educational resources",
    icon: "🎒",
    order: 2,
  },
  {
    name: "Sleep Issues",
    slug: "sleep-issues",
    description: "Share sleep strategies, challenges, and success stories",
    icon: "🌙",
    order: 3,
  },
  {
    name: "Communication",
    slug: "communication",
    description: "Communication strategies, AAC devices, and speech development",
    icon: "💬",
    order: 4,
  },
  {
    name: "Daily Living",
    slug: "daily-living",
    description: "Daily routines, life skills, and independence training",
    icon: "🏠",
    order: 5,
  },
  {
    name: "Sensory",
    slug: "sensory",
    description: "Sensory processing, regulation strategies, and sensory-friendly tips",
    icon: "🌈",
    order: 6,
  },
  {
    name: "Behavior",
    slug: "behavior",
    description: "Behavioral strategies, positive reinforcement, and challenges",
    icon: "🧠",
    order: 7,
  },
  {
    name: "Social Skills",
    slug: "social-skills",
    description: "Social development, making friends, and social stories",
    icon: "👋",
    order: 8,
  },
  {
    name: "Diet & Nutrition",
    slug: "diet-nutrition",
    description: "Feeding challenges, dietary interventions, and mealtime strategies",
    icon: "🥗",
    order: 9,
  },
  {
    name: "Therapists & Services",
    slug: "therapists-services",
    description: "Finding providers, insurance, and therapy recommendations",
    icon: "🏥",
    order: 10,
  },
  {
    name: "Milestones & Wins",
    slug: "milestones-wins",
    description: "Celebrate progress, achievements, and small wins",
    icon: "🎉",
    order: 11,
  },
  {
    name: "Support & Venting",
    slug: "support-venting",
    description: "A safe space to share feelings and receive support",
    icon: "💙",
    order: 12,
  },
  {
    name: "General Discussion",
    slug: "general",
    description: "General topics that don't fit other categories",
    icon: "💭",
    order: 13,
  },
];

async function seedCategories() {
  console.log("🌱 Seeding categories...\n");

  let created = 0;
  let skipped = 0;

  for (const category of categories) {
    try {
      const existing = await prisma.category.findUnique({
        where: { slug: category.slug },
      });

      if (existing) {
        console.log(`⏭️  Skipping "${category.name}" (already exists)`);
        skipped++;
        continue;
      }

      await prisma.category.create({
        data: category,
      });

      console.log(`✅ Created: ${category.icon} ${category.name}`);
      created++;
    } catch (error) {
      console.error(`❌ Failed to create "${category.name}":`, error);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Created: ${created}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Total:   ${categories.length}`);
}

async function main() {
  console.log("═══════════════════════════════════════════════════");
  console.log("           CATEGORY SEED SCRIPT                    ");
  console.log("═══════════════════════════════════════════════════\n");

  try {
    await seedCategories();
    console.log("\n✅ Categories seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding categories:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
