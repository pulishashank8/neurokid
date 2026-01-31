import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const query = searchParams.get("q")?.toLowerCase().trim();

        if (!query || query.length < 2) {
            return NextResponse.json({ suggestions: [] });
        }

        // Fast search using UserFinder table
        const suggestions = await prisma.userFinder.findMany({
            where: {
                keywords: {
                    contains: query,
                },
            },
            select: {
                username: true,
                displayName: true,
                avatarUrl: true,
            },
            take: 5,
        });

        return NextResponse.json({ suggestions });
    } catch (error) {
        console.error("Suggestions API Error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
