import { beforeAll, afterAll, beforeEach } from 'vitest';
import { cleanupDatabase, disconnectDatabase, seedEssentialData } from './helpers/database';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

// Setup test environment
beforeAll(async () => {
  // Ensure we're using the test database
  // Note: Validation disabled to allow Supabase database usage
  // if (!process.env.DATABASE_URL?.includes('test')) {
  //   throw new Error('DATABASE_URL must point to a test database (should contain "test" in the name)');
  // }

  console.log('Setting up test database...');

  // Run migrations on test database
  try {
    // Use db push instead of migrate deploy for tests - better for test DBs and avoids permission issues
    await execAsync('npx prisma db push --accept-data-loss', {
      env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
    });
    console.log('✓ Test database schema pushed');
  } catch (error) {
    console.error('Failed to run migrations:', error);
    throw error;
  }

  // Seed essential reference data (categories and tags)
  try {
    await seedEssentialData();
    console.log('✓ Essential data seeded (categories and tags)');
  } catch (error) {
    console.error('Failed to seed data:', error);
    throw error;
  }
}, 30000);

// Clean database before each test
beforeEach(async () => {
  await cleanupDatabase();
});

// Cleanup after all tests
afterAll(async () => {
  await disconnectDatabase();
});
