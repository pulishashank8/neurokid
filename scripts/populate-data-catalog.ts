/**
 * Automated Data Catalog Population Script
 *
 * Reads the Prisma schema and populates the governance tables:
 * - Dataset (table-level metadata)
 * - DatasetField (column-level metadata)
 * - DataOwner (team ownership)
 *
 * This demonstrates:
 * - Automated metadata discovery
 * - Data sensitivity classification
 * - Governance automation (what Collibra/Alation do)
 *
 * Run with: npx tsx scripts/populate-data-catalog.ts
 */

import { PrismaClient, DataSensitivity } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================================
// SENSITIVITY CLASSIFICATION RULES
// ============================================================================

/**
 * Classify dataset sensitivity based on table name and content type
 * This mimics enterprise data classification policies
 */
function classifyDatasetSensitivity(tableName: string): DataSensitivity {
  const phiTables = [
    'ScreeningResult',    // Autism assessment results
    'TherapySession',     // Therapy notes, child info
    'EmergencyCard',      // Medical info, diagnoses, medications
    'AIMessage',          // Conversations about health conditions
    'AIConversation',     // Health-related AI interactions
  ];

  const piiTables = [
    'User',               // Email, password hash
    'Profile',            // Name, location, bio
    'DirectMessage',      // Private communications
    'DailyWin',           // Personal journal entries
    'Notification',       // Personal alerts
    'UserConsent',        // Consent records
  ];

  const sensitiveTables = [
    'Report',             // User reports (harassment, etc.)
    'ModerationAction',   // Moderation decisions
    'ModActionLog',       // Mod action history
    'AuditLog',           // Security audit trail
    'SensitiveAccessLog', // PHI access records
    'ProviderReview',     // Reviews (could contain PHI)
  ];

  const internalTables = [
    'Provider',           // Provider directory
    'ProviderClaimRequest',
    'Category',
    'Tag',
    'Resource',
    'BusinessGlossaryTerm',
    'Dataset',
    'DatasetField',
    'DataOwner',
    'DataQualityRule',
    'DataQualityResult',
    'DataLineageNode',
    'DataLineageEdge',
    'JobExecution',
  ];

  if (phiTables.includes(tableName)) return 'PHI';
  if (piiTables.includes(tableName)) return 'PII';
  if (sensitiveTables.includes(tableName)) return 'SENSITIVE';
  if (internalTables.includes(tableName)) return 'INTERNAL';
  return 'PUBLIC';
}

/**
 * Classify field sensitivity based on field name patterns
 */
function classifyFieldSensitivity(fieldName: string, tableSensitivity: DataSensitivity): DataSensitivity {
  // PHI field patterns (healthcare identifiers)
  const phiPatterns = [
    /diagnosis/i, /medication/i, /allergy/i, /treatment/i,
    /symptom/i, /condition/i, /therapist/i, /doctor/i,
    /screening/i, /assessment/i, /score/i, /riskLevel/i,
    /mood/i, /trigger/i, /calming/i, /emergency/i,
    /childName/i, /childAge/i,
  ];

  // PII field patterns (personal identifiers)
  const piiPatterns = [
    /email/i, /phone/i, /address/i, /name/i, /username/i,
    /password/i, /token/i, /secret/i, /ip/i, /location/i,
    /bio/i, /avatar/i, /website/i,
  ];

  // Sensitive field patterns
  const sensitivePatterns = [
    /content/i, /message/i, /note/i, /reason/i, /description/i,
  ];

  const fieldLower = fieldName.toLowerCase();

  for (const pattern of phiPatterns) {
    if (pattern.test(fieldName)) return 'PHI';
  }

  for (const pattern of piiPatterns) {
    if (pattern.test(fieldName)) return 'PII';
  }

  for (const pattern of sensitivePatterns) {
    if (pattern.test(fieldName)) return 'SENSITIVE';
  }

  // Inherit from table if no specific match
  return tableSensitivity;
}

/**
 * Infer domain from table name
 */
