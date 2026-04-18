# Chaos Engineering Documentation

## Overview

This document defines the chaos engineering practices for lole - "Toast for Addis Ababa." Chaos engineering is the discipline of experimenting on a system to build confidence in its ability to withstand turbulent conditions in production. Given lole's position as a critical restaurant operating system for Ethiopia, we must proactively identify weaknesses before they impact restaurant operations.

## Table of Contents

1. [Principles](#principles)
2. [Critical Failure Scenarios](#critical-failure-scenarios)
3. [Experiment Designs](#experiment-designs)
4. [Runbooks](#runbooks)
5. [Safe Execution Procedures](#safe-execution-procedures)
6. [Automation](#automation)

---

## Principles

### Core Philosophy

Chaos engineering for lole follows these foundational principles:

1. **Assume Failure Will Happen** - Infrastructure in Ethiopia faces unique challenges (power instability, network fluctuations). Design for failure from the start.

2. **Inject Failure in Production** - While we start in staging, the ultimate goal is controlled experiments in production during low-traffic windows.

3. **Never Break Customer-Facing Flows** - Restaurant operations are mission-critical. Experiments must preserve the ability to take orders and process payments.

4. **Automate Experiments** - Manual chaos is inconsistent. Automated experiments run on schedules and produce reproducible results.

5. **Learn from Every Experiment** - Document hypotheses, observations, and improvements. Build a feedback loop.

### Experiment Stages

| Stage                     | Environment | Timing                 | Approval Required             |
| ------------------------- | ----------- | ---------------------- | ----------------------------- |
| 1 - Design                | N/A         | Planning               | Team Lead                     |
| 2 - Dry Run               | Staging     | Business Hours         | Team Lead                     |
| 3 - Production (Low Risk) | Production  | Off-Peak (2am-5am EAT) | Engineering Manager           |
| 4 - Production (Full)     | Production  | Low-Traffic Window     | Engineering Manager + On-Call |

### Blast Radius Control

- **Maximum Impact**: 5% of active sessions or 50 orders per minute (whichever is lower)
- **Experiment Duration**: Maximum 30 minutes
- **Auto-Rollback**: All experiments must auto-terminate or rollback within 30 minutes
- **Monitoring**: Real-time alerts must be active before experiment starts

---

## Critical Failure Scenarios

### Scenario Priority Matrix

| Priority | Scenario                          | Impact Area   | Detection Difficulty | Recovery Complexity |
| -------- | --------------------------------- | ------------- | -------------------- | ------------------- |
| P0       | Database Connection Failure       | All           | Low                  | Medium              |
| P0       | Payment Provider (Chapa) Downtime | Revenue       | Low                  | Medium              |
| P0       | Auth Service Failure              | All           | Medium               | Low                 |
| P1       | Redis/Cache Failure               | Performance   | Low                  | Low                 |
| P1       | Network Latency/Instability       | All           | Medium               | High                |
| P2       | High Load/Stress Conditions       | Performance   | Low                  | Medium              |
| P2       | KDS Display Failure               | Kitchen       | Low                  | Low                 |
| P2       | Realtime Sync Failure             | Collaboration | Medium               | Medium              |

### Detailed Failure Impact Analysis

#### P0 - Database Connection Failure

**Affected Systems:**

- Order creation and updates
- Menu item retrieval
- Table session management
- Payment recording
- Staff authentication

**Expected Symptoms:**

- API timeouts (5xx errors)
- Orders stuck in "pending" state
- Inability to start new table sessions
- Failed payment confirmations

**Mitigations Already in Place:**

- Connection pooling via Supabase
- RLS policies for tenant isolation
- Retry logic in client SDK

#### P0 - Payment Provider (Chapa) Downtime

**Affected Systems:**

- Payment processing
- Order completion
- Revenue tracking
- Guest checkout flow

**Expected Symptoms:**

- Failed payment transactions
- Orders stuck in "payment_pending" state
- Error messages on guest devices
- Revenue reporting gaps

**Mitigations Already in Place:**

- Cash payment fallback
- Payment retry mechanism
- Chapa webhook retry logic

#### P0 - Supabase Auth Service Failure

**Affected Systems:**

- Merchant login
- Staff authentication
- Session management
- JWT token validation

**Expected Symptoms:**

- Login failures
- 401 errors on protected routes
- Session expirations
- Token refresh failures

**Mitigations Already in Place:**

- Token refresh logic in middleware
- Offline token caching for guests
- PIN-based quick auth for staff

#### P1 - Redis/Cache Failure

**Affected Systems:**

- Session storage
- Rate limiting
- Real-time presence
- Temporary state

**Expected Symptoms:**

- Increased database load
- Slower session lookups
- Rate limit bypasses
- Presence indicators offline

**Mitigations Already in Place:**

- Fallback to database-backed sessions
- Graceful degradation

#### P1 - Network Latency/Instability

**Affected Systems:**

- All API calls
- Real-time updates
- KDS displays
- Guest ordering

**Expected Symptoms:**

- Slow page loads
- Stale data displays
- Order submission delays
- Reconnection loops

**Mitigations Already in Place:**

- Offline-first with IndexedDB/Dexie.js
- Queue for pending mutations
- Optimistic UI updates

#### P2 - High Load/Stress Conditions

**Affected Systems:**

- API response times
- Database connections
- Real-time message delivery

**Expected Symptoms:**

- Elevated latency
- Connection pool exhaustion
- 503 Service Unavailable

---

## Experiment Designs

### Experiment 1: Database Connection Failure

#### Hypothesis

When the database becomes unavailable, the system will fail gracefully with appropriate error messages within 5 seconds, and critical operations will queue for later sync.

#### Preconditions

- [ ] Active orders in system
- [ ] Monitoring dashboards visible
- [ ] On-call engineer notified
- [ ] Rollback procedure ready

#### Experiment Steps

```yaml
# Experiment Configuration
name: db_connection_failure
version: 1.0.0
description: Simulate database connection failure

environment:
    type: staging # Always start in staging
    database: supabase_staging

injection:
    method: firewall_rule
    target: database_host
    port: 5432
    action: drop_all_packets

duration:
    minutes: 5
    ramp_up: 30 seconds
    ramp_down: 30 seconds

monitoring:
    metrics:
        - api_error_rate
        - api_latency_p95
        - order_success_rate
        - payment_success_rate
    alerts:
        - error_rate > 10% for 1 minute
        - latency_p95 > 5000ms

rollback:
    automatic: true
    timeout: 60 seconds
    method: remove_firewall_rule
```

#### Expected Observations

1. API error rate increases to ~100% within 30 seconds
2. Error responses include meaningful messages (not stack traces)
3. Pending mutations queue in local storage (Dexie.js)
4. KDS shows "offline" indicator
5. No data corruption occurs

#### Success Criteria

- [ ] Error responses return within 5 seconds
- [ ] No 500-level errors leak internal information
- [ ] Offline indicator appears on UI
- [ ] Orders can be created locally and sync when restored

#### Rollback Procedure

1. Remove firewall block
2. Verify database connectivity
3. Monitor for queued sync completion
4. Confirm all systems operational

---

### Experiment 2: Redis/Cache Failure

#### Hypothesis

When Redis becomes unavailable, the system degrades gracefully with increased database load but no service interruption.

#### Preconditions

- [ ] Load test running (100 concurrent users)
- [ ] Database monitoring active
- [ ] Cache hit rate visible in dashboard

#### Experiment Steps

```yaml
# Experiment Configuration
name: redis_failure
version: 1.0.0
description: Simulate Redis/cache unavailability

environment:
    type: staging
    redis: upstash_staging

injection:
    method: network_isolation
    target: redis_host
    action: drop_all_packets

duration:
    minutes: 10
    ramp_up: 1 minute
    ramp_down: 1 minute

monitoring:
    metrics:
        - cache_hit_rate
        - database_connections
        - api_latency_p95
        - session_creation_time
    alerts:
        - db_connections > 80% of pool
        - latency_p95 > 2000ms

rollback:
    automatic: true
    timeout: 60 seconds
```

#### Expected Observations

1. Cache hit rate drops to 0%
2. Database connection count increases
3. API latency increases by 50-100ms
4. All functionality continues working

#### Success Criteria

- [ ] Service remains available
- [ ] No authentication failures
- [ ] Latency increase < 200ms
- [ ] Database connections don't exhaust

---

### Experiment 3: Payment Provider (Chapa) Downtime

#### Hypothesis

When Chapa is unavailable, the system redirects guests to cash payment and queues any pending payment attempts for retry.

#### Preconditions

- [ ] Test restaurant with active menu
- [ ] Test payment integration in sandbox mode
- [ ] Webhook endpoint accessible for testing

#### Experiment Steps

```yaml
# Experiment Configuration
name: chapa_downtime
version: 1.0.0
description: Simulate Chapa payment provider failure

environment:
    type: staging
    payment_provider: chapa_sandbox

injection:
    method: service_failure
    target: chapa_api
    action: return_503
    response_delay: 0ms

duration:
    minutes: 15
    ramp_up: 30 seconds
    ramp_down: 30 seconds

monitoring:
    metrics:
        - payment_attempt_count
        - payment_success_rate
        - payment_failure_count
        - order_completion_rate
    alerts:
        - payment_failure_rate > 50% for 2 minutes
        - pending_orders > 10

rollback:
    automatic: true
    timeout: 30 seconds
    method: restore_service
```

#### Expected Observations

1. Payment API returns 503 errors
2. UI shows "Payment unavailable - Cash option recommended"
3. Orders can be created with "payment_pending" status
4. Retry mechanism queues failed payments

#### Success Criteria

- [ ] Guests can complete order with cash
- [ ] Failed payments are recorded with retry flag
- [ ] No duplicate charges on recovery
- [ ] Revenue report reflects pending payments

---

### Experiment 4: Supabase Auth Service Failure

#### Hypothesis

When Supabase Auth is unavailable, existing sessions continue working, and new logins fall back to PIN-based quick auth.

#### Preconditions

- [ ] Active merchant and staff sessions
- [ ] PIN authentication configured for test staff

#### Experiment Steps

```yaml
# Experiment Configuration
name: auth_failure
version: 1.0.0
description: Simulate Supabase Auth service failure

environment:
    type: staging
    auth: supabase_auth_staging

injection:
    method: network_isolation
    target: auth_host
    action: drop_all_packets

duration:
    minutes: 10
    ramp_up: 30 seconds
    ramp_down: 30 seconds

monitoring:
    metrics:
        - login_success_rate
        - token_refresh_success_rate
        - session_active_count
        - api_unauthorized_rate
    alerts:
        - unauthorized_rate > 5% for 2 minutes

rollback:
    automatic: true
    timeout: 60 seconds
```

#### Expected Observations

1. Token refresh calls fail
2. Existing sessions continue working (until expiry)
3. New logins show fallback option
4. PIN quick-auth works independently

#### Success Criteria

- [ ] Existing sessions remain active
- [ ] PIN auth bypasses failed auth service
- [ ] No unauthorized access occurs
- [ ] Session recovery on service restore

---

### Experiment 5: Network Latency/Instability

#### Hypothesis

Under network instability, the offline-first architecture queues mutations locally and syncs when connectivity returns.

#### Preconditions

- [ ] Network link with configurable latency
- [ ] Order creation test scenario ready

#### Experiment Steps

```yaml
# Experiment Configuration
name: network_instability
version: 1.0.0
description: Simulate network latency and packet loss

environment:
    type: staging
    network: vercel_edge

injection:
    method: traffic_control
    parameters:
        latency_ms: 2000
        jitter_ms: 500
        packet_loss_percent: 10
        correlation_percent: 25

duration:
    minutes: 15
    ramp_up: 1 minute
    ramp_down: 1 minute

monitoring:
    metrics:
        - api_request_duration
        - api_timeout_rate
        - offline_queue_size
        - sync_success_rate
    alerts:
        - timeout_rate > 20%
        - queue_size > 50

rollback:
    automatic: true
    timeout: 60 seconds
    method: remove_latency
```

#### Expected Observations

1. API calls take 2-4 seconds
2. Some requests timeout (10-15%)
3. Offline queue accumulates mutations
4. Queue syncs after latency resolves

#### Success Criteria

- [ ] No data loss from timeouts
- [ ] Offline queue processes correctly
- [ ] User sees queue status indicator
- [ ] Sync completes without duplicates

---

### Experiment 6: High Load/Stress Conditions

#### Hypothesis

Under peak load conditions (10x normal traffic), critical restaurant operations remain functional with degraded performance.

#### Preconditions

- [ ] Load testing tool configured (k6)
- [ ] Baseline performance metrics established
- [ ] Auto-scaling policies verified

#### Experiment Steps

```yaml
# Experiment Configuration
name: high_load_stress
version: 1.0.0
description: Stress test with 10x normal traffic

environment:
    type: staging
    load_target: vercel_staging

injection:
    method: load_injection
    tool: k6
    scenario: peak_flow_scenarios.js
    parameters:
        vus: 500 # Virtual users
        duration: 30m
        ramp_up: 5m

monitoring:
    metrics:
        - requests_per_second
        - error_rate
        - p50_latency
        - p95_latency
        - p99_latency
        - db_connection_pool_usage
    alerts:
        - error_rate > 1%
        - p95_latency > 5000ms
        - pool_usage > 90%

rollback:
    automatic: true
    timeout: 120 seconds
    method: stop_k6
```

#### Expected Observations

1. Request rate reaches 5000 RPS
2. Error rate remains < 1%
3. p95 latency < 5 seconds
4. Database pool doesn't exhaust

#### Success Criteria

- [ ] Order creation succeeds > 99% of time
- [ ] KDS updates within 2 seconds
- [ ] No cascade failures
- [ ] Auto-scaling responds appropriately

---

## Runbooks

### General Experiment Runbook

#### Pre-Experiment Checklist

- [ ] Experiment design reviewed and approved
- [ ] Rollback procedure documented and tested
- [ ] On-call engineer notified
- [ ] Monitoring dashboards prepared
- [ ] Incident channel ready (Slack #chaos-experiments)
- [ ] Team aware of experiment window
- [ ] Database backups verified recent
- [ ] Feature flags for experiment enabled

#### During Experiment

1. **Start Monitoring**

    ```
    Open dashboard: Grafana - Chaos Experiment View
    Set refresh: 10 seconds
    ```

2. **Execute Injection**

    ```
    Apply chaos configuration
    Document start time
    Announce in #chaos-experiments
    ```

3. **Observe and Document**
    - Record all observations in experiment log
    - Note timestamp of any anomalies
    - Capture screenshots of error states
    - Document recovery behaviors

4. **If Alert Fires**
    - Evaluate if expected or unexpected
    - If unexpected: stop experiment immediately
    - If expected: continue with enhanced monitoring

#### Post-Experiment

1. **Cleanup**
    - Remove injection configuration
    - Verify all systems normal
    - Clear feature flags

2. **Analysis**
    - Compare to success criteria
    - Document deviations
    - Identify root causes of failures
    - Update experiment design if needed

3. **Reporting**
    - Complete experiment report template
    - Share findings in #chaos-experiments
    - Update runbook with lessons learned

---

### Database Failure Runbook

#### Quick Reference

| Item             | Value            |
| ---------------- | ---------------- |
| Severity Trigger | error_rate > 10% |
| Auto-Rollback    | 5 minutes        |
| Contact          | Database Team    |

#### Step-by-Step

1. **Pre-Flight**

    ```bash
    # Verify database accessible
    psql $STAGING_DB_URL -c "SELECT 1"
    # Check connection pool
    supabase db stats
    ```

2. **Start Experiment**

    ```bash
    # Apply firewall rule (staging)
    gcloud compute firewall-rules create chaos-db-block \
      --direction=INGRESS \
      --priority=1000 \
      --action=DENY \
      --source-ranges=10.0.0.0/8 \
      --target-tags=vercel-staging
    ```

3. **Observe**
    - Watch API error dashboard
    - Check order creation attempts
    - Verify error messages are user-friendly

4. **Rollback**

    ```bash
    # Remove firewall rule
    gcloud compute firewall-rules delete chaos-db-block --quiet
    ```

5. **Verify Recovery**
    ```bash
    # Test connectivity
    psql $STAGING_DB_URL -c "SELECT 1"
    # Check for queued syncs
    curl https://api.staging.lole.io/api/sync/status
    ```

---

### Payment Provider Failure Runbook

#### Quick Reference

| Item             | Value                 |
| ---------------- | --------------------- |
| Severity Trigger | payment_failure > 50% |
| Auto-Rollback    | 2 minutes             |
| Contact          | Payments Team         |

#### Step-by-Step

1. **Pre-Flight**

    ```bash
    # Verify Chapa sandbox accessible
    curl -X POST https://api.chapa.co/v1/transaction/verify \
      -H "Authorization: Bearer $TEST_KEY" \
      -d '{"tx_ref":"test"}'
    ```

2. **Start Experiment**

    ```bash
    # Configure payment mock to return 503
    # Via feature flag or direct config
    echo "payment_provider: mock_503" > .env.local
    ```

3. **Observe**
    - Check payment failure rate
    - Verify cash option appears
    - Test order completion flow

4. **Rollback**

    ```bash
    # Restore normal payment config
    echo "payment_provider: chapa" > .env.local
    # Restart service
    vercel --prod
    ```

5. **Verify Recovery**
    - Process test payment
    - Verify webhook delivery
    - Check revenue dashboard

---

### Auth Service Failure Runbook

#### Quick Reference

| Item             | Value             |
| ---------------- | ----------------- |
| Severity Trigger | unauthorized > 5% |
| Auto-Rollback    | 3 minutes         |
| Contact          | Platform Team     |

#### Step-by-Step

1. **Pre-Flight**

    ```bash
    # Verify auth service
    curl https://staging.lole.io/api/auth/health
    ```

2. **Start Experiment**

    ```bash
    # Block auth traffic
    iptables -A INPUT -p tcp --dport 443 -m string \
      --string "supabase.co" --algo bm -j DROP
    ```

3. **Observe**
    - Check existing session status
    - Test new login attempt
    - Verify PIN fallback

4. **Rollback**

    ```bash
    # Remove blocking rule
    iptables -D INPUT -p tcp --dport 443 -m string \
      --string "supabase.co" --algo bm -j DROP
    ```

5. **Verify Recovery**
    - Test token refresh
    - Verify session continuity

---

### Network Instability Runbook

#### Quick Reference

| Item             | Value               |
| ---------------- | ------------------- |
| Severity Trigger | timeout_rate > 20%  |
| Auto-Rollback    | 5 minutes           |
| Contact          | Infrastructure Team |

#### Step-by-Step

1. **Pre-Flight**

    ```bash
    # Baseline latency check
    curl -w "%{time_total}" https://staging.lole.io/api/health
    ```

2. **Start Experiment**

    ```bash
    # Apply network chaos (using tc or chaos-mesh)
    tc qdisc add dev eth0 root netem delay 2000ms 500ms loss 10%
    ```

3. **Observe**
    - Monitor API timeout rate
    - Check offline queue growth
    - Verify sync behavior

4. **Rollback**

    ```bash
    # Remove network chaos
    tc qdisc del dev eth0 root
    ```

5. **Verify Recovery**
    - Verify queue processes
    - Check for duplicate orders
    - Confirm data integrity

---

## Safe Execution Procedures

### Approval Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                    Chaos Experiment Flow                     │
└─────────────────────────────────────────────────────────────┘

  ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌────────┐
  │  Design  │────▶│  Review  │────▶│   Dry    │────▶│ Run in │
  │          │     │          │     │   Run    │     │ Prod   │
  └──────────┘     └──────────┘     └──────────┘     └────────┘
      │               │               │               │
      ▼               ▼               ▼               ▼
  Experiment    Team Lead      Engineering     On-call +
  Plan          Approval       Manager         Incident Ready
```

### Approval Matrix

| Experiment Type  | Staging   | Production (Low Risk) | Production (Full)   |
| ---------------- | --------- | --------------------- | ------------------- |
| Database Failure | Team Lead | Engineering Manager   | VP Engineering      |
| Redis Failure    | Team Lead | Engineering Manager   | VP Engineering      |
| Payment Provider | Team Lead | Payments Lead         | VP Engineering      |
| Auth Failure     | Team Lead | Platform Lead         | VP Engineering      |
| Network Latency  | Team Lead | Engineering Manager   | Engineering Manager |
| Stress Testing   | Team Lead | Engineering Manager   | VP Engineering      |

### Rollback Triggers

Stop experiment immediately if any of:

1. **Customer Impact**
    - Error rate > 20% for 1 minute
    - Payment failures > 50%
    - Auth unable to recover

2. **Data Integrity**
    - Data inconsistency detected
    - Duplicate records created
    - Transaction failures without cleanup

3. **Cascade Failure**
    - Secondary system fails
    - Recovery time > 10 minutes
    - Alert storm triggered

### Rollback Procedure (Reference)

See [Rollback Procedures](./rollback-procedures.md) for detailed rollback commands.

---

## Automation

### GitHub Actions Workflow

```yaml
name: Chaos Experiment

on:
    workflow_dispatch:
        inputs:
            experiment:
                type: choice
                options:
                    - db_failure
                    - redis_failure
                    - payment_failure
                    - auth_failure
                    - network_latency
                    - stress_test
            environment:
                type: choice
                options:
                    - staging
                    - production
            intensity:
                type: choice
                options:
                    - low
                    - medium
                    - high

jobs:
    chaos-experiment:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v4

            - name: Configure Chaos
              run: |
                  echo "experiment=${{ github.event.inputs.experiment }}" >> $GITHUB_ENV
                  echo "environment=${{ github.event.inputs.environment }}" >> $GITHUB_ENV
                  echo "intensity=${{ github.event.inputs.intensity }}" >> $GITHUB_ENV

            - name: Pre-flight Checks
              run: ./scripts/chaos/preflight.sh

            - name: Start Monitoring
              run: ./scripts/chaos/start-monitoring.sh

            - name: Run Experiment
              run: ./scripts/chaos/run-experiment.sh

            - name: Collect Results
              if: always()
              run: ./scripts/chaos/collect-results.sh

            - name: Rollback if Needed
              if: failure()
              run: ./scripts/chaos/rollback.sh

            - name: Notify
              if: always()
              run: ./scripts/chaos/notify.sh
```

### Scheduled Experiments

Recommended schedule for regular chaos:

| Experiment          | Frequency | Window      |
| ------------------- | --------- | ----------- |
| Database Failure    | Monthly   | Sat 2am EAT |
| Redis Failure       | Monthly   | Sat 3am EAT |
| Payment Failure     | Monthly   | Sat 4am EAT |
| Auth Failure        | Bi-weekly | Sun 2am EAT |
| Network Instability | Monthly   | Sun 3am EAT |
| Stress Test         | Quarterly | Fri 1am EAT |

---

## Experiment Report Template

````markdown
# Chaos Experiment Report

## Experiment Details

- **Name**:
- **Date**:
- **Environment**:
- **Duration**:
- **Conducted By**:

## Hypothesis

<!-- What did we expect to happen? -->

## Experiment Configuration

```yaml
<!-- Include experiment config -->
```
````

## Results

### Metrics Observed

| Metric | Expected | Actual | Pass/Fail |
| ------ | -------- | ------ | --------- |
|        |          |        |           |

### Incidents

<!-- Any incidents that occurred? -->

## Observations

<!-- What actually happened? -->

## Lessons Learned

<!-- What did we learn? -->

## Action Items

- [ ]
- [ ]

## Next Steps

<!-- Follow-up experiments or improvements -->

```

---

## Related Documentation

- [Rollback Procedures](./rollback-procedures.md)
- [P0 Release Readiness and Rollback](../08-reports/rollout/p0-release-readiness-and-rollback.md)
- [Incident Triage Rubric](../09-runbooks/incident-triage-rubric.md)
- [Performance SLOs](../08-reports/performance/performance-slos.md)
- [Monitoring Dashboards](../05-infrastructure/monitoring/monitoring-dashboards.md)
- [Feature Flags](../03-product/feature-flags.md)
```
