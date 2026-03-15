# Observability and Alerting Setup

**CRIT-08 Implementation** — Addresses ENTERPRISE_MASTER_BLUEPRINT Section 13

This document describes the complete observability stack for Gebeta Restaurant OS, providing production visibility without a dedicated DevOps team.

---

## Overview

| Layer             | Tool          | Purpose                                 | Cost      |
| ----------------- | ------------- | --------------------------------------- | --------- |
| Error tracking    | Sentry        | Crashes, exceptions, POS offline errors | Free tier |
| Uptime monitoring | Better Uptime | Endpoint health, latency spikes         | Free tier |
| Health checks     | `/api/health` | Database, Redis, QStash status          | Built-in  |
| Alerting          | Telegram      | Critical incident notifications         | Free      |

---

## 1. Sentry Configuration

Sentry is already configured in the codebase with restaurant_id tagging for production debugging.

### Files

- `sentry.client.config.ts` — Client-side (browser) configuration
- `sentry.server.config.ts` — Server-side (Node.js) configuration
- `sentry.edge.config.ts` — Edge runtime configuration
- `src/lib/monitoring/sentry-context.ts` — Context utilities for tagging

### Environment Variables

```bash
# Required for Sentry
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_AUTH_TOKEN=...  # For source maps upload during build
```

### Restaurant ID Tagging

Every error is tagged with `restaurant_id` for filtering in Sentry UI:

```typescript
// Client-side: Set context when user logs in
import { setRestaurantContext } from '@/lib/monitoring';

setRestaurantContext({
    restaurantId: 'rest-123',
    restaurantName: 'Saba Grill',
    deviceType: 'pos',
});
```

### Filtering in Sentry UI

1. Go to Sentry → Issues
2. Add filter: `restaurant_id:rest-123`
3. See all errors for that specific restaurant

### POS-Specific Configuration

For POS routes, session replay captures full context:

```typescript
// In POS components
setRestaurantContext({
    restaurantId: activeRestaurant.id,
    restaurantName: activeRestaurant.name,
    deviceType: 'pos',
    userId: staffMember.id,
});
```

---

## 2. Health Check Endpoint

### Endpoint

```
GET /api/health
```

### Response

```json
{
  "status": "healthy",
  "timestamp": "2026-03-15T14:30:00.000Z",
  "version": "1.0.0",
  "uptime": 3600,
  "checks": {
    "database": { "status": "up", "latency": 15 },
    "redis": { "status": "up", "latency": 5 },
    "qstash": { "status": "up", "latency": 120 },
    "environment": { "status": "up", "configured": [...], "missing": [] }
  },
  "region": "iad1"
}
```

### Status Codes

- `200` — Healthy or Degraded (service is running)
- `503` — Unhealthy (critical dependency down)

### Status Levels

| Status      | Meaning                                    |
| ----------- | ------------------------------------------ |
| `healthy`   | All services operational                   |
| `degraded`  | Non-critical services down (Redis, QStash) |
| `unhealthy` | Critical service down (Database)           |

### Simple Health Check

For load balancers that just need up/down:

```
HEAD /api/health
```

Returns `200` if database is connected, `503` otherwise.

---

## 3. Better Uptime Configuration

### Setup Steps

