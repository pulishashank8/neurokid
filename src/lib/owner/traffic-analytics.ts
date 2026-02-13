/**
 * Traffic analytics - Pillar 23
 * Derives channel from referrer, aggregates UTM data
 */
import { prisma } from '@/lib/prisma';
import { subDays } from 'date-fns';

/** Look up country from IP using ip-api.com (free tier, 45 req/min) */
async function lookupCountryFromIp(ip: string): Promise<string | null> {
  if (!ip) return null;
  const trimmed = ip.trim();
  if (
    trimmed === '127.0.0.1' ||
    trimmed.startsWith('10.') ||
    trimmed.startsWith('192.168.') ||
    trimmed.startsWith('172.16.') ||
    trimmed === 'localhost'
  ) {
    return 'Local';
  }
  try {
    const res = await fetch(`http://ip-api.com/json/${encodeURIComponent(trimmed)}?fields=country`, {
      signal: AbortSignal.timeout(3000),
    });
    const data = (await res.json()) as { country?: string };
    return data?.country ?? null;
  } catch {
    return null;
  }
}

function deriveChannel(referrer: string | null, utmSource?: string | null): string {
  if (utmSource) {
    const s = utmSource.toLowerCase();
    if (['google', 'bing', 'yahoo', 'duckduckgo'].some((e) => s.includes(e))) return 'ORGANIC';
    if (['facebook', 'twitter', 'linkedin', 'instagram', 'tiktok'].some((e) => s.includes(e))) return 'SOCIAL';
    if (s.includes('email') || s === 'newsletter') return 'EMAIL';
    if (['cpc', 'ppc', 'ad', 'ads'].some((e) => s.includes(e))) return 'PAID';
    return 'REFERRAL';
  }
  if (!referrer || referrer.trim() === '') return 'DIRECT';
  try {
    const url = new URL(referrer);
    const host = url.hostname.toLowerCase();
    if (['google', 'bing', 'yahoo', 'duckduckgo'].some((e) => host.includes(e))) return 'ORGANIC';
    if (['facebook', 'twitter', 'linkedin', 'instagram', 'tiktok'].some((e) => host.includes(e))) return 'SOCIAL';
    return 'REFERRAL';
  } catch {
    return 'DIRECT';
  }
}

export interface TrafficSummary {
  channel: string;
  count: number;
  bounceEstimate?: number;
}

export interface TopReferrer {
  domain: string;
  users: number;
}

export interface LandingPageMetric {
  pagePath: string;
  sessions: number;
}

export async function getTrafficByChannel(daysBack = 30): Promise<TrafficSummary[]> {
  const since = subDays(new Date(), daysBack);

  const sources = await prisma.trafficSource.findMany({
    where: { createdAt: { gte: since } },
    select: { channel: true },
  });

  const byChannel = new Map<string, number>();
  for (const s of sources) {
    byChannel.set(s.channel, (byChannel.get(s.channel) ?? 0) + 1);
  }

  const total = sources.length;
  return Array.from(byChannel.entries())
    .map(([channel, count]) => ({
      channel,
      count,
      bounceEstimate: total > 0 ? Math.round((1 - count / total) * 100) : undefined,
    }))
    .sort((a, b) => b.count - a.count);
}

export async function getTopReferrers(daysBack = 30): Promise<TopReferrer[]> {
  const since = subDays(new Date(), daysBack);

  const sources = await prisma.trafficSource.findMany({
    where: { createdAt: { gte: since }, referrer: { not: null } },
    select: { referrer: true },
  });

  const byDomain = new Map<string, number>();
  for (const s of sources) {
    const ref = s.referrer || '';
    if (!ref) continue;
    try {
      const url = new URL(ref);
      const domain = url.hostname.replace(/^www\./, '');
      byDomain.set(domain, (byDomain.get(domain) ?? 0) + 1);
    } catch {
      byDomain.set(ref.slice(0, 50), (byDomain.get(ref.slice(0, 50)) ?? 0) + 1);
    }
  }

  return Array.from(byDomain.entries())
    .map(([domain, users]) => ({ domain, users }))
    .sort((a, b) => b.users - a.users)
    .slice(0, 20);
}

export async function getLandingPagePerformance(daysBack = 30): Promise<LandingPageMetric[]> {
  const since = subDays(new Date(), daysBack);

  const sources = await prisma.trafficSource.findMany({
    where: { createdAt: { gte: since } },
    select: { landingPage: true },
  });

  const byPage = new Map<string, number>();
  for (const s of sources) {
    const page = s.landingPage || '/';
    byPage.set(page, (byPage.get(page) ?? 0) + 1);
  }

  return Array.from(byPage.entries())
    .map(([pagePath, sessions]) => ({ pagePath, sessions }))
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 15);
}

