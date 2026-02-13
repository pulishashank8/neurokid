/**
 * AI Insight generation for KPI cards
 * Rule-based insights explaining trends (optional: LLM call for richer text)
 */

export interface KpiContext {
  key: string;
  value: number;
  change?: number;
  prevValue?: number;
  screeningCompletions?: number;
  screeningChange?: number;
  postCreateCount?: number;
  aiRequestCount?: number;
}

export function generateKpiInsight(ctx: KpiContext): string {
  const { key, value, change = 0, screeningCompletions, screeningChange, postCreateCount } = ctx;

  if (key === 'totalUsers' && change > 0) {
    if (screeningCompletions !== undefined && screeningChange !== undefined && screeningChange > 5) {
      return `User growth up ${change.toFixed(0)}% driven by higher screening completions.`;
    }
    if (postCreateCount !== undefined && postCreateCount > 0) {
      return `User growth reflects increasing community engagement.`;
    }
    return `User base grew ${change > 0 ? '+' : ''}${change.toFixed(0)}% vs previous period.`;
  }

  if (key === 'activeUsers7d' && change !== undefined) {
    if (change > 10) {
      return `Active users surged ${change.toFixed(0)}%—strong engagement trend.`;
    }
    if (change < -10) {
      return `Active users declined—consider re-engagement campaigns.`;
    }
    return `Active user count stable with ${change >= 0 ? '+' : ''}${change.toFixed(0)}% change.`;
  }

  if (key === 'newSignupsToday') {
    if (value > 10) return `Today's signups are above recent average.`;
    if (value === 0) return `No new signups today—typical for low-traffic days.`;
    return `Daily signup activity within expected range.`;
  }

  if (key === 'totalPosts' && change !== undefined) {
    if (change > 15) return `Post volume up ${change.toFixed(0)}%—community is more active.`;
    if (change < -15) return `Post volume down—check for friction or seasonal effects.`;
    return `Post activity ${change >= 0 ? '+' : ''}${change.toFixed(0)}% vs previous period.`;
  }

  if (key === 'totalMessagesSent' && change !== undefined) {
    if (change > 20) return `Messaging increased ${change.toFixed(0)}%—users connecting more.`;
    return `Message volume ${change >= 0 ? '+' : ''}${change.toFixed(0)}% vs previous period.`;
  }

  if (key === 'aiUsage' && change !== undefined) {
    if (change > 20) return `AI usage up ${change.toFixed(0)}%—more parents seeking support.`;
    if (change < -20) return `AI usage declined—check for technical issues.`;
    return `AI requests ${change >= 0 ? '+' : ''}${change.toFixed(0)}% vs previous period.`;
  }

  if (key === 'dauMauRatio') {
    if (value > 0.2) return `Strong stickiness—users return frequently.`;
    if (value < 0.1) return `Consider improving retention and re-engagement.`;
    return `DAU/MAU ratio reflects current engagement patterns.`;
  }

  return '';
}
