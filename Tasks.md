# ገበታ Gebeta — Execution Tasks

> **📚 Primary Reference:** This document is derived from [docs/1/Engineering Foundation/0. ENTERPRISE_MASTER_BLUEPRINT.md](docs/1/Engineering%20Foundation/0.%20ENTERPRISE_MASTER_BLUEPRINT.md)
> For detailed Toast feature comparison, see [TOAST_FEATURE_AUDIT.md](TOAST_FEATURE_AUDIT.md)
> Feed the master blueprint to Claude Opus 4.6 at the start of every coding session.

Last updated: March 2026
North star: Engineering Foundation #0 - Enterprise Master Blueprint

---

## The 12 Laws (Non-Negotiable)

Before starting any task, review these architectural principles:

1. **Law 1: Offline-First** — Every critical operation MUST queue locally when offline. Never block on network.
2. **Law 2: Santim Precision** — All monetary values stored as INTEGER in santim. Never FLOAT or DECIMAL.
3. **Law 3: HMAC QR Security** — All guest QR codes MUST use HMAC-SHA256 with timing-safe comparison.
4. **Law 4: RLS Multi-Tenancy** — Every table MUST have `restaurant_id` with RLS policies enforced.
5. **Law 5: Idempotency Keys** — All order and payment mutations MUST include idempotency_key.
6. **Law 6: Event Bus First** — Cross-domain communication happens via event bus, not direct service calls.
7. **Law 7: GraphQL Contract** — All APIs use GraphQL Federation. No ad-hoc REST for domain operations.
8. **Law 8: Webhook Verify-First** — All payment webhooks MUST verify HMAC before processing.
9. **Law 9: Amharic Default** — All staff-facing surfaces default to Amharic UI.
10. **Law 10: No Auth.users Exposure** — Never expose auth.users in public schemas. Use dedicated profile tables.
11. **Law 11: Service Extraction Trigger** — Extract to microservices ONLY when P99 > 500ms despite optimization.
12. **Law 12: Telebirr First** — Ethiopia-first payments: Telebirr native, Chapa fallback, cash always works.

---

## Current Feature Parity Score: 74%

| Feature Category       | Toast Features | Gebeta Implementation | Parity | Priority |
| ---------------------- | -------------- | --------------------- | ------ | -------- |
| POS & Operations       | 15             | 12                    | 80%    | P0       |
| Kitchen Display System | 18             | 16                    | 89%    | P0       |
| Online Ordering        | 12             | 6                     | 50%    | P1       |
| Inventory Management   | 10             | 7                     | 70%    | P1       |
| Loyalty & Marketing    | 8              | 4                     | 50%    | P2       |
| Reporting & Analytics  | 12             | 8                     | 67%    | P1       |
| Staff & Payroll        | 10             | 6                     | 60%    | P2       |
| Table Management       | 8              | 7                     | 88%    | P0       |
| Payment Processing     | 6              | 4                     | 67%    | P1       |
| Delivery Services      | 8              | 3                     | 38%    | P2       |
| Multi-Location         | 7              | 3                     | 43%    | P2       |
| Hardware Integration   | 6              | 2                     | 33%    | P3       |

---

## Phase 1: Foundation (Sprints 1-3) — P0 Gaps

### Sprint 1: Payment Webhooks (P0)

> **Critical Path:** Without webhooks, digital payments require manual confirmation. Inoperable at scale.

- [ ] `P0-WEB-001` Build Chapa webhook endpoint (`/api/webhooks/chapa`)
    - Verify HMAC-SHA256 signature with timing-safe comparison
    - Publish to event bus, return 200 immediately
- [ ] `P0-WEB-002` Build Telebirr webhook endpoint (`/api/webhooks/telebirr`)
    - Same pattern as Chapa

- [ ] `P0-WEB-003` Set up QStash consumer for `payment.completed` events
    - Update order status to 'confirmed'
    - Award loyalty points (if guest authenticated)
    - Submit ERCA e-invoice (if VAT-registered)

### Sprint 2: Event Bus & Background Jobs (P0)

