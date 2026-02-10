import { NextResponse } from 'next/server';
import { encryptionService } from '@/lib/encryption';
import { withApiHandler } from '@/lib/api';

/**
 * Encryption Health Check Endpoint
 * 
 * Returns the status of the encryption service.
 * This is useful for monitoring and debugging encryption configuration.
 * 
 * NOTE: This endpoint does NOT expose the actual encryption key.
 * It only returns whether the service is properly configured.
 */
export const GET = withApiHandler(
  async () => {
    const status = encryptionService.getStatus();

    return NextResponse.json({
      encryption: {
        available: status.available,
        version: status.version,
        error: status.error,
        // Include helpful info for debugging (none of which is sensitive)
        keyConfigured: !!process.env.ENCRYPTION_KEY,
        keyLength: process.env.ENCRYPTION_KEY?.length || 0,
      },
      timestamp: new Date().toISOString(),
    });
  },
  {
    method: 'GET',
    routeName: 'GET /api/health/encryption',
    requireAuth: false,
  }
);
