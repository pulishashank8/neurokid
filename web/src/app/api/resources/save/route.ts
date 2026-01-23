import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// POST /api/resources/save - Toggle save for a resource
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { resourceId } = await request.json();

        if (!resourceId) {
            return NextResponse.json({ error: "Resource ID is required" }, { status: 400 });
        }

        // Verify resource exists
        const resource = await prisma.resource.findUnique({
            where: { id: resourceId },
        });

        if (!resource) {
            return NextResponse.json({ error: "Resource not found" }, { status: 404 });
        }

        // Check if already saved
        const existing = await prisma.savedResource.findUnique({
            where: {
                userId_resourceId: {
                    userId: session.user.id,
                    resourceId,
                },
            },
        });

        if (existing) {
            // Remove
            await prisma.savedResource.delete({
                where: {
                    id: existing.id,
                },
            });
            return NextResponse.json({ saved: false });
        } else {
            // Create
            await prisma.savedResource.create({
                data: {
                    userId: session.user.id,
                    resourceId,
                },
            });
            return NextResponse.json({ saved: true });
        }
    } catch (error) {
        console.error("Error saving resource:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// GET /api/resources/save - Get user's saved resource IDs
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ savedIds: [] });
        }

        const saved = await prisma.savedResource.findMany({
            where: { userId: session.user.id },
            select: { resourceId: true },
        });

        return NextResponse.json({ savedIds: saved.map(s => s.resourceId) });
    } catch (error) {
        console.error("Error fetching saved resources:", error);
        return NextResponse.json({ savedIds: [] });
    }
}
