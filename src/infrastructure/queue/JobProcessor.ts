import { Worker, Job as BullJob } from 'bullmq';
import Redis from 'ioredis';
import { IJobProcessor, Job } from '@/domain/interfaces/queue';

export abstract class JobProcessor<T> implements IJobProcessor<T> {
  abstract readonly jobName: string;
  protected worker: Worker | null = null;
  protected redis: Redis | null = null;

  protected initialize(): void {
    if (this.worker) return;

    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      throw new Error('REDIS_URL environment variable is not set');
    }

    this.redis = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
    });

    this.worker = new Worker(
      this.jobName,
      async (bullJob: BullJob<T>) => {
        const job = this.toJob(bullJob);
        await this.process(job);
      },
      {
        connection: this.redis,
        concurrency: 5,
      }
    );

    this.worker.on('failed', async (bullJob, err) => {
      if (bullJob && this.onFailed) {
        const job = this.toJob(bullJob as BullJob<T>);
        await this.onFailed(job, err);
      }
    });

    this.worker.on('completed', async (bullJob, result) => {
      if (this.onCompleted) {
        const job = this.toJob(bullJob as BullJob<T>);
        await this.onCompleted(job, result);
      }
    });
  }

  abstract process(job: Job<T>): Promise<void>;

  async onFailed?(job: Job<T>, err: Error): Promise<void>;
  async onCompleted?(job: Job<T>, result: unknown): Promise<void>;

  async close(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
      this.worker = null;
    }
    if (this.redis) {
      await this.redis.quit();
      this.redis = null;
    }
  }

  protected toJob(bullJob: BullJob<T>): Job<T> {
    return {
      id: bullJob.id ?? '',
      name: bullJob.name,
      data: bullJob.data,
      attemptsMade: bullJob.attemptsMade,
      progress: typeof bullJob.progress === 'number' ? bullJob.progress : 0,
    };
  }
}
