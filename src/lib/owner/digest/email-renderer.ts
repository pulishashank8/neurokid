/**
 * Digest Email HTML Renderer - Pillar 18
 */
import { compileDailyBrief } from './daily-brief';
import { compileWeeklyAnalytics } from './weekly-analytics';
import { compileMonthlyExecutive } from './monthly-executive';

export type DigestType = 'DAILY' | 'WEEKLY' | 'MONTHLY';

export async function renderDigestHtml(type: DigestType): Promise<string> {
  let data: Record<string, unknown>;
  let title: string;

  if (type === 'DAILY') {
    data = await compileDailyBrief();
    title = `Daily Brief — ${data.date}`;
    const signupEmails = (data.signupEmails as string[]) ?? [];
    const signupItems = signupEmails.slice(0, 5).map((e) => '<li>' + String(e) + '</li>').join('');
    const signupList = signupItems ? '<ul>' + signupItems + '</ul>' : '';
    return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${title}</title></head><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#0f172a;color:#e2e8f0">
<h1 style="color:#10b981">🌅 NeuroKid Daily Brief</h1>
<p><strong>Date:</strong> ${data.date}</p>
<h2>Signups (24h)</h2><p>${data.newSignups} new users</p>
${signupList}
<h2>Errors</h2><p>${data.errors} client errors</p>
<h2>Anomalies</h2><p>${data.anomaliesCount} unresolved</p>
<h2>Critical AI Insights</h2><p>${data.criticalInsights}</p>
<h2>Active Users (24h)</h2><p>${data.activeUsers}</p>
<h2>Pending Moderation</h2><p>${data.pendingReports} reports</p>
<hr/><p style="color:#64748b;font-size:12px">NeuroKid Owner Dashboard</p></body></html>`;
  }

  if (type === 'WEEKLY') {
    data = await compileWeeklyAnalytics();
    title = `Weekly Analytics — ${data.weekEnd}`;
    return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${title}</title></head><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#0f172a;color:#e2e8f0">
<h1 style="color:#10b981">📊 Weekly Analytics</h1>
<p><strong>Week ending:</strong> ${data.weekEnd}</p>
<h2>Growth</h2><p>${data.newUsers} new users | WoW: ${data.growthWoW}%</p>
<h2>Automation</h2><p>${data.automationActions} actions taken</p>
<h2>Costs</h2><p>$${data.totalCost?.toFixed(2) ?? '0'}</p>
<hr/><p style="color:#64748b;font-size:12px">NeuroKid Owner Dashboard</p></body></html>`;
  }

  data = await compileMonthlyExecutive();
  title = `Monthly Executive — ${data.month}`;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${title}</title></head><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#0f172a;color:#e2e8f0">
<h1 style="color:#10b981">📋 Monthly Executive</h1>
<p><strong>Month:</strong> ${data.month}</p>
<h2>Growth</h2><p>${data.newUsers} new users | MoM: ${data.growthMoM}%</p>
<h2>Financials</h2><p>Revenue: $${data.totalRevenue?.toFixed(2) ?? '0'} | Costs: $${data.totalCost?.toFixed(2) ?? '0'} | Net: $${data.netProfit?.toFixed(2) ?? '0'}</p>
<h2>Compliance</h2><p>${data.pendingDataRequests} pending data requests</p>
<hr/><p style="color:#64748b;font-size:12px">NeuroKid Owner Dashboard</p></body></html>`;
}
