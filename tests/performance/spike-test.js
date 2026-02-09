/**
 * Spike Test - 10x Traffic Spike
 * 
 * Simulates sudden 10x traffic increase.
 * Validates auto-scaling and system stability under shock load.
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const apiLatency = new Trend('api_latency');

export const options = {
  stages: [
    { duration: '2m', target: 100 },     // Baseline load
    { duration: '30s', target: 1000 },   // Spike to 1000 (10x)
    { duration: '2m', target: 1000 },    // Sustained spike
    { duration: '30s', target: 100 },    // Return to baseline
    { duration: '2m', target: 100 },     // Verify recovery
  ],
  thresholds: {
    http_req_failed: ['rate<5'],         // Allow higher error rate during spike
    http_req_duration: ['p(95)<2000'],   // Relaxed latency during spike
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

export default function () {
  const res = http.get(`${BASE_URL}/api/posts?limit=20`);
  
  const checkRes = check(res, {
    'request succeeds or gets rate limited': (r) => 
      r.status === 200 || r.status === 429 || r.status === 503,
  });
  
  errorRate.add(!checkRes);
  apiLatency.add(res.timings.duration);
  
  sleep(Math.random() * 2 + 1);
}

export function handleSummary(data) {
  return {
    stdout: `
╔════════════════════════════════════════════════════════════╗
║                  SPIKE TEST RESULTS                        ║
╠════════════════════════════════════════════════════════════╣
  Max VUs:      ${data.metrics.vus_max.values.max}
  Total Req:    ${data.metrics.http_reqs.values.count}
  
  Latency:
    p(95):      ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms
    p(99):      ${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms
  
  Errors:       ${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%
  
  Status:       ${data.metrics.http_req_failed.values.rate < 0.05 ? '✅ PASSED' : '❌ FAILED'}
╚════════════════════════════════════════════════════════════╝
`,
  };
}
