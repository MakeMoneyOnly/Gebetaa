# Prometheus Metrics Implementation Plan

## Overview

Add Prometheus-compatible metrics endpoint for Grafana dashboard integration.

## Current State

- **Existing**: `/api/metrics` returns JSON for dashboard consumption
- **Missing**: Prometheus text format output for Grafana scraping
- **Grafana expects**: `http_request_duration_seconds_bucket`, `http_requests_total`, `gebeta_*` metrics

## Architecture Decision: Stateless Prometheus on Vercel

**Challenge**: Vercel functions are stateless - in-memory counters reset on each cold start.

**Solution**: Use Upstash Redis as Prometheus registry backend (already configured for rate limiting).

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Middleware    │────▶│  Upstash Redis   │────▶│  /api/metrics/  │
│  (timing hook)  │     │  (metrics store) │     │   prometheus    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

## Files to Create/Modify

### 1. Install prom-client

```bash
pnpm add prom-client
```

### 2. Create `src/lib/monitoring/prometheus.ts`

```typescript
// Prometheus metrics registry with Upstash Redis backing
// - http_request_duration_seconds (histogram)
// - http_requests_total (counter)
// - gebeta_orders_total (counter)
// - gebeta_payments_total (counter)
// - gebeta_active_sessions (gauge)
```

### 3. Create `src/app/api/metrics/prometheus/route.ts`

- GET endpoint returns Prometheus text format
- No auth required (public metrics for Prometheus scraper)
- Optional: Bearer token for production

### 4. Modify `src/lib/api/tracing.ts`

Add `recordPrometheusMetric()` call after duration calculation.

## Implementation Steps

### Step 1: Install Dependencies
```bash
pnpm add prom-client
```

### Step 2: Create Prometheus Registry

Create `src/lib/monitoring/prometheus.ts`:

```typescript
import client from 'prom-client';

// Clear default registry on hot reload
if (process.env.NODE_ENV !== 'production') {
  client.register.clear();
}

// HTTP request duration histogram
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'path', 'status'],
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});

// HTTP requests counter
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'path', 'status'],
});

// Business metrics
const ordersTotal = new client.Counter({
  name: 'gebeta_orders_total',
  help: 'Total orders processed',
  labelNames: ['restaurant_id', 'status'],
});

const paymentsTotal = new client.Counter({
  name: 'gebeta_payments_total',
  help: 'Total payments processed',
  labelNames: ['provider', 'status'],
});

const activeSessions = new client.Gauge({
  name: 'gebeta_active_sessions',
  help: 'Currently active table sessions',
});

const activeRestaurants = new client.Gauge({
  name: 'gebeta_active_restaurants',
  help: 'Active restaurants in time window',
});

export const metrics = {
  httpRequestDuration,
  httpRequestsTotal,
  ordersTotal,
  paymentsTotal,
  activeSessions,
  activeRestaurants,
};

export function getPrometheusMetrics(): Promise<string> {
  return client.register.metrics();
}
```

### Step 3: Create Prometheus Endpoint

Create `src/app/api/metrics/prometheus/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { getPrometheusMetrics } from '@/lib/monitoring/prometheus';

export async function GET() {
  const metrics = await getPrometheusMetrics();
  return new NextResponse(metrics, {
    headers: { 'Content-Type': 'text/plain; version=0.0.4' },
  });
}
```

### Step 4: Hook into Middleware Timing

In `src/lib/api/tracing.ts`, add after duration calculation:

```typescript
import { metrics } from '@/lib/monitoring/prometheus';

// In addHeaders or response handling:
const durationSeconds = duration / 1000;
metrics.httpRequestDuration
  .labels(method, pathPattern, String(statusCode))
  .observe(durationSeconds);
metrics.httpRequestsTotal
  .labels(method, pathPattern, String(statusCode))
  .inc();
```

### Step 5: Track Business Metrics

Modify `src/lib/monitoring/metrics.ts` to also record to Prometheus:

```typescript
import { metrics } from './prometheus';

// In trackOrderMetric:
metrics.ordersTotal.labels(restaurantId, status).inc();

// In trackPaymentMetric:
metrics.paymentsTotal.labels(provider, status).inc();
```

## Prometheus Scrape Configuration

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'gebeta-api'
    static_configs:
      - targets: ['gebeta-api.vercel.app']
    metrics_path: '/api/metrics/prometheus'
    scrape_interval: 15s
```

## Alternative: Pull from Audit Logs

For stateless Vercel deployment, consider pulling metrics from audit_logs:

```typescript
// In /api/metrics/prometheus/route.ts
// Query last 5 minutes of audit_logs
// Aggregate into Prometheus format
// This avoids in-memory counter issues
```

## Testing

1. Run `curl http://localhost:3000/api/metrics/prometheus`
2. Verify output format matches Prometheus spec
3. Configure local Prometheus to scrape
4. Check Grafana dashboard loads data

## Vercel Considerations

- In-memory metrics reset on cold start
- Consider Upstash Redis for persistence
- Or use pull-based approach from audit_logs
- Grafana Cloud can scrape Vercel deployments

## Estimated Effort

- **Files**: 3 new, 2 modified
- **Lines**: ~150
- **Time**: 2-3 hours