/**
 * GET /api/owner/security-events
 * 
 * Security event dashboard for administrators
 * Returns blocked IPs, security alerts, and metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { getBlockedIps } from '@/lib/security/ip-blocker';
import { getGeoConfig } from '@/lib/security/geo-block';
import { getCaptchaConfig } from '@/lib/captcha';

export async function GET(request: NextRequest): Promise<NextResponse> {
  // Verify admin access
  // Note: In production, add proper admin authentication
  
  try {
    const blockedIps = await getBlockedIps();
    const securityMetrics = await getSecurityMetrics();
    
    return NextResponse.json({
      blockedIps: blockedIps.map(ip => ({
        ip: ip.ip,
        reason: ip.reason,
        blockedAt: new Date(ip.blockedAt).toISOString(),
        expiresAt: ip.expiresAt ? new Date(ip.expiresAt).toISOString() : null,
        threatScore: ip.threatScore,
        incidentCount: ip.incidentCount,
      })),
      recentAlerts: [], // Note: Requires prisma generate for SecurityAlert model
      metrics: securityMetrics,
      config: {
        geo: getGeoConfig(),
        captcha: getCaptchaConfig(),
      },
    });
  } catch (error) {
    console.error('[SECURITY-DASHBOARD] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch security data' },
      { status: 500 }
    );
  }
}

/**
 * Get security metrics
 */
async function getSecurityMetrics() {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  // Note: These will work after running prisma generate for SecurityAlert model
  // For now, return placeholder values
  return {
    totalAlerts: 0,
    unacknowledgedAlerts: 0,
    alertsLastHour: 0,
    alertsLastDay: 0,
    blockedAttempts: 0,
    timestamp: now.toISOString(),
  };
}
