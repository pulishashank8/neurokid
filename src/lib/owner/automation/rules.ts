/**
 * 15 Predefined Automation Rules (Pillar 9)
 * Each rule defines trigger, conditions, and actions
 */

export type RuleSeverity = 'Low' | 'Medium' | 'High' | 'Critical';

export interface AutomationRuleDefinition {
  id: string;
  name: string;
  description: string;
  triggerEvent: string;
  conditions: Record<string, unknown>;
  actions: string[];
  severity: RuleSeverity;
}

/** 15 rules from PRD Pillar 9 */
export const AUTOMATION_RULES: AutomationRuleDefinition[] = [
  {
    id: 'reengagement_inactive_14d',
    name: 'Re-engagement: Inactive + High Churn',
    description: 'User inactive >14 days + HIGH churn risk → Send re-engagement email',
    triggerEvent: 'CHURN_SCAN_COMPLETE',
    conditions: { inactiveDays: 14, churnRiskMin: 0.6 },
    actions: ['SEND_REENGAGEMENT_EMAIL'],
    severity: 'Medium',
  },
  {
    id: 'auto_temp_block_reports',
    name: 'Auto Temp Block: 3+ Reports in 24h',
    description: '3+ reports against same user in 24h → Auto-temp-block 24h + notify owner',
    triggerEvent: 'REPORT_CREATED',
    conditions: { reportCount: 3, windowHours: 24 },
    actions: ['TEMP_BLOCK_24H', 'NOTIFY_OWNER'],
    severity: 'High',
  },
  {
    id: 'spam_shadowban',
    name: 'Spam: 5+ Posts in 10 min',
    description: '5+ posts in 10 min by same user → Auto-shadowban + flag for review',
    triggerEvent: 'POST_CREATED',
    conditions: { postCount: 5, windowMinutes: 10 },
    actions: ['SHADOWBAN_USER', 'NOTIFY_OWNER'],
    severity: 'High',
  },
  {
    id: 'client_error_critical',
    name: 'ClientError Count >10 in 5 min',
    description: 'ClientError count >10 in 5 min → Critical alert + admin notification',
    triggerEvent: 'CLIENT_ERROR_BATCH',
    conditions: { errorCount: 10, windowMinutes: 5 },
    actions: ['CRITICAL_ALERT', 'NOTIFY_OWNER'],
    severity: 'Critical',
  },
  {
    id: 'ai_cost_spike',
    name: 'Daily AI Cost >2x Average',
    description: 'Daily AI cost >2x average → Alert owner + suggest caching',
    triggerEvent: 'AI_COST_DAILY_SCAN',
    conditions: { multiplier: 2 },
    actions: ['NOTIFY_OWNER'],
    severity: 'Medium',
  },
  {
    id: 'gdpr_escalate',
    name: 'GDPR DataRequest Pending >25 Days',
    description: 'GDPR DataRequest pending >25 days → Escalate to critical + email owner',
    triggerEvent: 'GDPR_SCAN',
    conditions: { pendingDays: 25 },
    actions: ['CRITICAL_ALERT', 'NOTIFY_OWNER'],
    severity: 'Critical',
  },
  {
    id: 'welcome_new_user',
    name: 'New User Signup',
    description: 'New user signup → Send welcome email + log',
    triggerEvent: 'USER_SIGNUP',
    conditions: {},
    actions: ['SEND_WELCOME_EMAIL', 'LOG'],
    severity: 'Low',
  },
  {
    id: 'suggest_pin_viral',
    name: 'Post Gets 50+ Votes in 1h',
    description: 'Post gets 50+ votes in 1h → Suggest pinning + notify',
    triggerEvent: 'VOTE_CREATED',
    conditions: { voteCount: 50, windowMinutes: 60 },
    actions: ['SUGGEST_PIN', 'NOTIFY_OWNER'],
    severity: 'Low',
  },
  {
    id: 'congrats_10_posts',
    name: 'User Reaches 10 Posts',
    description: 'User reaches 10 posts → Send congratulations',
    triggerEvent: 'POST_CREATED',
    conditions: { postCount: 10 },
    actions: ['SEND_CONGRATS_EMAIL'],
    severity: 'Low',
  },
  {
    id: 'ip_block_failed_logins',
    name: '10+ Failed Logins from IP',
    description: '10+ failed logins from IP → Auto IP-block 1h + log',
    triggerEvent: 'LOGIN_FAILED',
    conditions: { failedCount: 10, windowMinutes: 15 },
    actions: ['BLOCK_IP_1H', 'NOTIFY_OWNER'],
    severity: 'Critical',
  },
  {
    id: 'missing_profiles_alert',
    name: 'Missing Profiles >20%',
    description: 'Missing profiles >20% → Alert + suggest onboarding fix',
    triggerEvent: 'PROFILE_SCAN',
    conditions: { missingPercent: 20 },
    actions: ['NOTIFY_OWNER'],
    severity: 'Medium',
  },
  {
    id: 'feature_adoption_low',
    name: 'Feature Adoption <5% After 30 Days',
    description: 'Feature adoption <5% after 30 days → Suggest in-app promotion',
    triggerEvent: 'FEATURE_ADOPTION_SCAN',
    conditions: { adoptionPercent: 5, daysSinceRelease: 30 },
    actions: ['NOTIFY_OWNER'],
    severity: 'Low',
  },
  {
    id: 'high_risk_screening',
    name: 'User Completes HIGH Risk Screening',
    description: 'User completes HIGH risk screening → Suggest resources',
    triggerEvent: 'SCREENING_COMPLETED',
    conditions: { riskLevel: 'HIGH' },
    actions: ['NOTIFY_OWNER'],
    severity: 'Medium',
  },
  {
    id: 'db_latency_alert',
    name: 'DB Latency >2000ms for 5 min',
    description: 'DB latency >2000ms for 5 min → Alert + check queries',
    triggerEvent: 'DB_LATENCY_SCAN',
    conditions: { latencyMs: 2000, windowMinutes: 5 },
    actions: ['CRITICAL_ALERT', 'NOTIFY_OWNER'],
    severity: 'Critical',
  },
  {
    id: 'content_gap_search',
    name: 'Topic Searched >10x, 0 Posts',
    description: 'Topic searched >10x with 0 posts → Suggest content creation',
    triggerEvent: 'SEARCH_ANALYSIS',
    conditions: { searchCount: 10, postCount: 0 },
    actions: ['NOTIFY_OWNER'],
    severity: 'Low',
  },
];
