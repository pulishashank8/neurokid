import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/admin-auth';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/owner/email/templates/[id] - Get a single template
 */
export async function GET(request: NextRequest, context: RouteContext) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: 'Template ID required' }, { status: 400 });
  }

  try {
    const template = await prisma.emailTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error('[EmailTemplates] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch template' }, { status: 500 });
  }
}

/**
 * PUT /api/owner/email/templates/[id] - Update a template
 * Body: { name?, subject?, body?, category? }
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: 'Template ID required' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { name, subject, body: templateBody, category } = body;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = String(name).trim();
    if (subject !== undefined) updateData.subject = String(subject);
    if (templateBody !== undefined) updateData.body = String(templateBody);
    if (category !== undefined) updateData.category = String(category);

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const template = await prisma.emailTemplate.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(template);
  } catch (error: unknown) {
    const e = error as { code?: string };
    if (e?.code === 'P2025') {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }
    if (e?.code === 'P2002') {
      return NextResponse.json({ error: 'A template with this name already exists' }, { status: 409 });
    }
    console.error('[EmailTemplates] PUT error:', error);
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
  }
}

/**
 * DELETE /api/owner/email/templates/[id] - Delete a template
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: 'Template ID required' }, { status: 400 });
  }

  try {
    await prisma.emailTemplate.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const e = error as { code?: string };
    if (e?.code === 'P2025') {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }
    console.error('[EmailTemplates] DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
  }
}
