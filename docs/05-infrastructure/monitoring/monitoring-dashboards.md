# Monitoring Dashboards Documentation

Last updated: 2026-03-16

## Overview

This document describes the monitoring dashboards implemented for the lole Restaurant OS platform. The monitoring system provides comprehensive observability across API performance, application metrics, database performance, and business metrics.

## Architecture

### Monitoring Components

1. **Sentry Integration** - Error tracking and performance monitoring
2. **Custom Metrics** - Business and operational metrics tracking
3. **Alerting System** - Telegram-based alert notifications
4. **API Metrics Endpoints** - Data aggregation for dashboards

### Data Flow

```
API Requests → Audit Logs → Metrics Aggregation → Dashboards
                    ↓
              Sentry Spans → Performance Tracking
                    ↓
              Alert Rules → Telegram Alerts
```

## Dashboard Types

### 1. API Reliability Dashboard

**Purpose**: Track API endpoint performance, error rates, and response times.

**Data Source**: `audit_logs` table with `action = 'api_metric_recorded'`

**Metrics Tracked**:

- Request count per endpoint
- Error count and error rate (%)
- P50, P95, P99 latency
- SLO status (healthy/breach/no_data)

**SLO Targets**:
| Endpoint | Method | P95 Latency | Error Rate |
|----------|--------|-------------|------------|
| `/api/merchant/command-center` | GET | 500ms | <1% |
| `/api/orders` | GET | 400ms | <1% |
| `/api/orders/:id/status` | PATCH | 300ms | <0.5% |

**Access**:

- UI: `src/app/(dashboard)/merchant/analytics/page.tsx`
- API: `GET /api/analytics/api-metrics?range=today|week|month`

### 2. Application Performance Dashboard

**Purpose**: Track Core Web Vitals, page loads, and client-side errors.

**Data Source**: Sentry telemetry

**Metrics Tracked**:

- Page load times (LCP, FCP)
- Client-side JavaScript errors
- Session replay data
- User browser distribution

**Access**: Sentry Dashboard (sentry.io)

### 3. Database Performance Dashboard

**Purpose**: Track query performance and connection pool usage.

**Metrics Tracked**:

- Query latency (P50, P95, P99)
- Connection pool utilization
- Slow queries
- Deadlocks and conflicts

**Alert Thresholds**:

- Warning: Connection pool > 60%
- Critical: Connection pool > 80%
- Warning: Query latency P95 > 300ms
- Critical: Query latency P95 > 500ms

### 4. Business Metrics Dashboard

**Purpose**: Track orders, payments, sessions, and active restaurants.

**Data Source**: `audit_logs` table with custom metric actions

**Metrics Tracked**:

- Orders: total, completed, cancelled
- Payments: total, completed, failed, total amount
- Sessions: total, active, closed
- Active restaurants (unique)

**Access**:

- API: `GET /api/metrics?range=hour|day|week|month`

## API Endpoints

### GET /api/metrics

System-level aggregated metrics for dashboard consumption.

**Authentication**:

- `x-metrics-api-key` header (recommended for internal services)
- `x-hmac-signature` + `x-timestamp` headers (for authenticated requests)

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| range | string | Time range: hour, day, week, month |

**Response**:

```json
{
    "data": {
        "period": {
            "range": "day",
            "since": "2026-03-16T00:00:00.000Z",
            "until": "2026-03-16T12:00:00.000Z"
        },
        "generated_at": "2026-03-16T12:00:00.000Z",
        "api": {
            "requests": 1500,
            "errors": 15,
            "avgLatency": 250,
            "p95Latency": 480,
            "p99Latency": 890,
            "errorRate": 1.0
        },
        "orders": {
            "total": 450,
            "completed": 420,
            "cancelled": 30
        },
        "payments": {
            "total": 380,
            "completed": 365,
            "failed": 15,
            "totalAmount": 125000
        },
        "sessions": {
            "total": 120,
            "active": 45,
            "closed": 75
        },
        "business": {
            "active_restaurants": 25
        }
    }
}
```

### GET /api/analytics/api-metrics

Restaurant-scoped API metrics with SLO tracking.

**Authentication**: Requires authenticated user with restaurant context

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| range | string | Time range: today, week, month |

**Response**: Per-endpoint metrics with SLO status

## Alert Configuration

### Alert Rules

Alert rules are defined in `src/lib/monitoring/alerting-rules.ts`:

**API Alerts**:

- P95 latency above 1s (warning) / 2s (critical)
- Error rate above 1% (warning) / 5% (critical)
- Availability below 99% (critical)

**Business Alerts**:

- Payment failure rate above 2% (warning) / 5% (critical)
- Order cancellation rate above 10% (warning)

**Infrastructure Alerts**:

- Database connection pool above 60% (warning) / 80% (critical)
- Database query latency P95 above 500ms (critical)
- Error spike above 50 in 5 minutes (critical)

### Telegram Alerts

Alerts are sent via Telegram when configured:

**Environment Variables**:

- `TELEGRAM_BOT_TOKEN` - Bot API token
- `TELEGRAM_ALERT_CHAT_ID` - Target chat ID

**Alert Levels**:

- 🔴 Critical - Immediate action required
- 🟡 Warning - Attention needed
- ℹ️ Info - Informational

## Implementation Files

### Monitoring Module (`src/lib/monitoring/`)

| File                         | Description                       |
| ---------------------------- | --------------------------------- |
| `index.ts`                   | Main exports                      |
| `metrics.ts`                 | Custom metrics tracking functions |
| `alerts.ts`                  | Telegram alert system             |
| `alerting-rules.ts`          | Alert rule definitions            |
| `sentry-context.ts`          | Sentry context utilities          |
| `payment-webhook-monitor.ts` | Payment webhook monitoring        |

### API Routes (`src/app/api/`)

| Endpoint                     | Description                   |
| ---------------------------- | ----------------------------- |
| `/api/metrics`               | System-level metrics          |
| `/api/analytics/api-metrics` | Restaurant-scoped API metrics |

## Usage Examples

### Tracking Custom Metrics

```typescript
import { trackOrderMetric, trackPaymentMetric } from '@/lib/monitoring';

// Track order event
await trackOrderMetric(supabase, {
    restaurantId: 'rest-123',
    orderId: 'order-456',
    event: 'completed',
    items: 5,
    total: 2500,
    durationMs: 1500,
});

// Track payment event
await trackPaymentMetric(supabase, {
    restaurantId: 'rest-123',
    paymentId: 'pay-789',
    provider: 'telebirr',
    event: 'completed',
    amount: 2500,
});
```

### Performance Tracing

```typescript
import { tracePerformance } from '@/lib/monitoring';

const result = await tracePerformance(
    'db:menu:fetch',
    async () => {
        return await fetchMenuItems(restaurantId);
    },
    { tags: { restaurant_id: restaurantId } }
);
```

### Alert Integration

```typescript
import { Alerts } from '@/lib/monitoring';

// Trigger critical alert
await Alerts.posOffline('rest-123', 'Saba Grill', 10);

// Trigger warning alert
await Alerts.apiLatencyHigh('/api/orders', 2100);
```

## Environment Variables

| Variable                 | Required | Description                   |
| ------------------------ | -------- | ----------------------------- |
| `NEXT_PUBLIC_SENTRY_DSN` | Yes      | Sentry DSN for error tracking |
| `TELEGRAM_BOT_TOKEN`     | No       | Telegram bot token for alerts |
| `TELEGRAM_ALERT_CHAT_ID` | No       | Telegram chat ID for alerts   |
| `METRICS_API_KEY`        | No       | API key for /api/metrics      |

## Sentry Integration

### Configuration Files

- `sentry.client.config.ts` - Browser SDK
- `sentry.server.config.ts` - Server SDK
- `sentry.edge.config.ts` - Edge Runtime SDK

### Features Enabled

- **Traces**: 10% sample rate
- **Profiles**: 10% sample rate
- **Session Replay**: 10% session, 100% on error
- **Context**: Restaurant ID tagging for all errors

### Custom Tags

Errors are automatically tagged with:

- `restaurant_id` - Restaurant identifier
- `restaurant_name` - Restaurant name
- `device_type` - POS, KDS, Guest, or Dashboard
- `route` - Request path

---

## Grafana Dashboard Configuration

### Overview

The platform includes a comprehensive Grafana dashboard for production monitoring. The dashboard provides real-time visibility into API performance, database metrics, infrastructure health, business KPIs, realtime subscriptions, KDS performance, and payment gateway metrics.

### Dashboard Features

The Grafana dashboard includes the following panels organized by category:

#### API Performance Overview