function inferDomain(tableName: string): string {
  const domains: Record<string, string[]> = {
    'Healthcare': [
      'ScreeningResult', 'TherapySession', 'EmergencyCard',
      'Provider', 'ProviderReview', 'ProviderClaimRequest',
    ],
    'Community': [
      'Post', 'Comment', 'Vote', 'Bookmark', 'Category', 'Tag',
      'Report', 'ModerationAction', 'ModActionLog',
    ],
    'User Management': [
      'User', 'Profile', 'UserRole', 'UserSession', 'UserConsent',
    ],
    'Messaging': [
      'Conversation', 'DirectMessage', 'BlockedUser', 'MessageReport',
      'MessageRateLimit', 'ConnectionRequest', 'Notification',
    ],
    'AI Services': [
      'AIConversation', 'AIMessage', 'RateLimitLog',
    ],
    'Data Governance': [
      'Dataset', 'DatasetField', 'DataOwner', 'BusinessGlossaryTerm',
      'DatasetGlossaryTerm', 'DataQualityRule', 'DataQualityResult',
      'DataLineageNode', 'DataLineageEdge', 'JobExecution',
      'AuditLog', 'SensitiveAccessLog',
    ],
    'Content': [
      'Resource', 'SavedResource', 'DailyWin', 'SearchQuery',
    ],
    'Authentication': [
      'EmailVerification', 'EmailVerificationToken', 'PasswordResetToken',
    ],
  };

  for (const [domain, tables] of Object.entries(domains)) {
    if (tables.includes(tableName)) return domain;
  }
  return 'Other';
}

/**
 * Generate human-readable description for a dataset
 */
function generateDescription(tableName: string): string {
  const descriptions: Record<string, string> = {
    // Healthcare domain
    'ScreeningResult': 'Autism screening assessment results including M-CHAT, ADOS, and AQ scores with risk level classifications. Contains PHI requiring HIPAA compliance.',
    'TherapySession': 'Therapy session records for children including session notes, progress tracking, and mood assessments. Contains PHI about minors.',
    'EmergencyCard': 'Emergency information cards containing child diagnoses, medications, allergies, triggers, and emergency contacts. Critical PHI data.',
    'Provider': 'Directory of autism specialists including therapists, psychologists, and developmental pediatricians with location and specialty data.',
    'ProviderReview': 'User reviews of autism service providers. May contain PHI in review content.',

    // Community domain
    'Post': 'Community forum posts where parents discuss autism-related topics. May contain sensitive family information.',
    'Comment': 'Comments on community posts. May contain sensitive personal experiences.',
    'Vote': 'Upvotes and downvotes on posts and comments.',
    'Bookmark': 'User bookmarks for saved posts.',

    // User domain
    'User': 'User account records including email and authentication data. Contains PII.',
    'Profile': 'User profile information including display name, bio, and location. Contains PII.',
    'UserRole': 'Role assignments (Parent, Therapist, Moderator, Admin) for access control.',
    'UserConsent': 'GDPR/CCPA consent records tracking user data processing permissions.',

    // AI domain
    'AIConversation': 'AI chat conversation threads. May contain PHI discussed with AI assistant.',
    'AIMessage': 'Individual messages in AI conversations. May contain sensitive health questions.',

    // Governance domain
    'Dataset': 'Data catalog entries describing datasets in the system.',
    'DatasetField': 'Field-level metadata for cataloged datasets.',
    'DataOwner': 'Team ownership assignments for data stewardship.',
    'DataQualityRule': 'Data quality validation rules and thresholds.',
    'DataQualityResult': 'Results from data quality check executions.',
    'DataLineageNode': 'Nodes in the data lineage graph (sources, processes, stores).',
    'DataLineageEdge': 'Edges connecting lineage nodes showing data flow.',
    'AuditLog': 'Security audit trail for user actions.',
    'SensitiveAccessLog': 'Access log for PHI data views and exports.',
  };

  return descriptions[tableName] || `Database table storing ${tableName} records.`;
}

