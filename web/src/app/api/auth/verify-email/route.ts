import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get("token");

        if (!token) {
            return NextResponse.redirect(new URL('/login?error=MissingToken', request.url));
        }

        const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

        const emailToken = await prisma.emailVerificationToken.findUnique({
            where: { tokenHash },
            include: { user: true },
        });

        if (!emailToken) {
            return NextResponse.redirect(new URL('/login?error=InvalidToken', request.url));
        }

        if (new Date() > emailToken.expiresAt) {
            return NextResponse.redirect(new URL('/login?error=TokenExpired', request.url));
        }

        // Verify user
        await prisma.user.update({
            where: { id: emailToken.userId },
            data: {
                emailVerified: true,
                emailVerifiedAt: new Date(),
            },
        });

        // Delete used token
        await prisma.emailVerificationToken.delete({
            where: { id: emailToken.id },
        });

        return NextResponse.redirect(new URL('/login?verified=true', request.url));
    } catch (error) {
        console.error("Verification error:", error);
        return NextResponse.redirect(new URL('/login?error=UnknownError', request.url));
    }
}
