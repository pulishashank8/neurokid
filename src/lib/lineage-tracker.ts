/**
 * Data Lineage Tracking System
 *
 * Automatically tracks data flow through the NeuroKid application:
 * - Source: Database tables
 * - Process: API endpoints, transformations
 * - Store: Caches, derived tables
 * - Report: Frontend components, exports
 *
 * This demonstrates enterprise-grade data lineage capabilities
 * similar to Collibra, Alation, or DataHub.
 */

import { prisma } from './prisma';

// ============================================================================
// TYPES
// ============================================================================

export interface LineageEvent {
  operation: string;          // e.g., "GET /api/posts"
  tablesAccessed: string[];   // e.g., ["Post", "User", "Category"]
  fieldsAccessed?: Record<string, string[]>; // e.g., { Post: ["title", "content"] }
  transformations?: string[]; // e.g., ["filter:status=ACTIVE", "join:User"]
  outputType?: 'API' | 'EXPORT' | 'CACHE' | 'COMPONENT';
  outputName?: string;        // e.g., "PostList", "user-export.csv"
  userId?: string;
  requestId?: string;
  timestamp?: Date;
}

export interface LineageGraph {
  nodes: LineageNode[];
  edges: LineageEdge[];
}

export interface LineageNode {
  id: string;
  name: string;
  type: 'SOURCE' | 'PROCESS' | 'STORE' | 'REPORT';
  metadata?: Record<string, unknown>;
}

export interface LineageEdge {
  source: string;
  target: string;
  transformation?: string;
}

// ============================================================================
// LINEAGE DEFINITIONS
// ============================================================================

/**
 * Static lineage definitions for NeuroKid data flows
 * This maps the expected data flow through the system
 */
