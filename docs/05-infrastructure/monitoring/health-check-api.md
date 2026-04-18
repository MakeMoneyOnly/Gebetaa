# Health Check API

lole exposes three health check endpoints for monitoring, Kubernetes probes, and external uptime monitoring.

## Endpoints Overview

| Endpoint             | Method | Path                | Purpose                                       |
| -------------------- | ------ | ------------------- | --------------------------------------------- |
| Comprehensive Health | `GET`  | `/api/health`       | Full system health with all dependency checks |
| Liveness Probe       | `GET`  | `/api/health/live`  | Lightweight check — is the process alive?     |
| Readiness Probe      | `GET`  | `/api/health/ready` | Is the service ready to accept traffic?       |

All endpoints support `HEAD` requests for load-balancer checks. The comprehensive endpoint also supports `OPTIONS` as an ultra-light liveness signal.

---

## 1. Comprehensive Health — `GET /api/health`

### Purpose

Returns the full system health status including all dependency checks, payment provider status, circuit breaker states, and performance metrics. Used by Better Uptime for external monitoring with Telegram alerting.

### Checks Performed

| Check             | Critical?  | Description                                                                                                                                       |
| ----------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `database`        | Yes        | Queries `restaurants` table to verify Supabase DB connectivity                                                                                    |
| `redis`           | Yes (prod) | Pings Upstash Redis via REST API; falls back to legacy `REDIS_URL`                                                                                |
| `supabase`        | Yes        | Alias for database check plus connection pool config (`pool_enabled`, `pool_mode`, `pool_size`)                                                   |
| `qstash`          | Yes (prod) | Queries QStash API (`/v2/messages`) to verify job queue availability                                                                              |
| `memory`          | Yes        | Checks process heap usage; fails above 90%, warns above 80%                                                                                       |
| `environment`     | Yes        | Validates required env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`) and reports optional ones |
| `payments`        | No         | Checks Chapa (`CHAPA_SECRET_KEY`) and Telebirr (`TELEBIRR_APP_ID` + `TELEBIRR_APP_KEY`) configuration                                             |
| `circuitBreakers` | No         | Reports state (`CLOSED`/`OPEN`/`HALF_OPEN`) and failure counts from the circuit breaker registry                                                  |
| `performance`     | No         | Aggregates slow and critical operation counts from the performance metrics store                                                                  |

### Status Logic

| Overall Status | Condition                                                                                                 | HTTP Code |
| -------------- | --------------------------------------------------------------------------------------------------------- | --------- |
| `healthy`      | All checks pass                                                                                           | `200`     |
| `degraded`     | Non-critical services (Redis, QStash) down in non-production environments                                 | `200`     |
| `unhealthy`    | Database down, required env vars missing, memory critical, or Redis/QStash `not_configured` in production | `503`     |

### Response Format

```json
{
    "status": "healthy",
    "timestamp": "2026-04-10T05:00:00.000Z",
    "uptime": 86400,
    "version": "0.1.0",
    "commit": "a1b2c3d",
    "checks": {
        "database": {
            "status": "pass",
            "latency_ms": 12,
            "message": "Database connected"
        },
        "redis": {
            "status": "pass",
            "latency_ms": 8,
            "message": "Redis connected"
        },
        "supabase": {
            "status": "pass",
            "latency_ms": 12,
            "message": "Database connected",
            "pool_enabled": true,
            "pool_mode": "transaction",
            "pool_size": 10
        },
        "qstash": {
            "status": "pass",
            "latency_ms": 45,
            "message": "QStash connected"
        },
        "memory": {
            "status": "pass",
            "used_mb": 128,
            "limit_mb": 1024,
            "message": "Memory usage normal: 12.5%"
        },
        "environment": {
            "status": "pass",
            "configured": [
                "NEXT_PUBLIC_SUPABASE_URL",
                "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
                "SUPABASE_SECRET_KEY",
                "UPSTASH_REDIS_REST_URL"
            ],
            "missing": []
        },
        "payments": [
            {
                "name": "chapa",
                "status": "pass",
                "latency_ms": 0,
                "message": "Chapa API key configured"
            },
            {
                "name": "telebirr",
                "status": "not_configured",
                "message": "TELEBIRR_APP_ID or TELEBIRR_APP_KEY not set"
            }
        ],
        "circuitBreakers": [
            {
                "name": "payment-service",
                "state": "CLOSED",
                "failureCount": 0
            }
        ],
        "performance": {
            "totalOperations": 1500,
            "slowOperations": 3,
            "criticalOperations": 0,
            "alerts": []
        }
    },
    "region": "iad1"
}
```

### Unhealthy Response (`503`)

```json
{
    "status": "unhealthy",
    "timestamp": "2026-04-10T05:00:00.000Z",
    "uptime": 86400,
    "version": "0.1.0",
    "checks": {
        "database": {
            "status": "fail",
            "latency_ms": 5000,
            "message": "connection refused"
        },
        "redis": { "status": "pass", "latency_ms": 8, "message": "Redis connected" },
        "supabase": { "status": "fail", "latency_ms": 5000, "message": "connection refused" },
        "qstash": { "status": "not_configured", "message": "QStash not configured" },
        "memory": {
            "status": "pass",
            "used_mb": 200,
            "limit_mb": 1024,
            "message": "Memory usage normal: 19.5%"
        },
        "environment": { "status": "pass", "configured": [], "missing": [] },
        "payments": [],
        "circuitBreakers": [],
        "performance": {
            "totalOperations": 0,
            "slowOperations": 0,
            "criticalOperations": 0,
            "alerts": []
        }
    },
    "region": "iad1"
}
```

### Additional Methods

- **`HEAD /api/health`** — Returns `200` if database is reachable, `503` otherwise. No body.
- **`OPTIONS /api/health`** — Always returns `200` with `X-Server-Status: alive`. Ultra-light liveness signal.

### Response Headers

| Header            | Description                           |
| ----------------- | ------------------------------------- |
| `Cache-Control`   | `no-store, no-cache, must-revalidate` |
| `X-Health-Status` | `healthy`, `degraded`, or `unhealthy` |
| `X-Response-Time` | Total response processing time in ms  |

---

## 2. Liveness Probe — `GET /api/health/live`

### Purpose

Determines whether the application process is alive and responding to HTTP requests. Used by Kubernetes to decide if a pod needs to be restarted.

### Checks Performed

None. This endpoint is intentionally lightweight — no database, Redis, or external service calls. It only confirms the server process is running. Target response time: **< 100ms**.

### Status Logic

Always returns `200` if the server is responding. If the server cannot respond, the liveness probe will time out and Kubernetes will handle the restart.

### Response Format

```json
{
    "alive": true,
    "timestamp": "2026-04-10T05:00:00.000Z",
    "uptime_seconds": 86400,
    "response_time_ms": 2
}
```

### Additional Methods

- **`HEAD /api/health/live`** — Returns `200` with `X-Alive-Status: alive`. No body.

### Response Headers

| Header            | Description                           |
| ----------------- | ------------------------------------- |
| `Cache-Control`   | `no-store, no-cache, must-revalidate` |
| `X-Alive-Status`  | `alive`                               |
| `X-Response-Time` | Response processing time in ms        |

---

## 3. Readiness Probe — `GET /api/health/ready`

### Purpose

Determines whether the service is ready to receive traffic. Used by Kubernetes to decide if a pod should be added to the service load-balancer endpoints.

### Checks Performed

| Check      | Critical? | Description                                                                                      |
| ---------- | --------- | ------------------------------------------------------------------------------------------------ |
| `database` | Yes       | Queries `restaurants` table to verify Supabase DB connectivity                                   |
| `redis`    | No        | Pings Upstash Redis via REST API (3s timeout); optional — missing config does not fail readiness |

### Status Logic

| Condition               | HTTP Code |
| ----------------------- | --------- |
| Database is reachable   | `200`     |
| Database is unreachable | `503`     |

Redis unavailability does not cause a readiness failure. If Redis is not configured, the check reports `pass` with a message indicating it is optional.

### Response Format — Ready (`200`)

```json
{
    "ready": true,
    "timestamp": "2026-04-10T05:00:00.000Z",
    "checks": {
        "database": {
            "status": "pass",
            "latency_ms": 15,
            "message": "Database connected"
        },
        "redis": {
            "status": "pass",
            "latency_ms": 8,
            "message": "Redis connected"
        }
    },
    "response_time_ms": 25
}
```

### Response Format — Not Ready (`503`)

```json
{
    "ready": false,
    "timestamp": "2026-04-10T05:00:00.000Z",
    "checks": {
        "database": {
            "status": "fail",
            "latency_ms": 3000,
            "message": "connection refused"
        },
        "redis": {
            "status": "pass",
            "latency_ms": 8,
            "message": "Redis connected"
        }
    },
    "response_time_ms": 3010
}
```

### Response Headers

| Header            | Description                           |
| ----------------- | ------------------------------------- |
| `Cache-Control`   | `no-store, no-cache, must-revalidate` |
| `X-Ready-Status`  | `ready` or `not_ready`                |
| `X-Response-Time` | Total response processing time in ms  |

---

## Kubernetes Probe Configuration

```yaml
apiVersion: v1
kind: Pod
spec:
    containers:
        - name: lole
          ports:
              - containerPort: 3000

          # Liveness: restart the pod if the process is unresponsive
          livenessProbe:
              httpGet:
                  path: /api/health/live
                  port: 3000
              initialDelaySeconds: 30
              periodSeconds: 30
              timeoutSeconds: 5
              failureThreshold: 3

          # Readiness: remove pod from service endpoints if dependencies are down
          readinessProbe:
              httpGet:
                  path: /api/health/ready
                  port: 3000
              initialDelaySeconds: 10
              periodSeconds: 10
              timeoutSeconds: 5
              failureThreshold: 3

          # Startup: use comprehensive check during initial startup
          # (optional — only if startup may be slow due to migrations)
          startupProbe:
              httpGet:
                  path: /api/health
                  port: 3000
              initialDelaySeconds: 5
              periodSeconds: 10
              timeoutSeconds: 30
              failureThreshold: 30
