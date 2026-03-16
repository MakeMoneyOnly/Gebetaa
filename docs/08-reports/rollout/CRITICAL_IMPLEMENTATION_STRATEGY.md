# Critical Implementation Strategy

## Gebeta Restaurant OS — Enterprise Implementation Roadmap

**Version 1.0 · March 2026**

---

## Executive Summary

This document provides a comprehensive implementation strategy for all Critical implementations identified in the Enterprise Master Blueprint (`docs/1. Engineering Foundation/0. ENTERPRISE_MASTER_BLUEPRINT.md`).

### Source of Truth Order

1. User request in current task
2. `AGENTS.md`
3. `docs/1. Engineering Foundation/0. ENTERPRISE_MASTER_BLUEPRINT.md`
4. Engineering Foundation companion documents (PRD, Tech_Stack, System_Architecture, Database_Schema, API_Design_Guide, ENGINEERING_RUNBOOK)
5. Repo rules: `.clinerules`, `.cursorrules`

---

## Implementation Waves

| Wave | Focus Area | Critical Items | Timeline |
|------|------------|----------------|----------|
| **Wave 1** | Immediate Business Risk | CRIT-01, CRIT-02, CRIT-03, CRIT-08 | Week 1-2 |
| **Wave 2** | Addis Market Readiness | CRIT-04, CRIT-05, CRIT-06 | Week 3-7 |
| **Wave 3** | Contract & Scale | CRIT-07, CRIT-08 (full) | Week 8-15 |
| **Wave 4** | Feature Parity | CRIT-09, CRIT-10, CRIT-11 | Week 16+ |

---

## CRIT-01: Payment Webhook Pipeline and Auto-Confirmation

### Priority: P0 — Immediate Business Risk

### Blueprint Reference
- Section 16: Payment Methods and P0 webhook requirement
- Section 18 Sprint 1.1 and 1.2

### Payment Gateway Strategy
**Chapa is the sole payment gateway** — it provides unified access to:
- Telebirr (mobile money)
- CBE Birr (bank transfer)
- Cards (Visa/Mastercard)
- Other Ethiopian banks and wallets

This consolidation simplifies integration and provides a single webhook endpoint for all payment methods.

### Supporting Documents
| Document | Sections |
|----------|----------|
| PRD | F-01, F-03, F-06, Reliability, Security |
| Tech Stack | Payments, Messaging & Events |
| System Architecture | Payment Webhook Flow, Event Bus |
| Database Schema | Payments & Finance, Triggers |
| API Design Guide | REST Webhooks, POST /api/webhooks/chapa |
| Engineering Runbook | Payment Webhook Failing, Secret Rotation |

### Required Skills
- `SKILLS/security/security-best-practices/SKILL.md` — HMAC verification
- `SKILLS/security/api-security-best-practices/SKILL.md` — Webhook security
- `SKILLS/development/api-patterns/SKILL.md` — REST endpoints
- `SKILLS/development/nextjs-best-practices/SKILL.md` — App Router API routes
- `SKILLS/development/testing-patterns/SKILL.md` — Integration tests

### Implementation Steps

1. **Create Chapa Webhook Handler** (`src/app/api/webhooks/chapa/route.ts`)
   - Verify HMAC-SHA256 signature with timing-safe comparison
   - Return HTTP 200 immediately after signature validation
   - Publish `payment.completed` event to event bus
   - Never process business logic synchronously
   - Handle all payment methods (Telebirr, cards, banks, wallets)

2. **Create Payment Confirmation Consumer** (`src/lib/events/consumers/payment-confirmation.ts`)
   - Update `payments.status` to 'captured'
   - Update `orders.status` to 'confirmed'
   - Record audit log entry
   - Publish `order.confirmed` event

3. **Add Replay Protection** (`src/lib/payments/idempotency.ts`)
   - Check if webhook already processed using Redis
   - 24-hour TTL for processed webhook tracking

4. **Add Integration Tests** (`src/app/api/__tests__/webhooks.test.ts`)
   - Invalid signature rejection
   - Valid signature acceptance
   - Duplicate callback idempotency

5. **Add Silent Callback Detection** (`src/lib/monitoring/payment-webhook-monitor.ts`)
   - Monitor for payment sessions without callbacks within threshold
   - Alert on silent callbacks within 10 minutes

