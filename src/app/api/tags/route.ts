import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCached, setCached, CACHE_TTL } from "@/lib/redis";

// GET /api/tags - Get all tags
export async function GET() {
  try {
    // Check cache
    const cached = await getCached("all", { prefix: "tags", ttl: CACHE_TTL.TAGS });
    if (cached) {
      return NextResponse.json(cached);
    }

    const tags = await prisma.tag.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        _count: {
          select: {
            posts: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    const formattedTags = tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      description: tag.description,
      postCount: tag._count.posts,
    }));

    const response = { tags: formattedTags };

    // Cache the response
    await setCached("all", response, { prefix: "tags", ttl: CACHE_TTL.TAGS });

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    console.error("Error fetching tags:", error);
    return NextResponse.json(
      { error: "Failed to fetch tags" },
      { status: 500 }
    );
  }
}
