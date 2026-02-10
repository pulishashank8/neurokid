/**
 * Full-Text Search API Endpoint
 * 
 * GET /api/search?q={query}&type={type}&limit={limit}&offset={offset}
 * 
 * Query Parameters:
 * - q: Search query string
 * - type: Comma-separated list of types (post, resource, provider) - defaults to all
 * - limit: Number of results (default: 20, max: 50)
 * - offset: Pagination offset (default: 0)
 */

import { NextRequest, NextResponse } from "next/server";
import { container } from "tsyringe";
import { FullTextSearchService, SearchOptions } from "@/application/services/FullTextSearchService";
import { DatabaseConnection } from "@/infrastructure/database/DatabaseConnection";
import { enforceRateLimit, RateLimits, getClientIp } from "@/lib/rate-limit";

// Initialize service
const db = container.resolve(DatabaseConnection);
const searchService = new FullTextSearchService(db);

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(request);
    const rateLimitResult = await enforceRateLimit(RateLimits.searchPosts, ip);
    if (rateLimitResult) return rateLimitResult;

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || searchParams.get("query");
    const typeParam = searchParams.get("type") || "post,resource,provider";
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 50);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    // Validate query
    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { 
          results: [], 
          total: 0, 
          query: query || "",
          error: "Query must be at least 2 characters" 
        },
        { status: 400 }
      );
    }

    // Parse types
    const validTypes = ["post", "resource", "provider"] as const;
    const requestedTypes = typeParam.split(",").map((t) => t.trim().toLowerCase());
    const types = requestedTypes.filter((t): t is typeof validTypes[number] =>
      validTypes.includes(t as typeof validTypes[number])
    );

    if (types.length === 0) {
      return NextResponse.json(
        { error: "Invalid type parameter. Must be one of: post, resource, provider" },
        { status: 400 }
      );
    }

    // Perform search
    const options: SearchOptions = {
      limit,
      offset,
      types,
    };

    const results = await searchService.search(query.trim(), options);

    return NextResponse.json({
      ...results,
      types,
    });
  } catch (error) {
    console.error("[Search API] Error:", error);
    return NextResponse.json(
      { error: "Search failed", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