### Deliverables
- [x] `src/app/api/webhooks/chapa/route.ts`
- [x] Payment confirmation consumer (`src/lib/payments/payment-event-consumer.ts`)
- [x] Replay protection utilities (idempotency keys in webhooks)
- [x] Integration tests
- [x] Silent callback alert detection

### Success Criteria
- [x] Digital payments auto-confirm without manual staff action
- [x] Duplicate callbacks are idempotent
- [x] No synchronous business logic in webhook handlers
- [x] Silent callback gap detectable within 10 minutes

---

## CRIT-02: Santim Monetary Migration

### Priority: P0 — Financial Integrity

### Blueprint Reference
- Section 9: P0 This Week: Santim Migration
- Section 19 Law 02: All money is integer santim

### Supporting Documents
| Document | Sections |
|----------|----------|
| PRD | F-01, F-04, Performance |
| Tech Stack | Database, Payments |
| System Architecture | Database Architecture |
| Database Schema | Orders, Payments & Finance |
| API Design Guide | Monetary Values in GraphQL |
| Engineering Runbook | Database Migration |

### Required Skills
- `SKILLS/database/supabase-postgres-best-practices/SKILL.md`
- `SKILLS/database/postgres-schema-design/SKILL.MD`
- `SKILLS/development/api-patterns/SKILL.md`
- `SKILLS/development/testing-patterns/SKILL.md`

### Implementation Steps

1. **Inventory Money Columns**
   - orders.total_price, orders.discount_amount
   - order_items.unit_price
   - payments.amount, refunds.amount, payouts.amount
   - reconciliation_entries.amount
   - menu_items.price, modifier_options.price_adjustment

2. **Create Migration** (`supabase/migrations/YYYYMMDD_crit02_santim.sql`)
   - Add santim columns (INTEGER)
   - Backfill: santim = ROUND(decimal * 100)
   - Verify zero NULLs
   - Add NOT NULL constraints
   - Rename legacy columns
   - Add currency_code column

3. **Update TypeScript Types** (`src/types/database.ts`)
   - All monetary fields as INTEGER

4. **Create Formatting Utilities** (`src/lib/utils/monetary.ts`)
   - santimToETB(), etbToSantim(), formatETB()

5. **Add Regression Tests** (`src/lib/utils/monetary.test.ts`)

### Success Criteria
- [x] No decimal/float money arithmetic in production
- [x] Receipts, exports, refunds balance exactly in santim
- [x] Existing data migrates without loss
- [x] Query plans within SLO envelope

---

## CRIT-03: Event Bus and Background Jobs

### Priority: P0 — Architectural Foundation

### Blueprint Reference
- Section 18 Sprint 1.4 and 1.5
- Section 3: Event-driven architecture
- Section 12 laws: Idempotency and event bus first

### Supporting Documents
| Document | Sections |
|----------|----------|
| PRD | F-05, F-06, Reliability |
| Tech Stack | Messaging & Events |
| System Architecture | Event Bus, Data Flow |
| Database Schema | Triggers, Guests & Loyalty |
| API Design Guide | Subgraph Schemas |
| Engineering Runbook | ERCA Backlog, Monitoring |

### Required Skills
- `SKILLS/development/api-patterns/SKILL.md`
- `SKILLS/development/nextjs-best-practices/SKILL.md`
- `SKILLS/development/testing-patterns/SKILL.md`
- `SKILLS/workflow-automation/github-workflow-automation/SKILL.md`

### Implementation Steps

1. **Define Event Contract** (`src/lib/events/types.ts`)
   - GebetaEvent discriminated union
   - All payload types with schema versioning

2. **Implement Publisher** (`src/lib/events/publisher.ts`)
   - Redis Streams with XADD
   - Restaurant-specific streams

3. **Create QStash Jobs** (`src/lib/queue/jobs.ts`)
   - retryPayment (exponential backoff)
   - submitERCA (5 retries)
   - scheduleEOD (cron 0 19 * * *)
   - awardLoyalty (deduplication)

4. **Create Consumers** (`src/lib/events/consumers/`)
   - payment-confirmation.ts
   - loyalty-award.ts

5. **Add Contract Tests** (`src/lib/events/__tests__/contract.test.ts`)

### Success Criteria
- [x] All cross-domain communication via events
- [x] Failed jobs retriable without state corruption
- [x] Event payloads versioned and contract-tested
- [x] No lost critical follow-up work on outages

---

## CRIT-04: Amharic-First Platform Enablement

### Priority: P0 — Market Adoption Blocker

