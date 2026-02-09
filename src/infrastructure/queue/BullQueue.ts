import { Queue, Job as BullJob } from 'bullmq';
import Redis from 'ioredis';
import { injectable } from 'tsyringe';
import { IJobQueue, JobOptions, Job } from '@/domain/interfaces/queue/IJobQueue';

@injectable()
export class BullQueue implements IJobQueue {
  private queues: Map<string, Queue> = new Map();
  private redis: Redis | null = null;

  private getRedis(): Redis {
    if (!this.redis) {
      const redisUrl = process.env.REDIS_URL;
      if (!redisUrl) {
        throw new Error('REDIS_URL environment variable is not set');
      }
      this.redis = new Redis(redisUrl, {
        maxRetriesPerRequest: null,
        lazyConnect: true,
      });
    }
    return this.redis;
  }

  private getQueue(name: string): Queue {
    if (!this.queues.has(name)) {
      this.queues.set(name, new Queue(name, { connection: this.getRedis() }));
    }
    return this.queues.get(name)!;
  }

  async add<T>(jobName: string, data: T, options?: JobOptions): Promise<Job<T>> {
    const queue = this.getQueue(jobName);
    const job = await queue.add(jobName, data, {
      delay: options?.delay,
      priority: options?.priority,
      attempts: options?.attempts ?? 3,
      backoff: options?.backoff,
      removeOnComplete: options?.removeOnComplete ?? 100,
      removeOnFail: options?.removeOnFail ?? 50,
    });

    return this.toJob<T>(job);
  }

  async addBulk<T>(jobs: Array<{ name: string; data: T; options?: JobOptions }>): Promise<Job<T>[]> {
    const results: Job<T>[] = [];
    for (const j of jobs) {
      const result = await this.add(j.name, j.data, j.options);
      results.push(result);
    }
    return results;
  }

  async getJob<T>(jobId: string): Promise<Job<T> | null> {
    for (const queue of this.queues.values()) {
      const job = await queue.getJob(jobId);
      if (job) {
        return this.toJob<T>(job as BullJob<T>);
      }
    }
    return null;
  }

  async removeJob(jobId: string): Promise<void> {
    for (const queue of this.queues.values()) {
      const job = await queue.getJob(jobId);
      if (job) {
        await job.remove();
        return;
      }
    }
  }

  async close(): Promise<void> {
    for (const queue of this.queues.values()) {
      await queue.close();
    }
    if (this.redis) {
      await this.redis.quit();
    }
    this.queues.clear();
    this.redis = null;
  }

  private toJob<T>(bullJob: BullJob<T>): Job<T> {
    return {
      id: bullJob.id ?? '',
      name: bullJob.name,
      data: bullJob.data,
      attemptsMade: bullJob.attemptsMade,
      progress: typeof bullJob.progress === 'number' ? bullJob.progress : 0,
    };
  }
}
