# Remaining Implementation Tasks

> Last Updated: 2026-03-16
>
> This document tracks remaining implementations from the Critical Implementation Roadmap.

---

## ✅ Completed Implementations

| CRIT    | Status  | Notes                                                                                                                       |
| ------- | ------- | --------------------------------------------------------------------------------------------------------------------------- |
| CRIT-01 | ✅ DONE | Payment webhooks (Chapa), HMAC verification, event publishing                                                               |
| CRIT-02 | ✅ DONE | Santim monetary handling, ETB formatting                                                                                    |
| CRIT-03 | ✅ DONE | Event bus with Redis Streams, publishers, consumers, contract tests                                                         |
| CRIT-05 | ✅ DONE | PowerSync offline infrastructure, KDS sync, order sync, printer fallback, stale-device alerts with Vercel Crons, unit tests |
| CRIT-06 | ✅ DONE | Multi-tenant security, RLS, idempotency keys                                                                                |
| CRIT-07 | ✅ DONE | GraphQL Federation, Apollo Router, subgraph routes, JWT auth, CI workflows, service extraction validation                   |
| CRIT-08 | ✅ DONE | Sentry, health endpoints, alerting                                                                                          |
| CRIT-09 | ✅ DONE | Happy hour pricing, tip pooling, course firing                                                                              |
| CRIT-10 | ✅ DONE | KDS components, station boards                                                                                              |
| CRIT-11 | ✅ DONE | Notification queue, SMS retry, deduplication, waitlist, HMAC sessions, push fallback, observability                         |

---

## ❌ Not Started

### CRIT-04: Amharic-First Platform Enablement

**Priority:** P0 — Market Adoption Blocker

**Current State:** No i18n infrastructure exists

**Required Steps:**

- [ ]   1. Install and configure `next-intl`
- [ ]   2. Add locale middleware to `middleware.ts`
- [ ]   3. Create translation files:
    - [ ] `src/i18n/messages/am.json` (Amharic - default)
    - [ ] `src/i18n/messages/en.json` (English - fallback)
- [ ]   4. Configure Amharic as default locale in `next.config.ts`
- [ ]   5. Add Noto Sans Ethiopic font via `next/font`
- [ ]   6. Replace hardcoded strings in:
    - [ ] POS routes (`src/app/(pos)/`)
    - [ ] KDS routes (`src/app/(kds)/`)
    - [ ] Merchant dashboard
    - [ ] Guest ordering
- [ ]   7. Add bilingual database columns via migration
- [ ]   8. Add accessibility tests for RTL/bilingual

**Files to Create/Modify:**

- `src/i18n/` (new directory)
- `src/middleware.ts` (add locale handling)
- `next.config.ts` (add next-intl config)
- `supabase/migrations/*_bilingual.sql`

**Skills Required:**

- `nextjs-best-practices`
- `react-best-practices`
- `core-web-vitals`
- `accessibility-auditor`

---

### CRIT-11: Table, Guest, and Notification Reliability

**Priority:** P1 — Guest Experience

**Current State:** ✅ COMPLETE - All notification reliability features implemented

**Implemented Steps:**

- [x]   1. Implement SMS notification retry logic with exponential backoff
- [x]   2. Add notification deduplication to prevent spam
- [x]   3. Implement table waitlist notification flows
- [x]   4. Add HMAC-scoped guest tracking (secure session tokens)
- [x]   5. Create notification observability dashboard
- [x]   6. Add queue-based notification processing (via event bus)
- [x]   7. Implement delivery status tracking
- [x]   8. Add fallback to push notifications where SMS fails

**Files Created:**

- `src/lib/notifications/retry.ts` - SMS retry with exponential backoff
- `src/lib/notifications/deduplication.ts` - Notification deduplication
- `src/lib/waitlist/service.ts` - Waitlist service
- `src/lib/guest/session.ts` - HMAC-scoped sessions
- `src/lib/notifications/queue.ts` - Queue processor
- `src/lib/notifications/push.ts` - Push notifications
- `src/lib/notifications/fallback.ts` - SMS→push fallback
- `src/lib/monitoring/notification-metrics.ts` - Observability
- `supabase/migrations/20260316_crit11_notification_queue.sql`
- `supabase/migrations/20260317_crit11_push_notification_support.sql`
- `supabase/migrations/20260317_crit11_notification_metrics.sql`

**Skills Required:**

- `api-patterns`
- `security-best-practices`
- `react-best-practices`
- `testing-patterns`

---

## ✅ Completed Implementations (Continued)

### CRIT-07: GraphQL Federation and API Contract

**Priority:** P0 — API Governance

**Status:** ✅ COMPLETE

**What's Implemented:**

