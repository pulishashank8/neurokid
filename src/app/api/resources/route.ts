import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { STATIC_RESOURCES, RESOURCE_COUNT } from "@/lib/resources-static";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category");
    const sortBy = searchParams.get("sortBy");
    const limitParam = searchParams.get("limit");
    const limit = Math.min(limitParam ? Number.parseInt(limitParam, 10) : 250, 300); // Default 250 so 200+ resources show; max 300

    const where: any = {
      status: "ACTIVE",
    };

    if (category && category !== "ALL") {
      where.category = category;
    }

    let orderBy: any = { createdAt: "desc" };
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

    // Use full static list when viewing all categories and DB has fewer than our curated count
    const useStatic = (!category || category === "ALL") &&
      (resources.length === 0 || resources.length < RESOURCE_COUNT);
    if (useStatic) {
      const mappedStatic = STATIC_RESOURCES.map((r, i) => ({
        ...r,
        id: `static-${i}`,
        views: 1000 + (STATIC_RESOURCES.length - 1 - i),
        createdAt: new Date().toISOString(),
        status: "ACTIVE",
        _count: { savedBy: 42 + i }
      }))
        .sort((a, b) => (b.views ?? 0) - (a.views ?? 0))
        .slice(0, limit);
      return NextResponse.json({ resources: mappedStatic });
    }

    return NextResponse.json({ resources });
  } catch (error) {
    console.error("Error fetching resources:", error);
    return NextResponse.json(
      { error: "Failed to fetch resources" },
      { status: 400 }
    );
  }
}
