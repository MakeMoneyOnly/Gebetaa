# Merchant Command Center Performance SLOs

Last updated: 2026-02-17

## User-Facing SLO Targets

- Command center API (`GET /api/merchant/command-center`)
    - P95 latency <= 500ms
    - Error rate < 1%
- Orders list API (`GET /api/orders`)
    - P95 latency <= 400ms
    - Error rate < 1%
- Order status update (`PATCH /api/orders/:id/status`)
    - P95 latency <= 300ms
    - Error rate < 0.5%

## Realtime Freshness Targets

- Order state propagation delay <= 2s P95
- Table/session state propagation delay <= 2s P95

## Frontend Interaction Targets

- Primary dashboard render under 2.5s on standard broadband
- Filter/search interaction response under 300ms (UI feedback)

## Monitoring and Alerts

- Alert when latency target is breached for 15 minutes.
- Alert when error rate exceeds threshold for 5 minutes.
- Alert when realtime event lag exceeds 5 seconds.