export const LINEAGE_DEFINITIONS = {
  // ============================================================================
  // HEALTHCARE DATA FLOWS (PHI)
  // ============================================================================
  'screening-flow': {
    description: 'Autism screening data flow from form to results',
    nodes: [
      { id: 'form:screening-questionnaire', name: 'Screening Questionnaire Form', type: 'SOURCE' as const },
      { id: 'api:POST /api/screening', name: 'Submit Screening API', type: 'PROCESS' as const },
      { id: 'transform:score-calculation', name: 'Risk Score Calculation', type: 'PROCESS' as const },
      { id: 'db:ScreeningResult', name: 'ScreeningResult Table', type: 'STORE' as const },
      { id: 'api:GET /api/screening/:id', name: 'Get Screening Result API', type: 'PROCESS' as const },
      { id: 'component:ScreeningResults', name: 'Results Display Component', type: 'REPORT' as const },
      { id: 'export:screening-pdf', name: 'PDF Export for Doctor', type: 'REPORT' as const },
    ],
    edges: [
      { source: 'form:screening-questionnaire', target: 'api:POST /api/screening', transformation: 'Form submission' },
      { source: 'api:POST /api/screening', target: 'transform:score-calculation', transformation: 'Validate answers' },
      { source: 'transform:score-calculation', target: 'db:ScreeningResult', transformation: 'Calculate risk level' },
      { source: 'db:ScreeningResult', target: 'api:GET /api/screening/:id', transformation: 'SELECT by id' },
      { source: 'api:GET /api/screening/:id', target: 'component:ScreeningResults', transformation: 'JSON response' },
      { source: 'db:ScreeningResult', target: 'export:screening-pdf', transformation: 'Generate PDF' },
    ],
  },

  'therapy-session-flow': {
    description: 'Therapy session tracking data flow',
    nodes: [
      { id: 'form:therapy-session', name: 'Therapy Session Form', type: 'SOURCE' as const },
      { id: 'api:POST /api/therapy-sessions', name: 'Log Session API', type: 'PROCESS' as const },
      { id: 'db:TherapySession', name: 'TherapySession Table', type: 'STORE' as const },
      { id: 'api:GET /api/therapy-sessions', name: 'List Sessions API', type: 'PROCESS' as const },
      { id: 'transform:session-analytics', name: 'Session Analytics Aggregation', type: 'PROCESS' as const },
      { id: 'component:TherapyHistory', name: 'Therapy History Component', type: 'REPORT' as const },
      { id: 'component:ProgressChart', name: 'Progress Chart Component', type: 'REPORT' as const },
    ],
    edges: [
      { source: 'form:therapy-session', target: 'api:POST /api/therapy-sessions', transformation: 'Form submission with PHI' },
      { source: 'api:POST /api/therapy-sessions', target: 'db:TherapySession', transformation: 'INSERT with validation' },
      { source: 'db:TherapySession', target: 'api:GET /api/therapy-sessions', transformation: 'SELECT with user filter' },
      { source: 'api:GET /api/therapy-sessions', target: 'component:TherapyHistory', transformation: 'JSON response' },
      { source: 'db:TherapySession', target: 'transform:session-analytics', transformation: 'Aggregate by week/month' },
      { source: 'transform:session-analytics', target: 'component:ProgressChart', transformation: 'Mood trends, frequency' },
    ],
  },

  'emergency-card-flow': {
    description: 'Emergency card data flow (critical PHI)',
    nodes: [
      { id: 'form:emergency-card', name: 'Emergency Card Form', type: 'SOURCE' as const },
      { id: 'api:POST /api/emergency-cards', name: 'Create Card API', type: 'PROCESS' as const },
      { id: 'db:EmergencyCard', name: 'EmergencyCard Table (PHI)', type: 'STORE' as const },
      { id: 'api:GET /api/emergency-cards/:id', name: 'Get Card API', type: 'PROCESS' as const },
      { id: 'component:EmergencyCardView', name: 'Card View Component', type: 'REPORT' as const },
      { id: 'export:emergency-card-print', name: 'Printable Card Export', type: 'REPORT' as const },
    ],
    edges: [
      { source: 'form:emergency-card', target: 'api:POST /api/emergency-cards', transformation: 'Collect medical info' },
      { source: 'api:POST /api/emergency-cards', target: 'db:EmergencyCard', transformation: 'Store encrypted PHI' },
      { source: 'db:EmergencyCard', target: 'api:GET /api/emergency-cards/:id', transformation: 'Auth check + SELECT' },
      { source: 'api:GET /api/emergency-cards/:id', target: 'component:EmergencyCardView', transformation: 'Decrypt for display' },
      { source: 'db:EmergencyCard', target: 'export:emergency-card-print', transformation: 'Generate printable format' },
    ],
  },

  // ============================================================================
  // COMMUNITY DATA FLOWS
  // ============================================================================
  'community-post-flow': {
    description: 'Community forum post data flow',
    nodes: [
      { id: 'form:post-editor', name: 'Post Editor Form', type: 'SOURCE' as const },
      { id: 'api:POST /api/posts', name: 'Create Post API', type: 'PROCESS' as const },
      { id: 'transform:content-sanitize', name: 'HTML Sanitization', type: 'PROCESS' as const },
      { id: 'db:Post', name: 'Post Table', type: 'STORE' as const },
      { id: 'db:User', name: 'User Table (author)', type: 'STORE' as const },
      { id: 'db:Category', name: 'Category Table', type: 'STORE' as const },
      { id: 'cache:post-list', name: 'Redis Post Cache', type: 'STORE' as const },
      { id: 'api:GET /api/posts', name: 'List Posts API', type: 'PROCESS' as const },
      { id: 'transform:hot-score', name: 'Hot Score Calculation', type: 'PROCESS' as const },
      { id: 'component:PostList', name: 'Post List Component', type: 'REPORT' as const },
      { id: 'component:PostDetail', name: 'Post Detail Page', type: 'REPORT' as const },
    ],
    edges: [
      { source: 'form:post-editor', target: 'api:POST /api/posts', transformation: 'Submit with auth' },
      { source: 'api:POST /api/posts', target: 'transform:content-sanitize', transformation: 'XSS prevention' },
      { source: 'transform:content-sanitize', target: 'db:Post', transformation: 'INSERT sanitized' },
      { source: 'db:Post', target: 'api:GET /api/posts', transformation: 'SELECT with filters' },
      { source: 'db:User', target: 'api:GET /api/posts', transformation: 'JOIN author info' },
      { source: 'db:Category', target: 'api:GET /api/posts', transformation: 'JOIN category' },
      { source: 'api:GET /api/posts', target: 'transform:hot-score', transformation: 'Calculate ranking' },
      { source: 'transform:hot-score', target: 'cache:post-list', transformation: 'Cache for 5min' },
      { source: 'cache:post-list', target: 'component:PostList', transformation: 'JSON response' },
      { source: 'db:Post', target: 'component:PostDetail', transformation: 'Single post view' },
    ],
  },

  // ============================================================================
  // AI CONVERSATION DATA FLOW
  // ============================================================================
  'ai-chat-flow': {
    description: 'AI assistant conversation data flow',
    nodes: [
      { id: 'form:chat-input', name: 'Chat Input Form', type: 'SOURCE' as const },
      { id: 'api:POST /api/ai/chat', name: 'Send Message API', type: 'PROCESS' as const },
      { id: 'db:AIConversation', name: 'AIConversation Table', type: 'STORE' as const },
      { id: 'db:AIMessage', name: 'AIMessage Table', type: 'STORE' as const },
      { id: 'external:groq-api', name: 'Groq LLM API', type: 'PROCESS' as const },
      { id: 'transform:context-build', name: 'Conversation Context Builder', type: 'PROCESS' as const },
      { id: 'component:ChatInterface', name: 'Chat Interface Component', type: 'REPORT' as const },
    ],
    edges: [
      { source: 'form:chat-input', target: 'api:POST /api/ai/chat', transformation: 'User message' },
      { source: 'api:POST /api/ai/chat', target: 'db:AIMessage', transformation: 'Store user message' },
      { source: 'db:AIMessage', target: 'transform:context-build', transformation: 'Load conversation history' },
      { source: 'transform:context-build', target: 'external:groq-api', transformation: 'Send with system prompt' },
      { source: 'external:groq-api', target: 'db:AIMessage', transformation: 'Store AI response' },
      { source: 'db:AIMessage', target: 'component:ChatInterface', transformation: 'Stream response' },
    ],
  },

  // ============================================================================
  // USER & AUTH DATA FLOW
  // ============================================================================
  'user-registration-flow': {
    description: 'User registration and profile data flow',
    nodes: [
      { id: 'form:registration', name: 'Registration Form', type: 'SOURCE' as const },
      { id: 'api:POST /api/auth/register', name: 'Register API', type: 'PROCESS' as const },
      { id: 'transform:password-hash', name: 'Bcrypt Password Hash', type: 'PROCESS' as const },
      { id: 'db:User', name: 'User Table (PII)', type: 'STORE' as const },
      { id: 'db:Profile', name: 'Profile Table (PII)', type: 'STORE' as const },
      { id: 'external:resend-email', name: 'Resend Email Service', type: 'PROCESS' as const },
      { id: 'db:EmailVerification', name: 'EmailVerification Table', type: 'STORE' as const },
    ],
    edges: [
      { source: 'form:registration', target: 'api:POST /api/auth/register', transformation: 'Collect credentials' },
      { source: 'api:POST /api/auth/register', target: 'transform:password-hash', transformation: 'Hash password' },
      { source: 'transform:password-hash', target: 'db:User', transformation: 'Store hashed password' },
      { source: 'db:User', target: 'db:Profile', transformation: 'Create profile' },
      { source: 'api:POST /api/auth/register', target: 'db:EmailVerification', transformation: 'Generate OTP' },
      { source: 'db:EmailVerification', target: 'external:resend-email', transformation: 'Send verification' },
    ],
  },

  // ============================================================================
  // PROVIDER DIRECTORY DATA FLOW
  // ============================================================================
  'provider-search-flow': {
    description: 'Autism specialist provider search flow',
    nodes: [
      { id: 'form:provider-search', name: 'Provider Search Form', type: 'SOURCE' as const },
      { id: 'api:GET /api/providers', name: 'Search Providers API', type: 'PROCESS' as const },
      { id: 'db:Provider', name: 'Provider Table', type: 'STORE' as const },
      { id: 'db:ProviderReview', name: 'ProviderReview Table', type: 'STORE' as const },
      { id: 'transform:geo-filter', name: 'Geographic Filter', type: 'PROCESS' as const },
      { id: 'transform:specialty-filter', name: 'Specialty Filter', type: 'PROCESS' as const },
      { id: 'component:ProviderList', name: 'Provider List Component', type: 'REPORT' as const },
      { id: 'component:ProviderDetail', name: 'Provider Detail Page', type: 'REPORT' as const },
    ],
    edges: [
      { source: 'form:provider-search', target: 'api:GET /api/providers', transformation: 'Search params' },
      { source: 'api:GET /api/providers', target: 'transform:geo-filter', transformation: 'Location filter' },
      { source: 'transform:geo-filter', target: 'transform:specialty-filter', transformation: 'Specialty filter' },
      { source: 'transform:specialty-filter', target: 'db:Provider', transformation: 'Query with filters' },
      { source: 'db:Provider', target: 'db:ProviderReview', transformation: 'JOIN reviews' },
      { source: 'db:Provider', target: 'component:ProviderList', transformation: 'Search results' },
      { source: 'db:Provider', target: 'component:ProviderDetail', transformation: 'Single provider view' },
    ],
  },

  // ============================================================================
  // GOVERNANCE DATA FLOW
  // ============================================================================
  'data-export-flow': {
    description: 'GDPR user data export flow',
    nodes: [
      { id: 'action:data-export-request', name: 'Export Request (GDPR)', type: 'SOURCE' as const },
      { id: 'api:POST /api/owner/export', name: 'Data Export API', type: 'PROCESS' as const },
      { id: 'db:User', name: 'User Table', type: 'STORE' as const },
      { id: 'db:Profile', name: 'Profile Table', type: 'STORE' as const },
      { id: 'db:Post', name: 'Post Table', type: 'STORE' as const },
      { id: 'db:Comment', name: 'Comment Table', type: 'STORE' as const },
      { id: 'db:ScreeningResult', name: 'ScreeningResult Table', type: 'STORE' as const },
      { id: 'db:TherapySession', name: 'TherapySession Table', type: 'STORE' as const },
      { id: 'transform:data-aggregate', name: 'User Data Aggregation', type: 'PROCESS' as const },
      { id: 'db:SensitiveAccessLog', name: 'Access Log (Audit)', type: 'STORE' as const },
      { id: 'export:user-data-json', name: 'JSON Data Export', type: 'REPORT' as const },
    ],
    edges: [
      { source: 'action:data-export-request', target: 'api:POST /api/owner/export', transformation: 'Auth required' },
      { source: 'api:POST /api/owner/export', target: 'db:User', transformation: 'SELECT user data' },
      { source: 'api:POST /api/owner/export', target: 'db:Profile', transformation: 'SELECT profile' },
      { source: 'api:POST /api/owner/export', target: 'db:Post', transformation: 'SELECT user posts' },
      { source: 'api:POST /api/owner/export', target: 'db:Comment', transformation: 'SELECT user comments' },
      { source: 'api:POST /api/owner/export', target: 'db:ScreeningResult', transformation: 'SELECT screenings' },
      { source: 'api:POST /api/owner/export', target: 'db:TherapySession', transformation: 'SELECT sessions' },
      { source: 'db:User', target: 'transform:data-aggregate', transformation: 'Collect all data' },
      { source: 'transform:data-aggregate', target: 'db:SensitiveAccessLog', transformation: 'Log export event' },
      { source: 'transform:data-aggregate', target: 'export:user-data-json', transformation: 'Generate JSON' },
    ],
  },
};