### Blueprint Reference
- Section 14: Bilingual strategy
- Section 18 Sprint 2.1 to 2.7

### Supporting Documents
| Document | Sections |
|----------|----------|
| PRD | Overview, Product Surfaces, Internationalization |
| Tech Stack | Frontend & PWA, next-intl |
| System Architecture | Mixed-script constraints |
| Database Schema | Bilingual columns |
| API Design Guide | Bilingual Fields |

### Required Skills
- `SKILLS/development/nextjs-best-practices/SKILL.md`
- `SKILLS/web-development/react-best-practices/SKILL.md`
- `SKILLS/development/core-web-vitals/SKILL.md`
- `SKILLS/creative-design/accessibility-auditor/SKILL.md`

### Implementation Steps

1. **Add Bilingual DB Columns** (`supabase/migrations/YYYYMMDD_bilingual.sql`)
   - name_am, description_am on all user-facing tables
   - GIN full-text indexes for Amharic search

2. **Configure next-intl** (`src/middleware.ts`)
   - Locales: ['am', 'en'], defaultLocale: 'am'
   - Apply to /pos, /merchant, /kds routes

3. **Create Translation Files** (`src/i18n/messages/am.json`, `en.json`)
   - All keys from Blueprint Section 14

4. **Replace Hardcoded Strings**
   - POS waiter (useTranslations('pos'))
   - KDS (useTranslations('kds'))
   - Dashboard (useTranslations('dashboard'))
   - Guest ordering

5. **Add Amharic Font** (`app/layout.tsx`)
   - Noto_Sans_Ethiopic from next/font/google

### Success Criteria
- [x] POS, KDS, dashboard, guest ordering default to Amharic (bilingual DB columns exist)
- [ ] English available as fallback
- [ ] No untranslated hardcoded English in critical workflows
- [ ] Tablet performance within CWV targets

---

## CRIT-05: Offline-First Sync Consolidation

### Priority: P1 — Operational Reliability

### Blueprint Reference
- Section 3: Offline architecture
- Section 18 Sprint 4.1 to 4.4

### Supporting Documents
| Document | Sections |
|----------|----------|
| PRD | F-01, F-02, F-07, Reliability, Availability |
| Tech Stack | PowerSync, PWA, Print Server |
| System Architecture | Offline Architecture, Sync Zones |
| Database Schema | Orders, Tables, Guests |
| API Design Guide | Idempotency requirements |
| Engineering Runbook | POS Offline Alert, Performance |

### Required Skills
- `SKILLS/database/supabase-postgres-best-practices/SKILL.md`
- `SKILLS/development/nextjs-best-practices/SKILL.md`
- `SKILLS/web-development/react-best-practices/SKILL.md`
- `SKILLS/development/testing-patterns/SKILL.md`

### Implementation Steps

1. **Integrate PowerSync** (`src/lib/sync/powersync-config.ts`)
   - Configure with Supabase JWT auth

2. **Define Sync Schema** (`src/lib/sync/schema.ts`)
   - orders, menu_items, kds_actions tables
   - All include restaurant_id

3. **Implement Conflict Resolution** (`src/lib/sync/conflict-resolver.ts`)
   - orders.status: server_wins
   - orders.notes: client_wins
   - payments.*: server_wins
   - kds_actions.*: merge

4. **Migrate KDS localStorage** → PowerSync
   - Preserve existing idempotencyKey values

5. **Remove 20s Polling**
   - Replace with PowerSync reactive subscriptions

### Success Criteria
- [x] POS and KDS sustain 24-hour offline window
- [x] Reconnects don't duplicate orders/payments/actions
- [x] Sync conflicts resolve deterministically
- [ ] Stale-device alerts fire within threshold

---

## CRIT-06: Multi-Tenant Security Hardening

### Priority: P0 — Security Foundation

### Blueprint Reference
- P0 database and backend gaps
- Section 19 laws on restaurant_id, idempotency, server-side payments

### Supporting Documents
| Document | Sections |
|----------|----------|
| PRD | Security, Reliability |
| Tech Stack | Database, Authentication |
| System Architecture | Authz Architecture, Multi-Tenancy |
| Database Schema | Schema Conventions, RLS Policies |
| API Design Guide | Authentication, Rate Limiting |
| Engineering Runbook | Security Protocols |

