import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";
import { STATIC_RESOURCES } from "@/lib/resources-static";
import { Prisma, ResourceCategory } from "@prisma/client";
import { createLogger } from "@/lib/logger";

const STATIC_ID_PREFIX = "static-";

export async function GET(request: NextRequest) {
  const logger = createLogger({ context: 'GET /api/resources' });
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category");
    const sortBy = searchParams.get("sortBy");
    const limitParam = searchParams.get("limit");
    const limit = Math.min(limitParam ? Number.parseInt(limitParam, 10) : 150, 200); // Default 150, max 200
    const savedOnly = searchParams.get("savedOnly") === "1";

    // Saved-only view: return only resources the user has saved (with full details)
    if (savedOnly) {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return NextResponse.json({ resources: [] });
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
      if (savedIds.length === 0) {
        return NextResponse.json({ resources: [] });
      }
      const dbIds = savedIds.filter((id) => !id.startsWith(STATIC_ID_PREFIX));
      const staticKeys = savedIds.filter((id) => id.startsWith(STATIC_ID_PREFIX));
      const dbResources = dbIds.length > 0
        ? await prisma.resource.findMany({
            where: { id: { in: dbIds }, status: "ACTIVE" },
            select: {
              id: true,
              title: true,
              content: true,
              link: true,
              category: true,
              views: true,
              createdAt: true,
              status: true,
              _count: { select: { savedBy: true } },
            },
          })
        : [];
      const staticResources = staticKeys.map((key) => {
        const idx = Number.parseInt(key.replace(STATIC_ID_PREFIX, ""), 10);
        const r = STATIC_RESOURCES[idx];
        if (!r) return null;
        return {
          id: key,
          title: r.title,
          content: r.content ?? null,
          link: r.link ?? null,
          category: r.category,
          views: 1000 + idx,
          createdAt: new Date().toISOString(),
          status: "ACTIVE",
          _count: { savedBy: 42 + idx },
        };
      }).filter(Boolean) as typeof dbResources;
      const resources = [...dbResources, ...staticResources];
      return NextResponse.json({ resources });
    }

    const where: Prisma.ResourceWhereInput = {
      status: "ACTIVE",
    };

    if (category && category !== "ALL") {
      where.category = category as ResourceCategory;
    }

    let orderBy: Prisma.ResourceOrderByWithRelationInput = { createdAt: "desc" };
    if (sortBy === "views") {
      orderBy = { views: "desc" };
    }

    let resources = await prisma.resource.findMany({
      where,
      orderBy,
      take: limit,
      select: {
        id: true,
        title: true,
        content: true,
        link: true,
        category: true,
        views: true,
        createdAt: true,
        status: true,
        _count: {
          select: { savedBy: true }
        }
      },
    });

    // Fallback to static resources if DB is empty; use stable IDs (index in full array)
    if (resources.length === 0) {
      logger.debug('DB resources empty, serving static fallback');
      const mappedStatic = STATIC_RESOURCES.map((r, i) => ({
        ...r,
        id: `${STATIC_ID_PREFIX}${i}`,
        views: 1000 + i,
        createdAt: new Date().toISOString(),
        status: "ACTIVE",
        _count: { savedBy: 42 + i }
      }));
      const filtered = !category || category === "ALL"
        ? mappedStatic
        : mappedStatic.filter((r) => r.category === category);
      const limited = filtered.slice(0, limit);
      return NextResponse.json({ resources: limited });
    }

    return NextResponse.json({ resources });
  } catch (error) {
    logger.error({ error }, 'Error fetching resources');
    return NextResponse.json(
      { error: "Failed to fetch resources" },
      { status: 400 }
    );
  }
}
