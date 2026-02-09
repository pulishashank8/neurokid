import { Job } from './IJobQueue';

export interface IJobProcessor<T> {
  readonly jobName: string;
  process(job: Job<T>): Promise<void>;
  onFailed?(job: Job<T>, err: Error): Promise<void>;
  onCompleted?(job: Job<T>, result: unknown): Promise<void>;
  close(): Promise<void>;
}
