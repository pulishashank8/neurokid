import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { createVoteSchema } from "@/lib/validations/community";
import { invalidateCache } from "@/lib/redis";
import {
  RATE_LIMITERS,
  rateLimitResponse,
} from "@/lib/rateLimit";

// POST /api/votes - Create/update/remove vote
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit: 60 votes per minute per user
    const canVote = await RATE_LIMITERS.vote.checkLimit(session.user.id);
    if (!canVote) {
      const retryAfter = await RATE_LIMITERS.vote.getRetryAfter(
        session.user.id
      );
      return rateLimitResponse(retryAfter);
    }

    const body = await request.json();
    const validation = createVoteSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { targetType, targetId, value } = validation.data;

    // Verify target exists
    if (targetType === "POST") {
      const post = await prisma.post.findUnique({
        where: { id: targetId },
        select: { id: true },
      });
      if (!post) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 });
      }
    } else if (targetType === "COMMENT") {
      const comment = await prisma.comment.findUnique({
        where: { id: targetId },
        select: { id: true },
      });
      if (!comment) {
        return NextResponse.json({ error: "Comment not found" }, { status: 404 });
      }
    }

    // Check if vote already exists
    const existingVote = await prisma.vote.findUnique({
      where: {
        userId_targetId_targetType: {
          userId: session.user.id,
          targetId,
          targetType,
        },
      },
    });

    let updatedVoteScore = 0;

    if (value === 0) {
      // Remove vote
      if (existingVote) {
        await prisma.vote.delete({
          where: {
            userId_targetId_targetType: {
              userId: session.user.id,
              targetId,
              targetType,
            },
          },
        });

        // Update target vote score
        const scoreChange = -existingVote.value;
        if (targetType === "POST") {
          const post = await prisma.post.update({
            where: { id: targetId },
            data: { voteScore: { increment: scoreChange } },
            select: { voteScore: true },
          });
          updatedVoteScore = post.voteScore;
        } else {
          const comment = await prisma.comment.update({
            where: { id: targetId },
            data: { voteScore: { increment: scoreChange } },
            select: { voteScore: true },
          });
          updatedVoteScore = comment.voteScore;
        }
      }
    } else {
      // Create or update vote
      const oldValue = existingVote?.value || 0;
      const scoreChange = value - oldValue;

      await prisma.vote.upsert({
        where: {
          userId_targetId_targetType: {
            userId: session.user.id,
            targetId,
            targetType,
          },
        },
        create: {
          userId: session.user.id,
          targetType,
          targetId,
          value,
        },
        update: {
          value,
        },
      });

      // Update target vote score
      if (targetType === "POST") {
        const post = await prisma.post.update({
          where: { id: targetId },
          data: { voteScore: { increment: scoreChange } },
          select: { voteScore: true },
        });
        updatedVoteScore = post.voteScore;
      } else {
        const comment = await prisma.comment.update({
          where: { id: targetId },
          data: { voteScore: { increment: scoreChange } },
          select: { voteScore: true },
        });
        updatedVoteScore = comment.voteScore;
      }
    }

    // Invalidate caches
    if (targetType === "POST") {
      await invalidateCache("posts:*", { prefix: "posts" });
    }

    return NextResponse.json({
      success: true,
      voteScore: updatedVoteScore,
      userVote: value,
    });
  } catch (error) {
    console.error("Error processing vote:", error);
    return NextResponse.json(
      { error: "Failed to process vote" },
      { status: 500 }
    );
  }
}
