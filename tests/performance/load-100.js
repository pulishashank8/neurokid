/**
 * Load Test - 100 Concurrent Users
 * 
 * Baseline performance test with 100 concurrent users.
 * Sustained load for 10 minutes to establish baseline metrics.
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const apiLatency = new Trend('api_latency');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 100 },    // Ramp up to 100 users
    { duration: '10m', target: 100 },   // Stay at 100 users for 10 minutes
    { duration: '2m', target: 0 },      // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.1'],
    errors: ['rate<0.1'],
    api_latency: ['p(95)<500'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

// Simulated user actions
export default function () {
  group('Browse Feed', () => {
    // Get posts feed
    const feedRes = http.get(`${BASE_URL}/api/posts?limit=20`);
    
    const feedCheck = check(feedRes, {
      'feed returns 200': (r) => r.status === 200,
      'feed has data': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.data && Array.isArray(body.data);
        } catch {
          return false;
        }
      },
    });
    
    errorRate.add(!feedCheck);
    apiLatency.add(feedRes.timings.duration);
    
    sleep(Math.random() * 3 + 2); // 2-5 seconds between actions
  });
  
  group('View Categories', () => {
    const categoriesRes = http.get(`${BASE_URL}/api/categories`);
    
    const catCheck = check(categoriesRes, {
      'categories returns 200': (r) => r.status === 200,
    });
    
    errorRate.add(!catCheck);
    apiLatency.add(categoriesRes.timings.duration);
    
    sleep(Math.random() * 2 + 1); // 1-3 seconds
  });
  
  group('View Post Detail', () => {
    // Get a specific post (using a dummy ID)
    const postRes = http.get(`${BASE_URL}/api/posts/post_123`);
    
    const postCheck = check(postRes, {
      'post detail returns valid response': (r) => 
        r.status === 200 || r.status === 404, // 404 is OK if post doesn't exist
    });
    
    errorRate.add(!postCheck);
    apiLatency.add(postRes.timings.duration);
    
    sleep(Math.random() * 5 + 5); // 5-10 seconds reading
  });
  
  group('Search', () => {
    const searchRes = http.get(`${BASE_URL}/api/search?q=autism&limit=10`);
    
    const searchCheck = check(searchRes, {
      'search returns valid response': (r) => 
        r.status === 200 || r.status === 429, // Rate limiting is OK
    });
    
    errorRate.add(!searchCheck);
    apiLatency.add(searchRes.timings.duration);
    
    sleep(Math.random() * 3 + 2); // 2-5 seconds
  });
  
  sleep(Math.random() * 5 + 5); // 5-10 seconds between iterations
}

export function handleSummary(data) {
  const success = data.metrics.http_req_failed.values.rate < 0.001 &&
                  data.metrics.http_req_duration.values['p(95)'] < 500;
  
  return {
    stdout: `
╔════════════════════════════════════════════════════════════╗
║              LOAD TEST RESULTS - 100 USERS                 ║
╠════════════════════════════════════════════════════════════╣
  Duration:     ${data.state.testRunDuration}s
  Max VUs:      ${data.metrics.vus_max.values.max}
  Total Req:    ${data.metrics.http_reqs.values.count}
  Req/Sec:      ${(data.metrics.http_reqs.values.rate).toFixed(2)}
  
  Latency:
    Avg:        ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms
    Min:        ${data.metrics.http_req_duration.values.min.toFixed(2)}ms
    Max:        ${data.metrics.http_req_duration.values.max.toFixed(2)}ms
    p(50):      ${data.metrics.http_req_duration.values.med.toFixed(2)}ms
    p(95):      ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms
    p(99):      ${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms
  
  Errors:
    Rate:       ${(data.metrics.http_req_failed.values.rate * 100).toFixed(3)}%
    Count:      ${data.metrics.http_req_failed.values.passes}
  
  Data:
    Received:   ${(data.metrics.data_received.values.count / 1024 / 1024).toFixed(2)} MB
    Sent:       ${(data.metrics.data_sent.values.count / 1024 / 1024).toFixed(2)} MB
  
  Status:       ${success ? '✅ PASSED' : '❌ FAILED'}
  
  Thresholds:
    p(95)<500:  ${data.metrics.http_req_duration.values['p(95)'] < 500 ? '✅' : '❌'}
    p(99)<1000: ${data.metrics.http_req_duration.values['p(99)'] < 1000 ? '✅' : '❌'}
    Errors<0.1%: ${data.metrics.http_req_failed.values.rate < 0.001 ? '✅' : '❌'}
╚════════════════════════════════════════════════════════════╝
`,
  };
}
