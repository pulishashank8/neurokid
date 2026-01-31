import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) { // Use ID if available, otherwise email
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Update lastActiveAt
    try {
        await prisma.user.update({
            where: { id: session.user.id },
            data: { lastActiveAt: new Date() }
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to update activity:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
