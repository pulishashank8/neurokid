/**
 * Vercel Deploy Webhook - Pillar 25
 * Auto-log deploys from Vercel
 */
import { NextRequest, NextResponse } from 'next/server';
import { createDeployEvent } from '@/lib/owner/changelog';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const webhookSecret = process.env.VERCEL_DEPLOY_WEBHOOK_SECRET;
  if (webhookSecret && authHeader !== `Bearer ${webhookSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = await request.json();
    const meta = payload?.meta ?? payload;
    const version = meta?.commit?.shortId ?? meta?.version ?? process.env.VERCEL_GIT_COMMIT_SHA ?? 'unknown';
    const gitCommit = meta?.commit?.sha ?? process.env.VERCEL_GIT_COMMIT_SHA;
    const status = payload?.state === 'ERROR' || payload?.status === 'error' ? 'FAILED' : 'SUCCESS';
    const env = process.env.VERCEL_ENV ?? 'PRODUCTION';

    await createDeployEvent({
      version: String(version).slice(0, 40),
      gitCommit: gitCommit ? String(gitCommit).slice(0, 40) : undefined,
      changesSummary: meta?.commit?.message ?? undefined,
      status,
      environment: env,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[webhooks/vercel-deploy]', err);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });
  }
}
