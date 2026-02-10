import { injectable, inject } from 'tsyringe';
import { JobProcessor } from '@/infrastructure/queue/JobProcessor';
import { INotificationService, CreateNotificationInput } from '@/domain/interfaces/services/INotificationService';
import { TOKENS } from '@/lib/container';
import { Job } from '@/domain/interfaces/queue';

export interface NotificationJobData {
  type: 'single' | 'bulk';
  notification?: CreateNotificationInput;
  notifications?: CreateNotificationInput[];
}

@injectable()
export class NotificationProcessor extends JobProcessor<NotificationJobData> {
  readonly jobName = 'notification:create';

  constructor(
    @inject(TOKENS.NotificationService) private notificationService: INotificationService
  ) {
    super();
  }

  start(): void {
    this.initialize();
    console.log(`[NotificationProcessor] Started processing '${this.jobName}' jobs`);
  }

  async process(job: Job<NotificationJobData>): Promise<void> {
    const { type, notification, notifications } = job.data;

    if (type === 'single' && notification) {
      await this.notificationService.create(notification);
      console.log(`[NotificationProcessor] Created notification for user ${notification.userId} (job ${job.id})`);
    } else if (type === 'bulk' && notifications && notifications.length > 0) {
      await this.notificationService.createMany(notifications);
      console.log(`[NotificationProcessor] Created ${notifications.length} notifications (job ${job.id})`);
    }
  }

  async onFailed(job: Job<NotificationJobData>, err: Error): Promise<void> {
    console.error(`[NotificationProcessor] Job ${job.id} failed after ${job.attemptsMade} attempts:`, err.message);
  }
}
