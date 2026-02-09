import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { STATIC_RESOURCES } from "@/lib/resources-static";
import { Prisma, ResourceCategory } from "@prisma/client";
import { createLogger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const logger = createLogger({ context: 'GET /api/resources' });
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category");
    const sortBy = searchParams.get("sortBy");
    const limitParam = searchParams.get("limit");
    const limit = Math.min(limitParam ? parseInt(limitParam) : 50, 100); // Default 50, max 100

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

    // Fallback to static resources if DB is empty to ensure "Marketplace" feel
    if (resources.length === 0 && (!category || category === "ALL")) {
      logger.debug('DB resources empty, serving static fallback');
      const mappedStatic = STATIC_RESOURCES.map((r, i) => ({
        ...r,
        id: `static-${i}`,
        views: 1000 + i,
        createdAt: new Date().toISOString(),
        status: "ACTIVE",
        _count: { savedBy: 42 + i }
      }));
      return NextResponse.json({ resources: mappedStatic });
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