// ============================================================================
// LINEAGE TRACKING CLASS
// ============================================================================

export class LineageTracker {
  private static instance: LineageTracker;

  private constructor() {}

  public static getInstance(): LineageTracker {
    if (!LineageTracker.instance) {
      LineageTracker.instance = new LineageTracker();
    }
    return LineageTracker.instance;
  }

  /**
   * Record a lineage event (API call, data access)
   */
  async recordEvent(event: LineageEvent): Promise<void> {
    try {
      // Create or find the process node for this API operation
      const processNode = await prisma.dataLineageNode.upsert({
        where: {
          id: `api:${event.operation}`,
        },
        update: {
          metadata: {
            lastAccessed: new Date().toISOString(),
            accessCount: { increment: 1 },
            userId: event.userId,
          },
        },
        create: {
          id: `api:${event.operation}`,
          name: event.operation,
          type: 'PROCESS',
          metadata: {
            tablesAccessed: event.tablesAccessed,
            fieldsAccessed: event.fieldsAccessed,
            createdAt: new Date().toISOString(),
          },
        },
      });

      // Create edges from source tables to this process
      for (const tableName of event.tablesAccessed) {
        // Ensure source node exists
        await prisma.dataLineageNode.upsert({
          where: { id: `db:${tableName}` },
          update: {},
          create: {
            id: `db:${tableName}`,
            name: `${tableName} Table`,
            type: 'SOURCE',
            metadata: { tableType: 'PostgreSQL' },
          },
        });

        // Create edge if doesn't exist
        const existingEdge = await prisma.dataLineageEdge.findFirst({
          where: {
            sourceNodeId: `db:${tableName}`,
            targetNodeId: processNode.id,
          },
        });

        if (!existingEdge) {
          const fields = event.fieldsAccessed?.[tableName]?.join(', ') || 'all';
          await prisma.dataLineageEdge.create({
            data: {
              sourceNodeId: `db:${tableName}`,
              targetNodeId: processNode.id,
              transformationLogic: `SELECT ${fields}`,
            },
          });
        }
      }

      // Create output node if specified
      if (event.outputType && event.outputName) {
        const outputNodeId = `${event.outputType.toLowerCase()}:${event.outputName}`;

        await prisma.dataLineageNode.upsert({
          where: { id: outputNodeId },
          update: {},
          create: {
            id: outputNodeId,
            name: event.outputName,
            type: 'REPORT',
            metadata: { outputType: event.outputType },
          },
        });

        // Create edge from process to output
        const existingOutputEdge = await prisma.dataLineageEdge.findFirst({
          where: {
            sourceNodeId: processNode.id,
            targetNodeId: outputNodeId,
          },
        });

        if (!existingOutputEdge) {
          await prisma.dataLineageEdge.create({
            data: {
              sourceNodeId: processNode.id,
              targetNodeId: outputNodeId,
              transformationLogic: 'JSON response',
            },
          });
        }
      }
    } catch (error) {
      // Don't fail the main request if lineage tracking fails
      console.error('[LineageTracker] Error recording event:', error);
    }
  }

