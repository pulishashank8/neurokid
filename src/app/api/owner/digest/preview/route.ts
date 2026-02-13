/**
 * GET /api/owner/digest/preview - Preview digest HTML
 */
import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { renderDigestHtml, DigestType } from '@/lib/owner/digest/email-renderer';

export async function GET(request: NextRequest) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const type = (searchParams.get('type') || 'DAILY') as DigestType;
    if (!['DAILY', 'WEEKLY', 'MONTHLY'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }
    const html = await renderDigestHtml(type);
    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (err) {
    console.error('[owner/digest/preview]', err);
    return NextResponse.json({ error: 'Preview failed' }, { status: 500 });
  }
}