1. Go to [betteruptime.com](https://betteruptime.com) and create a free account
2. Create a new monitor:
    - **URL**: `https://gebeta.app/api/health`
    - **Check type**: HTTP
    - **Check frequency**: 60 seconds
    - **Timeout**: 30 seconds
    - **Expected status**: 200

3. Configure incident escalation:
    - Add Telegram integration
    - Or use webhook to trigger `sendAlert()` directly

### Telegram Integration

1. In Better Uptime, go to Integrations → Telegram
2. Connect your Telegram account
3. Select the chat/channel for alerts
4. Customize the alert message template

### Alternative: Webhook Integration

Create a webhook endpoint that Better Uptime can call:

```typescript
// src/app/api/webhooks/uptime/route.ts
import { sendCriticalAlert } from '@/lib/monitoring/alerts';

export async function POST(request: Request) {
    const body = await request.json();

    if (body.alert_type === 'down') {
        await sendCriticalAlert(`Endpoint ${body.monitor_url} is down`, {
            monitor_name: body.monitor_name,
            error: body.error_details,
            checked_at: body.checked_at,
        });
    }

    return Response.json({ received: true });
}
```

---

## 4. Telegram Alert System

### Environment Variables

```bash
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_ALERT_CHAT_ID=-1001234567890
```

### Getting Bot Token

1. Open Telegram and search for `@BotFather`
2. Send `/newbot` and follow instructions
3. Copy the API token

### Getting Chat ID

For private chat:

```bash
# Send a message to your bot, then:
curl "https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates"
```

For group/channel:

1. Add the bot to the group
2. Send a message mentioning the bot
3. Use `getUpdates` to find the chat ID (negative number for groups)

### Usage in Code

```typescript
import { sendAlert, Alerts } from '@/lib/monitoring';

// Generic alert
await sendAlert('critical', 'Database connection pool exhausted', {
    utilization_percent: 85,
    active_connections: 45,
});

// Predefined alerts
await Alerts.posOffline('rest-123', 'Saba Grill', 5);
await Alerts.paymentWebhookSilent('chapa', 10);
await Alerts.lowStock('rest-123', 'Saba Grill', 'Tibbs', 5, 10);
```

### Alert Levels

| Level      | Emoji | Use Case                        |
| ---------- | ----- | ------------------------------- |
| `critical` | 🔴    | Revenue impact, service down    |
| `warning`  | 🟡    | Degraded performance, low stock |
| `info`     | ℹ️    | Deployments, maintenance        |

### Testing Alerts

```typescript
import { testAlerts } from '@/lib/monitoring/alerts';

const result = await testAlerts();
console.log(result.message);
```

Or via API:

```bash
curl -X POST https://gebeta.app/api/test-alerts
```

---

## 5. Critical Alerts Reference

Configure these alerts before signing your first restaurant:

| Alert                  | Trigger                                 | Severity | Response Time     |
| ---------------------- | --------------------------------------- | -------- | ----------------- |
| POS offline            | No sync for 5 min during business hours | Critical | 10 min            |
| Payment webhook silent | No callback in 10 min after initiation  | Critical | 10 min            |
| Payment failure rate   | >5% failures in 10-min window           | Critical | 10 min            |
| API P99 latency        | >2s for 5 consecutive minutes           | Warning  | 1 hour            |
| DB connection pool     | >80% utilization                        | Critical | 10 min            |
| Job queue backlog      | QStash depth >100 jobs                  | Critical | 30 min            |
| Low stock              | Stock <= reorder level                  | Warning  | Next business day |

---

## 6. Monitoring Checklist

### Daily (2 minutes)

- [ ] Check Sentry for new error groups
- [ ] Review Better Uptime status page
- [ ] Check Telegram for overnight alerts
- [ ] Verify EOD reports sent at 10PM EAT

### Weekly

- [ ] Review Supabase dashboard: slow queries, connection pool
- [ ] Check Upstash: Redis memory, QStash failure rate
- [ ] Review Sentry error trends by restaurant_id

### When Onboarding a New Restaurant

- [ ] Verify Sentry tagging works (place test order, check Sentry)
- [ ] Test Telebirr payment end-to-end
- [ ] Test Chapa payment end-to-end
- [ ] Confirm EOD Telegram report at 10PM on first day

---

## 7. Incident Response

### POS Offline Alert

1. Check `/api/health` manually
2. Check Supabase status (status.supabase.com)
3. Check PowerSync status
4. If Supabase down → POS works offline for 24h, inform restaurant
5. Check Sentry for error spike

### Payment Webhook Failing

1. Check `/api/webhooks/chapa` or `/api/webhooks/telebirr` in logs
2. Verify webhook URL in provider dashboard: `https://gebeta.app/api/webhooks/chapa`
3. Check `CHAPA_WEBHOOK_SECRET` env var matches dashboard
4. Check QStash for failed jobs

### Database Connection Pool Exhausted

1. Verify pgBouncer is enabled in Supabase
2. Verify all `DATABASE_URL` use pooler URL
3. If critical: Supabase Pro allows up to 60 direct connections
4. Long term: upgrade to Supabase Team

---

## 8. Cost Summary

| Service       | Tier | Monthly Cost |
| ------------- | ---- | ------------ |
| Sentry        | Free | $0           |
| Better Uptime | Free | $0           |
| Telegram      | Free | $0           |
| **Total**     |      | **$0**       |

At 500+ restaurants, consider:

- Sentry Team ($26/mo) for more events
- Better Uptime Pro ($20/mo) for more endpoints
- Axiom (free 25GB/mo) for structured logs

---

## References

- [ENTERPRISE_MASTER_BLUEPRINT.md](../1.%20Engineering%20Foundation/0.%20ENTERPRISE_MASTER_BLUEPRINT.md) — Section 13: Monitoring & Observability
- [ENGINEERING_RUNOOK.md](../1.%20Engineering%20Foundation/6.%20ENGINEERING_RUNOOK.md) — Incident runbook
- [Sentry Documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Better Uptime Documentation](https://betteruptime.com/docs)
- [Telegram Bot API](https://core.telegram.org/bots/api)