```

### Probe Tuning Guidelines

| Parameter             | Liveness | Readiness | Rationale                                                                                  |
| --------------------- | -------- | --------- | ------------------------------------------------------------------------------------------ |
| `initialDelaySeconds` | 30       | 10        | Liveness needs more time to avoid premature restarts during cold start                     |
| `periodSeconds`       | 30       | 10        | Liveness is checked less frequently; readiness is checked often to route traffic correctly |
| `timeoutSeconds`      | 5        | 5         | Both should respond well within 5s                                                         |
| `failureThreshold`    | 3        | 3         | 3 consecutive failures before action — avoids flapping                                     |

---

## Monitoring Setup — Better Uptime

### Recommended Configuration

| Setting              | Value                                                       |
| -------------------- | ----------------------------------------------------------- |
| Monitor type         | HTTP(s)                                                     |
| URL                  | `https://<domain>/api/health`                               |
| Method               | `GET`                                                       |
| Polling interval     | 60 seconds                                                  |
| Request timeout      | 30 seconds                                                  |
| Expected status code | `200`                                                       |
| Keyword check        | `"status": "healthy"` (optional — alerts on `degraded` too) |
| SSL verification     | Enabled                                                     |
| Follow redirects     | Disabled                                                    |

### Alerting Configuration

