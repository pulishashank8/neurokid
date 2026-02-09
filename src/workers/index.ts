import 'reflect-metadata';
import { registerDependencies } from '@/lib/container-registrations';
import { container, TOKENS } from '@/lib/container';
import { EmailProcessor } from './processors/EmailProcessor';
import { NotificationProcessor } from './processors/NotificationProcessor';
import { createViewCountProcessor } from './processors/ViewCountProcessor';
import { IEmailService } from '@/domain/interfaces/services/IEmailService';
import { INotificationService } from '@/domain/interfaces/services/INotificationService';

interface Processor {
  close(): Promise<void>;
}

async function bootstrap(): Promise<void> {
  console.log('[Worker] Bootstrapping worker process...');

  // Register all dependencies
  registerDependencies();

  const processors: Processor[] = [];

  // Initialize email processor if email service is available
  try {
    const emailService = container.resolve<IEmailService>(TOKENS.EmailService);
    if (emailService) {
      const emailProcessor = new EmailProcessor(emailService);
      emailProcessor.start();
      processors.push(emailProcessor);
    }
  } catch (err) {
    console.warn('[Worker] EmailService not registered, skipping EmailProcessor');
  }

  // Initialize notification processor
  try {
    const notificationService = container.resolve<INotificationService>(TOKENS.NotificationService);
    if (notificationService) {
      const notificationProcessor = new NotificationProcessor(notificationService);
      notificationProcessor.start();
      processors.push(notificationProcessor);
    }
  } catch (err) {
    console.warn('[Worker] NotificationService not registered, skipping NotificationProcessor');
  }

  // Initialize view count processor for batch flushing
  try {
    const viewCountProcessor = createViewCountProcessor();
    viewCountProcessor.start();
    processors.push(viewCountProcessor);
    console.log('[Worker] ViewCountProcessor started');
  } catch (err) {
    console.warn('[Worker] ViewCountService not registered, skipping ViewCountProcessor');
  }

  console.log(`[Worker] Started ${processors.length} processor(s)`);

  // Graceful shutdown handling
  const shutdown = async (signal: string): Promise<void> => {
    console.log(`[Worker] Received ${signal}, shutting down gracefully...`);

    try {
      await Promise.all(processors.map(p => p.close()));
      console.log('[Worker] All processors closed successfully');
      process.exit(0);
    } catch (err) {
      console.error('[Worker] Error during shutdown:', err);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Keep process alive
  console.log('[Worker] Worker process is running. Press Ctrl+C to stop.');
}

bootstrap().catch(err => {
  console.error('[Worker] Fatal error:', err);
  process.exit(1);
});