  /**
   * Populate lineage from static definitions
   */
  async populateFromDefinitions(): Promise<{ nodes: number; edges: number }> {
    let nodeCount = 0;
    let edgeCount = 0;

    for (const [flowName, flow] of Object.entries(LINEAGE_DEFINITIONS)) {
      console.log(`  Processing flow: ${flowName}`);

      // Create nodes
      for (const node of flow.nodes) {
        await prisma.dataLineageNode.upsert({
          where: { id: node.id },
          update: {
            name: node.name,
            type: node.type,
            metadata: { flowName, description: flow.description },
          },
          create: {
            id: node.id,
            name: node.name,
            type: node.type,
            metadata: { flowName, description: flow.description },
          },
        });
        nodeCount++;
      }

      // Create edges
      for (const edge of flow.edges) {
        const sourceNode = await prisma.dataLineageNode.findUnique({
          where: { id: edge.source },
        });
        const targetNode = await prisma.dataLineageNode.findUnique({
          where: { id: edge.target },
        });

        if (sourceNode && targetNode) {
          const existingEdge = await prisma.dataLineageEdge.findFirst({
            where: {
              sourceNodeId: edge.source,
              targetNodeId: edge.target,
            },
          });

          if (!existingEdge) {
            await prisma.dataLineageEdge.create({
              data: {
                sourceNodeId: edge.source,
                targetNodeId: edge.target,
                transformationLogic: edge.transformation,
              },
            });
            edgeCount++;
          }
        }
      }
    }

    return { nodes: nodeCount, edges: edgeCount };
  }

