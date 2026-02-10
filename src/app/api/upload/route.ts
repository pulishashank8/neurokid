import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";
import { rateLimitResponse, RATE_LIMITERS } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const canUpload = await RATE_LIMITERS.upload.checkLimit(session.user.id);
        if (!canUpload) {
            const retryAfter = await RATE_LIMITERS.upload.getRetryAfter(session.user.id);
            return rateLimitResponse(retryAfter);
        }

        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        // Limit check (2MB) - Base64 will be approx 33% larger
        if (file.size > 2 * 1024 * 1024) {
            return NextResponse.json({ error: "File size limit is 2MB" }, { status: 400 });
        }

        // Validate file type (security: prevent upload of executable files)
        // NOTE: SVG removed due to XSS vulnerability (can contain embedded scripts)
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: "Invalid file type. Only JPG, PNG, GIF, and WebP images are allowed." }, { status: 400 });
        }

        // Additional security: validate file extension
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
        const fileName = file.name.toLowerCase();
        const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
        if (!hasValidExtension) {
            return NextResponse.json({ error: "Invalid file extension" }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Convert to Base64 Data URI
        const base64String = buffer.toString('base64');
        const mimeType = file.type || 'application/octet-stream';
        const dataUri = `data:${mimeType};base64,${base64String}`;

        return NextResponse.json({ url: dataUri, type: mimeType });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
}
