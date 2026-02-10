/**
 * AI Content Safety Service
 * 
 * Integrates Google Perspective API for toxicity detection
 * and provides content moderation for AI interactions.
 */

import { createLogger } from '@/lib/logger';

const logger = createLogger({ context: 'ContentSafety' });

// Perspective API configuration
const PERSPECTIVE_API_KEY = process.env.PERSPECTIVE_API_KEY;
const PERSPECTIVE_API_URL = 'https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze';

// Toxicity thresholds
const TOXICITY_THRESHOLDS = {
  // Block content above this threshold
  BLOCK: 0.8,
  // Flag for review above this threshold
  FLAG: 0.6,
  // Warn user above this threshold
  WARN: 0.4,
};

// Attribute weights for different toxicity types
const ATTRIBUTES = [
  'TOXICITY',
  'SEVERE_TOXICITY',
  'IDENTITY_ATTACK',
  'INSULT',
  'PROFANITY',
  'THREAT',
  'SEXUALLY_EXPLICIT',
  'FLIRTATION',
];

export interface PerspectiveResult {
  isSafe: boolean;
  action: 'allow' | 'warn' | 'flag' | 'block';
  scores: Record<string, number>;
  reason?: string;
}

export interface ContentSafetyCheck {
  isSafe: boolean;
  action: 'allow' | 'warn' | 'block';
  reason?: string;
  perspective?: PerspectiveResult;
}

/**
 * Check content safety using Perspective API
 */
export async function checkPerspectiveAPI(
  text: string,
  context?: string
): Promise<PerspectiveResult> {
  try {
    // Skip if no API key configured
    if (!PERSPECTIVE_API_KEY || PERSPECTIVE_API_KEY === 'mock-key') {
      logger.debug('Perspective API not configured, skipping check');
      return {
        isSafe: true,
        action: 'allow',
        scores: {},
      };
    }

    const url = `${PERSPECTIVE_API_URL}?key=${PERSPECTIVE_API_KEY}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        comment: {
          text,
          type: 'PLAIN_TEXT',
        },
        context: context
          ? {
              articleAndParentComment: {
                article: { text: context },
              },
            }
          : undefined,
        languages: ['en'],
        requestedAttributes: ATTRIBUTES.reduce((acc, attr) => {
          acc[attr] = {};
          return acc;
        }, {} as Record<string, Record<string, unknown>>),
        doNotStore: true, // Don't store user content
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error({ status: response.status, error }, 'Perspective API error');
      // Fail open - allow if API fails
      return {
        isSafe: true,
        action: 'allow',
        scores: {},
      };
    }

    const data = await response.json();

    // Extract scores
    const scores: Record<string, number> = {};
    let maxToxicity = 0;

    for (const attr of ATTRIBUTES) {
      const score = data.attributeScores?.[attr]?.summaryScore?.value || 0;
      scores[attr] = score;
      if (score > maxToxicity) {
        maxToxicity = score;
      }
    }

    // Determine action based on thresholds
    let action: 'allow' | 'warn' | 'flag' | 'block' = 'allow';
    let isSafe = true;
    let reason: string | undefined;

    if (maxToxicity >= TOXICITY_THRESHOLDS.BLOCK) {
      action = 'block';
      isSafe = false;
      reason = 'Content violates safety guidelines';
    } else if (maxToxicity >= TOXICITY_THRESHOLDS.FLAG) {
      action = 'flag';
      reason = 'Content flagged for review';
    } else if (maxToxicity >= TOXICITY_THRESHOLDS.WARN) {
      action = 'warn';
    }

    logger.debug({ scores, action }, 'Perspective API check complete');

    return {
      isSafe,
      action,
      scores,
      reason,
    };
  } catch (error) {
    logger.error({ error }, 'Perspective API exception');
    // Fail open - allow if API fails
    return {
      isSafe: true,
      action: 'allow',
      scores: {},
    };
  }
}

/**
 * Comprehensive content safety check
 * Combines Perspective API with local checks
 */
export async function checkContentSafety(
  content: string,
  options?: {
    skipPerspective?: boolean;
    context?: string;
  }
): Promise<ContentSafetyCheck> {
  // Local keyword checks first (fast)
  const lowerContent = content.toLowerCase();

  // Check for crisis content (always block)
  const crisisKeywords = [
    'kill', 'murder', 'suicide', 'self-harm', 'cut myself',
    'end my life', 'hurt someone', 'weapon', 'gun', 'knife',
  ];

  for (const keyword of crisisKeywords) {
    if (lowerContent.includes(keyword)) {
      return {
        isSafe: false,
        action: 'block',
        reason: 'Crisis content detected. If you or someone you know is in crisis, please call 988 or 911.',
      };
    }
  }

  // Check Perspective API if not skipped
  if (!options?.skipPerspective) {
    const perspective = await checkPerspectiveAPI(content, options?.context);

    if (perspective.action === 'block') {
      return {
        isSafe: false,
        action: 'block',
        reason: perspective.reason,
        perspective,
      };
    }

    if (perspective.action === 'flag' || perspective.action === 'warn') {
      return {
        isSafe: true,
        action: perspective.action === 'flag' ? 'warn' : 'allow',
        perspective,
      };
    }
  }

  return {
    isSafe: true,
    action: 'allow',
  };
}

/**
 * Batch check multiple messages for safety
 */
export async function batchCheckContentSafety(
  contents: string[]
): Promise<Array<{ index: number; safe: boolean; action: string; reason?: string }>> {
  const results = await Promise.all(
    contents.map(async (content, index) => {
      const check = await checkContentSafety(content, { skipPerspective: true });
      return {
        index,
        safe: check.isSafe,
        action: check.action,
        reason: check.reason,
      };
    })
  );

  return results;
}