| Panel                   | Description                         | SLO Target        | Alert Threshold                  |
| ----------------------- | ----------------------------------- | ----------------- | -------------------------------- |
| API P95 Latency         | Current P95 response time           | ≤ 500ms           | Warning: 500ms, Critical: 1000ms |
| API Error Rate (5xx)    | Percentage of 5xx errors            | < 1%              | Warning: 1%, Critical: 5%        |
| API Requests/sec        | Request throughput                  | N/A               | N/A                              |
| DB Connection Pool %    | Database connection utilization     | < 80%             | Warning: 60%, Critical: 80%      |
| API Latency by Endpoint | P50/P95/P99 latency trends by route | Per-endpoint SLOs | Route-specific                   |
| API Requests by Status  | Request count by HTTP status code   | N/A               | N/A                              |

#### Database Performance

| Panel                       | Description                                       | SLO Target  | Alert Threshold                 |
| --------------------------- | ------------------------------------------------- | ----------- | ------------------------------- |
| Database Query Latency      | P50/P95/P99 query execution time                  | P95 ≤ 300ms | Warning: 300ms, Critical: 500ms |
| Database Active Connections | Active, idle, and idle-in-transaction connections | N/A         | Monitor for idle-in-transaction |

#### Infrastructure Metrics

| Panel                  | Description                   | SLO Target | Alert Threshold             |
| ---------------------- | ----------------------------- | ---------- | --------------------------- |
| Container Memory Usage | Memory utilization percentage | < 90%      | Warning: 70%, Critical: 90% |
| Container CPU Usage    | CPU utilization percentage    | < 90%      | Warning: 70%, Critical: 90% |

#### Business Metrics

| Panel                | Description                         | SLO Target | Alert Threshold           |
| -------------------- | ----------------------------------- | ---------- | ------------------------- |
| Total Orders (24h)   | Order count for the last 24 hours   | N/A        | N/A                       |
| Payment Failure Rate | Percentage of failed payments       | < 2%       | Warning: 2%, Critical: 5% |
| Active Sessions      | Currently active table sessions     | N/A        | N/A                       |
| Active Restaurants   | Number of restaurants with activity | N/A        | N/A                       |

#### Realtime & Order Flow

| Panel                           | Description                                   | SLO Target     | Alert Threshold                   |
| ------------------------------- | --------------------------------------------- | -------------- | --------------------------------- |
| Realtime P95 Latency            | P95 realtime event propagation time           | ≤ 2000ms       | Warning: 1000ms, Critical: 2000ms |
| Realtime Propagation by Channel | P50/P95 latency by channel (orders, sessions) | ≤ 2000ms       | Per-channel monitoring            |
| Orders/min                      | Current order throughput rate                 | N/A            | N/A                               |
| Order Completion Time P95       | Time from order creation to completion        | ≤ 5min typical | Warning: 5min, Critical: 10min    |

#### KDS Performance

| Panel                         | Description                              | SLO Target          | Alert Threshold             |
| ----------------------------- | ---------------------------------------- | ------------------- | --------------------------- |
| KDS Queue Depth               | Number of orders waiting to be processed | < 10                | Warning: 10, Critical: 20   |
| KDS Processing Time P95       | Time for KDS to process an order item    | ≤ 30s               | Warning: 30s, Critical: 60s |
| KDS Queue Depth by Restaurant | Queue depth per restaurant               | < 10 per restaurant | Restaurant-specific         |

#### Payment Gateway

| Panel                                 | Description                                   | SLO Target        | Alert Threshold                   |
| ------------------------------------- | --------------------------------------------- | ----------------- | --------------------------------- |
| Payment Gateway P95 Latency           | P95 payment processing time                   | ≤ 5000ms          | Warning: 2000ms, Critical: 5000ms |
| Payment Failure Rate                  | Overall payment failure percentage            | < 2%              | Warning: 2%, Critical: 5%         |
| Payment Gateway Latency by Provider   | P50/P95 latency by provider (Telebirr, Chapa) | Provider-specific | Per-provider thresholds           |
| Payment Requests by Provider & Status | Request volume by provider and status         | N/A               | Monitor for anomalies             |

#### Error Rates by Endpoint

| Panel                      | Description                    | SLO Target | Alert Threshold           |
| -------------------------- | ------------------------------ | ---------- | ------------------------- |
| 5xx Error Rate by Endpoint | Server error rate per endpoint | < 1%       | Warning: 1%, Critical: 5% |
| 4xx Errors by Endpoint     | Client error rate per endpoint | N/A        | Monitor for spikes        |

