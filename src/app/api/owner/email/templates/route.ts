import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/admin-auth';

/**
 * GET /api/owner/email/templates - List all email templates
 */
export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const templates = await prisma.emailTemplate.findMany({
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ templates });
  } catch (error) {
    console.error('[EmailTemplates] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}

/**
 * POST /api/owner/email/templates - Create a new template
 * Body: { name, subject, body, category? }
 */
export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, subject, body: templateBody, category } = body;

    if (!name || !subject || templateBody === undefined) {
      return NextResponse.json({ error: 'name, subject, and body are required' }, { status: 400 });
    }

    const template = await prisma.emailTemplate.create({
      data: {
        name: String(name).trim(),
        subject: String(subject),
        body: String(templateBody),
        category: category ? String(category) : 'GENERAL',
      },
    });

    return NextResponse.json(template);
  } catch (error: unknown) {
    const e = error as { code?: string };
    if (e?.code === 'P2002') {
      return NextResponse.json({ error: 'A template with this name already exists' }, { status: 409 });
    }
    console.error('[EmailTemplates] POST error:', error);
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }
}