  /**
   * Get the complete lineage graph for visualization
   */
  async getLineageGraph(): Promise<LineageGraph> {
    const nodes = await prisma.dataLineageNode.findMany();
    const edges = await prisma.dataLineageEdge.findMany();

    return {
      nodes: nodes.map(n => ({
        id: n.id,
        name: n.name,
        type: n.type as 'SOURCE' | 'PROCESS' | 'STORE' | 'REPORT',
        metadata: n.metadata as Record<string, unknown> | undefined,
      })),
      edges: edges.map(e => ({
        source: e.sourceNodeId,
        target: e.targetNodeId,
        transformation: e.transformationLogic || undefined,
      })),
    };
  }

  /**
   * Get upstream lineage (what feeds into this node)
   */
  async getUpstream(nodeId: string, depth: number = 3): Promise<LineageNode[]> {
    const upstream: LineageNode[] = [];
    const visited = new Set<string>();

    async function traverse(id: string, currentDepth: number) {
      if (currentDepth === 0 || visited.has(id)) return;
      visited.add(id);

      const edges = await prisma.dataLineageEdge.findMany({
        where: { targetNodeId: id },
        include: { sourceNode: true },
      });

      for (const edge of edges) {
        upstream.push({
          id: edge.sourceNode.id,
          name: edge.sourceNode.name,
          type: edge.sourceNode.type as 'SOURCE' | 'PROCESS' | 'STORE' | 'REPORT',
        });
        await traverse(edge.sourceNodeId, currentDepth - 1);
      }
    }

    await traverse(nodeId, depth);
    return upstream;
  }

