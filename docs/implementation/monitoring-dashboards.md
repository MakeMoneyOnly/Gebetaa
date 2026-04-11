# Monitoring Dashboards

## Overview

Gebeta uses Grafana for monitoring and alerting, with metrics exposed via Prometheus at `/api/metrics/prometheus`.

## Dashboard Configuration

### Prerequisites

- Grafana 10+ with Prometheus data source
- Access to Gebeta's `/api/metrics/prometheus` endpoint
- Prometheus scraping configured

### Importing Dashboards

1. Open Grafana → Dashboards → Import
2. Upload the JSON file from `config/grafana/dashboards/`
3. Select Prometheus data source
4. Click Import

## Available Dashboards

### 1. System Overview (`gebeta-overview.json`)

High-level system health dashboard showing:

- Active restaurants and staff
- Order throughput (orders/minute)
- Revenue (ETB/hour)
- Error rate (% of requests)
- Average response time (P50, P95, P99)
- Active sync connections
- Database connection pool utilization

### 2. Orders Dashboard (`gebeta-orders.json`)

Order processing metrics:

- Orders by status (pending, preparing, ready, served, cancelled)
- Order creation rate
- Average order completion time
- Order item count distribution
- Split order frequency
- Discount application rate

### 3. Payments Dashboard (`gebeta-payments.json`)

Payment processing metrics:

- Payment success rate by provider (Cash, Telebirr, Chapa, CBE Birr, Amole)
- Average payment processing time
- Payment failure reasons
- Refund rate
- Revenue by payment method
- Payment session expiry rate

### 4. KDS Dashboard (`gebeta-kds.json`)

Kitchen Display System metrics:

- Items by status (queued, cooking, ready, bumped)
- Average cooking time by station
- Item recall rate
- Bump-to-ready time
- Queue depth by station
- Kitchen throughput (items/hour)

## Alert Rules

### Critical Alerts (P0)

| Alert                    | Condition                                 | Severity | Action            |
| ------------------------ | ----------------------------------------- | -------- | ----------------- |
| High Error Rate          | > 5% for 5 min                            | Critical | Page on-call      |
| Order Processing Down    | 0 orders for 10 min during business hours | Critical | Page on-call      |
| Payment Failures         | > 10% failure rate for 5 min              | Critical | Page on-call      |
| Database Connection Pool | > 80% utilized                            | Warning  | Scale connections |

### Warning Alerts (P1)

| Alert              | Condition                | Severity | Action             |
| ------------------ | ------------------------ | -------- | ------------------ |
| Slow Response Time | P95 > 1s for 5 min       | Warning  | Investigate        |
| Sync Queue Backlog | > 100 pending operations | Warning  | Check connectivity |
| KDS Queue Depth    | > 50 items per station   | Warning  | Check kitchen      |
| High Memory Usage  | > 85% for 5 min          | Warning  | Investigate        |

## Metrics Reference

### Application Metrics

- `gebeta_http_requests_total` - Total HTTP requests
- `gebeta_http_request_duration_seconds` - Request duration histogram
- `gebeta_orders_created_total` - Orders created
- `gebeta_orders_completed_total` - Orders completed
- `gebeta_payments_processed_total` - Payments processed
- `gebeta_kds_items_queued_total` - KDS items queued
- `gebeta_sync_operations_total` - Sync operations processed

### Infrastructure Metrics

- `gebeta_db_connections_active` - Active DB connections
- `gebeta_db_connections_idle` - Idle DB connections
- `gebeta_realtime_connections` - Active Realtime connections
- `gebeta_sync_queue_size` - Pending sync operations

## Setup Instructions

### 1. Configure Prometheus

Add Gebeta as a scrape target in `prometheus.yml`:

```yaml
scrape_configs:
    - job_name: 'gebeta'
      metrics_path: '/api/metrics/prometheus'
      static_configs:
          - targets: ['localhost:3000']
```

### 2. Configure Grafana Data Source

1. Add Prometheus data source in Grafana
2. Set URL to your Prometheus instance
3. Test connection

### 3. Import Dashboards

1. Copy JSON files from `config/grafana/dashboards/`
2. Import each dashboard in Grafana UI

### 4. Configure Alert Channels

1. Set up notification channels (Slack, PagerDuty, email)
2. Configure alert rules from `config/grafana/alerts/alert-rules.yml`
3. Test alerts
