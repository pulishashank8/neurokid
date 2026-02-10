import { injectable, inject } from 'tsyringe';
import { JobProcessor } from '@/infrastructure/queue/JobProcessor';
import { IEmailService, SendEmailInput } from '@/domain/interfaces/services/IEmailService';
import { TOKENS } from '@/lib/container';
import { Job } from '@/domain/interfaces/queue';

export interface SendEmailJobData extends SendEmailInput {
  type?: 'general' | 'verification' | 'password-reset' | 'welcome';
}

@injectable()
export class EmailProcessor extends JobProcessor<SendEmailJobData> {
  readonly jobName = 'email:send';

  constructor(
    @inject(TOKENS.EmailService) private emailService: IEmailService
  ) {
    super();
  }

  start(): void {
    this.initialize();
    console.log(`[EmailProcessor] Started processing '${this.jobName}' jobs`);
  }

  async process(job: Job<SendEmailJobData>): Promise<void> {
    const { to, subject, html, text, from, replyTo } = job.data;

    await this.emailService.send({
      to,
      subject,
      html,
      text,
      from,
      replyTo,
    });

    console.log(`[EmailProcessor] Email sent to ${to} (job ${job.id})`);
  }

  async onFailed(job: Job<SendEmailJobData>, err: Error): Promise<void> {
    console.error(`[EmailProcessor] Job ${job.id} failed after ${job.attemptsMade} attempts:`, err.message);
    // Could add monitoring/alerting here
  }

  async onCompleted(job: Job<SendEmailJobData>): Promise<void> {
    console.log(`[EmailProcessor] Job ${job.id} completed successfully`);
  }
}
