import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Clean all test data from database (truncate all tables)
 * Preserves database structure but removes all data
 * IMPORTANT: Does NOT delete Categories and Tags (reference data needed by tests)
 */
export async function cleanupDatabase() {
  // Only clean user-generated data, NOT reference data (categories, tags)
  const tables = [
    'Vote',
    'Comment',
    'Post',
    'ModActionLog',
    'ModerationAction',
    'Report',
    'Bookmark',
    // NOT cleaning: Tag, Category (reference data)
    'Notification',
    'AIMessage',
    'AIConversation',
    'ProviderReview',
    'ProviderClaimRequest',
    'Provider',
    'UserRole',
    'Profile',
    'EmailVerification',
    'RateLimitLog',
    'AuditLog',
    'Resource',
    'DatasetGlossaryTerm',
    'BusinessGlossaryTerm',
    'DatasetField',
    'Dataset',
    'DataOwner',
    'User',
  ];

  try {
    // Truncate all tables
    // Note: We don't disable FK checks (session_replication_role) because it requires SUPERUSER
    // We rely on CASCADE to handle dependencies
    for (const table of tables) {
      try {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
      } catch (error) {
        // Table might not exist or other error, continue
        console.warn(`Warning: Could not truncate ${table}:`, error);
      }
    }
  } catch (error) {
    console.error('Error cleaning database:', error);
    throw error;
  }
}

/**
 * Seed essential reference data (categories and tags)
 * Call this once at the start of tests  
 */
export async function seedEssentialData() {
  // Check if categories already exist
  const existingCategories = await prisma.category.count();

  if (existingCategories === 0) {
    // Create default categories
    await prisma.category.createMany({
      data: [
        { name: 'General Discussion', slug: 'general-discussion', description: 'General topics', order: 1 },
        { name: 'Diagnosis & Assessment', slug: 'diagnosis', description: 'Diagnosis questions', order: 2 },
        { name: 'Therapies & Treatments', slug: 'therapies', description: 'Treatment options', order: 3 },
        { name: 'Education & School', slug: 'education', description: 'School support', order: 4 },
      ],
      skipDuplicates: true,
    });
  }

  // Check if tags already exist
  const existingTags = await prisma.tag.count();

  if (existingTags === 0) {
    // Create default tags
    await prisma.tag.createMany({
      data: [
        { name: 'Autism', slug: 'autism', color: '#3B82F6' },
        { name: 'ADHD', slug: 'adhd', color: '#10B981' },
        { name: 'Sensory', slug: 'sensory', color: '#F59E0B' },
        { name: 'Education', slug: 'education', color: '#8B5CF6' },
        { name: 'Behavior', slug: 'behavior', color: '#EF4444' },
      ],
      skipDuplicates: true,
    });
  }
}

/**
 * Disconnect from database
 */
export async function disconnectDatabase() {
  await prisma.$disconnect();
}

/**
 * Get Prisma client for tests
 */
export function getTestPrisma() {
  return prisma;
}
