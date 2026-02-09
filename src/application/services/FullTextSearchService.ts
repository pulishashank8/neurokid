/**
 * Full-Text Search Service
 * 
 * PostgreSQL-powered full-text search with:
 * - tsvector/tsquery based search
 * - Relevance ranking with ts_rank
 * - Search result highlighting with ts_headline
 * - Support for posts, resources, and providers
 */

import { injectable } from "tsyringe";
import { PrismaClient } from "@prisma/client";
import { DatabaseConnection } from "@/infrastructure/database/DatabaseConnection";

export interface SearchResult {
  id: string;
  title: string;
  content?: string;
  createdAt: Date;
  rank: number;
  headline?: string;
  type: "post" | "resource" | "provider";
}

export interface SearchOptions {
  limit?: number;
  offset?: number;
  types?: Array<"post" | "resource" | "provider">;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  query: string;
  limit: number;
  offset: number;
}

@injectable()
export class FullTextSearchService {
  private prisma: PrismaClient;

  constructor(db: DatabaseConnection) {
    this.prisma = db.getClient();
  }

  /**
   * Search across all content types
   */
  async search(query: string, options: SearchOptions = {}): Promise<SearchResponse> {
    const { limit = 20, offset = 0, types = ["post", "resource", "provider"] } = options;

    const results: SearchResult[] = [];
    let total = 0;

    if (types.includes("post")) {
      const posts = await this.searchPosts(query, limit, offset);
      results.push(...posts);
      total += await this.countPosts(query);
    }

    if (types.includes("resource")) {
      const resources = await this.searchResources(query, limit, offset);
      results.push(...resources);
      total += await this.countResources(query);
    }

    if (types.includes("provider")) {
      const providers = await this.searchProviders(query, limit, offset);
      results.push(...providers);
      total += await this.countProviders(query);
    }

    // Sort by rank
    results.sort((a, b) => b.rank - a.rank);

    return {
      results: results.slice(0, limit),
      total,
      query,
      limit,
      offset,
    };
  }

  /**
   * Search posts with full-text ranking and highlighting
   */
  async searchPosts(
    query: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<SearchResult[]> {
    const searchQuery = this.sanitizeQuery(query);

    const posts = await this.prisma.$queryRaw<Array<{
      id: string;
      title: string;
      content: string;
      createdAt: Date;
      rank: number;
      headline: string | null;
    }>>`
      SELECT 
        p.id,
        p.title,
        p.content,
        p."createdAt",
        ts_rank(p."searchVector", plainto_tsquery('english', ${searchQuery})) as rank,
        ts_headline('english', p.content, plainto_tsquery('english', ${searchQuery}),
          'StartSel=<mark>, StopSel=</mark>, MaxWords=50, MinWords=10'
        ) as headline
      FROM "Post" p
      WHERE p."searchVector" @@ plainto_tsquery('english', ${searchQuery})
        AND p.status = 'ACTIVE'
      ORDER BY rank DESC, p."createdAt" DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    return posts.map((post) => ({
      id: post.id,
      title: post.title,
      content: post.content,
      createdAt: post.createdAt,
      rank: Number(post.rank),
      headline: post.headline || undefined,
      type: "post" as const,
    }));
  }

  /**
   * Count total post search results
   */
  async countPosts(query: string): Promise<number> {
    const searchQuery = this.sanitizeQuery(query);

    const result = await this.prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count
      FROM "Post"
      WHERE "searchVector" @@ plainto_tsquery('english', ${searchQuery})
        AND status = 'ACTIVE'
    `;

    return Number(result[0].count);
  }

  /**
   * Search resources with full-text ranking
   */
  async searchResources(
    query: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<SearchResult[]> {
    const searchQuery = this.sanitizeQuery(query);

    const resources = await this.prisma.$queryRaw<Array<{
      id: string;
      title: string;
      content: string | null;
      createdAt: Date;
      rank: number;
    }>>`
      SELECT 
        r.id,
        r.title,
        r.content,
        r."createdAt",
        ts_rank(r."searchVector", plainto_tsquery('english', ${searchQuery})) as rank
      FROM "Resource" r
      WHERE r."searchVector" @@ plainto_tsquery('english', ${searchQuery})
        AND r.status = 'ACTIVE'
      ORDER BY rank DESC, r."createdAt" DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    return resources.map((resource) => ({
      id: resource.id,
      title: resource.title,
      content: resource.content || undefined,
      createdAt: resource.createdAt,
      rank: Number(resource.rank),
      type: "resource" as const,
    }));
  }

  /**
   * Count total resource search results
   */
  async countResources(query: string): Promise<number> {
    const searchQuery = this.sanitizeQuery(query);

    const result = await this.prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count
      FROM "Resource"
      WHERE "searchVector" @@ plainto_tsquery('english', ${searchQuery})
        AND status = 'ACTIVE'
    `;

    return Number(result[0].count);
  }

  /**
   * Search providers with full-text ranking
   */
  async searchProviders(
    query: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<SearchResult[]> {
    const searchQuery = this.sanitizeQuery(query);

    const providers = await this.prisma.$queryRaw<Array<{
      id: string;
      name: string;
      city: string | null;
      state: string | null;
      createdAt: Date;
      rank: number;
    }>>`
      SELECT 
        p.id,
        p.name as title,
        p.city,
        p.state,
        p."createdAt",
        ts_rank(p."searchVector", plainto_tsquery('english', ${searchQuery})) as rank
      FROM "Provider" p
      WHERE p."searchVector" @@ plainto_tsquery('english', ${searchQuery})
      ORDER BY rank DESC, p."createdAt" DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    return providers.map((provider) => ({
      id: provider.id,
      title: provider.name,
      content: provider.city && provider.state 
        ? `${provider.city}, ${provider.state}` 
        : provider.city || provider.state || undefined,
      createdAt: provider.createdAt,
      rank: Number(provider.rank),
      type: "provider" as const,
    }));
  }

  /**
   * Count total provider search results
   */
  async countProviders(query: string): Promise<number> {
    const searchQuery = this.sanitizeQuery(query);

    const result = await this.prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count
      FROM "Provider"
      WHERE "searchVector" @@ plainto_tsquery('english', ${searchQuery})
    `;

    return Number(result[0].count);
  }

  /**
   * Get search suggestions based on partial query
   */
  async getSuggestions(query: string, limit: number = 5): Promise<string[]> {
    if (!query || query.length < 2) return [];

    const searchQuery = this.sanitizeQuery(query + ":*");

    const suggestions = await this.prisma.$queryRaw<Array<{ title: string }>>`
      SELECT title
      FROM "Post"
      WHERE "searchVector" @@ to_tsquery('english', ${searchQuery})
        AND status = 'ACTIVE'
      ORDER BY "createdAt" DESC
      LIMIT ${limit}
    `;

    return suggestions.map((s) => s.title);
  }

  /**
   * Sanitize search query to prevent SQL injection
   */
  private sanitizeQuery(query: string): string {
    // Remove special characters that could cause issues
    return query
      .replace(/[<>]/g, "") // Remove < and > to prevent HTML issues
      .replace(/['"\\]/g, "") // Remove quotes and backslashes
      .trim();
  }
}
