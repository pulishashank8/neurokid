import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { RegisterSchemaWithConfirm } from "@/lib/validators";
import bcryptjs from "bcryptjs";
import {
  RATE_LIMITERS,
  getClientIp,
  rateLimitResponse,
} from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 3 registrations per hour per IP
    const ip = getClientIp(request);
    const canRegister = await RATE_LIMITERS.register.checkLimit(ip);

    if (!canRegister) {
      const retryAfter = await RATE_LIMITERS.register.getRetryAfter(ip);
      return rateLimitResponse(retryAfter);
    }

    const body = await request.json();

    // Validate input
    const parsed = RegisterSchemaWithConfirm.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.errors,
        },
        { status: 400 }
      );
    }

    const { email, password, username, displayName } = parsed.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists with this email" },
        { status: 409 }
      );
    }

    // Check if username is already taken
    const existingUsername = await prisma.profile.findUnique({
      where: { username },
    });

    if (existingUsername) {
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Create user with profile
    const user = await prisma.user.create({
      data: {
        email,
        hashedPassword,
        profile: {
          create: {
            username,
            displayName,
          },
        },
        // Assign PARENT role by default
        userRoles: {
          create: {
            role: "PARENT",
          },
        },
      },
      include: {
        profile: true,
        userRoles: true,
      },
    });

    return NextResponse.json(
      {
        message: "User registered successfully",
        user: {
          id: user.id,
          email: user.email,
          profile: user.profile,
          roles: user.userRoles.map((ur) => ur.role),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 }
    );
  }
}
