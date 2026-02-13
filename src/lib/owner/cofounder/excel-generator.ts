/**
 * Excel Report Generator for Co-Founder AI
 *
 * Creates comprehensive Excel workbooks with multiple worksheets
 * containing business metrics, user data, system logs, and insights.
 */

import ExcelJS from 'exceljs';

export interface ExcelReportData {
  executiveSummary: {
    generatedAt: string;
    reportPeriod: string;
    summary: string;
    recommendations: string[];
  };
  kpis: {
    name: string;
    value: number | string;
    change: string;
    status: 'good' | 'warning' | 'critical';
  }[];
  userMetrics: {
    date: string;
    signups: number;
    activeUsers: number;
    totalUsers: number;
    retention: string;
  }[];
  businessPerformance: {
    metric: string;
    current: number;
    previous: number;
    change: number;
    target: number;
  }[];
  systemLogs: {
    timestamp: string;
    level: 'info' | 'warning' | 'error';
    message: string;
    details?: string;
  }[];
  securityEvents: {
    timestamp: string;
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    resolved: boolean;
  }[];
  agentInsights: {
    agent: string;
    timestamp: string;
    insight: string;
    confidence: number;
    priority: 'low' | 'medium' | 'high';
  }[];
  actionItems: {
    priority: number;
    action: string;
    expectedImpact: string;
    owner: string;
    dueDate?: string;
  }[];
}

/**
 * Generate a comprehensive Excel report for Co-Founder AI
 * Returns a Buffer that can be saved to file or sent as email attachment
 */
export async function generateCoFounderExcelReport(
  data: ExcelReportData
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();

  // Set workbook properties
  workbook.creator = 'NeuroKind Co-Founder AI';
  workbook.created = new Date();
  workbook.modified = new Date();
  workbook.properties.date1904 = false;

  // 1. Executive Summary Sheet
  createExecutiveSummarySheet(workbook, data.executiveSummary);

  // 2. KPI Dashboard Sheet
  createKPIDashboardSheet(workbook, data.kpis);

  // 3. User Metrics Sheet
  createUserMetricsSheet(workbook, data.userMetrics);

  // 4. Business Performance Sheet
  createBusinessPerformanceSheet(workbook, data.businessPerformance);

  // 5. System Logs Sheet
  createSystemLogsSheet(workbook, data.systemLogs);

  // 6. Security Events Sheet
  createSecurityEventsSheet(workbook, data.securityEvents);

  // 7. AI Agent Insights Sheet
  createAgentInsightsSheet(workbook, data.agentInsights);

  // 8. Recommended Actions Sheet
  createActionItemsSheet(workbook, data.actionItems);

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * Create Executive Summary worksheet
 */
function createExecutiveSummarySheet(
  workbook: ExcelJS.Workbook,
  data: ExcelReportData['executiveSummary']
) {
  const sheet = workbook.addWorksheet('Executive Summary', {
    properties: { tabColor: { argb: 'FF10B981' } },
  });

  // Header styling
  sheet.getCell('A1').value = 'CO-FOUNDER AI EXECUTIVE REPORT';
  sheet.getCell('A1').font = { size: 18, bold: true, color: { argb: 'FF10B981' } };

  sheet.getCell('A3').value = 'Report Generated:';
  sheet.getCell('B3').value = data.generatedAt;
  sheet.getCell('A4').value = 'Report Period:';
  sheet.getCell('B4').value = data.reportPeriod;

  sheet.getCell('A6').value = 'Executive Summary:';
  sheet.getCell('A6').font = { bold: true, size: 14 };
  sheet.getCell('A7').value = data.summary;
  sheet.getCell('A7').alignment = { wrapText: true, vertical: 'top' };
  sheet.mergeCells('A7:E10');

  sheet.getCell('A12').value = 'Top Recommendations:';
  sheet.getCell('A12').font = { bold: true, size: 14 };

  data.recommendations.forEach((rec, index) => {
    sheet.getCell(`A${13 + index}`).value = `${index + 1}. ${rec}`;
    sheet.getCell(`A${13 + index}`).alignment = { wrapText: true };
  });

  // Column widths
  sheet.getColumn('A').width = 25;
  sheet.getColumn('B').width = 40;
  sheet.columns.forEach((col) => {
    if (col.number && col.number > 2) col.width = 20;
  });
}

/**
 * Create KPI Dashboard worksheet with conditional formatting
 */
function createKPIDashboardSheet(
  workbook: ExcelJS.Workbook,
  kpis: ExcelReportData['kpis']
) {
  const sheet = workbook.addWorksheet('KPI Dashboard', {
    properties: { tabColor: { argb: 'FF3B82F6' } },
  });

  // Header
  sheet.getCell('A1').value = 'KEY PERFORMANCE INDICATORS';
  sheet.getCell('A1').font = { size: 16, bold: true };
  sheet.mergeCells('A1:D1');

  // Column headers
  const headers = ['Metric', 'Current Value', 'Change', 'Status'];
  headers.forEach((header, index) => {
    const cell = sheet.getCell(2, index + 1);
    cell.value = header;
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1F2937' },
    };
    cell.alignment = { horizontal: 'center' };
  });

  // Data rows with conditional formatting
  kpis.forEach((kpi, index) => {
    const row = index + 3;
    sheet.getCell(row, 1).value = kpi.name;
    sheet.getCell(row, 2).value = kpi.value;
    sheet.getCell(row, 3).value = kpi.change;
    sheet.getCell(row, 4).value = kpi.status.toUpperCase();

    // Status color coding
    const statusCell = sheet.getCell(row, 4);
    statusCell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    statusCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: {
        argb:
          kpi.status === 'good'
            ? 'FF10B981'
            : kpi.status === 'warning'
              ? 'FFF59E0B'
              : 'FFEF4444',
      },
    };
    statusCell.alignment = { horizontal: 'center' };
  });

  // Column widths
  sheet.getColumn(1).width = 30;
  sheet.getColumn(2).width = 20;
  sheet.getColumn(3).width = 15;
  sheet.getColumn(4).width = 15;
}

