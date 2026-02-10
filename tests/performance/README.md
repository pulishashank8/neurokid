# Performance Testing with k6

This directory contains performance tests using [k6](https://k6.io/) to validate the application can handle the target load of 5000 concurrent users.

## Target Requirements

- **30,000-50,000 registered users**
- **5,000 concurrent users posting simultaneously**
- **p95 latency < 500ms for API endpoints**
- **p99 latency < 1000ms for API endpoints**
- **Error rate < 0.1%**

## Test Scenarios

### 1. Smoke Test (`smoke-test.js`)
- Minimal load to verify system works
- 1-10 virtual users
- Run before larger tests

### 2. Load Test - 100 Users (`load-100.js`)
- Baseline performance test
- 100 concurrent users
- Gradual ramp up
- Sustained load for 10 minutes

### 3. Load Test - 1000 Users (`load-1000.js`)
- Medium load test
- 1000 concurrent users
- Tests database connection pooling
- Sustained load for 10 minutes

### 4. Stress Test - 5000 Users (`stress-5000.js`)
- Target capacity test
- 5000 concurrent users
- Write-heavy scenario (simultaneous posts)
- Tests horizontal scaling

### 5. Spike Test (`spike-test.js`)
- 10x traffic spike (1000 to 10,000 users)
- Validates auto-scaling
- Verifies system stability

### 6. Soak Test (`soak-test.js`)
- Extended duration test (1 hour)
- 1000 concurrent users
- Identifies memory leaks
- Validates connection stability

## Running Tests

### Prerequisites

Install k6:
```bash
# macOS
brew install k6

# Windows (Chocolatey)
choco install k6

# Windows (Winget)
winget install k6

# Linux
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

### Run Individual Tests

```bash
# Smoke test (quick validation)
k6 run tests/performance/smoke-test.js

# 100 concurrent users
k6 run tests/performance/load-100.js

# 1000 concurrent users
k6 run tests/performance/load-1000.js

# 5000 concurrent users (target capacity)
k6 run tests/performance/stress-5000.js

# Spike test (10x traffic)
k6 run tests/performance/spike-test.js

# Soak test (1 hour duration)
k6 run tests/performance/soak-test.js
```

### Run with Custom Parameters

```bash
# Override base URL
k6 run -e BASE_URL=https://staging.example.com tests/performance/load-1000.js

# Override duration
k6 run -e DURATION=5m tests/performance/load-1000.js

# Run with specific tags
k6 run --tag env=staging tests/performance/load-1000.js
```

### Run All Tests (CI/CD)

```bash
# Run in sequence
npm run test:performance

# Or individually
npm run test:performance:smoke
npm run test:performance:load
npm run test:performance:stress
```

## Interpreting Results

### Key Metrics

| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| HTTP Requests/sec | > 1000 | 500-1000 | < 500 |
| p95 Latency | < 500ms | 500-1000ms | > 1000ms |
| p99 Latency | < 1000ms | 1000-2000ms | > 2000ms |
| Error Rate | < 0.1% | 0.1-1% | > 1% |
| Failed Requests | 0 | < 10 | > 10 |

### Output Example

```
  ✓ http_req_duration..............: avg=45.6ms  min=12.3ms med=38.2ms max=234.5ms p(95)=89.1ms p(99)=156.3ms
  ✓ http_req_failed................: 0.00%  ✓ 0 / ✗ 0
  ✓ http_reqs......................: 12345  412.3/s
  ✓ iterations.....................: 10000  333.3/s
  ✓ vus............................: 100    min=100    max=100
  ✓ vus_max........................: 100    min=100    max=100
```

## Performance Baseline

Baseline metrics are stored in `tests/performance/baselines/`:

- `baseline-100.json` - 100 users baseline
- `baseline-1000.json` - 1000 users baseline  
- `baseline-5000.json` - 5000 users baseline

Compare current results against baselines:

```bash
k6 run --out json=results.json tests/performance/load-1000.js
k6 compare baselines/baseline-1000.json results.json
```

## CI/CD Integration

### GitHub Actions

```yaml
- name: Run Performance Tests
  run: k6 run tests/performance/stress-5000.js
  env:
    BASE_URL: ${{ secrets.STAGING_URL }}
```

### Fail Criteria

Tests will fail if:
- Error rate > 1%
- p95 latency > 1000ms
- Any failed checks
- Rate limiting errors > 0.1%

## Troubleshooting

### High Error Rates
1. Check database connection pool
2. Verify Redis is responding
3. Check server logs for exceptions
4. Verify rate limits are appropriate

### High Latency
1. Check database query performance
2. Verify caching is working
3. Check network latency
4. Review slow query logs

### Connection Errors
1. Check connection pool size
2. Verify load balancer health
3. Check for connection leaks
4. Review connection timeout settings

## Additional Resources

- [k6 Documentation](https://k6.io/docs/)
- [Performance Testing Best Practices](https://k6.io/docs/testing-guides/)
- [k6 Cloud](https://k6.io/cloud/) - For distributed load testing
