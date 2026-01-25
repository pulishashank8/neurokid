import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { username, displayName } = await request.json();

    if (!username || !displayName) {
      return NextResponse.json(
        { error: "Username and display name are required" },
        { status: 400 }
      );
    }

    const trimmedUsername = username.toLowerCase().trim();
    const trimmedDisplayName = displayName.trim();

    if (trimmedUsername.length < 3) {
      return NextResponse.json(
        { error: "Username must be at least 3 characters" },
        { status: 400 }
      );
    }

    if (trimmedUsername.length > 30) {
      return NextResponse.json(
        { error: "Username must be less than 30 characters" },
        { status: 400 }
      );
    }

    if (!/^[a-z0-9_]+$/.test(trimmedUsername)) {
      return NextResponse.json(
        { error: "Username can only contain letters, numbers, and underscores" },
        { status: 400 }
      );
    }

    if (trimmedDisplayName.length < 1 || trimmedDisplayName.length > 50) {
      return NextResponse.json(
        { error: "Display name must be between 1 and 50 characters" },
        { status: 400 }
      );
    }

    const existingProfile = await prisma.profile.findUnique({
      where: { username: trimmedUsername },
    });

    if (existingProfile && existingProfile.userId !== userId) {
      return NextResponse.json(
        { error: "This username is already taken. Please choose another." },
        { status: 409 }
      );
    }

    const userProfile = await prisma.profile.findUnique({
      where: { userId },
    });

    if (userProfile) {
      await prisma.profile.update({
        where: { userId },
        data: {
          username: trimmedUsername,
          displayName: trimmedDisplayName,
        },
      });
    } else {
      await prisma.profile.create({
        data: {
          userId,
          username: trimmedUsername,
          displayName: trimmedDisplayName,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Onboarding error:", error);
    
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "This username is already taken. Please choose another." },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to complete profile" },
      { status: 500 }
    );
  }
}
