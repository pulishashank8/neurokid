import { NextResponse } from 'next/server';
import { getAllCircuitBreakerStats, getCircuitBreakerStats } from '@/lib/circuit-breaker';
import { AIJobQueue } from '@/lib/queue/ai-job-queue';
import { createLogger } from '@/lib/logger';

const logger = createLogger({ context: 'CircuitHealth' });

/**
 * GET /api/health/circuits - Circuit breaker health monitoring
 * 
 * Returns the current state of all circuit breakers including:
 * - State (open, closed, half-open)
 * - Failure/success counts
 * - Response time percentiles
 * - AI Job Queue internal circuit breaker state
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const circuitName = searchParams.get('name');

    // Get circuit breaker stats from opossum
    let circuitStats;
    if (circuitName) {
      const stats = getCircuitBreakerStats(circuitName);
      circuitStats = stats ? { [circuitName]: stats } : {};
    } else {
      circuitStats = getAllCircuitBreakerStats();
    }

    // Get AI Job Queue internal circuit state
    const aiQueueCircuitState = await AIJobQueue.getCircuitState?.() || null;

    // Calculate overall health
    const circuits = Object.entries(circuitStats);
    const openCircuits = circuits.filter(([, stats]) => stats.state === 'open');
    const halfOpenCircuits = circuits.filter(([, stats]) => stats.state === 'half-open');
    const hasInternalIssues = aiQueueCircuitState && 
      (aiQueueCircuitState.groqOpen || aiQueueCircuitState.geminiOpen);

    const isHealthy = openCircuits.length === 0 && !hasInternalIssues;

    const response = {
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      summary: {
        total: circuits.length,
        open: openCircuits.length,
        halfOpen: halfOpenCircuits.length,
        closed: circuits.length - openCircuits.length - halfOpenCircuits.length,
        hasInternalCircuitIssues: hasInternalIssues,
      },
      circuits: circuitStats,
      aiQueueCircuit: aiQueueCircuitState,
    };

    // Return 503 if any circuits are open (service degraded)
    const statusCode = isHealthy ? 200 : 503;

    return NextResponse.json(response, { status: statusCode });
  } catch (error) {
    logger.error({ error }, 'Failed to get circuit breaker health');
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: 'Failed to retrieve circuit breaker status',
      },
      { status: 500 }
    );
  }
}
