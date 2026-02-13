/**
 * Forwards Sentry-captured server errors to the owner dashboard (ClientError table)
 * so they appear in the Problem Detection dashboard alongside client-side errors.
 */
import { prisma } from '@/lib/prisma';
import type { Event } from '@sentry/types';

export async function forwardSentryEventToDashboard(
  event: Event
): Promise<void> {
  const userId = event.user?.id ?? null;
  try {
    const message =
      event.message ||
      event.exception?.values?.[0]?.value ||
      'Unknown server error';
    const stackTrace =
      event.exception?.values?.[0]?.stacktrace?.frames
        ?.map((f) => `${f.filename}:${f.lineno} ${f.function}`)
        .join('\n') || undefined;

    const requestUrl = event.request?.url;
    let pagePath = '/';
    if (requestUrl) {
      try {
        pagePath = new URL(requestUrl).pathname || '/';
      } catch {
        // ignore
      }
    }

    await prisma.clientError.create({
      data: {
        userId: userId || undefined,
        errorType: 'FEATURE_CRASH',
        message: String(message).slice(0, 5000),
        stackTrace: stackTrace?.slice(0, 10000),
        pagePath: pagePath.slice(0, 500),
        pageTitle: event.request?.method
          ? `${event.request.method} ${pagePath}`
          : undefined,
        userAgent: event.request?.headers?.['User-Agent'] as string | undefined,
        metadata: {
          source: 'sentry',
          environment: event.environment,
          release: event.release,
        },
      },
    });
  } catch (err) {
    console.error('[sentry-forward] Failed to store event in dashboard:', err);
  }
}
