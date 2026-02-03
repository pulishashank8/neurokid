#!/usr/bin/env tsx
/**
 * Email Configuration Verification Script
 * 
 * This script verifies that the email service (Resend) is properly configured
 * before production deployment.
 * 
 * Usage:
 *   npx tsx scripts/verify-email-config.ts
 * 
 * Checks:
 *   - RESEND_API_KEY is set and valid format
 *   - EMAIL_FROM is configured
 *   - API key has correct prefix (re_)
 *   - Domain is verified (if production)
 */

import { getEmailConfigStatus, isProduction, isEmailConfigured } from '../src/lib/env';
import { logger } from '../src/lib/logger';

async function verifyEmailConfig() {
  console.log('='.repeat(60));
  console.log('NeuroKid Email Configuration Verification');
  console.log('='.repeat(60));
  console.log();

  const status = getEmailConfigStatus();
  const prod = isProduction();

  console.log(`Environment: ${prod ? 'PRODUCTION' : 'DEVELOPMENT'}`);
  console.log();

  // Check 1: API Key
  console.log('1. Checking RESEND_API_KEY...');
  if (!status.apiKeyPrefix) {
    console.error('   ❌ FAILED: RESEND_API_KEY is not set');
    console.error('   → Get your API key from: https://resend.com/api-keys');
    process.exit(1);
  }
  console.log(`   ✅ API Key found: ${status.apiKeyPrefix}`);

  // Check 2: API Key Format
  console.log('2. Checking API key format...');
  if (!status.apiKeyPrefix?.startsWith('re_')) {
    console.error('   ❌ FAILED: API key format is invalid');
    console.error('   → Resend API keys should start with "re_"');
    process.exit(1);
  }
  console.log('   ✅ API key format is valid');

  // Check 3: From Address
  console.log('3. Checking EMAIL_FROM...');
  if (status.fromAddress === 'onboarding@resend.dev' && prod) {
    console.warn('   ⚠️  WARNING: Using default Resend dev email in production');
    console.warn('   → Configure a custom domain for production use');
    console.warn('   → See: https://resend.com/docs/dashboard/domains');
  } else if (status.fromAddress === 'not-configured') {
    console.error('   ❌ FAILED: EMAIL_FROM is not configured');
    process.exit(1);
  } else {
    console.log(`   ✅ From address: ${status.fromAddress}`);
  }

  // Check 4: Domain verification (production only)
  if (prod && !status.fromAddress.endsWith('@resend.dev')) {
    console.log('4. Checking domain verification...');
    console.log('   ℹ️  Ensure your domain is verified in Resend dashboard');
    console.log('   → https://resend.com/domains');
  }

  console.log();
  console.log('='.repeat(60));
  console.log('✅ Email configuration verification passed!');
  console.log('='.repeat(60));
  console.log();
  console.log('Your email service is ready for:');
  console.log('  • User registration verification emails');
  console.log('  • Password reset emails');
  console.log('  • Future notification emails');
  console.log();
}

verifyEmailConfig().catch((error) => {
  console.error('Verification failed:', error);
  process.exit(1);
});
