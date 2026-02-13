/**
 * Co-Founder AI Email Report Renderer
 *
 * Generates comprehensive HTML email reports for executive business intelligence.
 * Includes: KPIs, user activity, system health, security alerts, agent insights, and recommendations.
 */

import { ExecutiveReport } from '@/lib/agents/core/types';

export interface CoFounderEmailData {
  report: ExecutiveReport;
  kpis: {
    totalUsers: number;
    activeUsers7d: number;
    newSignupsToday: number;
    newSignups7d: number;
    newSignups30d: number;
    dauMauRatio: number;
    revenue: number;
    costs: number;
    netProfit: number;
    churnRate: number;
    avgResponseTime: number;
    errorRate: number;
    uptime: number;
  };
  userActivity: {
    newUsers: Array<{ date: string; count: number }>;
    activeUsers: Array<{ date: string; count: number }>;
    engagement: Array<{ date: string; rate: number }>;
  };
  systemHealth: {
    status: 'healthy' | 'degraded' | 'critical';
    errors: Array<{ message: string; count: number; severity: string }>;
    performance: Array<{ endpoint: string; avgTime: number }>;
  };
  security: {
    threats: number;
    failedLogins: number;
    bannedUsers: number;
    suspiciousIPs: string[];
  };
  bugs: Array<{
    id: string;
    title: string;
    description: string;
    reportedAt: Date;
    reporter: string;
  }>;
  agentInsights: Array<{
    agentType: string;
    agentName: string;
    severity: string;
    title: string;
    description: string;
    createdAt: Date;
  }>;
  chartImages?: {
    growthTrend?: string; // Base64 PNG
    revenueChart?: string;
    performanceChart?: string;
  };
  charts?: {
    growthChart?: string; // QuickChart.io URL
    revenueChart?: string;
    activityChart?: string;
    performanceChart?: string;
    engagementChart?: string;
  };
}