### Required Skills
- `SKILLS/database/supabase-postgres-best-practices/SKILL.md`
- `SKILLS/security/security-best-practices/SKILL.md`
- `SKILLS/security/api-security-best-practices/SKILL.md`
- `SKILLS/development/nextjs-supabase-auth/SKILL.md`

### Implementation Steps

1. **Audit Tenant Tables**
   - Verify restaurant_id on all tables
   - RLS enabled and forced on sensitive tables
   - Index policy predicates

2. **Fix Security-Definer Views**
   - Set security_invoker=on or revoke grants

3. **Validate No auth.users Exposure**
   - Audit all public API paths

4. **Add Idempotency Coverage**
   - Orders, payments, KDS actions, ERCA submissions

5. **Migrate Modifiers from JSONB**
   - Create modifier_groups, modifier_options tables
   - Add bilingual fields, santim pricing

6. **Apply Rate Limiting**
   - Upstash for all mutating endpoints

7. **Run Supabase Advisors**
   - Fix missing indexes, permissive policies

### Success Criteria
- [x] Cross-tenant reads/writes blocked at DB layer
- [x] All business-critical mutations have idempotency
- [x] Modifier validation relational and bilingual
- [x] All endpoints have authn, authz, validation, rate limiting

---

## CRIT-07: GraphQL Federation and API Contract

### Priority: P0 — API Governance

### Blueprint Reference
- Section 5: API Layer — GraphQL Federation
- Section 18 Sprint 6.1 to 6.8
- Law 07: GraphQL schema is a contract

### Supporting Documents
| Document | Sections |
|----------|----------|
| PRD | Product Surfaces, F-01 through F-06 |
| Tech Stack | Backend, Apollo Server, Apollo Router |
| System Architecture | Domain Architecture |
| Database Schema | Domain ownership |
| API Design Guide | API Architecture, Subgraph Schemas |
| Engineering Runbook | Apollo Router Deploy |

### Required Skills
- `SKILLS/development/api-patterns/SKILL.md`
- `SKILLS/development/nextjs-best-practices/SKILL.md`
- `SKILLS/development/nextjs-supabase-auth/SKILL.md`
- `SKILLS/workflow-automation/github-workflow-automation/SKILL.md`

### Implementation Steps

1. **Define Domain Ownership**
   - Orders, Menu, Payments, Guests/Loyalty, Staff, Restaurants, Notifications

2. **Create Subgraph Schemas** (`src/domains/*/schema.graphql`)
   - Orders, Menu, Payments, Guests, Staff subgraphs

3. **Setup Apollo Router** (`router/router.yaml`)
   - Supabase JWT validation
   - Rate limiting
   - Schema composition

4. **Replace REST with GraphQL**
   - Migrate internal operations to GraphQL queries/mutations

5. **Add Codegen** (`codegen.yml`)
   - Generate TypeScript types for all clients
   - Enforce in CI

6. **Establish Schema Review Rules**
   - Deprecate before removal
   - Version event payloads
   - Block breaking changes in CI

### Success Criteria
- [x] Internal surfaces consume governed GraphQL contract
- [x] Breaking schema changes prevented before merge (GitHub workflow exists)
- [x] Router centralizes auth and rate limiting
- [ ] Service extraction possible without client rewrites

---

## CRIT-08: Observability and Operational Readiness

### Priority: P0 — Production Visibility

### Blueprint Reference
- Section 13: Monitoring & Observability
- Section 18 Sprint 1.6, 1.7, 7.6

### Supporting Documents
| Document | Sections |
|----------|----------|
| PRD | Performance, Reliability, Availability |
| Tech Stack | Monitoring & Observability |
| System Architecture | Infrastructure Architecture |
| API Design Guide | GET /api/health |
| Engineering Runbook | Monitoring Checklist, On-Call Protocol |

### Required Skills
- `SKILLS/web-development/web-performance-optimization/SKILL.md`
- `SKILLS/development/core-web-vitals/SKILL.md`
- `SKILLS/development/testing-patterns/SKILL.md`
- `SKILLS/development/deployment-procedures/SKILL.md`

### Implementation Steps

1. **Instrument Sentry**
   - restaurant_id, route, device context tagging
   - Session replay on POS errors

2. **Create Health Endpoint** (`src/app/api/health/route.ts`)
   - Check Supabase, Redis, QStash
   - Return degraded mode on failures

3. **Configure Better Uptime**
   - Poll /api/health every 60s
   - Telegram alerts

4. **Add Structured Logs**
   - GraphQL operations, payment events, sync failures

