/**
 * Load Test - 1000 Concurrent Users
 * 
 * Medium load test with 1000 concurrent users.
 * Tests database connection pooling and caching layers.
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const apiLatency = new Trend('api_latency');
const cacheHits = new Counter('cache_hits');
const rateLimited = new Counter('rate_limited');

// Test configuration
export const options = {
  stages: [
    { duration: '5m', target: 1000 },   // Gradual ramp up (5 min)
    { duration: '10m', target: 1000 },  // Stay at 1000 users for 10 minutes
    { duration: '5m', target: 0 },      // Gradual ramp down (5 min)
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.1'],
    errors: ['rate<0.1'],
  },
  // Cloud execution settings
  cloud: {
    distribution: {
      'amazon:us:ashburn': { loadZone: 'amazon:us:ashburn', percent: 50 },
      'amazon:us:portland': { loadZone: 'amazon:us:portland', percent: 50 },
    },
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

export default function () {
  group('Feed Browsing (70% of users)', () => {
    // Get posts feed with different pagination
    const limit = Math.random() > 0.5 ? 20 : 50;
    const feedRes = http.get(`${BASE_URL}/api/posts?limit=${limit}&sort=new`);
    
    const feedCheck = check(feedRes, {
      'feed returns 200': (r) => r.status === 200,
      'feed response time < 500ms': (r) => r.timings.duration < 500,
    });
    
    errorRate.add(!feedCheck);
    apiLatency.add(feedRes.timings.duration);
    
    // Track cache hits via response headers
    if (feedRes.headers['X-Cache'] === 'HIT') {
      cacheHits.add(1);
    }
    
    sleep(Math.random() * 2 + 1);
  });
  
  group('Category Browsing (20% of users)', () => {
    const categoriesRes = http.get(`${BASE_URL}/api/categories`);
    
    check(categoriesRes, {
      'categories returns 200': (r) => r.status === 200,
    });
    
    apiLatency.add(categoriesRes.timings.duration);
    
    // Browse specific category
    const categoryRes = http.get(`${BASE_URL}/api/posts?categoryId=cat_1&limit=20`);
    
    check(categoryRes, {
      'category posts returns 200': (r) => r.status === 200,
    });
    
    apiLatency.add(categoryRes.timings.duration);
    sleep(Math.random() * 3 + 2);
  });
  
  group('Search (5% of users)', () => {
    const searchTerms = ['autism', 'therapy', 'school', 'support', 'ABA'];
    const term = searchTerms[Math.floor(Math.random() * searchTerms.length)];
    
    const searchRes = http.get(`${BASE_URL}/api/search?q=${term}&limit=20`);
    
    const searchCheck = check(searchRes, {
      'search returns valid response': (r) => 
        r.status === 200 || r.status === 429,
    });
    
    if (searchRes.status === 429) {
      rateLimited.add(1);
    }
    
    errorRate.add(!searchCheck);
    apiLatency.add(searchRes.timings.duration);
    sleep(Math.random() * 3 + 2);
  });
  
  group('Health Check (5% of users)', () => {
    const healthRes = http.get(`${BASE_URL}/api/health`);
    
    check(healthRes, {
      'health returns 200': (r) => r.status === 200,
      'health response is fast': (r) => r.timings.duration < 100,
    });
    
    apiLatency.add(healthRes.timings.duration);
  });
  
  sleep(Math.random() * 3 + 2); // 2-5 seconds between iterations
}

export function handleSummary(data) {
  const success = data.metrics.http_req_failed.values.rate < 0.001 &&
                  data.metrics.http_req_duration.values['p(95)'] < 500;
  
  return {
    stdout: `
╔════════════════════════════════════════════════════════════╗
║             LOAD TEST RESULTS - 1000 USERS                 ║
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
  
  Status:       ${success ? '✅ PASSED - System handles 1000 users' : '❌ FAILED'}
  
  Thresholds:
    p(95)<500:  ${data.metrics.http_req_duration.values['p(95)'] < 500 ? '✅' : '❌'}
    p(99)<1000: ${data.metrics.http_req_duration.values['p(99)'] < 1000 ? '✅' : '❌'}
╚════════════════════════════════════════════════════════════╝
`,
    'tests/performance/results/load-1000.json': JSON.stringify(data, null, 2),
  };
}
