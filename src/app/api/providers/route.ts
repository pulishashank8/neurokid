import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ProviderSpecialty, Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const city = searchParams.get("city");
    const state = searchParams.get("state");
    const specialty = searchParams.get("specialty");
    const verified = searchParams.get("verified");
    const sortBy = searchParams.get("sortBy");
    const limitParam = searchParams.get("limit");
    const limit = Math.min(limitParam ? parseInt(limitParam) : 50, 100); // Default 50, max 100

    const where: Prisma.ProviderWhereInput = {};

    if (city) {
      where.city = city;
    }

    if (state) {
      where.state = state;
    }

    if (specialty) {
      // Assuming specialty param matches the Enum string
      where.specialties = {
        has: specialty as ProviderSpecialty,
      };
    }

    if (verified === "true") {
      where.isVerified = true;
    }

    let orderBy: Prisma.ProviderOrderByWithRelationInput = { name: "asc" };
    if (sortBy === "rating") {
      orderBy = { rating: "desc" };
    } else {
      // Default sort? ID or Name?
      orderBy = { name: "asc" };
    }

    const providers = await prisma.provider.findMany({
      where,
      orderBy,
      take: limit,
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        latitude: true,
        longitude: true,
        specialties: true,
        rating: true,
        totalReviews: true,
        isVerified: true,
        website: true,
      },
    });

    const serializedProviders = providers.map((p) => ({
      ...p,
      rating: p.rating ? Number(p.rating) : null,
    }));

    return NextResponse.json({ providers: serializedProviders }, {
      headers: {
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200",
      },
    });
  } catch (error) {
    console.error("Error fetching providers:", error);
    return NextResponse.json(
      { error: "Failed to fetch providers" },
      { status: 500 }
    );
  }
}
