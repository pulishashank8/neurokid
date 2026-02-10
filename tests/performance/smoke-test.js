/**
 * Smoke Test
 * 
 * Minimal load test to verify the system is working.
 * Run this before any larger performance tests.
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  vus: 1,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.1'],
    errors: ['rate<0.1'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

export default function () {
  // Test health endpoint
  const healthRes = http.get(`${BASE_URL}/api/health`);
  
  const healthCheck = check(healthRes, {
    'health status is 200': (r) => r.status === 200,
    'health response is valid': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.status === 'healthy' || body.status === 'ok';
      } catch {
        return false;
      }
    },
  });
  
  errorRate.add(!healthCheck);
  
  // Test main page
  const mainRes = http.get(BASE_URL);
  
  const mainCheck = check(mainRes, {
    'main page status is 200': (r) => r.status === 200,
    'main page contains content': (r) => r.body && r.body.length > 0,
  });
  
  errorRate.add(!mainCheck);
  
  // Test API endpoints
  const endpoints = [
    '/api/posts',
    '/api/categories',
  ];
  
  for (const endpoint of endpoints) {
    const res = http.get(`${BASE_URL}${endpoint}`);
    
    const endpointCheck = check(res, {
      [`${endpoint} returns valid response`]: (r) => r.status === 200 || r.status === 429,
    });
    
    errorRate.add(!endpointCheck);
  }
  
  sleep(1);
}

export function handleSummary(data) {
  return {
    stdout: `
╔════════════════════════════════════════════════════════════╗
║                    SMOKE TEST RESULTS                      ║
╠════════════════════════════════════════════════════════════╣
  Duration:     ${data.state.testRunDuration}s
  VUs:          ${data.metrics.vus.values.max}
  Requests:     ${data.metrics.http_reqs.values.count}
  Req/Sec:      ${(data.metrics.http_reqs.values.rate).toFixed(2)}
  
  Latency:
    Avg:        ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms
    Min:        ${data.metrics.http_req_duration.values.min.toFixed(2)}ms
    Max:        ${data.metrics.http_req_duration.values.max.toFixed(2)}ms
    p(95):      ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms
    p(99):      ${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms
  
  Errors:
    Rate:       ${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%
    Count:      ${data.metrics.http_req_failed.values.passes}
  
  Status:       ${data.metrics.http_req_failed.values.rate < 0.001 ? '✅ PASSED' : '❌ FAILED'}
╚════════════════════════════════════════════════════════════╝
`,
  };
}
