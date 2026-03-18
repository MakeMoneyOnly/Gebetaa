# Monitoring Dashboards Documentation

Last updated: 2026-03-16

## Overview

This document describes the monitoring dashboards implemented for the Gebeta Restaurant OS platform. The monitoring system provides comprehensive observability across API performance, application metrics, database performance, and business metrics.

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

The platform includes a comprehensive Grafana dashboard for production monitoring. The dashboard provides real-time visibility into API performance, database metrics, infrastructure health, and business KPIs.

### Dashboard Features

The Grafana dashboard includes the following panels:

#### API Performance Overview

- **API P95 Latency** - Current P95 response time in milliseconds
- **API Error Rate (5xx)** - Percentage of 5xx errors
- **API Requests/sec** - Request throughput
- **DB Connection Pool %** - Database connection utilization
- **API Latency by Endpoint** - P50/P95/P99 latency trends by route
- **API Requests by Status** - Request count by HTTP status code

#### Database Performance

- **Database Query Latency** - P50/P95/P99 query execution time
- **Database Active Connections** - Active, idle, and idle-in-transaction connections

#### Infrastructure Metrics

- **Container Memory Usage** - Memory utilization percentage
- **Container CPU Usage** - CPU utilization percentage

#### Business Metrics

- **Total Orders (24h)** - Order count for the last 24 hours
- **Payment Failure Rate** - Percentage of failed payments
- **Active Sessions** - Currently active table sessions
- **Active Restaurants** - Number of restaurants with activity

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

Configure the following alert rules in Grafana:

| Alert                | Condition              | Severity |
| -------------------- | ---------------------- | -------- |
| API High Latency     | P95 > 1s for 5m        | Warning  |
| API Critical Latency | P95 > 2s for 5m        | Critical |
| High Error Rate      | Error rate > 1% for 5m | Warning  |
| Critical Error Rate  | Error rate > 5% for 5m | Critical |
| DB Connection Pool   | Pool > 80%             | Critical |
| High Memory          | Memory > 90%           | Critical |
| High CPU             | CPU > 90%              | Critical |

---

## Dashboard Access

### Merchant Dashboard

Access the analytics page at: `/merchant/analytics`

### Sentry Dashboard

Access at: https://sentry.io/organizations/gebeta

### API Metrics Endpoint

```bash
# Get system metrics
curl -H "x-metrics-api-key: your-api-key" \
  "https://your-domain.com/api/metrics?range=day"
```

### Grafana Dashboard

After importing, access at: `https://your-grafana.com/d/gebeta-prod-overview`