/**
 * Create User Metrics worksheet with trend analysis
 */
function createUserMetricsSheet(
  workbook: ExcelJS.Workbook,
  metrics: ExcelReportData['userMetrics']
) {
  const sheet = workbook.addWorksheet('User Metrics', {
    properties: { tabColor: { argb: 'FF8B5CF6' } },
  });

  // Header
  sheet.getCell('A1').value = 'USER METRICS & GROWTH TRENDS';
  sheet.getCell('A1').font = { size: 16, bold: true };

  // Column headers
  const headers = ['Date', 'New Signups', 'Active Users', 'Total Users', 'Retention'];
  headers.forEach((header, index) => {
    const cell = sheet.getCell(2, index + 1);
    cell.value = header;
    cell.font = { bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE5E7EB' },
    };
  });

  // Data rows
  metrics.forEach((metric, index) => {
    const row = index + 3;
    sheet.getCell(row, 1).value = metric.date;
    sheet.getCell(row, 2).value = metric.signups;
    sheet.getCell(row, 3).value = metric.activeUsers;
    sheet.getCell(row, 4).value = metric.totalUsers;
    sheet.getCell(row, 5).value = metric.retention;
  });

  // Add chart (if supported)
  // Note: ExcelJS chart support is limited, but we can add formulas

  sheet.columns.forEach((col) => {
    if (col.number) col.width = 18;
  });
}

/**
 * Create Business Performance worksheet
 */
function createBusinessPerformanceSheet(
  workbook: ExcelJS.Workbook,
  performance: ExcelReportData['businessPerformance']
) {
  const sheet = workbook.addWorksheet('Business Performance', {
    properties: { tabColor: { argb: 'FFF59E0B' } },
  });

  const headers = ['Metric', 'Current', 'Previous', 'Change (%)', 'Target'];
  headers.forEach((header, index) => {
    const cell = sheet.getCell(1, index + 1);
    cell.value = header;
    cell.font = { bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1F2937' },
    };
    cell.font.color = { argb: 'FFFFFFFF' };
  });

  performance.forEach((item, index) => {
    const row = index + 2;
    sheet.getCell(row, 1).value = item.metric;
    sheet.getCell(row, 2).value = item.current;
    sheet.getCell(row, 3).value = item.previous;
    sheet.getCell(row, 4).value = item.change;
    sheet.getCell(row, 5).value = item.target;

    // Conditional formatting for change
    const changeCell = sheet.getCell(row, 4);
    changeCell.font = {
      color: { argb: item.change >= 0 ? 'FF10B981' : 'FFEF4444' },
      bold: true,
    };
  });

  sheet.columns.forEach((col, index) => {
    if (col.number) col.width = index === 0 ? 30 : 15;
  });
}

/**
 * Create System Logs worksheet
 */