export interface TrafficByCountry {
  country: string;
  sessions: number;
}

export interface RecentTrafficRow {
  id: string;
  landingPage: string;
  channel: string;
  referrer: string | null;
  utmSource: string | null;
  ipAddress: string | null;
  country: string | null;
  createdAt: string;
}

export async function getTrafficByCountry(daysBack = 30): Promise<TrafficByCountry[]> {
  try {
    const since = subDays(new Date(), daysBack);
    const rows = await prisma.$queryRaw<{ country: string | null }[]>`
      SELECT country FROM "TrafficSource" WHERE "createdAt" >= ${since}
    `;
    const byCountry = new Map<string, number>();
    for (const r of rows) {
      const c = (r.country?.trim() || 'Unknown (no geo)');
      byCountry.set(c, (byCountry.get(c) ?? 0) + 1);
    }
    return Array.from(byCountry.entries())
      .map(([country, sessions]) => ({ country, sessions }))
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 15);
  } catch {
    return [];
  }
}

export async function getRecentTraffic(daysBack = 30, limit = 50): Promise<RecentTrafficRow[]> {
  const since = subDays(new Date(), daysBack);
  try {
    const rows = await prisma.$queryRaw<
      { id: string; landingPage: string; channel: string; referrer: string | null; utmSource: string | null; ipAddress: string | null; country: string | null; createdAt: Date }[]
    >`
      SELECT id, "landingPage", channel, referrer, "utmSource", "ipAddress", country, "createdAt"
      FROM "TrafficSource" WHERE "createdAt" >= ${since}
      ORDER BY "createdAt" DESC LIMIT ${limit}
    `;
    return rows.map((r) => ({
      id: r.id,
      landingPage: r.landingPage,
      channel: r.channel,
      referrer: r.referrer,
      utmSource: r.utmSource,
      ipAddress: r.ipAddress ?? null,
      country: r.country ?? null,
      createdAt: new Date(r.createdAt).toISOString(),
    }));
  } catch {
    const rows = await prisma.trafficSource.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: { id: true, landingPage: true, channel: true, referrer: true, utmSource: true, createdAt: true },
    });
    return rows.map((r) => ({
      id: r.id,
      landingPage: r.landingPage,
      channel: r.channel,
      referrer: r.referrer,
      utmSource: r.utmSource,
      ipAddress: null,
      country: null,
      createdAt: r.createdAt.toISOString(),
    }));
  }
}

export async function recordTrafficSource(options: {
  userId?: string | null;
  sessionId?: string;
  referrer?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
  landingPage: string;
  ipAddress?: string | null;
  country?: string | null;
  skipGeoLookup?: boolean;
}): Promise<void> {
  const channel = deriveChannel(options.referrer ?? null, options.utmSource);
  let country = options.country ?? null;
  if (!country && options.ipAddress && !options.skipGeoLookup) {
    try {
      country = await lookupCountryFromIp(options.ipAddress);
    } catch {
      country = null;
    }
  }
  if (!country && options.ipAddress) {
    const ip = options.ipAddress.trim();
    if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('127.') || ip === 'localhost') {
      country = 'Local';
    }
  }
  const landingPage = options.landingPage || '/';

  try {
    await prisma.$executeRaw`
      INSERT INTO "TrafficSource" (id, "userId", "sessionId", referrer, "utmSource", "utmMedium", "utmCampaign", "utmContent", channel, "landingPage", "ipAddress", country, "createdAt")
      VALUES (
        ('c' || substr(md5(random()::text || clock_timestamp()::text), 1, 24)),
        ${options.userId},
        ${options.sessionId},
        ${options.referrer},
        ${options.utmSource},
        ${options.utmMedium},
        ${options.utmCampaign},
        ${options.utmContent},
        ${channel},
        ${landingPage},
        ${options.ipAddress ?? null},
        ${country},
        NOW()
      )
    `;
  } catch {
    await prisma.trafficSource.create({
      data: {
        userId: options.userId ?? null,
        sessionId: options.sessionId ?? null,
        referrer: options.referrer ?? null,
        utmSource: options.utmSource ?? null,
        utmMedium: options.utmMedium ?? null,
        utmCampaign: options.utmCampaign ?? null,
        utmContent: options.utmContent ?? null,
        channel,
        landingPage,
      },
    });
  }
}