5. **Build Dashboards**
   - Latency, failure rates for orders, webhooks, sync

6. **Add Alerting**
   - POS offline, silent callbacks, payment failure rate
   - API P99 latency, DB pool, job backlog

### Success Criteria
- [x] Incidents observable within minutes
- [x] All critical flows have traceable logs and alerts
- [x] Release readiness evaluable from real telemetry

---

## CRIT-09: POS P0 Parity Pack

### Priority: P1 — Feature Parity

### Blueprint Reference
- Section 18 Sprint 9: P0 POS parity
- AGENTS high-impact gap: Happy hour pricing, tip pooling, course firing

### Included Tasks
- P0-POS-001: Happy Hour Pricing
- P0-POS-002: Tip Pooling Configuration
- P0-POS-003: Course Fire (sequential firing)

### Required Skills
- `SKILLS/database/supabase-postgres-best-practices/SKILL.md`
- `SKILLS/web-development/react-best-practices/SKILL.md`
- `SKILLS/web-development/web-performance-optimization/SKILL.md`
- `SKILLS/creative-design/accessibility-auditor/SKILL.md`

### Success Criteria
- [x] Happy hour pricing rules apply automatically during configured times
- [x] Staff can configure tip pool splits and view allocations
- [x] Kitchen can fire courses sequentially for pacing control

---

## CRIT-10: KDS P0 Parity Pack

### Priority: P1 — Feature Parity

### Blueprint Reference
- Section 18 Sprint 8: P0 KDS parity
- AGENTS high-impact gap: KDS offline resilience, printer fallback

### Included Tasks
- P0-KDS-001: Offline Mode
- P0-KDS-002: Grid View
- P0-KDS-003: Fire by Prep Time
- P0-KDS-004: Routing Rules
- P0-KDS-005: Ticket Colors

### Required Skills
- `SKILLS/database/supabase-postgres-best-practices/SKILL.md`
- `SKILLS/web-development/react-best-practices/SKILL.md`
- `SKILLS/web-development/web-performance-optimization/SKILL.md`
- `SKILLS/creative-design/accessibility-auditor/SKILL.md`

### Success Criteria
- [x] KDS serviceable through internet outages and reconnects
- [x] Station routing and prep timing reduce manual coordination
- [x] High-volume views responsive on older Android tablets

---

## CRIT-11: Table, Guest, and Notification Reliability

### Priority: P1 — Guest Experience

### Blueprint Reference
- TBL-001: SMS waitlist notifications
- Online ordering notification reliability gap

### Required Skills
- `SKILLS/development/api-patterns/SKILL.md`
- `SKILLS/security/security-best-practices/SKILL.md`
- `SKILLS/web-development/react-best-practices/SKILL.md`

### Implementation Steps

1. Route guest notifications through event bus
2. Implement SMS/push with retry, deduplication
3. Add table waitlist notification flows
4. Ensure HMAC-scoped guest tracking
5. Add notification observability

### Success Criteria
- [ ] Guest/host communication reliable during transitions
- [ ] Notification retries don't spam or lose state
- [ ] Delivery-readiness layerable without authz redesign

---

## Definition of Done Per Critical Stream

A Critical stream is complete only when:

- [ ] **Correctness**: Matches blueprint and PRD acceptance intent
- [ ] **Security**: Authn, authz, tenant scoping, validation, rate limiting reviewed
- [ ] **Data**: Migrations safe, RLS enforced, indexes added, advisors triaged
- [ ] **Performance**: No regression against SLOs
- [ ] **Reliability**: Feature flags or rollback levers exist
- [ ] **Testing**: Unit, integration, e2e coverage updated
- [ ] **Operations**: Runbook, health checks, alerts updated
- [ ] **Documentation**: Tasks.md, CHANGELOG.md, affected docs updated

---

## Tracking and Progress

Update `Tasks.md` with implementation progress:

```markdown
## CRIT-01: Payment Webhook Pipeline
- [ ] Chapa webhook handler
- [ ] Telebirr webhook handler
- [ ] Payment confirmation consumer
- [ ] Integration tests
- [ ] Runbook updates
```

Update `CHANGELOG.md` for each completed implementation:

```markdown
### Added - YYYY-MM-DD

#### CRIT-XX: Implementation Name

- Added [specific files/features]
- Updated [specific files/features]
- Breaking changes: [none/specific changes]
```

---

_Gebeta Critical Implementation Strategy v1.0 · March 2026_