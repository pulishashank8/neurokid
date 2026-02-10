import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";

const STATIC_ID_PREFIX = "static-";

// POST /api/resources/save - Toggle save for a resource (DB or static fallback)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { resourceId } = await request.json();

    if (!resourceId || typeof resourceId !== "string") {
      return NextResponse.json({ error: "Resource ID is required" }, { status: 400 });
    }

    const isStatic = resourceId.startsWith(STATIC_ID_PREFIX);

    if (isStatic) {
      // Static fallback resources: store by key in SavedStaticResource
      try {
        const existing = await prisma.savedStaticResource.findUnique({
          where: {
            userId_resourceKey: {
              userId: session.user.id,
              resourceKey: resourceId,
            },
          },
        });

        if (existing) {
          await prisma.savedStaticResource.delete({ where: { id: existing.id } });
          return NextResponse.json({ saved: false });
        }
        await prisma.savedStaticResource.create({
          data: {
            userId: session.user.id,
            resourceKey: resourceId,
          },
        });
        return NextResponse.json({ saved: true });
      } catch (staticErr: unknown) {
        // Table may not exist yet if migration not run
        const code = staticErr && typeof staticErr === "object" && "code" in staticErr ? (staticErr as { code: string }).code : "";
        if (code === "P2021" || String(staticErr).includes("SavedStaticResource") || String(staticErr).includes("does not exist")) {
          return NextResponse.json(
            { error: "Save feature is updating. Please run database migrations and try again." },
            { status: 503 }
          );
        }
        throw staticErr;
      }
    }

    // DB resources: must exist in Resource table
    const resource = await prisma.resource.findUnique({
      where: { id: resourceId },
    });

    if (!resource) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    const existing = await prisma.savedResource.findUnique({
      where: {
        userId_resourceId: {
          userId: session.user.id,
          resourceId,
        },
      },
    });

    if (existing) {
      await prisma.savedResource.delete({ where: { id: existing.id } });
      return NextResponse.json({ saved: false });
    }
    await prisma.savedResource.create({
      data: {
        userId: session.user.id,
        resourceId,
      },
    });
    return NextResponse.json({ saved: true });
  } catch (error) {
    console.error("Error saving resource:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// GET /api/resources/save - Get user's saved resource IDs (DB + static keys)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ savedIds: [] });
    }

    const dbSaved = await prisma.savedResource.findMany({
      where: { userId: session.user.id },
      select: { resourceId: true },
    });

    let staticSaved: { resourceKey: string }[] = [];
    try {
      staticSaved = await prisma.savedStaticResource.findMany({
        where: { userId: session.user.id },
        select: { resourceKey: true },
      });
    } catch {
      // SavedStaticResource table may not exist yet
    }

    const savedIds = [
      ...dbSaved.map((s) => s.resourceId),
      ...staticSaved.map((s) => s.resourceKey),
    ];
    return NextResponse.json({ savedIds });
  } catch (error) {
    console.error("Error fetching saved resources:", error);
    return NextResponse.json({ savedIds: [] });
  }
}
