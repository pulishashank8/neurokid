/**
 * Data Governance Setup Script
 *
 * One-command setup for the complete data governance framework:
 * 1. Populate data catalog (datasets, fields, owners, glossary terms)
 * 2. Seed quality rules (validation rules for healthcare data)
 * 3. Seed lineage graph (data flow visualization)
 * 4. Seed sample data (audit logs, quality results for demo)
 *
 * Run with: npx tsx scripts/setup-governance.ts
 */

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║    NeuroKid DATA GOVERNANCE FRAMEWORK SETUP               ║');
  console.log('║    Enterprise Data Governance for Autism Healthcare        ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const startTime = Date.now();

  // Step 1: Populate Data Catalog
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('STEP 1: Populating Data Catalog');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    execSync('npx tsx scripts/populate-data-catalog.ts', {
      stdio: 'inherit',
      cwd: process.cwd(),
    });
    console.log('✅ Data Catalog populated successfully\n');
  } catch (error) {
    console.error('❌ Failed to populate data catalog');
    process.exit(1);
  }

  // Step 2: Seed Quality Rules
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('STEP 2: Seeding Data Quality Rules');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    execSync('npx tsx scripts/seed-quality-rules.ts', {
      stdio: 'inherit',
      cwd: process.cwd(),
    });
    console.log('✅ Quality Rules seeded successfully\n');
  } catch (error) {
    console.error('❌ Failed to seed quality rules');
    process.exit(1);
  }

  // Step 3: Seed Lineage
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('STEP 3: Seeding Data Lineage Graph');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    execSync('npx tsx scripts/seed-lineage.ts', {
      stdio: 'inherit',
      cwd: process.cwd(),
    });
    console.log('✅ Lineage Graph seeded successfully\n');
  } catch (error) {
    console.error('❌ Failed to seed lineage');
    process.exit(1);
  }

  // Step 4: Seed Sample Data (Audit Logs + Quality Results)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('STEP 4: Seeding Sample Demo Data');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    execSync('npx tsx scripts/seed-sample-data.ts', {
      stdio: 'inherit',
      cwd: process.cwd(),
    });
    console.log('✅ Sample data seeded successfully\n');
  } catch (error) {
    console.error('❌ Failed to seed sample data');
    process.exit(1);
  }

  // Final Summary
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║    ✅ DATA GOVERNANCE SETUP COMPLETE                       ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Get counts
  const datasets = await prisma.dataset.count();
  const fields = await prisma.datasetField.count();
  const rules = await prisma.dataQualityRule.count();
  const nodes = await prisma.dataLineageNode.count();
  const edges = await prisma.dataLineageEdge.count();
  const auditLogs = await prisma.sensitiveAccessLog.count();
  const qualityResults = await prisma.dataQualityResult.count();

  console.log('📊 GOVERNANCE FRAMEWORK SUMMARY:');
  console.log('─────────────────────────────────');
  console.log(`   📁 Datasets Cataloged:    ${datasets}`);
  console.log(`   📋 Fields Documented:     ${fields}`);
  console.log(`   ✅ Quality Rules:         ${rules}`);
  console.log(`   🔗 Lineage Nodes:         ${nodes}`);
  console.log(`   ➡️  Lineage Edges:         ${edges}`);
  console.log(`   📋 Audit Log Entries:     ${auditLogs}`);
  console.log(`   📊 Quality Results:       ${qualityResults}`);
  console.log(`   ⏱️  Setup Time:            ${duration}s`);

  console.log('\n🚀 NEXT STEPS:');
  console.log('─────────────────────────────────');
  console.log('   1. Start the dev server:     npm run dev');
  console.log('   2. View the dashboard:       http://localhost:3000/owner/dashboard/data');
  console.log('   3. Run quality checks:       POST /api/governance/quality');
  console.log('   4. Explore lineage:          GET /api/governance/lineage');

  console.log('\n📖 DOCUMENTATION:');
  console.log('─────────────────────────────────');
  console.log('   • Data Governance Guide:     docs/DATA_GOVERNANCE.md');
  console.log('   • Portfolio Documentation:   docs/DATA_ENGINEERING_PORTFOLIO.md');
  console.log('   • API Reference:             /api/governance/*');

  console.log('\n');
}

main()
  .catch((e) => {
    console.error('❌ Setup failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

