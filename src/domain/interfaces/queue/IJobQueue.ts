export interface JobOptions {
  delay?: number;
  priority?: number;
  attempts?: number;
  backoff?: {
    type: 'fixed' | 'exponential';
    delay: number;
  };
  removeOnComplete?: boolean | number;
  removeOnFail?: boolean | number;
}

export interface Job<T = unknown> {
  id: string;
  name: string;
  data: T;
  attemptsMade: number;
  progress: number;
}

export interface IJobQueue {
  add<T>(jobName: string, data: T, options?: JobOptions): Promise<Job<T>>;
  addBulk<T>(jobs: Array<{ name: string; data: T; options?: JobOptions }>): Promise<Job<T>[]>;
  getJob<T>(jobId: string): Promise<Job<T> | null>;
  removeJob(jobId: string): Promise<void>;
}
