import { injectable, inject } from 'tsyringe';
import { PrismaClient, Vote as PrismaVote } from '@prisma/client';
import { TOKENS } from '@/lib/container';
import { IVoteRepository, CreateVoteInput } from '@/domain/interfaces/repositories/IVoteRepository';
import { Vote } from '@/domain/types';
import { IDatabaseConnection } from '../database/DatabaseConnection';

@injectable()
export class VoteRepository implements IVoteRepository {
  private prisma: PrismaClient;

  constructor(
    @inject(TOKENS.DatabaseConnection) db: IDatabaseConnection
  ) {
    this.prisma = db.getClient();
  }

  async findByUserAndTarget(userId: string, targetType: 'POST' | 'COMMENT', targetId: string): Promise<Vote | null> {
    const vote = await this.prisma.vote.findUnique({
      where: {
        userId_targetId_targetType: {
          userId,
          targetId,
          targetType,
        },
      },
    });
    return vote ? this.toDomain(vote) : null;
  }

  async upsert(data: CreateVoteInput): Promise<Vote> {
    const vote = await this.prisma.vote.upsert({
      where: {
        userId_targetId_targetType: {
          userId: data.userId,
          targetId: data.targetId,
          targetType: data.targetType,
        },
      },
      create: {
        userId: data.userId,
        targetType: data.targetType,
        targetId: data.targetId,
        value: data.value,
      },
      update: {
        value: data.value,
      },
    });
    return this.toDomain(vote);
  }

  async delete(userId: string, targetType: 'POST' | 'COMMENT', targetId: string): Promise<void> {
    await this.prisma.vote.deleteMany({
      where: {
        userId,
        targetType,
        targetId,
      },
    });
  }

  async getUserVotesForTargets(userId: string, targetType: 'POST' | 'COMMENT', targetIds: string[]): Promise<Map<string, number>> {
    const votes = await this.prisma.vote.findMany({
      where: {
        userId,
        targetType,
        targetId: { in: targetIds },
      },
      select: {
        targetId: true,
        value: true,
      },
    });

    const voteMap = new Map<string, number>();
    for (const vote of votes) {
      voteMap.set(vote.targetId, vote.value);
    }
    return voteMap;
  }

  async countByTarget(targetType: 'POST' | 'COMMENT', targetId: string): Promise<{ up: number; down: number }> {
    const [up, down] = await Promise.all([
      this.prisma.vote.count({
        where: { targetType, targetId, value: 1 },
      }),
      this.prisma.vote.count({
        where: { targetType, targetId, value: -1 },
      }),
    ]);
    return { up, down };
  }

  async getCountsByTargets(
    targetType: 'POST' | 'COMMENT',
    targetIds: string[]
  ): Promise<Map<string, { likeCount: number; dislikeCount: number }>> {
    if (targetIds.length === 0) return new Map();
    const [likesGroup, dislikesGroup] = await Promise.all([
      this.prisma.vote.groupBy({
        by: ['targetId'],
        where: { targetType, targetId: { in: targetIds }, value: 1 },
        _count: { id: true },
      }),
      this.prisma.vote.groupBy({
        by: ['targetId'],
        where: { targetType, targetId: { in: targetIds }, value: -1 },
        _count: { id: true },
      }),
    ]);
    const map = new Map<string, { likeCount: number; dislikeCount: number }>();
    for (const id of targetIds) {
      map.set(id, { likeCount: 0, dislikeCount: 0 });
    }
    for (const row of likesGroup) {
      map.set(row.targetId, { ...map.get(row.targetId)!, likeCount: row._count.id });
    }
    for (const row of dislikesGroup) {
      const cur = map.get(row.targetId)!;
      map.set(row.targetId, { ...cur, dislikeCount: row._count.id });
    }
    return map;
  }

  private toDomain(vote: PrismaVote): Vote {
    return {
      id: vote.id,
      userId: vote.userId,
      targetType: vote.targetType as 'POST' | 'COMMENT',
      targetId: vote.targetId,
      value: vote.value,
      createdAt: vote.createdAt,
    };
  }
}