function createSystemLogsSheet(
  workbook: ExcelJS.Workbook,
  logs: ExcelReportData['systemLogs']
) {
  const sheet = workbook.addWorksheet('System Logs', {
    properties: { tabColor: { argb: 'FF6B7280' } },
  });

  const headers = ['Timestamp', 'Level', 'Message', 'Details'];
  headers.forEach((header, index) => {
    const cell = sheet.getCell(1, index + 1);
    cell.value = header;
    cell.font = { bold: true };
  });

  logs.forEach((log, index) => {
    const row = index + 2;
    sheet.getCell(row, 1).value = log.timestamp;
    sheet.getCell(row, 2).value = log.level.toUpperCase();
    sheet.getCell(row, 3).value = log.message;
    sheet.getCell(row, 4).value = log.details || '';

    // Color code by level
    const levelCell = sheet.getCell(row, 2);
    levelCell.font = {
      color: {
        argb:
          log.level === 'error'
            ? 'FFEF4444'
            : log.level === 'warning'
              ? 'FFF59E0B'
              : 'FF6B7280',
      },
      bold: true,
    };
  });

  sheet.getColumn(1).width = 20;
  sheet.getColumn(2).width = 12;
  sheet.getColumn(3).width = 50;
  sheet.getColumn(4).width = 30;
}

/**
 * Create Security Events worksheet
 */
function createSecurityEventsSheet(
  workbook: ExcelJS.Workbook,
  events: ExcelReportData['securityEvents']
) {
  const sheet = workbook.addWorksheet('Security Events', {
    properties: { tabColor: { argb: 'FFEF4444' } },
  });

  const headers = ['Timestamp', 'Event Type', 'Severity', 'Description', 'Resolved'];
  headers.forEach((header, index) => {
    const cell = sheet.getCell(1, index + 1);
    cell.value = header;
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFEF4444' },
    };
  });

  events.forEach((event, index) => {
    const row = index + 2;
    sheet.getCell(row, 1).value = event.timestamp;
    sheet.getCell(row, 2).value = event.type;
    sheet.getCell(row, 3).value = event.severity.toUpperCase();
    sheet.getCell(row, 4).value = event.description;
    sheet.getCell(row, 5).value = event.resolved ? 'YES' : 'NO';

    // Severity color
    const severityCell = sheet.getCell(row, 3);
    severityCell.font = {
      color: {
        argb:
          event.severity === 'critical'
            ? 'FFEF4444'
            : event.severity === 'high'
              ? 'FFF59E0B'
              : event.severity === 'medium'
                ? 'FF3B82F6'
                : 'FF6B7280',
      },
      bold: true,
    };
  });

  sheet.getColumn(1).width = 20;
  sheet.getColumn(2).width = 20;
  sheet.getColumn(3).width = 12;
  sheet.getColumn(4).width = 50;
  sheet.getColumn(5).width = 10;
}

/**
 * Create AI Agent Insights worksheet
 */
function createAgentInsightsSheet(
  workbook: ExcelJS.Workbook,
  insights: ExcelReportData['agentInsights']
) {
  const sheet = workbook.addWorksheet('AI Agent Insights', {
    properties: { tabColor: { argb: 'FF8B5CF6' } },
  });

  const headers = ['Agent', 'Timestamp', 'Insight', 'Confidence', 'Priority'];
  headers.forEach((header, index) => {
    const cell = sheet.getCell(1, index + 1);
    cell.value = header;
    cell.font = { bold: true };
  });

  insights.forEach((insight, index) => {
    const row = index + 2;
    sheet.getCell(row, 1).value = insight.agent;
    sheet.getCell(row, 2).value = insight.timestamp;
    sheet.getCell(row, 3).value = insight.insight;
    sheet.getCell(row, 4).value = `${(insight.confidence * 100).toFixed(0)}%`;
    sheet.getCell(row, 5).value = insight.priority.toUpperCase();

    sheet.getCell(row, 3).alignment = { wrapText: true };
  });

  sheet.getColumn(1).width = 25;
  sheet.getColumn(2).width = 20;
  sheet.getColumn(3).width = 60;
  sheet.getColumn(4).width = 12;
  sheet.getColumn(5).width = 12;
}

/**
 * Create Recommended Actions worksheet
 */
function createActionItemsSheet(
  workbook: ExcelJS.Workbook,
  actions: ExcelReportData['actionItems']
) {
  const sheet = workbook.addWorksheet('Recommended Actions', {
    properties: { tabColor: { argb: 'FF10B981' } },
  });

  const headers = ['Priority', 'Action', 'Expected Impact', 'Owner', 'Due Date'];
  headers.forEach((header, index) => {
    const cell = sheet.getCell(1, index + 1);
    cell.value = header;
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF10B981' },
    };
  });

  actions.forEach((action, index) => {
    const row = index + 2;
    sheet.getCell(row, 1).value = action.priority;
    sheet.getCell(row, 2).value = action.action;
    sheet.getCell(row, 3).value = action.expectedImpact;
    sheet.getCell(row, 4).value = action.owner;
    sheet.getCell(row, 5).value = action.dueDate || 'TBD';

    sheet.getCell(row, 2).alignment = { wrapText: true };
    sheet.getCell(row, 3).alignment = { wrapText: true };

    // Priority color
    const priorityCell = sheet.getCell(row, 1);
    priorityCell.font = {
      color: {
        argb: action.priority === 1 ? 'FFEF4444' : action.priority === 2 ? 'FFF59E0B' : 'FF3B82F6',
      },
      bold: true,
    };
  });

  sheet.getColumn(1).width = 10;
  sheet.getColumn(2).width = 50;
  sheet.getColumn(3).width = 40;
  sheet.getColumn(4).width = 20;
  sheet.getColumn(5).width = 15;
}

