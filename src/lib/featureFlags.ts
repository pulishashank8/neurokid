type FeatureFlagValue = boolean | string | number;

interface FeatureFlagDefinition {
  name: string;
  defaultValue: FeatureFlagValue;
  description: string;
  rolloutPercentage?: number;
}

const FEATURE_FLAGS: Record<string, FeatureFlagDefinition> = {
  NEW_ONBOARDING_FLOW: {
    name: 'NEW_ONBOARDING_FLOW',
    defaultValue: false,
    description: 'Enable new user onboarding experience',
    rolloutPercentage: 0,
  },
  ENHANCED_SEARCH: {
    name: 'ENHANCED_SEARCH',
    defaultValue: false,
    description: 'Enable enhanced search with AI suggestions',
    rolloutPercentage: 0,
  },
  PYTHON_ANALYTICS: {
    name: 'PYTHON_ANALYTICS',
    defaultValue: false,
    description: 'Enable Python-based analytics processing',
    rolloutPercentage: 0,
  },
  NEW_MESSAGING_UI: {
    name: 'NEW_MESSAGING_UI',
    defaultValue: false,
    description: 'Enable redesigned messaging interface',
    rolloutPercentage: 0,
  },
  AI_MODERATION: {
    name: 'AI_MODERATION',
    defaultValue: false,
    description: 'Enable AI-assisted content moderation',
    rolloutPercentage: 0,
  },
};

export type FeatureFlagName = keyof typeof FEATURE_FLAGS;

function hashUserId(userId: string): number {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash % 100);
}

export function isFeatureEnabled(
  flagName: FeatureFlagName,
  userId?: string
): boolean {
  const envValue = process.env[`FEATURE_${flagName}`];
  if (envValue !== undefined) {
    return envValue === 'true' || envValue === '1';
  }

  const flag = FEATURE_FLAGS[flagName];
  if (!flag) {
    return false;
  }

  if (typeof flag.defaultValue === 'boolean') {
    if (flag.rolloutPercentage !== undefined && flag.rolloutPercentage > 0 && userId) {
      const userHash = hashUserId(userId);
      return userHash < flag.rolloutPercentage;
    }
    return flag.defaultValue;
  }

  return Boolean(flag.defaultValue);
}

export function getFeatureValue<T extends FeatureFlagValue>(
  flagName: FeatureFlagName,
  defaultValue: T
): T {
  const envValue = process.env[`FEATURE_${flagName}`];
  if (envValue !== undefined) {
    if (typeof defaultValue === 'boolean') {
      return (envValue === 'true' || envValue === '1') as T;
    }
    if (typeof defaultValue === 'number') {
      return (parseInt(envValue, 10) || defaultValue) as T;
    }
    return envValue as T;
  }

  const flag = FEATURE_FLAGS[flagName];
  if (!flag) {
    return defaultValue;
  }

  return flag.defaultValue as T;
}

export function getAllFeatureFlags(): Record<FeatureFlagName, FeatureFlagDefinition> {
  return { ...FEATURE_FLAGS };
}

export function getEnabledFlags(userId?: string): FeatureFlagName[] {
  return Object.keys(FEATURE_FLAGS).filter(
    (flag) => isFeatureEnabled(flag as FeatureFlagName, userId)
  ) as FeatureFlagName[];
}

export function useFeatureFlag(flagName: FeatureFlagName, userId?: string): boolean {
  return isFeatureEnabled(flagName, userId);
}
