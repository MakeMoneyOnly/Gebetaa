# API Reliability Dashboard

Last updated: 2026-02-17

## Scope

P0-091 adds API latency and error dashboards for these SLO endpoints:

- `GET /api/merchant/command-center`
- `GET /api/orders`
- `PATCH /api/orders/:id/status`

## Data Collection

- Request telemetry is written to `audit_logs` with:
  - `action = "api_metric_recorded"`
  - `entity_type = "api_endpoint"`
  - `metadata.endpoint`
  - `metadata.method`
  - `metadata.status_code`
  - `metadata.duration_ms`
  - `metadata.is_error`

## Aggregation API

- Endpoint: `GET /api/analytics/api-metrics?range=today|week|month`
- Auth: requires authenticated staff/agency context
- Output:
  - Per-endpoint request count
  - Error count and error rate %
  - P50/P95/avg latency
  - SLO status (`healthy`, `breach`, `no_data`)
  - Time-bucket trend data

## SLO Targets

- `GET /api/merchant/command-center`
  - P95 <= 500ms
  - Error rate < 1%
- `GET /api/orders`
  - P95 <= 400ms
  - Error rate < 1%
- `PATCH /api/orders/:id/status`
  - P95 <= 300ms
  - Error rate < 0.5%

## UI Surface

- Merchant analytics page: `src/app/(dashboard)/merchant/analytics/page.tsx`
- Section: `API Reliability Dashboard`
  - Summary cards
  - Endpoint SLO table
  - Trend table