| Channel          | Condition                   | Escalation               |
| ---------------- | --------------------------- | ------------------------ |
| Telegram         | Non-200 response or timeout | Immediate — on-call      |
| Email            | Status `degraded`           | Next business day review |
| Slack (optional) | Any status change           | Info channel             |

### Telegram Alert Setup

1. Create a Telegram bot via `@BotFather` and obtain the bot token.
2. Create a group or channel and add the bot.
3. Get the chat ID from the group/channel.
4. Configure `TELEGRAM_BOT_TOKEN` and `TELEGRAM_ALERT_CHAT_ID` environment variables.
5. In Better Uptime, add a Telegram integration pointing to the same chat.

---

## Status Codes Summary

| Code  | Condition                           | Endpoints                          |
| ----- | ----------------------------------- | ---------------------------------- |
| `200` | Service is healthy, alive, or ready | All                                |
| `503` | Service is unhealthy or not ready   | `/api/health`, `/api/health/ready` |

Note: `/api/health/live` always returns `200` when the server is responding. Liveness failures manifest as timeouts rather than `503` responses.

---

## Architecture Decision: Three-Endpoint Model

The three-endpoint separation follows the Kubernetes probe pattern:

- **`/api/health`** — Full diagnostics. Expensive (runs all checks in parallel). Used by external monitoring. Returns `200` for both `healthy` and `degraded` states so that alerts can be tuned per-check rather than on a binary up/down basis.
- **`/api/health/live`** — Cheapest possible check. No external calls. If this fails, the process needs a restart.
- **`/api/health/ready`** — Focused on traffic-readiness. Checks only the critical path (database). Fast and decisive.

This separation avoids the common failure mode where a slow database check causes liveness probe timeouts, triggering unnecessary pod restarts.

---

## Known Documentation Issues

Some runbooks and internal documentation reference the following endpoints that **do not exist** in the codebase:

- `/api/health`
- `/api/health`
- `/api/health`

Payment provider health is reported as part of the `checks.payments` array within the comprehensive `GET /api/health` response. There is no standalone `/api/health` endpoint.

Realtime and KDS health are not currently checked by any health endpoint. If granular checks for these subsystems are needed, they should be added to the comprehensive health check's `checks` object rather than as separate routes.

**Action required**: Update any runbooks referencing these non-existent endpoints to point to `GET /api/health` and note that subsystem status is available in the `checks` field of the response.

---

## Source Code

| Endpoint            | File                                |
| ------------------- | ----------------------------------- |
| `/api/health`       | `src/app/api/health/route.ts`       |
| `/api/health/live`  | `src/app/api/health/live/route.ts`  |
| `/api/health/ready` | `src/app/api/health/ready/route.ts` |
