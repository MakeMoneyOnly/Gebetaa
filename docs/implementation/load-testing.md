# Load Testing Documentation

Last updated: 2026-03-20

## Overview

This document describes how to run load tests for the Gebeta Restaurant OS platform. Load tests validate that critical API endpoints meet their SLO targets under peak load conditions.

## SLO Targets

The following endpoints are tested with their respective performance thresholds:

| Endpoint                       | Method | P95 Latency | Error Rate |
| ------------------------------ | ------ | ----------- | ---------- |
| `/api/merchant/command-center` | GET    | ≤ 500ms     | < 1%       |
| `/api/orders`                  | GET    | ≤ 400ms     | < 1%       |
| `/api/orders/:id/status`       | PATCH  | ≤ 300ms     | < 0.5%     |

## Prerequisites

### Install k6

#### macOS (Homebrew)

```bash
brew install k6
```

#### Linux (APT)

```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

#### Windows (Chocolatey)

```bash
choco install k6
```

#### Binary Download

Download from: https://github.com/grafana/k6/releases

## Running Load Tests

### Local Development

#### Quick Smoke Test (1 user, 10 seconds)

```bash
k6 run k6/peak-flow-scenarios.js \
  --vus 1 \
  --duration 10s \
  --env K6_BASE_URL=http://localhost:3000 \
  --env K6_USE_BYPASS_AUTH=true
```

#### Peak Flow Test (20 users, 2 minutes)

```bash
k6 run k6/peak-flow-scenarios.js \
  --vus 20 \
  --duration 2m \
  --env K6_BASE_URL=http://localhost:3000 \
  --env K6_USE_BYPASS_AUTH=true
```

### Staging Environment

```bash
k6 run k6/peak-flow-scenarios.js \
  --vus 20 \
  --duration 2m \
  --env K6_BASE_URL=https://staging.gebeta.app \
  --env K6_USE_BYPASS_AUTH=true
```

### Production Environment

⚠️ **Warning**: Only run load tests against production with explicit approval.

```bash
k6 run k6/peak-flow-scenarios.js \
  --vus 10 \
  --duration 1m \
  --env K6_BASE_URL=https://gebeta.app \
  --env K6_AUTH_TOKEN=<your-service-token>
```

## Environment Variables

| Variable             | Description                      | Default                 |
| -------------------- | -------------------------------- | ----------------------- |
| `K6_BASE_URL`        | Base URL for the API             | `http://localhost:3000` |
| `K6_AUTH_TOKEN`      | Bearer token for authentication  | (none)                  |
| `K6_USE_BYPASS_AUTH` | Use `x-e2e-bypass-auth` header   | `false`                 |
| `K6_ORDER_ID`        | Order ID for status update tests | `test-order-id`         |

## CI Integration

Load tests are integrated into the CI pipeline and run on the following schedule:

- **Staging**: Daily at 6:00 AM UTC (9:00 AM EAT)
- **Production**: Manual trigger only

### GitHub Actions Workflow

The load test workflow is defined in [`.github/workflows/load-tests.yml`](../../.github/workflows/load-tests.yml).

To manually trigger a load test:

1. Go to the [GitHub Actions workflow](https://github.com/gebeta/gebeta/actions/workflows/load-tests.yml)
2. Click "Run workflow"
3. Select the environment (staging/production)
4. Click "Run workflow"

## Test Scenarios

### Command Center Test

- **Endpoint**: `GET /api/merchant/command-center?range=today`
- **Virtual Users**: 20
- **Duration**: 2 minutes
- **SLO**: P95 ≤ 500ms, error rate < 1%

### Orders List Test

- **Endpoint**: `GET /api/orders`
- **Virtual Users**: 25
- **Duration**: 2 minutes
- **SLO**: P95 ≤ 400ms, error rate < 1%

### Order Status Update Test

- **Endpoint**: `PATCH /api/orders/:id/status`
- **Virtual Users**: 15
- **Duration**: 2 minutes
- **SLO**: P95 ≤ 300ms, error rate < 0.5%

## Interpreting Results

### Successful Test Output

```
✓ command_center status is 200
✓ command_center response time < 500ms
✓ orders status is 200
✓ orders response time < 400ms
✓ order_status status is 2xx or 404
✓ order_status response time < 300ms
```

### Threshold Failures

If a threshold is breached, the test will fail with an error like:

```
✗ FAILED thresholds: http_req_duration{p:95}<=500ms
```

### Response Time Metrics

Key metrics to watch:

- `p(50)` - Median response time
- `p(90)` - 90th percentile response time
- `p(95)` - 95th percentile response time (SLO target)
- `p(99)` - 99th percentile response time

## Troubleshooting

### Server Not Responding

Ensure the development server is running:

```bash
pnpm dev
```

### Authentication Errors

If you're getting 401 errors:

- For local development: Use `K6_USE_BYPASS_AUTH=true`
- For staging/production: Provide a valid `K6_AUTH_TOKEN`

### High Error Rates

If you see high error rates (>1%):

1. Check server logs for errors
2. Verify database connectivity
3. Check for rate limiting
4. Review recent deployments

## Adding New Test Scenarios

To add a new test scenario:

1. Edit `k6/peak-flow-scenarios.js`
2. Add a new export function:

    ```javascript
    export function testNewEndpoint() {
        const url = `${BASE_URL}/api/your-endpoint`;
        const res = http.get(url, { headers: getHeaders() });

        // Add your checks
        check(res, {
            'status is 200': r => r.status === 200,
        });
    }
    ```

3. Add the scenario to `options.scenarios`
4. Add thresholds to `options.thresholds`

## Resources

- [k6 Documentation](https://k6.io/docs/)
- [k6 GitHub Actions Integration](https://github.com/grafana/k6-action)
- [Performance SLOs](../08-reports/performance/performance-slos.md)
