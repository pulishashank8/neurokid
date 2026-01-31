import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";
import { rateLimitResponse, RATE_LIMITERS } from "@/lib/rateLimit";

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

        // 2MB Limit
        if (file.size > 2 * 1024 * 1024) {
            return NextResponse.json({ error: "File size limit is 2MB" }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Save to public/uploads
        const uploadDir = join(process.cwd(), "public/uploads");
        await mkdir(uploadDir, { recursive: true });

        const fileName = `${uuidv4()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "")}`;
        const filePath = join(uploadDir, fileName);

        await writeFile(filePath, buffer);

        const publicUrl = `/uploads/${fileName}`;

        return NextResponse.json({ url: publicUrl, type: file.type });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
}