  /**
   * Get downstream lineage (what this node feeds into)
   */
  async getDownstream(nodeId: string, depth: number = 3): Promise<LineageNode[]> {
    const downstream: LineageNode[] = [];
    const visited = new Set<string>();

    async function traverse(id: string, currentDepth: number) {
      if (currentDepth === 0 || visited.has(id)) return;
      visited.add(id);

      const edges = await prisma.dataLineageEdge.findMany({
        where: { sourceNodeId: id },
        include: { targetNode: true },
      });

      for (const edge of edges) {
        downstream.push({
          id: edge.targetNode.id,
          name: edge.targetNode.name,
          type: edge.targetNode.type as 'SOURCE' | 'PROCESS' | 'STORE' | 'REPORT',
        });
        await traverse(edge.targetNodeId, currentDepth - 1);
      }
    }

    await traverse(nodeId, depth);
    return downstream;
  }

  /**
   * Impact analysis: What would be affected if this table/field changes?
   */
  async analyzeImpact(tableOrFieldId: string): Promise<{
    affectedApis: string[];
    affectedComponents: string[];
    affectedExports: string[];
  }> {
    const downstream = await this.getDownstream(tableOrFieldId, 10);

    return {
      affectedApis: downstream
        .filter(n => n.type === 'PROCESS' && n.id.startsWith('api:'))
        .map(n => n.name),
      affectedComponents: downstream
        .filter(n => n.type === 'REPORT' && n.id.startsWith('component:'))
        .map(n => n.name),
      affectedExports: downstream
        .filter(n => n.type === 'REPORT' && n.id.startsWith('export:'))
        .map(n => n.name),
    };
  }
}

// Export singleton instance
export const lineageTracker = LineageTracker.getInstance();