/**
 * Get retention policy based on data type
 */
function getRetentionPolicy(tableName: string, sensitivity: DataSensitivity): string {
  // Healthcare data retention (HIPAA requires minimum 6 years)
  if (sensitivity === 'PHI') {
    return '7 years (HIPAA compliance)';
  }

  // Audit logs need long retention
  if (tableName.includes('Log') || tableName.includes('Audit')) {
    return '7 years (compliance audit trail)';
  }

  // Consent records
  if (tableName.includes('Consent')) {
    return 'Duration of account + 3 years';
  }

  // Transient data
  if (['UserSession', 'RateLimitLog', 'MessageRateLimit'].includes(tableName)) {
    return '90 days';
  }

  // Default
  return 'Duration of account';
}

// ============================================================================
// SCHEMA DEFINITION (matches Prisma models)
// ============================================================================

interface FieldDefinition {
  name: string;
  type: string;
  isNullable: boolean;
  description?: string;
}

interface TableDefinition {
  name: string;
  fields: FieldDefinition[];
}

// Define all tables from Prisma schema
const tables: TableDefinition[] = [
  {
    name: 'User',
    fields: [
      { name: 'id', type: 'String', isNullable: false, description: 'Unique user identifier (CUID)' },
      { name: 'email', type: 'String', isNullable: false, description: 'User email address (unique, PII)' },
      { name: 'hashedPassword', type: 'String', isNullable: true, description: 'Bcrypt hashed password' },
      { name: 'emailVerified', type: 'Boolean', isNullable: false, description: 'Email verification status' },
      { name: 'emailVerifiedAt', type: 'DateTime', isNullable: true, description: 'Email verification timestamp' },
      { name: 'createdAt', type: 'DateTime', isNullable: false, description: 'Account creation timestamp' },
      { name: 'updatedAt', type: 'DateTime', isNullable: false, description: 'Last update timestamp' },
      { name: 'lastLoginAt', type: 'DateTime', isNullable: true, description: 'Last login timestamp' },
      { name: 'isBanned', type: 'Boolean', isNullable: false, description: 'Account ban status' },
      { name: 'bannedAt', type: 'DateTime', isNullable: true, description: 'Ban timestamp' },
      { name: 'bannedReason', type: 'String', isNullable: true, description: 'Reason for ban' },
    ],
  },
  {
    name: 'Profile',
    fields: [
      { name: 'id', type: 'String', isNullable: false },
      { name: 'userId', type: 'String', isNullable: false, description: 'Foreign key to User' },
      { name: 'username', type: 'String', isNullable: false, description: 'Unique username (PII)' },
      { name: 'displayName', type: 'String', isNullable: false, description: 'Display name (PII)' },
      { name: 'bio', type: 'String', isNullable: true, description: 'User biography (may contain sensitive info)' },
      { name: 'avatarUrl', type: 'String', isNullable: true, description: 'Profile picture URL' },
      { name: 'location', type: 'String', isNullable: true, description: 'User location (PII)' },
      { name: 'verifiedTherapist', type: 'Boolean', isNullable: false, description: 'Therapist verification status' },
      { name: 'shadowbanned', type: 'Boolean', isNullable: false, description: 'Shadowban status' },
    ],
  },
  {
    name: 'ScreeningResult',
    fields: [
      { name: 'id', type: 'String', isNullable: false },
      { name: 'userId', type: 'String', isNullable: true, description: 'User who took screening (may be anonymous)' },
      { name: 'screeningType', type: 'String', isNullable: false, description: 'Type of screening (M-CHAT, ADOS, AQ)' },
      { name: 'score', type: 'Int', isNullable: true, description: 'Screening score (PHI)' },
      { name: 'riskLevel', type: 'String', isNullable: true, description: 'Risk classification (low/medium/high) - PHI' },
      { name: 'completedAt', type: 'DateTime', isNullable: false, description: 'Screening completion timestamp' },
      { name: 'answers', type: 'Json', isNullable: true, description: 'Individual question answers (PHI)' },
    ],
  },
  {
    name: 'TherapySession',
    fields: [
      { name: 'id', type: 'String', isNullable: false },
      { name: 'userId', type: 'String', isNullable: false, description: 'Parent user ID' },
      { name: 'childName', type: 'String', isNullable: false, description: 'Child name (PHI - minor)' },
      { name: 'therapistName', type: 'String', isNullable: false, description: 'Therapist name' },
      { name: 'therapyType', type: 'Enum', isNullable: false, description: 'Type of therapy (ABA, OT, Speech, etc.)' },
      { name: 'sessionDate', type: 'DateTime', isNullable: false, description: 'Date of therapy session' },
      { name: 'duration', type: 'Int', isNullable: false, description: 'Session duration in minutes' },
      { name: 'notes', type: 'String', isNullable: true, description: 'Session notes (PHI)' },
      { name: 'wentWell', type: 'String', isNullable: true, description: 'Positive observations (PHI)' },
      { name: 'toWorkOn', type: 'String', isNullable: true, description: 'Areas for improvement (PHI)' },
      { name: 'mood', type: 'Int', isNullable: true, description: 'Child mood rating 1-5 (PHI)' },
    ],
  },
  {
    name: 'EmergencyCard',
    fields: [
      { name: 'id', type: 'String', isNullable: false },
      { name: 'userId', type: 'String', isNullable: false },
      { name: 'childName', type: 'String', isNullable: false, description: 'Child name (PHI - minor)' },
      { name: 'childAge', type: 'Int', isNullable: true, description: 'Child age (PHI)' },
      { name: 'diagnosis', type: 'String', isNullable: true, description: 'Autism diagnosis details (PHI)' },
      { name: 'triggers', type: 'String', isNullable: true, description: 'Known triggers (PHI)' },
      { name: 'calmingStrategies', type: 'String', isNullable: true, description: 'Calming techniques (PHI)' },
      { name: 'communication', type: 'String', isNullable: true, description: 'Communication methods (PHI)' },
      { name: 'medications', type: 'String', isNullable: true, description: 'Current medications (PHI)' },
      { name: 'allergies', type: 'String', isNullable: true, description: 'Known allergies (PHI)' },
      { name: 'emergencyContact1Name', type: 'String', isNullable: true, description: 'Emergency contact name (PII)' },
      { name: 'emergencyContact1Phone', type: 'String', isNullable: true, description: 'Emergency contact phone (PII)' },
      { name: 'doctorName', type: 'String', isNullable: true, description: 'Doctor name' },
      { name: 'doctorPhone', type: 'String', isNullable: true, description: 'Doctor phone' },
    ],
  },
  {
    name: 'AIConversation',
    fields: [
      { name: 'id', type: 'String', isNullable: false },
      { name: 'userId', type: 'String', isNullable: false },
      { name: 'title', type: 'String', isNullable: false, description: 'Conversation title' },
      { name: 'createdAt', type: 'DateTime', isNullable: false },
      { name: 'updatedAt', type: 'DateTime', isNullable: false },
    ],
  },
  {
    name: 'AIMessage',
    fields: [
      { name: 'id', type: 'String', isNullable: false },
      { name: 'conversationId', type: 'String', isNullable: false },
      { name: 'userId', type: 'String', isNullable: false },
      { name: 'role', type: 'String', isNullable: false, description: 'Message role (user/assistant/system)' },
      { name: 'content', type: 'String', isNullable: false, description: 'Message content (may contain PHI)' },
      { name: 'tokens', type: 'Int', isNullable: true, description: 'Token count for billing' },
    ],
  },
  {
    name: 'Provider',
    fields: [
      { name: 'id', type: 'String', isNullable: false },
      { name: 'externalSource', type: 'Enum', isNullable: false, description: 'Data source (Google Places, OSM, Manual)' },
      { name: 'externalId', type: 'String', isNullable: true },
      { name: 'name', type: 'String', isNullable: false, description: 'Provider/practice name' },
      { name: 'phone', type: 'String', isNullable: true },
      { name: 'address', type: 'String', isNullable: true },
      { name: 'city', type: 'String', isNullable: true },
      { name: 'state', type: 'String', isNullable: true },
      { name: 'zipCode', type: 'String', isNullable: true },
      { name: 'latitude', type: 'Float', isNullable: true },
      { name: 'longitude', type: 'Float', isNullable: true },
      { name: 'specialties', type: 'Enum[]', isNullable: false, description: 'Provider specialties (ABA, OT, SLP, etc.)' },
      { name: 'rating', type: 'Decimal', isNullable: true },
      { name: 'isVerified', type: 'Boolean', isNullable: false },
    ],
  },
  {
    name: 'Post',
    fields: [
      { name: 'id', type: 'String', isNullable: false },
      { name: 'title', type: 'String', isNullable: false },
      { name: 'content', type: 'String', isNullable: false, description: 'Post content (may contain sensitive info)' },
      { name: 'authorId', type: 'String', isNullable: true },
      { name: 'isAnonymous', type: 'Boolean', isNullable: false },
      { name: 'categoryId', type: 'String', isNullable: false },
      { name: 'status', type: 'Enum', isNullable: false },
      { name: 'viewCount', type: 'Int', isNullable: false },
      { name: 'commentCount', type: 'Int', isNullable: false },
      { name: 'voteScore', type: 'Int', isNullable: false },
    ],
  },
  {
    name: 'DataQualityRule',
    fields: [
      { name: 'id', type: 'String', isNullable: false },
      { name: 'datasetId', type: 'String', isNullable: false },
      { name: 'fieldName', type: 'String', isNullable: true },
      { name: 'ruleType', type: 'Enum', isNullable: false, description: 'Rule type (NULL_CHECK, REGEX, RANGE, ANOMALY, etc.)' },
      { name: 'name', type: 'String', isNullable: false },
      { name: 'description', type: 'String', isNullable: true },
      { name: 'criteria', type: 'Json', isNullable: false, description: 'Rule parameters' },
      { name: 'severity', type: 'String', isNullable: false, description: 'WARNING or CRITICAL' },
      { name: 'isActive', type: 'Boolean', isNullable: false },
    ],
  },
  {
    name: 'DataQualityResult',
    fields: [
      { name: 'id', type: 'String', isNullable: false },
      { name: 'ruleId', type: 'String', isNullable: false },
      { name: 'status', type: 'String', isNullable: false, description: 'PASS, FAIL, or ERROR' },
      { name: 'recordsChecked', type: 'Int', isNullable: false },
      { name: 'failuresFound', type: 'Int', isNullable: false },
      { name: 'anomalyScore', type: 'Float', isNullable: true, description: 'ML anomaly score for detection rules' },
      { name: 'failureSample', type: 'Json', isNullable: true, description: 'Sample of failed records' },
      { name: 'runDate', type: 'DateTime', isNullable: false },
      { name: 'executionDurationMs', type: 'Int', isNullable: true },
    ],
  },
  {
    name: 'AuditLog',
    fields: [
      { name: 'id', type: 'String', isNullable: false },
      { name: 'userId', type: 'String', isNullable: false },
      { name: 'action', type: 'String', isNullable: false, description: 'Action performed' },
      { name: 'targetType', type: 'String', isNullable: true, description: 'Type of target entity' },
      { name: 'targetId', type: 'String', isNullable: true, description: 'ID of target entity' },
      { name: 'changes', type: 'Json', isNullable: true, description: 'Change details' },
      { name: 'ipAddress', type: 'String', isNullable: true },
      { name: 'userAgent', type: 'String', isNullable: true },
    ],
  },
  {
    name: 'SensitiveAccessLog',
    fields: [
      { name: 'id', type: 'String', isNullable: false },
      { name: 'adminUserId', type: 'String', isNullable: false },
      { name: 'datasetName', type: 'String', isNullable: false, description: 'Accessed dataset' },
      { name: 'actionType', type: 'String', isNullable: false, description: 'VIEW, EXPORT, or UPDATE' },
      { name: 'recordCount', type: 'Int', isNullable: true },
      { name: 'filterCriteria', type: 'Json', isNullable: true },
      { name: 'reason', type: 'String', isNullable: true, description: 'Justification for access' },
      { name: 'accessedAt', type: 'DateTime', isNullable: false },
    ],
  },
  {
    name: 'UserConsent',
    fields: [
      { name: 'id', type: 'String', isNullable: false },
      { name: 'userId', type: 'String', isNullable: false },
      { name: 'consentType', type: 'String', isNullable: false, description: 'Type (analytics, ai_training, research)' },
      { name: 'version', type: 'String', isNullable: false, description: 'Policy version consented to' },
      { name: 'hasGranted', type: 'Boolean', isNullable: false },
      { name: 'grantedAt', type: 'DateTime', isNullable: true },
      { name: 'revokedAt', type: 'DateTime', isNullable: true },
      { name: 'ipAddress', type: 'String', isNullable: true },
    ],
  },
];

