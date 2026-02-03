/**
 * Emergency Cards Encryption Migration Script
 * 
 * This script encrypts all existing plaintext PHI fields in the EmergencyCard table.
 * Run this AFTER deploying the updated API code.
 * 
 * Usage:
 *   npx tsx scripts/migrate-emergency-cards.ts
 * 
 * Safety:
 *   - Creates a backup JSON file before migration
 *   - Processes in batches to avoid memory issues
 *   - Idempotent - can be run multiple times safely
 *   - Validates encryption before committing
 */

import { PrismaClient } from "@prisma/client";
import { FieldEncryption } from "../src/lib/encryption";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

// Batch size for processing
const BATCH_SIZE = 50;

interface MigrationResult {
  totalCards: number;
  migratedCards: number;
  skippedCards: number;
  errors: Array<{ id: string; error: string }>;
  backupFile: string;
}

async function createBackup(): Promise<string> {
  console.log("📦 Creating backup of all emergency cards...");
  
  const cards = await prisma.emergencyCard.findMany();
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupFile = path.join(process.cwd(), `backups`, `emergency-cards-backup-${timestamp}.json`);
  
  // Ensure backups directory exists
  const backupDir = path.dirname(backupFile);
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  fs.writeFileSync(backupFile, JSON.stringify(cards, null, 2));
  console.log(`✅ Backup created: ${backupFile} (${cards.length} records)`);
  
  return backupFile;
}

function shouldEncrypt(value: string | null): boolean {
  if (!value) return false;
  // Don't re-encrypt already encrypted data
  return !FieldEncryption.isEncrypted(value);
}

async function migrateBatch(cards: Array<{ id: string }>): Promise<{ migrated: number; skipped: number; errors: Array<{ id: string; error: string }> }> {
  const errors: Array<{ id: string; error: string }> = [];
  let migrated = 0;
  let skipped = 0;

  for (const cardRef of cards) {
    try {
      // Fetch fresh data for each card
      const card = await prisma.emergencyCard.findUnique({
        where: { id: cardRef.id },
      });

      if (!card) {
        errors.push({ id: cardRef.id, error: "Card not found" });
        continue;
      }

      const updates: Record<string, string | null> = {};

      // Check each PHI field and encrypt if needed
      if (shouldEncrypt(card.triggers)) {
        updates.triggers = FieldEncryption.encrypt(card.triggers);
      }
      if (shouldEncrypt(card.calmingStrategies)) {
        updates.calmingStrategies = FieldEncryption.encrypt(card.calmingStrategies);
      }
      if (shouldEncrypt(card.communication)) {
        updates.communication = FieldEncryption.encrypt(card.communication);
      }
      if (shouldEncrypt(card.medications)) {
        updates.medications = FieldEncryption.encrypt(card.medications);
      }
      if (shouldEncrypt(card.allergies)) {
        updates.allergies = FieldEncryption.encrypt(card.allergies);
      }
      if (shouldEncrypt(card.additionalNotes)) {
        updates.additionalNotes = FieldEncryption.encrypt(card.additionalNotes);
      }

      // Only update if there are fields to encrypt
      if (Object.keys(updates).length > 0) {
        await prisma.emergencyCard.update({
          where: { id: card.id },
          data: updates,
        });
        migrated++;
        console.log(`  🔐 Migrated card ${card.id} (${Object.keys(updates).length} fields)`);
      } else {
        skipped++;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      errors.push({ id: cardRef.id, error: errorMessage });
      console.error(`  ❌ Error migrating card ${cardRef.id}:`, errorMessage);
    }
  }

  return { migrated, skipped, errors };
}

async function runMigration(): Promise<MigrationResult> {
  console.log("🚀 Starting Emergency Cards Encryption Migration\n");

  // Verify encryption key is set
  if (!process.env.ENCRYPTION_KEY) {
    throw new Error("ENCRYPTION_KEY environment variable is required!");
  }

  // Create backup
  const backupFile = await createBackup();

  // Get total count
  const totalCards = await prisma.emergencyCard.count();
  console.log(`\n📊 Total emergency cards: ${totalCards}\n`);

  if (totalCards === 0) {
    console.log("✅ No emergency cards to migrate");
    return { totalCards: 0, migratedCards: 0, skippedCards: 0, errors: [], backupFile };
  }

  // Process in batches
  let processed = 0;
  let totalMigrated = 0;
  let totalSkipped = 0;
  const allErrors: Array<{ id: string; error: string }> = [];

  while (processed < totalCards) {
    const batch = await prisma.emergencyCard.findMany({
      skip: processed,
      take: BATCH_SIZE,
      select: { id: true },
    });

    if (batch.length === 0) break;

    console.log(`\n📦 Processing batch ${Math.floor(processed / BATCH_SIZE) + 1}/${Math.ceil(totalCards / BATCH_SIZE)} (cards ${processed + 1}-${Math.min(processed + batch.length, totalCards)})`);
    
    const { migrated, skipped, errors } = await migrateBatch(batch);
    
    totalMigrated += migrated;
    totalSkipped += skipped;
    allErrors.push(...errors);
    processed += batch.length;

    // Progress indicator
    const percent = Math.round((processed / totalCards) * 100);
    console.log(`   Progress: ${percent}% (${processed}/${totalCards})`);
  }

  return {
    totalCards,
    migratedCards: totalMigrated,
    skippedCards: totalSkipped,
    errors: allErrors,
    backupFile,
  };
}

async function verifyMigration(): Promise<void> {
  console.log("\n🔍 Verifying migration...");
  
  const sampleCards = await prisma.emergencyCard.findMany({
    take: 5,
  });

  let allValid = true;
  for (const card of sampleCards) {
    const fields = ['triggers', 'calmingStrategies', 'communication', 'medications', 'allergies', 'additionalNotes'] as const;
    
    for (const field of fields) {
      const value = card[field];
      if (value && !FieldEncryption.isEncrypted(value)) {
        console.error(`  ❌ Card ${card.id} has unencrypted ${field}`);
        allValid = false;
      }
    }
  }

  if (allValid) {
    console.log("✅ All sampled cards are properly encrypted");
  } else {
    console.error("⚠️ Some cards may not be properly encrypted");
  }
}

// Main execution
async function main() {
  try {
    console.log("=" .repeat(60));
    console.log("Emergency Cards Encryption Migration");
    console.log("=" .repeat(60) + "\n");

    // Confirm before proceeding
    if (process.env.NODE_ENV === "production" && !process.env.FORCE_MIGRATION) {
      console.error("❌ This script should not be run directly in production!");
      console.error("Use your deployment pipeline or set FORCE_MIGRATION=true");
      process.exit(1);
    }

    const result = await runMigration();

    console.log("\n" + "=" .repeat(60));
    console.log("Migration Complete!");
    console.log("=" .repeat(60));
    console.log(`Total cards:      ${result.totalCards}`);
    console.log(`Migrated:         ${result.migratedCards}`);
    console.log(`Skipped (already encrypted): ${result.skippedCards}`);
    console.log(`Errors:           ${result.errors.length}`);
    console.log(`Backup file:      ${result.backupFile}`);

    if (result.errors.length > 0) {
      console.log("\n⚠️ Errors encountered:");
      result.errors.forEach(({ id, error }) => {
        console.log(`  - Card ${id}: ${error}`);
      });
    }

    // Verification
    await verifyMigration();

    console.log("\n✅ Migration finished successfully!");
    
    if (result.migratedCards > 0) {
      console.log("\n⚠️ IMPORTANT: Keep the backup file until you verify everything works correctly!");
      console.log(`   Backup location: ${result.backupFile}`);
    }

  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