### Importing the Dashboard

1. **Prerequisites**:
    - Grafana 10.0+ installed or Grafana Cloud account
    - Prometheus data source configured

2. **Import Steps**:

    ```bash
    # Option 1: Via Grafana UI
    # 1. Navigate to Dashboards → Import
    # 2. Upload the dashboard JSON file: docs/05-infrastructure/monitoring/grafana-dashboard.json
    # 3. Select your Prometheus data source
    # 4. Click Import
    ```

3. **Environment Variables Required**:
   | Variable | Description |
   |----------|-------------|
   | `GRAFANA_URL` | Grafana instance URL |
   | `GRAFANA_API_KEY` | API key with admin permissions |

### Prometheus Metrics Setup

For the dashboard to work, you need to expose Prometheus metrics from your application:

```bash
# Install prom-client
npm install prom-client
```

Create a metrics endpoint in your application:

```typescript
// src/app/api/metrics/prometheus/route.ts
import { Registry, collectDefaultMetrics, Counter, Histogram } from 'prom-client';

const register = new Registry();
collectDefaultMetrics({ register });

// Custom metrics
const httpRequestsTotal = new Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status'],
    registers: [register],
});

const httpRequestDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status'],
    buckets: [0.1, 0.5, 1, 2, 5],
    registers: [register],
});

export async function GET() {
    return new Response(await register.metrics(), {
        headers: { 'Content-Type': 'register.contentType' },
    });
}
```

### Alternative: Datadog Integration

If using Datadog instead of Grafana:

1. Install the Datadog agent:

    ```bash
    npm install datadog-lambda-js
    ```

2. Configure in `next.config.ts`:

    ```typescript
    // next.config.ts
    const withDatadog = require('@dd/browser-sdk');

    module.exports = withDatadog({
        // ... config
    });
    ```

3. Set environment variables:
    ```bash
    DATADOG_API_KEY=your-api-key
    DATADOG_SITE=datadoghq.eu
    ```

### Alert Rules for Grafana

Configure the following alert rules in Grafana based on SLO targets from [`performance-slos.md`](../../08-reports/performance/performance-slos.md):

#### API Performance Alerts

| Alert                | Condition              | Severity | SLO Reference |
| -------------------- | ---------------------- | -------- | ------------- |
| API High Latency     | P95 > 500ms for 5m     | Warning  | P95 ≤ 500ms   |
| API Critical Latency | P95 > 1s for 5m        | Critical | P95 ≤ 500ms   |
| High Error Rate      | Error rate > 1% for 5m | Warning  | Error < 1%    |
| Critical Error Rate  | Error rate > 5% for 5m | Critical | Error < 1%    |

#### Database Alerts

| Alert              | Condition          | Severity | SLO Reference |
| ------------------ | ------------------ | -------- | ------------- |
| DB Connection Pool | Pool > 60%         | Warning  | < 80%         |
| DB Connection Pool | Pool > 80%         | Critical | < 80%         |
| DB Query Latency   | P95 > 300ms for 5m | Warning  | P95 ≤ 300ms   |
| DB Query Latency   | P95 > 500ms for 5m | Critical | P95 ≤ 300ms   |

#### Infrastructure Alerts

| Alert       | Condition    | Severity |
| ----------- | ------------ | -------- |
| High Memory | Memory > 70% | Warning  |
| High Memory | Memory > 90% | Critical |
| High CPU    | CPU > 70%    | Warning  |
| High CPU    | CPU > 90%    | Critical |

#### Realtime Alerts

| Alert                     | Condition       | Severity | SLO Reference |
| ------------------------- | --------------- | -------- | ------------- |
| Realtime High Latency     | P95 > 1s for 5m | Warning  | P95 ≤ 2s      |
| Realtime Critical Latency | P95 > 2s for 5m | Critical | P95 ≤ 2s      |
| Realtime Event Lag        | Event lag > 5s  | Critical | P95 ≤ 2s      |

#### KDS Alerts

| Alert                    | Condition        | Severity | SLO Reference |
| ------------------------ | ---------------- | -------- | ------------- |
| KDS Queue Depth High     | Queue depth > 10 | Warning  | < 10          |
| KDS Queue Depth Critical | Queue depth > 20 | Critical | < 10          |
| KDS Processing Slow      | P95 > 30s for 5m | Warning  | P95 ≤ 30s     |
| KDS Processing Critical  | P95 > 60s for 5m | Critical | P95 ≤ 30s     |