- [ ] `P0-EVT-001` Implement Upstash Redis Streams event bus
    - Publish: `order.created`, `order.completed`, `payment.completed`, `menu.updated`

- [ ] `P0-EVT-002` Set up QStash CRON jobs
    - EOD report generation at 10PM Addis time
    - ERCA invoice submission job

- [ ] `P0-EVT-003` Add idempotency key validation to all mutation endpoints

### Sprint 3: Discount Engine (P1)

- [ ] `P1-DISC-001` Create `discounts` table
    - types: percentage, fixed_amount, bogo, item_override

- [ ] `P1-DISC-002` Build discount UI in Waiter POS (`/pos/waiter`)

- [ ] `P1-DISC-003` Build discount UI in Guest Ordering (`/[slug]`)

---

## Phase 2: Core Hardening (Sprints 4-6)

### Sprint 4: KDS Offline Resilience (P1)

- [ ] `P1-KDS-001` Implement PowerSync CRDT sync for KDS tablets
    - 24-hour offline window

- [ ] `P1-KDS-002` Kitchen printer fallback (ESC/POS integration)

- [ ] `P1-KDS-003` Course firing - automated course pacing (appetizers → entrees)

### Sprint 5: Amharic i18n (P0)

> **Primary Adoption Blocker** — No Amharic = no Addis market

- [ ] `P0-I18N-001` Set up next-intl with Amharic (am) locale

- [ ] `P0-I18N-002` Add Amharic translations to all staff-facing surfaces

- [ ] `P0-I18N-003` Bilingual receipt printing (Termux server)

### Sprint 6: ERCA VAT Compliance (P1)

- [ ] `P1-ERCA-001` Implement ERCA e-invoice submission

- [ ] `P1-ERCA-002` Add VAT report generation

---

## Phase 3: Feature Parity (Sprints 7-12)

### Sprint 7: POS Feature Parity (P0)

From TOAST_FEATURE_AUDIT.md Section 1:

- [ ] `P0-POS-001` Split Check - multiple payments per order
    - Split by item, split evenly, custom amounts

- [ ] `P0-POS-002` Course Firing - automated course pacing

- [ ] `P0-POS-003` Happy Hour Pricing - time-based pricing rules

- [ ] `P0-POS-004` Price Overrides - manual adjustments with reason codes

- [ ] `P0-POS-005` Tip Pooling - configurable tip distribution

### Sprint 8: KDS Feature Parity (P0)

From TOAST_FEATURE_AUDIT.md Section 2:

- [ ] `P0-KDS-001` Offline Mode - KDS continues during internet outages

- [ ] `P0-KDS-002` Grid View - compact multi-ticket with fire timers

- [ ] `P0-KDS-003` Fire by Prep Time - items fire based on prep duration

- [ ] `P0-KDS-004` Routing Rules - re-route based on dining option

- [ ] `P0-KDS-005` Ticket Colors - outline by dining behavior

### Sprint 9: Online Ordering Feature Parity (P1)

From TOAST_FEATURE_AUDIT.md Section 3:

- [ ] `P1-ORD-001` Google Integration - Order with Google Search & Maps

- [ ] `P1-ORD-002` Push Notifications / SMS - order status updates

- [ ] `P1-ORD-003` Native Mobile App - React Native/Expo app

- [ ] `P1-ORD-004` Scheduled Orders - pre-order for future pickup

### Sprint 10: Inventory Feature Parity (P1)

From TOAST_FEATURE_AUDIT.md Section 4:

- [ ] `P1-INV-001` Invoice Processing Automation - OCR scanning

- [ ] `P1-INV-002` Variance Reporting - actual vs theoretical usage

- [ ] `P1-INV-003` Par Level Alerts - auto-alert when inventory low

- [ ] `P1-INV-004` Waste Tracking - log and analyze waste

- [ ] `P1-INV-005` Unit Conversion - convert between purchase/use units

### Sprint 11: Loyalty & Marketing Feature Parity (P2)

From TOAST_FEATURE_AUDIT.md Section 5:

