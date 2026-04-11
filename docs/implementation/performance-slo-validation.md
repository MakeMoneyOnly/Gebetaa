# Performance SLO Validation

## Overview

This document defines the performance Service Level Objectives (SLOs) for Gebeta and the methodology for validating them.

## SLO Targets

| Endpoint                         | Metric      | Target  | Error Budget |
| -------------------------------- | ----------- | ------- | ------------ |
| GET /api/merchant/command-center | P95 latency | ≤ 500ms | < 1%         |
| GET /api/orders                  | P95 latency | ≤ 400ms | < 1%         |
| PATCH /api/orders/:id/status     | P95 latency | ≤ 300ms | < 0.5%       |
| Realtime propagation             | P95 latency | ≤ 2s    | < 1%         |

## Validation Methodology

### Tools

- **k6**: For HTTP load testing and latency measurement
- **Prometheus + Grafana**: For production metric collection
- **Custom scripts**: For realtime propagation testing

### Test Environment Requirements

- Staging environment matching production specifications
- Seeded database with realistic data volumes:
    - 50+ restaurants
    - 10,000+ orders
    - 5,000+ menu items
- Network conditions simulating Addis Ababa connectivity

### Running SLO Validation

```bash
# 1. Full SLO validation suite
cd tests/performance
k6 run slo-validation.js

# 2. Individual endpoint validation
k6 run --env BASE_URL=https://staging.gebetamenu.com slo-validation.js

# 3. Generate benchmark report
node benchmark-reporter.js --input results.json --output report.md
```

### Validation Criteria

A validation run **passes** when:

1. ALL P95 latency targets are met
2. ALL error rate targets are met
3. No SLO violations during the sustained load period
4. No degradation trends across consecutive runs

A validation run **fails** when:

1. Any single P95 latency target is exceeded
2. Error rate exceeds the budget for any endpoint
3. Degradation > 20% from previous baseline

## Remediation for SLO Violations

### P95 Latency Exceeded

1. Check slow query log: `SELECT * FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 20;`
2. Check for missing indexes: `SELECT * FROM pg_stat_user_indexes WHERE idx_scan = 0;`
3. Check connection pool utilization
4. Review recent schema changes or new queries
5. Check for N+1 query patterns in DataLoaders

### Error Rate Exceeded

1. Check application error logs
2. Check database connection limits
3. Check for rate limiting from external services (ERCA, payment providers)
4. Review recent deployments

### Realtime Propagation Exceeded

1. Check Supabase Realtime connection count
2. Check WebSocket connection stability
3. Check for large payload sizes in Realtime events
4. Review client-side reconnection logic

## Benchmark Results Template

| Endpoint                         | P50  | P95  | P99  | Error Rate | Status |
| -------------------------------- | ---- | ---- | ---- | ---------- | ------ |
| GET /api/merchant/command-center | — ms | — ms | — ms | — %        | ✅/❌  |
| GET /api/orders                  | — ms | — ms | — ms | — %        | ✅/❌  |
| PATCH /api/orders/:id/status     | — ms | — ms | — ms | — %        | ✅/❌  |

**Test Date**: YYYY-MM-DD
**Environment**: staging/production
**Concurrent Users**: 20/50/100
**Duration**: 10 minutes
