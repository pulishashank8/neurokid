/**
 * Real-Time Bug Alert System for Co-Founder AI
 *
 * Sends immediate email alerts when critical bugs are reported
 * or system anomalies are detected.
 */

import { Resend } from 'resend';
import { prisma } from '@/lib/prisma';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface BugAlertData {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  reportedBy: string;
  reportedAt: Date;
  context?: {
    userAgent?: string;
    url?: string;
    ipAddress?: string;
    stackTrace?: string;
  };
}

/**
 * Send immediate email alert for critical bugs
 */
export async function sendBugAlert(bugData: BugAlertData): Promise<void> {
  const recipientEmail = process.env.COFOUNDER_RECIPIENT_EMAIL || 'pulishashank8@gmail.com';

  // Only send alerts for high and critical severity bugs
  if (bugData.severity !== 'high' && bugData.severity !== 'critical') {
    console.log(`[Bug Alert] Skipping alert for ${bugData.severity} severity bug`);
    return;
  }

  console.log(`[Bug Alert] Sending ${bugData.severity} severity bug alert for: ${bugData.title}`);

  const emailHtml = generateBugAlertEmailHTML(bugData);
  const emailText = generateBugAlertEmailText(bugData);

  try {
    const emailResult = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'NeuroKind Co-Founder AI <cofounder@neurokind.help>',
      to: recipientEmail,
      subject: `🚨 ${bugData.severity.toUpperCase()} Bug Alert - ${bugData.title.substring(0, 50)}`,
      html: emailHtml,
      text: emailText,
    });

    if (emailResult.data) {
      console.log(`[Bug Alert] Email sent successfully:`, emailResult.data.id);
    } else {
      console.error(`[Bug Alert] Email send failed:`, emailResult.error);
    }
  } catch (error) {
    console.error(`[Bug Alert] Error sending bug alert email:`, error);
  }
}

/**
 * Generate HTML email for bug alert
 */
