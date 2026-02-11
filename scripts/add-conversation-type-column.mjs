#!/usr/bin/env node
/**
 * One-time script to add the type column to AIConversation if missing.
 * Run: node scripts/add-conversation-type-column.mjs
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "AIConversation" ADD COLUMN IF NOT EXISTS "type" VARCHAR(20) NOT NULL DEFAULT 'support';
    `);
    console.log('✓ type column added or already exists');
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "AIConversation_userId_type_idx" ON "AIConversation"("userId", "type");
    `);
    console.log('✓ index created or already exists');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
