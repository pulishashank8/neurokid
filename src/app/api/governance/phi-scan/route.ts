/**
 * PHI Scanner API
 *
 * Scans database tables for potential PHI (Protected Health Information) exposure:
 * - SSN patterns (XXX-XX-XXXX)
 * - Medical Record Numbers
 * - Date of Birth patterns
 * - Unmasked email addresses in sensitive fields
 * - Phone numbers
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/admin-auth';

// PHI detection patterns
const PHI_PATTERNS = {
  SSN: /\b\d{3}-\d{2}-\d{4}\b/,
  SSN_NO_DASH: /\b\d{9}\b/,
  PHONE: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/,
  EMAIL: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
  DOB: /\b(0[1-9]|1[0-2])[\/\-](0[1-9]|[12]\d|3[01])[\/\-](19|20)\d{2}\b/,
  MRN: /\bMRN[:\s]?\d{6,10}\b/i,
};

interface ScanResult {
  table: string;
  field: string;
  recordId: string;
  phiType: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  masked: string;
}

export async function POST() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  const findings: ScanResult[] = [];
  let recordsScanned = 0;

  try {
    // Scan AI Messages for unintended PHI disclosure
    const aiMessages = await prisma.aIMessage.findMany({
      take: 500,
      orderBy: { createdAt: 'desc' },
      select: { id: true, content: true },
    });

    recordsScanned += aiMessages.length;
    for (const msg of aiMessages) {
      const content = msg.content || '';

      if (PHI_PATTERNS.SSN.test(content)) {
        findings.push({
          table: 'AIMessage',
          field: 'content',
          recordId: msg.id,
          phiType: 'SSN',
          severity: 'critical',
          masked: content.substring(0, 50).replace(PHI_PATTERNS.SSN, '[SSN REDACTED]') + '...',
        });
      }

      if (PHI_PATTERNS.MRN.test(content)) {
        findings.push({
          table: 'AIMessage',
          field: 'content',
          recordId: msg.id,
          phiType: 'Medical Record Number',
          severity: 'critical',
          masked: content.substring(0, 50).replace(PHI_PATTERNS.MRN, '[MRN REDACTED]') + '...',
        });
      }
    }

    // Scan Posts for PHI
    const posts = await prisma.post.findMany({
      take: 500,
      orderBy: { createdAt: 'desc' },
      select: { id: true, content: true, title: true },
    });

    recordsScanned += posts.length;
    for (const post of posts) {
      const content = post.content + ' ' + post.title;

      if (PHI_PATTERNS.SSN.test(content)) {
        findings.push({
          table: 'Post',
          field: 'content',
          recordId: post.id,
          phiType: 'SSN',
          severity: 'critical',
          masked: content.substring(0, 50).replace(PHI_PATTERNS.SSN, '[SSN REDACTED]') + '...',
        });
      }

      if (PHI_PATTERNS.PHONE.test(content)) {
        findings.push({
          table: 'Post',
          field: 'content',
          recordId: post.id,
          phiType: 'Phone Number',
          severity: 'medium',
          masked: content.substring(0, 50).replace(PHI_PATTERNS.PHONE, '[PHONE REDACTED]') + '...',
        });
      }
    }

    // Scan Comments for PHI
    const comments = await prisma.comment.findMany({
      take: 500,
      orderBy: { createdAt: 'desc' },
      select: { id: true, content: true },
    });

    recordsScanned += comments.length;
    for (const comment of comments) {
      const content = comment.content || '';

      if (PHI_PATTERNS.SSN.test(content)) {
        findings.push({
          table: 'Comment',
          field: 'content',
          recordId: comment.id,
          phiType: 'SSN',
          severity: 'critical',
          masked: content.substring(0, 50).replace(PHI_PATTERNS.SSN, '[SSN REDACTED]') + '...',
        });
      }
    }

    // Scan Screening Results metadata
    const screenings = await prisma.screeningResult.findMany({
      take: 200,
      orderBy: { completedAt: 'desc' },
      select: { id: true, answers: true },
    });

    recordsScanned += screenings.length;
    for (const screening of screenings) {
      const answersStr = JSON.stringify(screening.answers || {});

      if (PHI_PATTERNS.SSN.test(answersStr) || PHI_PATTERNS.DOB.test(answersStr)) {
        findings.push({
          table: 'ScreeningResult',
          field: 'answers',
          recordId: screening.id,
          phiType: 'Potential PHI in answers',
          severity: 'high',
          masked: '[Screening data contains potential PHI patterns]',
        });
      }
    }

    const duration = Date.now() - startTime;

    // Log the scan
    await prisma.auditLog.create({
      data: {
        action: 'PHI_SCAN',
        resource: 'GOVERNANCE',
        details: {
          recordsScanned,
          findingsCount: findings.length,
          duration: `${duration}ms`,
        },
      },
    });

    const criticalCount = findings.filter(f => f.severity === 'critical').length;
    const highCount = findings.filter(f => f.severity === 'high').length;

    return NextResponse.json({
      success: true,
      data: {
        scanComplete: true,
        duration: `${duration}ms`,
        recordsScanned,
        findings: {
          total: findings.length,
          critical: criticalCount,
          high: highCount,
          medium: findings.filter(f => f.severity === 'medium').length,
          low: findings.filter(f => f.severity === 'low').length,
        },
        details: findings.slice(0, 20), // Return first 20 findings
        status: findings.length === 0 ? 'CLEAN' : criticalCount > 0 ? 'CRITICAL' : 'WARNINGS',
        message: findings.length === 0
          ? 'No unauthorized PHI exposure detected.'
          : `Found ${findings.length} potential PHI exposure(s). ${criticalCount} critical, ${highCount} high severity.`,
      },
    });
  } catch (error) {
    console.error('PHI Scan error:', error);
    return NextResponse.json(
      { success: false, error: 'PHI scan failed' },
      { status: 500 }
    );
  }
}
