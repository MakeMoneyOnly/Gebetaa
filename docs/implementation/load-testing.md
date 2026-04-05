# Load Testing Documentation

Last updated: 2026-04-04

## Overview

This document describes how to run load tests for the Gebeta Restaurant OS platform. Load tests validate that critical API endpoints meet their SLO targets under peak load conditions.

The test suite covers:
- **Core API endpoints** - Command center, orders, order status updates
- **Peak hour simulations** - Lunch and dinner rush scenarios
- **KDS high-volume** - Kitchen display system under load
- **Payment gateway stress** - Payment processing capacity
- **Concurrent sessions** - Table session management

## SLO Targets

The following endpoints are tested with their respective performance thresholds:

### Core API Endpoints

| Endpoint                       | Method | P95 Latency | Error Rate |
| ------------------------------ | ------ | ----------- | ---------- |
| `/api/merchant/command-center` | GET    | ≤ 500ms     | < 1%       |
| `/api/orders`                  | GET    | ≤ 400ms     | < 1%       |
| `/api/orders/:id/status`       | PATCH  | ≤ 300ms     | < 0.5%     |

### Peak Hour Ordering

| Endpoint          | Method | P95 Latency | Error Rate |
| ----------------- | ------ | ----------- | ---------- |
| `/api/orders`     | POST   | ≤ 500ms     | < 1%       |

### KDS Performance

| Endpoint                | Method | P95 Latency | Error Rate |
| ----------------------- | ------ | ----------- | ---------- |
| `/api/kds/queue`        | GET    | ≤ 300ms     | < 1%       |
| `/api/kds/items/:id/status` | PATCH | ≤ 200ms   | < 1%       |

### Payment Gateway

| Endpoint          | Method | P95 Latency | Error Rate | Success Rate |
| ----------------- | ------ | ----------- | ---------- | ------------ |
| `/api/payments`   | POST   | ≤ 2000ms    | < 2%       | > 95%        |
| `/api/payments/webhook` | POST | ≤ 500ms   | < 1%       | N/A          |

### Table Sessions

| Endpoint                    | Method | P95 Latency | Error Rate |
| --------------------------- | ------ | ----------- | ---------- |
| `/api/sessions`             | POST   | ≤ 400ms     | < 1%       |
| `/api/sessions/:id/heartbeat` | POST | ≤ 200ms    | < 1%       |

### Realtime Propagation

| Metric                      | Target |
| --------------------------- | ------ |
| Order state propagation     | P95 ≤ 2000ms |
| Table/session state propagation | P95 ≤ 2000ms |

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
| `K6_RESTAURANT_ID`   | Restaurant ID for multi-tenant tests | `test-restaurant-id` |
| `K6_TABLE_ID`        | Table ID for session tests       | `test-table-id`         |

## Running Specific Test Scenarios

### Run Only Core API Tests

```bash
k6 run k6/peak-flow-scenarios.js \
  --env K6_BASE_URL=http://localhost:3000 \
  --env K6_USE_BYPASS_AUTH=true \
  --include-scenarios command_center,orders_list,order_status_update
```

### Run Peak Hour Simulation

```bash
k6 run k6/peak-flow-scenarios.js \
  --env K6_BASE_URL=http://localhost:3000 \
  --env K6_USE_BYPASS_AUTH=true \
  --env K6_RESTAURANT_ID=your-restaurant-id \
  --include-scenarios peak_hour_lunch,peak_hour_dinner
```

### Run KDS Tests

```bash
k6 run k6/peak-flow-scenarios.js \
  --env K6_BASE_URL=http://localhost:3000 \
  --env K6_USE_BYPASS_AUTH=true \
  --env K6_RESTAURANT_ID=your-restaurant-id \
  --include-scenarios kds_high_volume,kds_status_updates
```

### Run Payment Gateway Tests

```bash
k6 run k6/peak-flow-scenarios.js \
  --env K6_BASE_URL=http://localhost:3000 \
  --env K6_USE_BYPASS_AUTH=true \
  --include-scenarios payment_stress,payment_webhook
```

### Run Table Session Tests

```bash
k6 run k6/peak-flow-scenarios.js \
  --env K6_BASE_URL=http://localhost:3000 \
  --env K6_USE_BYPASS_AUTH=true \
  --env K6_RESTAURANT_ID=your-restaurant-id \
  --include-scenarios concurrent_sessions,session_heartbeat
```

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

### Core API Tests

#### Command Center Test

- **Endpoint**: `GET /api/merchant/command-center?range=today`
- **Virtual Users**: 20
- **Duration**: 2 minutes
- **SLO**: P95 ≤ 500ms, error rate < 1%

#### Orders List Test

- **Endpoint**: `GET /api/orders`
- **Virtual Users**: 25
- **Duration**: 2 minutes
- **SLO**: P95 ≤ 400ms, error rate < 1%

#### Order Status Update Test

- **Endpoint**: `PATCH /api/orders/:id/status`
- **Virtual Users**: 15
- **Duration**: 2 minutes
- **SLO**: P95 ≤ 300ms, error rate < 0.5%

### Peak Hour Simulations

#### Lunch Rush Test

- **Endpoint**: `POST /api/orders`
- **Virtual Users**: 30 → 50 → 30 (ramping)
- **Duration**: 7.5 minutes total
- **SLO**: P95 ≤ 500ms, error rate < 1%
- **Description**: Simulates typical lunch rush (12:00-14:00) with rapid order volume increase

#### Dinner Rush Test

- **Endpoint**: `POST /api/orders`
- **Virtual Users**: 40 → 60 → 20 (ramping)
- **Duration**: 8.5 minutes total
- **SLO**: P95 ≤ 500ms, error rate < 1%
- **Description**: Simulates dinner rush (18:00-21:00) with higher peak than lunch

### KDS High-Volume Tests

#### KDS Queue Test

- **Endpoint**: `GET /api/kds/queue`
- **Virtual Users**: 20 → 40 (ramping)
- **Duration**: 4 minutes
- **SLO**: P95 ≤ 300ms, error rate < 1%
- **Description**: Tests KDS queue retrieval under high load

#### KDS Status Updates Test

- **Endpoint**: `PATCH /api/kds/items/:id/status`
- **Rate**: 50 updates/second
- **Duration**: 2 minutes
- **SLO**: P95 ≤ 200ms, error rate < 1%
- **Description**: Simulates kitchen staff marking items as completed

### Payment Gateway Stress Tests

#### Payment Processing Test

- **Endpoint**: `POST /api/payments`
- **Virtual Users**: 15 → 50 → 15 (ramping)
- **Duration**: 3 minutes
- **SLO**: P95 ≤ 2000ms, success rate > 95%
- **Description**: Tests payment processing capacity with Telebirr and Chapa providers

#### Payment Webhook Test

- **Endpoint**: `POST /api/payments/webhook`
- **Rate**: 20 webhooks/second
- **Duration**: 1 minute
- **SLO**: P95 ≤ 500ms, error rate < 1%
- **Description**: Tests webhook processing throughput

### Concurrent Table Session Tests

#### Table Session Test

- **Endpoint**: `POST /api/sessions`
- **Virtual Users**: 30 → 50 (ramping)
- **Duration**: 4 minutes
- **SLO**: P95 ≤ 400ms, error rate < 1%
- **Description**: Tests table session creation and management

#### Session Heartbeat Test

- **Endpoint**: `POST /api/sessions/:id/heartbeat`
- **Rate**: 100 heartbeats/second
- **Duration**: 2 minutes
- **SLO**: P95 ≤ 200ms, error rate < 1%
- **Description**: Tests session keep-alive under high concurrency

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