// ============================================================================
// MAIN POPULATION FUNCTION
// ============================================================================

async function main() {
  console.log('🚀 Starting Data Catalog Population...\n');

  // Step 1: Create Data Owners (teams)
  console.log('📋 Creating Data Owners...');
  const owners = [
    { teamName: 'Data Engineering', contactEmail: 'data-eng@neurokid.help', slackChannel: '#data-engineering' },
    { teamName: 'Platform Team', contactEmail: 'platform@neurokid.help', slackChannel: '#platform' },
    { teamName: 'Healthcare Operations', contactEmail: 'health-ops@neurokid.help', slackChannel: '#healthcare' },
    { teamName: 'Community Team', contactEmail: 'community@neurokid.help', slackChannel: '#community' },
    { teamName: 'Security & Compliance', contactEmail: 'security@neurokid.help', slackChannel: '#security' },
  ];

  for (const owner of owners) {
    await prisma.dataOwner.upsert({
      where: { teamName: owner.teamName },
      update: owner,
      create: owner,
    });
  }
  console.log(`   ✅ Created ${owners.length} data owners\n`);

  // Step 2: Create Business Glossary Terms
  console.log('📚 Creating Business Glossary Terms...');
  const glossaryTerms = [
    { name: 'PHI', definition: 'Protected Health Information - Any health data that can identify an individual, requiring HIPAA compliance.' },
    { name: 'PII', definition: 'Personally Identifiable Information - Data that can identify a specific person (name, email, SSN, etc.).' },
    { name: 'Autism Screening', definition: 'Standardized assessment tools (M-CHAT, ADOS, AQ) used to evaluate autism spectrum characteristics.' },
    { name: 'M-CHAT', definition: 'Modified Checklist for Autism in Toddlers - A screening tool for children 16-30 months.' },
    { name: 'ABA Therapy', definition: 'Applied Behavior Analysis - Evidence-based therapy for autism focusing on behavior modification.' },
    { name: 'Risk Level', definition: 'Classification of autism screening results as low, medium, high, or very high risk.' },
    { name: 'Data Steward', definition: 'Team or individual responsible for data quality, security, and governance of a dataset.' },
    { name: 'Data Lineage', definition: 'The complete journey of data from source to consumption, including all transformations.' },
    { name: 'Consent', definition: 'User permission for specific data processing activities as required by GDPR/CCPA.' },
    { name: 'Anonymization', definition: 'Process of removing personally identifiable information to protect privacy.' },
  ];

  for (const term of glossaryTerms) {
    await prisma.businessGlossaryTerm.upsert({
      where: { name: term.name },
      update: term,
      create: term,
    });
  }
  console.log(`   ✅ Created ${glossaryTerms.length} glossary terms\n`);

  // Step 3: Create Datasets and Fields
  console.log('📊 Creating Datasets and Fields...');
  let datasetCount = 0;
  let fieldCount = 0;

  for (const table of tables) {
    const sensitivity = classifyDatasetSensitivity(table.name);
    const domain = inferDomain(table.name);
    const retention = getRetentionPolicy(table.name, sensitivity);

    // Determine owner based on domain
    const ownerMap: Record<string, string> = {
      'Healthcare': 'Healthcare Operations',
      'Data Governance': 'Data Engineering',
      'Authentication': 'Security & Compliance',
      'User Management': 'Platform Team',
      'Community': 'Community Team',
      'Messaging': 'Platform Team',
      'AI Services': 'Data Engineering',
      'Content': 'Community Team',
    };
    const ownerTeam = ownerMap[domain] || 'Data Engineering';

    // Create dataset
    const dataset = await prisma.dataset.upsert({
      where: { name: table.name },
      update: {
        description: generateDescription(table.name),
        domain,
        sensitivity,
        retentionPolicy: retention,
        updateFrequency: 'Real-time',
        tags: [domain.toLowerCase().replace(' ', '-'), sensitivity.toLowerCase()],
      },
      create: {
        name: table.name,
        description: generateDescription(table.name),
        domain,
        ownerTeam,
        sensitivity,
        retentionPolicy: retention,
        updateFrequency: 'Real-time',
        tags: [domain.toLowerCase().replace(' ', '-'), sensitivity.toLowerCase()],
      },
    });
    datasetCount++;

    // Create fields
    for (const field of table.fields) {
      const fieldSensitivity = classifyFieldSensitivity(field.name, sensitivity);

      await prisma.datasetField.upsert({
        where: {
          datasetId_name: {
            datasetId: dataset.id,
            name: field.name,
          },
        },
        update: {
          type: field.type,
          description: field.description || `Field ${field.name} in ${table.name}`,
          isNullable: field.isNullable,
          sensitivity: fieldSensitivity,
        },
        create: {
          datasetId: dataset.id,
          name: field.name,
          type: field.type,
          description: field.description || `Field ${field.name} in ${table.name}`,
          isNullable: field.isNullable,
          sensitivity: fieldSensitivity,
        },
      });
      fieldCount++;
    }

    const sensitivityEmoji = {
      'PHI': '🏥',
      'PII': '👤',
      'SENSITIVE': '⚠️',
      'INTERNAL': '🔒',
      'PUBLIC': '🌐',
    };

    console.log(`   ${sensitivityEmoji[sensitivity]} ${table.name} (${sensitivity}) - ${table.fields.length} fields`);
  }

  console.log(`\n   ✅ Created ${datasetCount} datasets with ${fieldCount} fields\n`);

  // Step 4: Summary
  console.log('=' .repeat(60));
  console.log('📈 DATA CATALOG POPULATION SUMMARY');
  console.log('=' .repeat(60));

  const sensitivityCounts = await prisma.dataset.groupBy({
    by: ['sensitivity'],
    _count: true,
  });

  console.log('\n📊 Datasets by Sensitivity:');
  for (const row of sensitivityCounts) {
    console.log(`   ${row.sensitivity}: ${row._count} datasets`);
  }

  const domainCounts = await prisma.dataset.groupBy({
    by: ['domain'],
    _count: true,
  });

  console.log('\n🏷️  Datasets by Domain:');
  for (const row of domainCounts) {
    console.log(`   ${row.domain}: ${row._count} datasets`);
  }

  const totalDatasets = await prisma.dataset.count();
  const totalFields = await prisma.datasetField.count();
  const totalOwners = await prisma.dataOwner.count();
  const totalTerms = await prisma.businessGlossaryTerm.count();

  console.log('\n📋 Totals:');
  console.log(`   Datasets:        ${totalDatasets}`);
  console.log(`   Fields:          ${totalFields}`);
  console.log(`   Data Owners:     ${totalOwners}`);
  console.log(`   Glossary Terms:  ${totalTerms}`);

  console.log('\n✅ Data Catalog population complete!');
  console.log('   Run `npx prisma studio` to view in browser.\n');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