#### Payment Gateway Alerts

| Alert                    | Condition                | Severity | SLO Reference |
| ------------------------ | ------------------------ | -------- | ------------- |
| Payment Latency High     | P95 > 2s for 5m          | Warning  | P95 ≤ 5s      |
| Payment Latency Critical | P95 > 5s for 5m          | Critical | P95 ≤ 5s      |
| Payment Failure High     | Failure rate > 2% for 5m | Warning  | < 2%          |
| Payment Failure Critical | Failure rate > 5% for 5m | Critical | < 5%          |

#### Order Flow Alerts

| Alert                     | Condition           | Severity | SLO Reference  |
| ------------------------- | ------------------- | -------- | -------------- |
| Order Completion Slow     | P95 > 5min for 15m  | Warning  | Typical ≤ 5min |
| Order Completion Critical | P95 > 10min for 15m | Critical | Typical ≤ 5min |

### Alert Rule Configuration Examples

```yaml
# Grafana Alerting Rules (alerting_rules.yml)
groups:
    - name: lole-api
      rules:
          - alert: APIHighLatency
            expr: histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{job="lole-api"}[5m])) by (le)) > 0.5
            for: 5m
            labels:
                severity: warning
            annotations:
                summary: 'API P95 latency exceeds 500ms'
                description: 'API P95 latency is {{ $value }}s'

          - alert: APICriticalLatency
            expr: histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{job="lole-api"}[5m])) by (le)) > 1
            for: 5m
            labels:
                severity: critical
            annotations:
                summary: 'API P95 latency exceeds 1s'
                description: 'API P95 latency is {{ $value }}s'

    - name: lole-realtime
      rules:
          - alert: RealtimeHighLatency
            expr: histogram_quantile(0.95, sum(rate(lole_realtime_propagation_seconds_bucket[5m])) by (le)) > 1
            for: 5m
            labels:
                severity: warning
            annotations:
                summary: 'Realtime P95 latency exceeds 1s'
                description: 'Realtime propagation P95 latency is {{ $value }}s'

          - alert: RealtimeCriticalLatency
            expr: histogram_quantile(0.95, sum(rate(lole_realtime_propagation_seconds_bucket[5m])) by (le)) > 2
            for: 5m
            labels:
                severity: critical
            annotations:
                summary: 'Realtime P95 latency exceeds 2s SLO'
                description: 'Realtime propagation P95 latency is {{ $value }}s'

    - name: lole-kds
      rules:
          - alert: KDSQueueDepthHigh
            expr: lole_kds_queue_depth > 10
            for: 5m
            labels:
                severity: warning
            annotations:
                summary: 'KDS queue depth exceeds 10'
                description: 'KDS queue depth is {{ $value }}'

          - alert: KDSQueueDepthCritical
            expr: lole_kds_queue_depth > 20
            for: 5m
            labels:
                severity: critical
            annotations:
                summary: 'KDS queue depth critical'
                description: 'KDS queue depth is {{ $value }}'

    - name: lole-payments
      rules:
          - alert: PaymentFailureHigh
            expr: sum(rate(lole_payment_requests_total{status="failed"}[5m])) / sum(rate(lole_payment_requests_total[5m])) > 0.02
            for: 5m
            labels:
                severity: warning
            annotations:
                summary: 'Payment failure rate exceeds 2%'
                description: 'Payment failure rate is {{ $value | humanizePercentage }}'

          - alert: PaymentFailureCritical
            expr: sum(rate(lole_payment_requests_total{status="failed"}[5m])) / sum(rate(lole_payment_requests_total[5m])) > 0.05
            for: 5m
            labels:
                severity: critical
            annotations:
                summary: 'Payment failure rate exceeds 5%'
                description: 'Payment failure rate is {{ $value | humanizePercentage }}'
```

---

## Dashboard Access

### Merchant Dashboard

Access the analytics page at: `/merchant/analytics`

### Sentry Dashboard

Access at: https://sentry.io/organizations/lole

### API Metrics Endpoint

```bash
# Get system metrics
curl -H "x-metrics-api-key: your-api-key" \
  "https://your-domain.com/api/metrics?range=day"
```

### Grafana Dashboard

After importing, access at: `https://your-grafana.com/d/lole-prod-overview`
