/**
 * Ranking Service
 *
 * Provides configurable ranking algorithms for community posts.
 * Extracted from route handler for testability and configurability.
 */

export interface RankingConfig {
  /**
   * Decay factor for time-based ranking.
   * Lower values = faster decay (older posts rank lower faster)
   * Default: 0.8 (50% decay every 2 hours)
   */
  decayFactor: number;

  /**
   * Hours until decay reaches 50%
   * Default: 2 hours
   */
  halfLifeHours: number;

  /**
   * Minimum score to prevent negative infinity from log(0)
   * Default: 1
   */
  minScore: number;

  /**
   * Weight multiplier for upvotes
   * Default: 1.0
   */
  upvoteWeight: number;

  /**
   * Weight multiplier for comments (engagement)
   * Default: 0.5
   */
  commentWeight: number;
}

// Default configuration - can be overridden via environment or database
export const DEFAULT_RANKING_CONFIG: RankingConfig = {
  decayFactor: 0.8,
  halfLifeHours: 2,
  minScore: 1,
  upvoteWeight: 1.0,
  commentWeight: 0.5,
};

/**
 * Reddit-style Hot algorithm with time decay
 *
 * Score = sign(votes) * log10(|votes| + 1) * decay^(age/halfLife)
 *
 * @param voteScore - Net vote score (upvotes - downvotes)
 * @param createdAt - Post creation timestamp
 * @param commentCount - Number of comments (optional engagement boost)
 * @param config - Ranking configuration
 * @returns Hot score (higher = more visible)
 */
export function calculateHotScore(
  voteScore: number,
  createdAt: Date,
  commentCount: number = 0,
  config: RankingConfig = DEFAULT_RANKING_CONFIG
): number {
  const {
    decayFactor,
    halfLifeHours,
    minScore,
    upvoteWeight,
    commentWeight,
  } = config;

  // Calculate weighted score including comment engagement
  const effectiveScore = (voteScore * upvoteWeight) + (commentCount * commentWeight);

  // Sign determines positive/negative ranking
  const sign = effectiveScore > 0 ? 1 : effectiveScore < 0 ? -1 : 0;

  // Logarithmic scaling to prevent runaway scores
  const magnitude = Math.log10(Math.max(Math.abs(effectiveScore), minScore) + 1);

  // Time decay based on post age
  const ageHours = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
  const decay = Math.pow(decayFactor, ageHours / halfLifeHours);

  return sign * magnitude * decay;
}

/**
 * Wilson Score Lower Bound
 *
 * Used for "Best" sorting - accounts for confidence interval
 * Works better than raw percentage for items with few votes
 *
 * @param upvotes - Number of upvotes
 * @param downvotes - Number of downvotes
 * @param confidence - Confidence level (default 0.95 = 95%)
 * @returns Lower bound of Wilson score interval
 */
export function calculateWilsonScore(
  upvotes: number,
  downvotes: number,
  confidence: number = 0.95
): number {
  const n = upvotes + downvotes;

  if (n === 0) return 0;

  // z-score for confidence level (1.96 for 95%)
  const z = confidence === 0.95 ? 1.96 : 1.645; // 95% or 90%
  const phat = upvotes / n;

  const denominator = 1 + (z * z) / n;
  const center = phat + (z * z) / (2 * n);
  const spread = z * Math.sqrt((phat * (1 - phat) + (z * z) / (4 * n)) / n);

  return (center - spread) / denominator;
}

/**
 * Sort posts by hot score
 *
 * @param posts - Array of posts with voteScore, createdAt, and _count.comments
 * @param config - Optional ranking configuration
 * @returns Sorted array (highest score first)
 */
export function sortByHot<T extends { voteScore: number; createdAt: Date; _count?: { comments: number } }>(
  posts: T[],
  config: RankingConfig = DEFAULT_RANKING_CONFIG
): T[] {
  return [...posts].sort((a, b) => {
    const scoreA = calculateHotScore(
      a.voteScore,
      a.createdAt,
      a._count?.comments || 0,
      config
    );
    const scoreB = calculateHotScore(
      b.voteScore,
      b.createdAt,
      b._count?.comments || 0,
      config
    );
    return scoreB - scoreA;
  });
}

/**
 * Sort posts by "best" using Wilson score
 *
 * @param posts - Array of posts with upvotes and downvotes
 * @returns Sorted array (best first)
 */
export function sortByBest<T extends { upvotes: number; downvotes: number }>(
  posts: T[]
): T[] {
  return [...posts].sort((a, b) => {
    const scoreA = calculateWilsonScore(a.upvotes, a.downvotes);
    const scoreB = calculateWilsonScore(b.upvotes, b.downvotes);
    return scoreB - scoreA;
  });
}
