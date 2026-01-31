import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { syncUserToFinder } from "@/lib/finder";

const onboardingSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(/^[a-z0-9_-]+$/, "Username can only contain lowercase letters, numbers, underscores, and hyphens"),
  displayName: z.string().min(1, "Full name is required").max(100, "Full name too long"),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const body = await request.json();
    const validation = onboardingSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { username, displayName } = validation.data;
    const trimmedUsername = username.toLowerCase().trim();

    // Check if username is already taken
    const existingProfile = await prisma.profile.findUnique({
      where: { username: trimmedUsername },
    });

    if (existingProfile && existingProfile.userId !== userId) {
      return NextResponse.json(
        { error: "Username is already taken. Please try another one." },
        { status: 409 }
      );
    }

    // Upsert profile
    await prisma.profile.upsert({
      where: { userId },
      update: {
        username: trimmedUsername,
        displayName: displayName.trim(),
      },
      create: {
        userId,
        username: trimmedUsername,
        displayName: displayName.trim(),
      },
    });

    // Sync to UserFinder for search optimization
    await syncUserToFinder(userId);

    return NextResponse.json({ success: true, message: "Profile updated successfully" });
  } catch (error) {
    console.error("Onboarding API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