export function renderCoFounderEmail(data: CoFounderEmailData): string {
  const { report, kpis, userActivity, systemHealth, security, bugs, agentInsights } = data;

  // Calculate changes and trends
  const userGrowth = ((kpis.newSignups7d / Math.max(kpis.totalUsers - kpis.newSignups7d, 1)) * 100).toFixed(1);
  const profitMargin = kpis.revenue > 0 ? ((kpis.netProfit / kpis.revenue) * 100).toFixed(1) : '0';

  // Determine overall health status
  const overallHealth = systemHealth.status === 'healthy' && security.threats === 0 && bugs.length === 0
    ? '🟢 Healthy'
    : systemHealth.status === 'critical' || bugs.length > 5
    ? '🔴 Critical'
    : '🟡 Needs Attention';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NeuroKind Co-Founder AI Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #0d1117 0%, #161b22 100%);
      color: #e6edf3;
      padding: 20px;
      line-height: 1.6;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: #161b22;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    }
    .header {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      font-size: 32px;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 8px;
      letter-spacing: -0.5px;
    }
    .header .subtitle {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.9);
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .header .timestamp {
      margin-top: 12px;
      font-size: 13px;
      color: rgba(255, 255, 255, 0.8);
    }
    .content {
      padding: 30px;
    }
    .section {
      margin-bottom: 40px;
    }
    .section-title {
      font-size: 20px;
      font-weight: 700;
      color: #e6edf3;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid #21262d;
    }
    .executive-summary {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      padding: 24px;
      border-radius: 12px;
      margin-bottom: 30px;
    }
    .executive-summary h2 {
      font-size: 18px;
      color: #ffffff;
      margin-bottom: 12px;
      font-weight: 700;
    }
    .executive-summary p {
      font-size: 16px;
      line-height: 1.7;
      color: rgba(255, 255, 255, 0.95);
    }
    .alert-banner {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      padding: 20px;
      border-radius: 12px;
      margin-bottom: 30px;
      border-left: 4px solid #b91c1c;
    }
    .alert-banner h3 {
      font-size: 16px;
      color: #ffffff;
      margin-bottom: 8px;
      font-weight: 700;
    }
    .alert-banner p {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.95);
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin-bottom: 30px;
    }
    .kpi-card {
      background: #21262d;
      padding: 20px;
      border-radius: 12px;
      border: 1px solid #30363d;
    }
    .kpi-label {
      font-size: 12px;
      color: #8b949e;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
      font-weight: 600;
    }
    .kpi-value {
      font-size: 28px;
      font-weight: 800;
      color: #e6edf3;
      margin-bottom: 4px;
    }
    .kpi-change {
      font-size: 13px;
      font-weight: 600;
    }
    .kpi-change.positive { color: #34d399; }
    .kpi-change.negative { color: #f87171; }
    .kpi-change.neutral { color: #8b949e; }
    .table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 16px;
    }
    .table th {
      background: #21262d;
      padding: 12px;
      text-align: left;
      font-size: 12px;
      color: #8b949e;
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.5px;
      border-bottom: 1px solid #30363d;
    }
    .table td {
      padding: 12px;
      border-bottom: 1px solid #30363d;
      font-size: 14px;
      color: #e6edf3;
    }
    .table tr:last-child td {
      border-bottom: none;
    }
    .status-indicator {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }
    .status-healthy { background: rgba(52, 211, 153, 0.1); color: #34d399; }
    .status-warning { background: rgba(251, 191, 36, 0.1); color: #fbbf24; }
    .status-critical { background: rgba(248, 113, 113, 0.1); color: #f87171; }
    .recommendation {
      background: #21262d;
      padding: 16px;
      border-radius: 8px;
      border-left: 4px solid #10b981;
      margin-bottom: 12px;
    }
    .recommendation-priority {
      font-size: 11px;
      text-transform: uppercase;
      font-weight: 700;
      margin-bottom: 6px;
      letter-spacing: 0.5px;
    }
    .priority-critical { color: #f87171; }
    .priority-high { color: #fbbf24; }
    .priority-medium { color: #60a5fa; }
    .recommendation-title {
      font-size: 15px;
      font-weight: 700;
      color: #e6edf3;
      margin-bottom: 6px;
    }
    .recommendation-description {
      font-size: 14px;
      color: #8b949e;
      margin-bottom: 8px;
    }
    .recommendation-impact {
      font-size: 13px;
      color: #10b981;
      font-weight: 600;
    }
    .footer {
      background: #0d1117;
      padding: 24px 30px;
      text-align: center;
      border-top: 1px solid #21262d;
    }
    .footer p {
      font-size: 13px;
      color: #8b949e;
      margin-bottom: 4px;
    }
    .footer .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: #ffffff;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
      margin-top: 12px;
    }
    .chart-container {
      margin: 20px 0;
      text-align: center;
    }
    .chart-container img {
      max-width: 100%;
      border-radius: 8px;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>🚀 NeuroKind Co-Founder Report</h1>
      <div class="subtitle">Executive Business Intelligence</div>
      <div class="timestamp">${new Date().toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      })}</div>
    </div>

    <div class="content">
      <!-- Executive Summary -->
      <div class="executive-summary">
        <h2>📊 Executive Summary</h2>
        <p><strong>Platform Health:</strong> ${overallHealth}</p>
        <p>${report.executiveSummary || 'Platform is operating normally with steady growth. All systems functional.'}</p>
      </div>

      ${bugs.length > 0 || systemHealth.status === 'critical' ? `
      <!-- Critical Alerts -->
      <div class="alert-banner">
        <h3>⚠️ Critical Alerts Requiring Immediate Attention</h3>
        <p>
          ${bugs.length > 0 ? `${bugs.length} bug report(s) pending review. ` : ''}
          ${systemHealth.status === 'critical' ? 'System health is critical. ' : ''}
          ${security.threats > 0 ? `${security.threats} security threat(s) detected. ` : ''}
        </p>
      </div>
      ` : ''}

      <!-- KPI Dashboard -->
      <div class="section">
        <h2 class="section-title">📈 Key Performance Indicators</h2>
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-label">Total Users</div>
            <div class="kpi-value">${kpis.totalUsers.toLocaleString()}</div>
            <div class="kpi-change positive">+${userGrowth}% growth (7d)</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Active Users (7d)</div>
            <div class="kpi-value">${kpis.activeUsers7d.toLocaleString()}</div>
            <div class="kpi-change ${kpis.dauMauRatio > 0.3 ? 'positive' : 'neutral'}">
              ${(kpis.dauMauRatio * 100).toFixed(1)}% DAU/MAU
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Revenue</div>
            <div class="kpi-value">$${kpis.revenue.toLocaleString()}</div>
            <div class="kpi-change ${kpis.netProfit > 0 ? 'positive' : 'negative'}">
              ${profitMargin}% profit margin
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">System Uptime</div>
            <div class="kpi-value">${kpis.uptime.toFixed(2)}%</div>
            <div class="kpi-change ${kpis.errorRate < 1 ? 'positive' : 'negative'}">
              ${kpis.errorRate.toFixed(2)}% error rate
            </div>
          </div>
        </div>
      </div>

      <!-- User Activity -->
      <div class="section">
        <h2 class="section-title">👥 User Activity & Growth</h2>
        <table class="table">
          <thead>
            <tr>
              <th>Metric</th>
              <th>Today</th>
              <th>7 Days</th>
              <th>30 Days</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>New Signups</strong></td>
              <td>${kpis.newSignupsToday}</td>
              <td>${kpis.newSignups7d}</td>
              <td>${kpis.newSignups30d}</td>
            </tr>
            <tr>
              <td><strong>Active Users</strong></td>
              <td>—</td>
              <td>${kpis.activeUsers7d}</td>
              <td>—</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- System Health -->
      <div class="section">
        <h2 class="section-title">🖥️ System Health & Performance</h2>
        <p>
          <span class="status-indicator status-${systemHealth.status === 'healthy' ? 'healthy' : systemHealth.status === 'degraded' ? 'warning' : 'critical'}">
            ${systemHealth.status.toUpperCase()}
          </span>
          <strong>Average Response Time:</strong> ${kpis.avgResponseTime.toFixed(0)}ms &nbsp;|&nbsp;
          <strong>Uptime:</strong> ${kpis.uptime.toFixed(2)}%
        </p>
        ${systemHealth.errors.length > 0 ? `
        <table class="table">
          <thead>
            <tr>
              <th>Error</th>
              <th>Count</th>
              <th>Severity</th>
            </tr>
          </thead>
          <tbody>
            ${systemHealth.errors.slice(0, 5).map(err => `
            <tr>
              <td>${err.message}</td>
              <td>${err.count}</td>
              <td><span class="status-indicator status-${err.severity === 'critical' ? 'critical' : 'warning'}">${err.severity}</span></td>
            </tr>
            `).join('')}
          </tbody>
        </table>
        ` : '<p style="color: #34d399; margin-top: 12px;">✓ No critical errors detected</p>'}
      </div>

      <!-- Security & Compliance -->
      <div class="section">
        <h2 class="section-title">🔒 Security & Compliance</h2>
        <p>
          <strong>Threats Detected:</strong> ${security.threats} &nbsp;|&nbsp;
          <strong>Failed Logins:</strong> ${security.failedLogins} &nbsp;|&nbsp;
          <strong>Banned Users:</strong> ${security.bannedUsers}
        </p>
        ${security.suspiciousIPs.length > 0 ? `
        <p style="margin-top: 12px; color: #fbbf24;">
          ⚠️ Suspicious IPs: ${security.suspiciousIPs.slice(0, 5).join(', ')}
        </p>
        ` : '<p style="color: #34d399; margin-top: 12px;">✓ No security threats detected</p>'}
      </div>

      ${bugs.length > 0 ? `
      <!-- User-Reported Bugs -->
      <div class="section">
        <h2 class="section-title">🐛 User-Reported Bugs & Issues</h2>
        ${bugs.map(bug => `
        <div class="recommendation">
          <div class="recommendation-priority priority-critical">CRITICAL - BUG REPORT</div>
          <div class="recommendation-title">${bug.title}</div>
          <div class="recommendation-description">${bug.description}</div>
          <div class="recommendation-impact">
            Reported by: ${bug.reporter} on ${new Date(bug.reportedAt).toLocaleDateString()}
          </div>
        </div>
        `).join('')}
      </div>
      ` : ''}

      ${agentInsights.length > 0 ? `
      <!-- AI Agent Insights -->
      <div class="section">
        <h2 class="section-title">🤖 AI Agent Insights</h2>
        ${agentInsights.slice(0, 5).map(insight => `
        <div class="recommendation">
          <div class="recommendation-priority priority-${insight.severity === 'critical' ? 'critical' : insight.severity === 'warning' ? 'high' : 'medium'}">
            ${insight.severity.toUpperCase()} - ${insight.agentName}
          </div>
          <div class="recommendation-title">${insight.title}</div>
          <div class="recommendation-description">${insight.description}</div>
        </div>
        `).join('')}
      </div>
      ` : ''}

      <!-- Recommended Actions -->
      <div class="section">
        <h2 class="section-title">💡 Top Recommended Actions</h2>
        ${report.recommendations && report.recommendations.length > 0 ?
          report.recommendations.slice(0, 3).map(rec => `
        <div class="recommendation">
          <div class="recommendation-priority priority-${rec.priority}">${rec.priority.toUpperCase()} PRIORITY</div>
          <div class="recommendation-title">${rec.action}</div>
          <div class="recommendation-description">${rec.rationale || ''}</div>
          <div class="recommendation-impact">Expected Impact: ${rec.expectedImpact || 'Significant improvement'}</div>
        </div>
          `).join('') : `
        <div class="recommendation">
          <div class="recommendation-priority priority-medium">NORMAL OPERATIONS</div>
          <div class="recommendation-title">Continue Monitoring</div>
          <div class="recommendation-description">All systems operating normally. Continue regular monitoring and maintain current strategies.</div>
        </div>
        `}
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>This report was generated automatically by Co-Founder AI</p>
      <p>NeuroKind - Supporting families of autistic children</p>
      <div class="badge">
        <span>🤖</span>
        <span>Powered by Co-Founder AI</span>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  return html;
}

/**
 * Generate plain text version for email clients that don't support HTML
 */
export function renderCoFounderEmailPlainText(data: CoFounderEmailData): string {
  const { report, kpis, bugs, agentInsights } = data;

  return `
NEUROKIND CO-FOUNDER AI REPORT
${new Date().toLocaleString()}
====================================

EXECUTIVE SUMMARY
${report.executiveSummary || 'Platform is operating normally with steady growth.'}

KEY PERFORMANCE INDICATORS
- Total Users: ${kpis.totalUsers.toLocaleString()}
- Active Users (7d): ${kpis.activeUsers7d.toLocaleString()}
- New Signups Today: ${kpis.newSignupsToday}
- Revenue: $${kpis.revenue.toLocaleString()}
- Net Profit: $${kpis.netProfit.toLocaleString()}
- System Uptime: ${kpis.uptime.toFixed(2)}%
- Error Rate: ${kpis.errorRate.toFixed(2)}%

USER-REPORTED BUGS
${bugs.length > 0 ? bugs.map(b => `- ${b.title}: ${b.description}`).join('\n') : 'None'}

AI AGENT INSIGHTS
${agentInsights.length > 0 ? agentInsights.slice(0, 5).map(i => `- [${i.agentName}] ${i.title}: ${i.description}`).join('\n') : 'No critical insights'}

RECOMMENDED ACTIONS
${report.recommendations && report.recommendations.length > 0
  ? report.recommendations.slice(0, 3).map((r, i) => `${i + 1}. [${r.priority.toUpperCase()}] ${r.action}: ${r.rationale}`).join('\n')
  : '1. Continue monitoring - All systems operating normally'}

---
Generated by Co-Founder AI for NeuroKind
  `.trim();
}