function generateBugAlertEmailHTML(bug: BugAlertData): string {
  const severityColor =
    bug.severity === 'critical'
      ? '#ef4444'
      : bug.severity === 'high'
        ? '#f59e0b'
        : '#3b82f6';

  const severityBg =
    bug.severity === 'critical'
      ? 'rgba(239, 68, 68, 0.1)'
      : bug.severity === 'high'
        ? 'rgba(245, 158, 11, 0.1)'
        : 'rgba(59, 130, 246, 0.1)';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
      background: linear-gradient(135deg, #0d1117 0%, #161b22 100%);
      color: #e6edf3;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      border-radius: 12px 12px 0 0;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
    }
    .content {
      background: #1f2937;
      border-radius: 0 0 12px 12px;
      padding: 30px;
    }
    .severity-badge {
      display: inline-block;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
      color: ${severityColor};
      background: ${severityBg};
      border: 1px solid ${severityColor};
      margin-bottom: 20px;
    }
    .bug-title {
      font-size: 20px;
      font-weight: bold;
      color: #ffffff;
      margin: 0 0 15px 0;
    }
    .bug-description {
      font-size: 14px;
      line-height: 1.6;
      color: #d1d5db;
      margin-bottom: 20px;
      padding: 15px;
      background: rgba(0, 0, 0, 0.2);
      border-radius: 8px;
      border-left: 4px solid ${severityColor};
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin-top: 20px;
    }
    .info-item {
      background: rgba(0, 0, 0, 0.2);
      padding: 12px;
      border-radius: 8px;
    }
    .info-label {
      font-size: 11px;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 5px;
    }
    .info-value {
      font-size: 14px;
      color: #ffffff;
      font-weight: 500;
    }
    .context-section {
      margin-top: 25px;
      padding: 15px;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 8px;
    }
    .context-title {
      font-size: 14px;
      font-weight: bold;
      color: #ffffff;
      margin-bottom: 10px;
    }
    .context-item {
      font-size: 12px;
      color: #d1d5db;
      margin-bottom: 5px;
      font-family: 'Courier New', monospace;
    }
    .action-button {
      display: inline-block;
      margin-top: 20px;
      padding: 12px 24px;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: bold;
      text-align: center;
    }
    .footer {
      text-align: center;
      margin-top: 20px;
      font-size: 12px;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚨 Bug Alert - Immediate Attention Required</h1>
    </div>
    <div class="content">
      <span class="severity-badge">${bug.severity} Severity</span>

      <h2 class="bug-title">${bug.title}</h2>

      <div class="bug-description">
        ${bug.description}
      </div>

      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Reported By</div>
          <div class="info-value">${bug.reportedBy}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Reported At</div>
          <div class="info-value">${new Date(bug.reportedAt).toLocaleString()}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Bug ID</div>
          <div class="info-value">${bug.id}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Status</div>
          <div class="info-value">🔴 Active</div>
        </div>
      </div>

      ${
        bug.context
          ? `
      <div class="context-section">
        <div class="context-title">Technical Context</div>
        ${bug.context.url ? `<div class="context-item">URL: ${bug.context.url}</div>` : ''}
        ${bug.context.userAgent ? `<div class="context-item">User Agent: ${bug.context.userAgent}</div>` : ''}
        ${bug.context.ipAddress ? `<div class="context-item">IP: ${bug.context.ipAddress}</div>` : ''}
        ${bug.context.stackTrace ? `<div class="context-item">Stack Trace Available: Yes</div>` : ''}
      </div>
      `
          : ''
      }

      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://neurokind.help'}/owner/dashboard/feedback" class="action-button">
        View in Dashboard →
      </a>
    </div>
    <div class="footer">
      <p>This alert was sent by Co-Founder AI</p>
      <p>Powered by NeuroKind</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generate plain text email for bug alert
 */
function generateBugAlertEmailText(bug: BugAlertData): string {
  return `
🚨 BUG ALERT - IMMEDIATE ATTENTION REQUIRED

Severity: ${bug.severity.toUpperCase()}
Title: ${bug.title}

Description:
${bug.description}

Reported By: ${bug.reportedBy}
Reported At: ${new Date(bug.reportedAt).toLocaleString()}
Bug ID: ${bug.id}
Status: Active

${
  bug.context
    ? `
Technical Context:
${bug.context.url ? `URL: ${bug.context.url}` : ''}
${bug.context.userAgent ? `User Agent: ${bug.context.userAgent}` : ''}
${bug.context.ipAddress ? `IP: ${bug.context.ipAddress}` : ''}
${bug.context.stackTrace ? `Stack Trace: Available` : ''}
`
    : ''
}

View in Dashboard: ${process.env.NEXT_PUBLIC_APP_URL || 'https://neurokind.help'}/owner/dashboard/feedback

---
This alert was sent by Co-Founder AI
Powered by NeuroKind
  `.trim();
}

/**
 * Send alert for system error spike
 */
export async function sendErrorSpikeAlert(errorData: {
  errorCount: number;
  timeWindow: string;
  threshold: number;
  topErrors: Array<{ message: string; count: number }>;
}): Promise<void> {
  const bugData: BugAlertData = {
    id: `error-spike-${Date.now()}`,
    severity: 'critical',
    title: `System Error Spike Detected - ${errorData.errorCount} errors in ${errorData.timeWindow}`,
    description: `Critical: Error rate has exceeded threshold (${errorData.threshold} errors). Current count: ${errorData.errorCount} errors in the last ${errorData.timeWindow}.

Top Errors:
${errorData.topErrors.map((e, i) => `${i + 1}. ${e.message} (${e.count}x)`).join('\n')}

This requires immediate investigation to prevent user impact.`,
    reportedBy: 'System Monitor',
    reportedAt: new Date(),
  };

  await sendBugAlert(bugData);
}

/**
 * Send alert for anomaly detection
 */
export async function sendAnomalyAlert(anomalyData: {
  metric: string;
  currentValue: number;
  expectedValue: number;
  deviation: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}): Promise<void> {
  const bugData: BugAlertData = {
    id: `anomaly-${Date.now()}`,
    severity: anomalyData.severity,
    title: `Anomaly Detected in ${anomalyData.metric}`,
    description: `The metric "${anomalyData.metric}" has deviated significantly from expected patterns.

Current Value: ${anomalyData.currentValue}
Expected Value: ${anomalyData.expectedValue}
Deviation: ${anomalyData.deviation}%

This may indicate a system issue, unusual user behavior, or a potential security threat.`,
    reportedBy: 'Anomaly Detector AI',
    reportedAt: new Date(),
  };

  await sendBugAlert(bugData);
}