/**
 * Helper: Get sample data for testing Excel generation
 */
export function getSampleExcelData(): ExcelReportData {
  return {
    executiveSummary: {
      generatedAt: new Date().toISOString(),
      reportPeriod: 'Last 24 Hours',
      summary:
        'Platform performance remains strong with 30 new signups and 172 active users. No critical issues detected. Revenue tracking on target with 15% growth this month.',
      recommendations: [
        'Investigate and fix the 3 user-reported bugs in the feedback system',
        'Optimize database queries causing slow response times on user dashboard',
        'Launch engagement campaign to activate 58 inactive users',
      ],
    },
    kpis: [
      { name: 'Total Users', value: 260, change: '+11.5%', status: 'good' },
      { name: 'Active Users (7d)', value: 172, change: '+8.2%', status: 'good' },
      { name: 'Daily Signups', value: 30, change: '+20%', status: 'good' },
      { name: 'System Uptime', value: '99.9%', change: '0%', status: 'good' },
      { name: 'Bug Reports', value: 3, change: '+50%', status: 'warning' },
      { name: 'Error Rate', value: '0.1%', change: '-25%', status: 'good' },
    ],
    userMetrics: [
      { date: '2026-02-06', signups: 12, activeUsers: 145, totalUsers: 230, retention: '78%' },
      { date: '2026-02-07', signups: 18, activeUsers: 152, totalUsers: 248, retention: '79%' },
      { date: '2026-02-08', signups: 15, activeUsers: 148, totalUsers: 263, retention: '77%' },
      { date: '2026-02-09', signups: 22, activeUsers: 160, totalUsers: 285, retention: '80%' },
      { date: '2026-02-10', signups: 19, activeUsers: 158, totalUsers: 304, retention: '79%' },
      { date: '2026-02-11', signups: 25, activeUsers: 165, totalUsers: 329, retention: '81%' },
      { date: '2026-02-12', signups: 30, activeUsers: 172, totalUsers: 359, retention: '82%' },
    ],
    businessPerformance: [
      { metric: 'Monthly Revenue', current: 12500, previous: 11000, change: 13.6, target: 15000 },
      { metric: 'Cost per User', current: 15, previous: 18, change: -16.7, target: 12 },
      { metric: 'User Engagement', current: 85, previous: 78, change: 9.0, target: 90 },
    ],
    systemLogs: [
      { timestamp: '2026-02-12 10:30', level: 'info', message: 'System health check passed' },
      { timestamp: '2026-02-12 09:15', level: 'warning', message: 'High database query time detected', details: 'avg: 250ms' },
      { timestamp: '2026-02-12 08:00', level: 'error', message: 'API rate limit exceeded', details: 'Endpoint: /api/posts' },
    ],
    securityEvents: [
      { timestamp: '2026-02-12 11:00', type: 'Failed Login Attempt', severity: 'medium', description: 'Multiple failed login attempts from IP 192.168.1.1', resolved: true },
      { timestamp: '2026-02-12 08:30', type: 'Rate Limit Exceeded', severity: 'low', description: 'User exceeded API rate limit', resolved: true },
    ],
    agentInsights: [
      { agent: 'GROWTH_STRATEGIST', timestamp: '2026-02-12 10:00', insight: 'User signup velocity increasing 20% week-over-week', confidence: 0.92, priority: 'high' },
      { agent: 'CHURN_PREDICTOR', timestamp: '2026-02-12 09:30', insight: '12 users at high risk of churn - low engagement last 7 days', confidence: 0.85, priority: 'high' },
      { agent: 'SECURITY_SENTINEL', timestamp: '2026-02-12 08:45', insight: 'No critical security threats detected in last 24 hours', confidence: 0.98, priority: 'low' },
    ],
    actionItems: [
      { priority: 1, action: 'Fix user-reported bugs in feedback system', expectedImpact: 'Improved user satisfaction', owner: 'Dev Team', dueDate: '2026-02-15' },
      { priority: 2, action: 'Optimize slow database queries', expectedImpact: '50% faster response times', owner: 'Backend Team' },
      { priority: 3, action: 'Launch re-engagement campaign for inactive users', expectedImpact: 'Reduce churn by 25%', owner: 'Growth Team', dueDate: '2026-02-20' },
    ],
  };
}