- ✅ GraphQL subgraph schemas in `graphql/subgraphs/` (orders, menu, payments, guests, staff)
- ✅ Apollo Router configuration with JWT authentication (`router/router.yaml`, `router/router.graphos.yaml`)
- ✅ Dockerfile for Apollo Router deployment (`router/Dockerfile`)
- ✅ Supergraph configuration for local development (`graphql/supergraph.yaml`)
- ✅ Domain resolvers for all subgraphs:
    - `src/domains/orders/resolvers.ts`
    - `src/domains/menu/resolvers.ts`
    - `src/domains/payments/resolvers.ts`
    - `src/domains/guests/resolvers.ts`
    - `src/domains/staff/resolvers.ts`
- ✅ Subgraph API routes for local development:
    - `src/app/api/subgraphs/orders/route.ts`
    - `src/app/api/subgraphs/menu/route.ts`
    - `src/app/api/subgraphs/payments/route.ts`
    - `src/app/api/subgraphs/guests/route.ts`
    - `src/app/api/subgraphs/staff/route.ts`
- ✅ GraphQL context types with JWT validation
- ✅ Shared subgraph handler utility (`src/lib/graphql/subgraph-handler.ts`)
- ✅ GraphQL code generator configuration (`codegen.yml`)
- ✅ CI workflow for schema validation (`.github/workflows/graphql-contract-check.yml`)
- ✅ CI workflow for publishing subgraphs (`.github/workflows/publish-graphql-subgraphs.yml`)
- ✅ Deployment documentation (`docs/08-reports/graphql/apollo-router-deployment.md`)

**Remaining (Future Enhancements):**

- [ ] Migrate REST endpoints to GraphQL mutations (gradual migration)
- [ ] Add schema review rules for deprecation workflow
- [ ] Set up Apollo GraphOS account and configure APOLLO_KEY

**Files Created/Modified:**

- `router/Dockerfile` - Production-ready Apollo Router image
- `router/router.yaml` - Router configuration with JWT auth, rate limiting, CORS
- `router/router.graphos.yaml` - GraphOS managed configuration
- `graphql/supergraph.yaml` - Local supergraph composition
- `src/app/api/subgraphs/*/route.ts` - All subgraph routes
- `src/domains/*/resolvers.ts` - Domain resolvers
- `docs/08-reports/graphql/apollo-router-deployment.md` - Deployment guide

---

## Implementation Dependencies

```
CRIT-04 (Amharic)     → Can start immediately
CRIT-07 (GraphQL)     → Can start immediately
CRIT-11 (Notifications) → Depends on CRIT-03 (Event Bus) ✅ DONE
```

---

## Remaining Items by CRIT (from CRITICAL_IMPLEMENTATION_STRATEGY.md)

### CRIT-04: Amharic-First Platform Enablement — ❌ Partial

- [x] Bilingual DB columns exist
- [ ] English available as fallback
- [ ] No untranslated hardcoded English in critical workflows
- [ ] Tablet performance within CWV targets after localization

### CRIT-05: Offline-First Sync Consolidation — ✅ COMPLETE

- [x] POS and KDS sustain 24-hour offline window
- [x] Reconnects don't duplicate orders/payments/actions
- [x] Sync conflicts resolve deterministically
- [x] **Stale-device alerts fire within threshold** (Vercel Cron configured, unit tests added)

### CRIT-07: GraphQL Federation and API Contract — ✅ COMPLETE

- [x] Internal surfaces consume governed GraphQL contract
- [x] Breaking schema changes prevented before merge (GitHub workflow exists)
- [x] Router centralizes auth and rate limiting
- [x] **Service extraction possible without client rewrites** (validation document created)

### CRIT-11: Table, Guest, and Notification Reliability — ✅ COMPLETE

- [x] Guest/host communication reliable during transitions
- [x] Notification retries don't spam or lose state
- [x] Delivery-readiness layerable without authz redesign

**Implemented Files:**

- `src/lib/notifications/retry.ts` - SMS retry with exponential backoff
- `src/lib/notifications/deduplication.ts` - Notification deduplication
- `src/lib/notifications/queue.ts` - Queue processor
- `src/lib/notifications/push.ts` - Push notifications
- `src/lib/notifications/fallback.ts` - SMS→push fallback
- `src/lib/waitlist/service.ts` - Waitlist management
- `src/lib/waitlist/types.ts` - Type definitions
- `src/lib/guest/session.ts` - HMAC-scoped guest sessions
- `src/lib/events/consumers/notification-processor.ts` - Event-driven notifications

---

## Notes

- The `critical-implementation-roadmap.md` has been deleted as all items are now tracked in this document
- Source of truth: `docs/08-reports/rollout/CRITICAL_IMPLEMENTATION_STRATEGY.md`