- [ ] `P2-LOY-001` Visit-Based Rewards - rewards after N visits

- [ ] `P2-LOY-002` Tiered Loyalty - Bronze/Silver/Gold/Platinum

- [ ] `P2-LOY-003` Birthday Rewards - automated birthday offers

- [ ] `P2-LOY-004` Email Campaigns - automated email marketing

- [ ] `P2-LOY-005` SMS Marketing - text message campaigns

### Sprint 12: Delivery & Multi-Location Feature Parity (P2)

From TOAST_FEATURE_AUDIT.md Sections 10-11:

- [ ] `P2-DEL-001` Third-Party Delivery Integration - BEU, Deliver Addis, Zmall

- [ ] `P2-DEL-002` Delivery Tracking - real-time GPS driver tracking

- [ ] `P2-DEL-003` Menu Sync - one menu across all platforms

- [ ] `P2-MLT-001` Centralized Menu Management - push menu to all locations

- [ ] `P2-MLT-002` Cross-Location Inventory Transfer

---

## Cross-Cutting Tasks

### Monitoring & Observability (P0)

- [ ] `MON-001` Set up Sentry error tracking
- [ ] `MON-002` Set up Better Uptime endpoint monitoring
- [ ] `MON-003` Add API latency dashboards

### Security

- [ ] `SEC-001` Audit all RLS policies
- [ ] `SEC-002` Add HMAC verification to all webhook handlers
- [ ] `SEC-003` Implement rate limiting on GraphQL endpoint

### Payments (P1)

- [ ] `PAY-001` Contactless Payments - NFC, tap-to-pay
- [ ] `PAY-002` Digital Wallets - Apple Pay, Google Pay
- [ ] `PAY-003` Tip on Device - digital tip collection

### Table Management (P0)

- [ ] `TBL-001` SMS Waitlist Notifications - text when table ready
- [ ] `TBL-002` Google Reserve Integration

---

## Definition of Done

Every task is complete when:

- [ ] Code merged to main
- [ ] Unit tests added
- [ ] Integration tests cover critical paths
- [ ] RLS policies updated (if DB changes)
- [ ] docs/README.md reflects changes
- [ ] Sentry error monitoring verified

---

## Reference: Scale Thresholds

| Metric             | Threshold | Action                              |
| ------------------ | --------- | ----------------------------------- |
| Restaurants        | 200       | Extract Orders + Payments to NestJS |
| API P99            | > 500ms   | Optimize or extract to service      |
| Concurrent POS     | 500+      | Move Realtime to dedicated Redis    |
| Daily transactions | 10,000+   | Add read replica for analytics      |

---

## Reference Documents

| Document                                                                                         | Purpose                           |
| ------------------------------------------------------------------------------------------------ | --------------------------------- |
| [Engineering Foundation #0](docs/1/Engineering%20Foundation/0.%20ENTERPRISE_MASTER_BLUEPRINT.md) | Master blueprint, architecture    |
| [Engineering Foundation #1](docs/1/Engineering%20Foundation/1.%20PRD.md)                         | Product requirements              |
| [Engineering Foundation #2](docs/1/Engineering%20Foundation/2.%20Tech_Stack.md)                  | Tech stack decisions              |
| [Engineering Foundation #3](docs/1/Engineering%20Foundation/3.%20System_Architecure.md)          | System architecture               |
| [Engineering Foundation #4](docs/1/Engineering%20Foundation/4.%20Database_Schema.md)             | Database schema                   |
| [Engineering Foundation #5](docs/1/Engineering%20Foundation/5.%20API_Design_Guide.md)            | API design                        |
| [Engineering Foundation #6](docs/1/Engineering%20Foundation/6.%20ENGINEERING_RUNOOK.md)          | Operations runbook                |
| [TOAST_FEATURE_AUDIT.md](TOAST_FEATURE_AUDIT.md)                                                 | Detailed Toast feature comparison |

---

_Tasks derived from Engineering Foundation #0 and TOAST_FEATURE_AUDIT.md_
