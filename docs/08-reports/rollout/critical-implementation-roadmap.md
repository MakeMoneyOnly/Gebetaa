# Critical Implementation Roadmap

## Purpose

This roadmap translates the Critical implementation work from the Enterprise Master Blueprint into an execution sequence that can be used directly in delivery planning, sprint decomposition, and release gating.

Primary source of truth order applied:

1. `AGENTS.md`
2. `docs/1/Engineering Foundation/0. ENTERPRISE_MASTER_BLUEPRINT.md`
3. Engineering Foundation companion docs:
    - `1. PRD.md`
    - `2. Tech_Stack.md`
    - `3. System_Architecure.md`
    - `4. Database_Schema.md`
    - `5. API_Design_Guide.md`
    - `6. ENGINEERING_RUNOOK.md`
4. Repo rules: `.clinerules`, `.cursorrules`

## Skills Applied

Minimal skill set used for this roadmap, following the order defined in `AGENTS.md`:

- `SKILLS/database/supabase-postgres-best-practices/SKILL.md`
- `SKILLS/database/postgres-schema-design/SKILL.MD`
- `SKILLS/security/security-best-practices/SKILL.md`
- `SKILLS/security/api-security-best-practices/SKILL.md`
- `SKILLS/development/nextjs-best-practices/SKILL.md`
- `SKILLS/development/nextjs-supabase-auth/SKILL.md`
- `SKILLS/development/api-patterns/SKILL.md`
- `SKILLS/web-development/react-best-practices/SKILL.md`
- `SKILLS/web-development/web-performance-optimization/SKILL.md`
- `SKILLS/development/core-web-vitals/SKILL.md`
- `SKILLS/creative-design/accessibility-auditor/SKILL.md`
- `SKILLS/development/testing-patterns/SKILL.md`
- `SKILLS/development/deployment-procedures/SKILL.md`
- `SKILLS/workflow-automation/github-workflow-automation/SKILL.md`

## Critical Implementation Order

1. `CRIT-01` Payment webhook pipeline and auto-confirmation
2. `CRIT-02` Santim monetary migration and finance contract hardening
3. `CRIT-03` Event bus and durable background job runtime
4. `CRIT-04` Amharic-first platform enablement
5. `CRIT-05` Offline-first sync consolidation for POS and KDS
6. `CRIT-06` Multi-tenant data, schema, and security hardening
7. `CRIT-07` GraphQL federation and API contract governance
8. `CRIT-08` Observability, alerting, and operational readiness
9. `CRIT-09` POS P0 parity pack
10. `CRIT-10` KDS P0 parity pack
11. `CRIT-11` Table, guest, and notification reliability pack

## Dependency Graph

- `CRIT-01` depends on existing payment adapters only.
- `CRIT-02` must complete before any new payment, discount, reconciliation, or GraphQL monetary contract work.
- `CRIT-03` depends on `CRIT-01` and partially on `CRIT-02` for stable event payloads.
- `CRIT-04` can run in parallel with `CRIT-01` to `CRIT-03`.
- `CRIT-05` depends on `CRIT-03` event definitions and `CRIT-06` idempotency rules.
- `CRIT-06` should be completed before `CRIT-07`, `CRIT-09`, `CRIT-10`, and `CRIT-11` expand write paths.
- `CRIT-07` depends on `CRIT-03` event/domain boundaries and `CRIT-06` authz rules.
- `CRIT-08` starts immediately but reaches final readiness only after `CRIT-01` to `CRIT-07` are instrumented.
- `CRIT-09` and `CRIT-10` depend on `CRIT-02`, `CRIT-03`, `CRIT-05`, and `CRIT-06`.
- `CRIT-11` depends on `CRIT-03`, `CRIT-04`, `CRIT-07`, and `CRIT-08`.

---

## CRIT-01 Payment Webhook Pipeline and Auto-Confirmation

### Blueprint scope

- Blueprint Section 16: Payment Methods and P0 webhook requirement
- Blueprint Section 18 Sprint 1.1 and 1.2
- Blueprint current-state audit: payment webhook callbacks missing, auto payment confirmation missing

### Supporting references

- PRD: `F-01: Waiter POS`, `F-03: Guest QR Ordering`, `F-06: Notifications & Communication`, `Reliability`, `Security`
- Tech Stack: `Payments`, `Messaging & Events`, `Authentication`
- System Architecture: `Payment Webhook Flow (Critical Path)`, `Event Bus - Publishers and Consumers`, `Security Architecture`
- Database Schema: `Payments & Finance`, `Database Triggers`, `RLS Policies`
- API Design Guide: `REST Endpoints (Webhook-Only)`, `POST /api/webhooks/chapa`, `POST /api/webhooks/telebirr`, `Error Handling`, `Rate Limiting`
- Engineering Runbook: `Payment Webhook Failing`, `Secret Rotation`

### Required skills

- `security-best-practices`
- `api-security-best-practices`
- `api-patterns`
- `nextjs-best-practices`
- `nextjs-supabase-auth`
- `testing-patterns`
- `deployment-procedures`

### Implementation steps

1. Create provider-specific webhook handlers at `/api/webhooks/chapa` and `/api/webhooks/telebirr`.
2. Read raw request bodies as text and verify provider signatures with timing-safe comparison before any parsing.
3. Return HTTP 200 immediately for accepted webhook deliveries and move all state changes into asynchronous processing.
4. Publish normalized `payment.completed` and `payment.failed` events with immutable payload shape including `restaurant_id`, `order_id`, `payment_id`, `provider`, `provider_transaction_id`, and `idempotency_key`.
5. Build a consumer that updates `payments.status`, confirms `orders.status`, records audit events, and triggers guest/staff notifications.
6. Expose Telebirr as the first digital payment option in POS and guest payment selection flows, keeping Chapa and cash fallback intact.
7. Add replay protection using provider transaction identifiers plus internal idempotency keys.
8. Add integration tests for signature failures, duplicate callbacks, success callbacks, and delayed retries.
9. Add runbook links and secret rotation instructions to deployment checklists.

### Deliverables

- Webhook route handlers
- Shared webhook verification utilities
- Event publication contract
- Payment-confirmation consumer/job
- POS and guest payment-method ordering updates
- Tests and runbook updates

### Success criteria

- Digital payments move from manual confirmation to automatic confirmation.
- Duplicate provider callbacks are idempotent and do not create duplicate state transitions.
- Handlers do not execute synchronous business logic after signature verification.
- Payment webhook incident runbook steps are executable without tribal knowledge.
- Monitoring can detect a silent callback gap within 10 minutes.

---

## CRIT-02 Santim Monetary Migration and Finance Contract Hardening

### Blueprint scope

- Blueprint Section 9: `P0 This Week: Santim Migration`
- Blueprint Section 19 Law 02: all money is integer santim
- Blueprint finance notes: payments, payouts, refunds, reconciliation entries all in scope

### Supporting references

- PRD: `F-01: Waiter POS`, `F-04: Merchant Dashboard`, `Performance`, `Reliability`
- Tech Stack: `Database`, `Payments`
- System Architecture: `Database Architecture`, `Critical Indexes`
- Database Schema: `Orders`, `Payments & Finance`, `Migration Execution Order`
- API Design Guide: `Monetary Values in GraphQL`, `Payments Subgraph`
- Engineering Runbook: `Database Migration (Supabase)`, `Performance Benchmarks`

### Required skills

- `supabase-postgres-best-practices`
- `postgres-schema-design`
- `api-patterns`
- `testing-patterns`
- `deployment-procedures`

### Implementation steps

1. Inventory every money-bearing column and API field, including `orders`, `order_items`, `payments`, `refunds`, `payouts`, `reconciliation_entries`, discount values, modifier price adjustments, and export/report serializers.
2. Write phased Supabase migrations with generated santim columns or additive integer columns, verification queries, guarded renames, and rollback-safe semantics.
3. Backfill and validate zero-null results before swapping application reads to integer columns.
4. Add `currency_code` where the blueprint requires future multi-currency readiness.
5. Update database types, server validators, GraphQL schema types, UI formatters, and exports to treat money as integer santim end-to-end.
6. Add covering indexes for any new hot-path columns used in reconciliation, filters, and provider lookups.
7. Execute before-and-after `EXPLAIN ANALYZE` for payments, finance exports, and order settlement queries.
8. Run Supabase advisors immediately after migration and triage RLS/index findings.
9. Add regression tests for ETB formatting, split payment math, refunds, and reconciliation totals.

### Deliverables

- Safe forward migration set in `supabase/migrations/*.sql`
- Updated generated types and runtime validators
- Updated GraphQL monetary contracts
- Migration verification SQL and rollback notes

### Success criteria

- No production money arithmetic remains on decimal or float pathways.
- Receipts, exports, refunds, and reconciliation all balance exactly in santim.
- Existing orders and payments migrate without data loss.
- Query plans remain within the performance SLO envelope.

---

## CRIT-03 Event Bus and Durable Background Job Runtime

### Blueprint scope

- Blueprint Section 18 Sprint 1.4 and 1.5
- Blueprint Section 3 event-driven architecture direction
- Blueprint Section 12 laws: idempotency and event bus first

### Supporting references

- PRD: `F-05: Loyalty & Guest Retention`, `F-06: Notifications & Communication`, `Reliability`
- Tech Stack: `Messaging & Events`, `Caching & NoSQL`, `CI/CD & Developer Tooling`
- System Architecture: `Event Bus - Publishers and Consumers`, `Data Flow Diagram`, `Offline Architecture`
- Database Schema: `Database Triggers`, `Guests & Loyalty`, `Inventory`
- API Design Guide: `Subgraph Schemas`, `GraphQL Client Setup`, `Rate Limiting`
- Engineering Runbook: `ERCA Submission Backlog`, `Monitoring Checklist`

### Required skills

- `api-patterns`
- `nextjs-best-practices`
- `react-best-practices`
- `testing-patterns`
- `deployment-procedures`
- `github-workflow-automation`

### Implementation steps

1. Define a single `GebetaEvent` discriminated union for the blueprint event set with schema versioning.
2. Implement `publishEvent` on Upstash Redis Streams with deterministic stream naming and trace metadata.
3. Stand up QStash job handlers for retry payment, ERCA submission, loyalty awarding, EOD reporting, and sync reconciliation.
4. Move cross-domain side effects out of synchronous route handlers and domain services into event consumers or jobs.
5. Add dead-letter handling, retry policy, deduplication keys, and audit logging for each job type.
6. Instrument consumers with latency, retry count, backlog, and failure metrics.
7. Create an event contract test suite to stop accidental payload-shape drift.
8. Document the producer-consumer ownership map per domain.

### Deliverables

- Shared event contract package/module
- Redis Streams publisher and consumer runtime
- QStash job handlers and retry policies
- Contract tests and CI verification

### Success criteria

- Orders, payments, loyalty, inventory, notifications, and ERCA workflows communicate asynchronously.
- Failed jobs can be retried without corrupting state.
- Event payloads are versioned and contract-tested.
- Cold starts or transient outages no longer lose critical follow-up work.

---

## CRIT-04 Amharic-First Platform Enablement

### Blueprint scope

- Blueprint Section 14 bilingual strategy and strings
- Blueprint Section 18 Sprint 2.1 to 2.7
- Blueprint current-state gap: Amharic UI missing, marked as critical adoption blocker

### Supporting references

- PRD: `Overview`, `Product Surfaces`, `F-01`, `F-02`, `F-03`, `F-04`, `Internationalization`
- Tech Stack: `Frontend & PWA`, `next-intl`
- System Architecture: guest and staff route surfaces, mixed-script constraints in appendix
- Database Schema: bilingual columns in `Migration Execution Order`
- API Design Guide: `Bilingual Fields`
- Engineering Runbook: environment and deploy steps for font and locale changes

### Required skills

- `nextjs-best-practices`
- `react-best-practices`
- `core-web-vitals`
- `web-performance-optimization`
- `accessibility-auditor`
- `testing-patterns`

### Implementation steps

1. Add bilingual database columns for all user-facing names and descriptions required by the blueprint.
2. Configure `next-intl` with `am` default and `en` fallback across POS, KDS, merchant, and guest surfaces.
3. Replace hardcoded strings in staff-facing routes first, then guest journey text, trackers, notifications, and printing templates.
4. Install `Noto Sans Ethiopic` via `next/font` and apply typography tokens that preserve legibility on tablets.
5. Ensure mixed-direction rendering uses `dir="auto"` where Amharic text may include LTR numbers.
6. Keep staff-critical text server-rendered where possible to avoid translation flashes on weak 4G.
7. Add locale-aware formatting for ETB, dates, and notification timestamps.
8. Add accessibility and snapshot tests for bilingual rendering, keyboard flows, and truncation resilience on tablet sizes.

### Deliverables

- Locale infrastructure and message catalogs
- Bilingual schema migration
- Surface-by-surface translation completion report
- Typography and accessibility validation

### Success criteria

- POS, KDS, merchant dashboard, and guest ordering all default to Amharic.
- English remains available as a fallback without breaking layout.
- No critical workflow uses untranslated hardcoded English.
- Tablet performance remains within CWV and interaction targets after localization.

---

## CRIT-05 Offline-First Sync Consolidation for POS and KDS

### Blueprint scope

- Blueprint Section 3 offline architecture
- Blueprint Section 18 Sprint 4.1 to 4.4
- Blueprint current-state gap: partial Dexie/localStorage offline queue, no unified KDS sync

### Supporting references

- PRD: `F-01: Waiter POS`, `F-02: Kitchen Display System`, `F-07: Printing`, `Reliability`, `Availability`
- Tech Stack: `PowerSync`, `PWA`, `Print Server`
- System Architecture: `Offline Architecture`, `PowerSync Sync Zones`, `Conflict Resolution Rules`
- Database Schema: `Orders`, `Tables`, `Guests & Loyalty`, `Inventory`
- API Design Guide: idempotency requirements in orders and payments mutations
- Engineering Runbook: `POS Offline Alert`, `POS Device Compromise`, `Performance Benchmarks`

### Required skills

- `supabase-postgres-best-practices`
- `nextjs-best-practices`
- `react-best-practices`
- `testing-patterns`
- `deployment-procedures`

### Implementation steps

1. Replace fragmented Dexie/localStorage queues with PowerSync-managed sync zones for POS and KDS.
2. Define offline-safe tables and mutation envelopes for orders, order items, KDS actions, payments, and table/session actions.
3. Preserve and enforce idempotency keys on every queued mutation.
4. Implement conflict resolution exactly as defined in the blueprint: server wins for payments and authoritative order status, client wins for specific waiter-entered notes.
5. Move KDS offline actions from `localStorage` into a replicated table such as `kds_actions` with replay safety.
6. Add printer-fallback integration points so receipt and kitchen print jobs degrade predictably during connectivity loss.
7. Create chaos-style test cases for tablet reboot, network drop, duplicate sync replay, and prolonged outage recovery.
8. Add operational sync-health indicators and alerts for stale devices.

### Deliverables

- PowerSync schema and sync policy
- Unified offline queue contract
- KDS action persistence migration
- Device health telemetry and tests

### Success criteria

- POS and KDS sustain a 24-hour offline window without data loss.
- Reconnects do not duplicate orders, payments, or KDS actions.
- Sync conflicts resolve deterministically and are auditable.
- Business-hours stale-device alerts fire within the blueprint threshold.

---

## CRIT-06 Multi-Tenant Data, Schema, and Security Hardening

### Blueprint scope

- Blueprint P0 database and backend gaps
- Blueprint Section 19 laws on `restaurant_id`, idempotency, server-side payments, and GraphQL contract
- Cross-cutting `SEC-001`, `SEC-002`, `SEC-003`

### Supporting references

- PRD: `Security`, `Reliability`
- Tech Stack: `Database`, `Authentication`, `Payments`
- System Architecture: `Authentication & Authorization Architecture`, `Multi-Tenancy Model`, `Defense in Depth`
- Database Schema: `Schema Conventions`, `RLS Policies`, `Migration Execution Order`, `Database Triggers`
- API Design Guide: `Authentication`, `Rate Limiting`, partner API key scoping
- Engineering Runbook: `Security Protocols`, `POS Device Compromise`
- Repo rules: `.clinerules`, `.cursorrules`, `AGENTS.md`

### Required skills

- `supabase-postgres-best-practices`
- `postgres-schema-design`
- `security-best-practices`
- `api-security-best-practices`
- `nextjs-supabase-auth`
- `testing-patterns`

### Implementation steps

1. Audit every tenant-scoped table for `restaurant_id`, RLS enabled, forced RLS where sensitive, and indexed policy predicates.
2. Remove or redesign any exposed-schema view that could behave as `security definer` without explicit `security_invoker=on` or revoked grants.
3. Validate that no public API path or exposed schema leaks `auth.users`.
4. Add or confirm idempotency-key coverage for orders, payments, KDS actions, ERCA submissions, and retryable background jobs.
5. Normalize modifiers from JSONB into relational tables with bilingual fields, required-selection validation, and santim-compatible pricing.
6. Apply route-level and GraphQL edge rate limiting using Upstash for all mutating and partner-access surfaces.
7. Harden middleware/server-side auth boundaries with `@supabase/ssr` patterns only.
8. Run Supabase advisors, capture findings, and fix missing indexes or permissive policies immediately.
9. Add tenant-isolation integration tests and negative authz tests for every changed API.

### Deliverables

- RLS remediation set
- Modifier schema migration
- Idempotency coverage matrix
- GraphQL and REST rate-limit posture
- Advisor triage report

### Success criteria

- Cross-tenant reads and writes are blocked at the database layer.
- No business-critical mutation lacks idempotency.
- Modifier validation and pricing are relational, reportable, and bilingual.
- GraphQL and REST entry points have explicit authn, authz, validation, rate limiting, and audit posture.

---

## CRIT-07 GraphQL Federation and API Contract Governance

### Blueprint scope

- Blueprint API Layer gap marked `P0`
- Blueprint Section on Apollo Federation and migration Sprint 6.1 to 6.8
- Law 07: GraphQL schema is a contract

### Supporting references

- PRD: `Product Surfaces`, `F-01` through `F-06`
- Tech Stack: `Backend`, `Apollo Server`, `Apollo Router`, `CI/CD & Developer Tooling`
- System Architecture: `Domain Architecture`, `Phase 2: Service Extraction Plan`, `Infrastructure Architecture`
- Database Schema: domain ownership across tables
- API Design Guide: `API Architecture Overview`, `Subgraph Schemas`, `GraphQL Client Setup`, `GraphQL Codegen Config`, `API Versioning & Deprecation`
- Engineering Runbook: `Apollo Router Deploy`, deployment process

### Required skills

- `api-patterns`
- `nextjs-best-practices`
- `nextjs-supabase-auth`
- `github-workflow-automation`
- `testing-patterns`
- `deployment-procedures`

### Implementation steps

1. Define domain ownership for Orders, Menu, Payments, Guests/Loyalty, Staff, Restaurants, and Notifications based on the blueprint subgraph boundaries.
2. Stand up subgraph schemas behind the current monolith first so clients can migrate without service extraction.
3. Introduce Apollo Router with Supabase JWT validation, rate limiting, and schema composition checks.
4. Replace ad-hoc REST reads and writes for internal business operations with GraphQL queries, mutations, and subscriptions.
5. Add `graphql-code-generator` for POS, KDS, merchant, and guest operations and enforce type generation in CI.
6. Establish schema review rules: deprecate before removal, version event payloads separately, and block breaking changes in CI.
7. Keep REST limited to webhook ingestion and health checks exactly as the API guide prescribes.
8. Add partner integration surfaces for delivery platforms with scoped API keys and restaurant-linked authorization.

### Deliverables

- Initial subgraphs and router config
- Generated GraphQL client types
- CI contract checks and schema governance rules
- Partner-facing integration contract

### Success criteria

- Internal product surfaces consume a governed GraphQL contract.
- Breaking schema changes are prevented before merge.
- Router authentication and rate limiting centralize request control.
- Service extraction later can occur without client rewrites.

---

## CRIT-08 Observability, Alerting, and Operational Readiness

### Blueprint scope

- Blueprint observability section and critical alerts table
- Blueprint Section 18 Sprint 1.6, 1.7, and 7.6
- Monitoring and Observability tasks `MON-001`, `MON-002`, `MON-003`

### Supporting references

- PRD: `Performance`, `Reliability`, `Availability`, `Success Metrics`
- Tech Stack: `Monitoring & Observability`, `Infrastructure & Hosting`
- System Architecture: `Infrastructure Architecture`, `Scalability Architecture`
- API Design Guide: `GET /api/health`
- Engineering Runbook: `Monitoring Checklist`, incident runbook sections, `On-Call Protocol`, `Performance Benchmarks`

### Required skills

- `web-performance-optimization`
- `core-web-vitals`
- `react-best-practices`
- `testing-patterns`
- `deployment-procedures`
- `github-workflow-automation`

### Implementation steps

1. Instrument Sentry in Next.js with `restaurant_id`, route surface, and device context tagging.
2. Implement `/api/health` with Supabase, Redis, and QStash dependency checks plus degraded mode signaling.
3. Configure Better Uptime to poll health every 60 seconds and send Telegram alerts.
4. Add structured logs for GraphQL operations, payment events, sync failures, and job execution.
5. Build latency and failure dashboards for orders, command center, order status mutation, webhook processing, and sync propagation.
6. Add alerting for POS offline, silent payment callbacks, payment failure rate, API P99 latency, DB pool utilization, and job backlog.
7. Define release gates that require instrumentation before enabling risky features.
8. Add smoke tests for health, alerts, and critical telemetry paths in CI or staging verification scripts.

### Deliverables

- Sentry integration
- Health endpoint and Better Uptime config
- Dashboard definitions
- Telegram alert sender and alert matrix
- Release verification checklist updates

### Success criteria

- Production incidents become observable within minutes, not by restaurant complaint.
- Every critical flow has traceable logs and actionable alerts.
- Release readiness and rollback criteria can be evaluated from real telemetry.

---

## CRIT-09 POS P0 Parity Pack

### Blueprint scope

- Blueprint Sprint 7 P0 POS parity tasks
- Toast parity gaps emphasized in `AGENTS.md`: split checks, multi-payment, course firing

### Included tasks

- `P0-POS-001` Split Check
- `P0-POS-002` Course Firing
- `P0-POS-003` Happy Hour Pricing
- `P0-POS-004` Price Overrides
- `P0-POS-005` Tip Pooling

### Supporting references

- PRD: `F-01: Waiter POS`, `F-04: Merchant Dashboard`, `F-06: Notifications & Communication`, `F-07: Printing`
- Tech Stack: `Frontend & PWA`, `Database`, `Payments`, `Print Server`
- System Architecture: staff order flow, offline rules, event bus
- Database Schema: `Orders`, `Payments & Finance`, `Staff & Roles`, `Menu`
- API Design Guide: `Orders Subgraph`, `Payments Subgraph`, GraphQL mutation idempotency
- Engineering Runbook: payment, POS offline, deployment verification

### Required skills

- `postgres-schema-design`
- `api-patterns`
- `nextjs-best-practices`
- `react-best-practices`
- `testing-patterns`
- `deployment-procedures`

### Implementation steps

1. Finalize split-check domain model so one order can support multiple partial payments, settlement records, and reopened balances.
2. Build a pricing engine that evaluates happy-hour rules, manual overrides with reason codes, discounts, and tips in a deterministic order.
3. Introduce manager-approval and audit requirements for overrides and high-risk discount actions.
4. Add course metadata and fire timing hooks at item/order level so POS can stage production correctly.
5. Add UI flows optimized for tablets and partial connectivity, using integer santim arithmetic only.
6. Update receipts, exports, and reconciliation to reflect multi-payment and tip allocation accurately.
7. Add integration tests for mixed cash plus digital settlement, partial refunds, and reopened checks.
8. Release behind feature flags with rollback switches per pricing and settlement behavior.

### Success criteria

- A waiter can split, settle, adjust, and close a complex table without manual back-office correction.
- Override and tip actions are auditable by staff identity and reason code.
- Pricing remains correct under happy hour, discounts, modifiers, and split settlement combinations.

---

## CRIT-10 KDS P0 Parity Pack

### Blueprint scope

- Blueprint Sprint 8 P0 KDS parity tasks
- Blueprint current-state gap: partial KDS offline architecture
- AGENTS high-impact gap: KDS offline resilience and printer fallback

### Included tasks

- `P0-KDS-001` Offline Mode
- `P0-KDS-002` Grid View
- `P0-KDS-003` Fire by Prep Time
- `P0-KDS-004` Routing Rules
- `P0-KDS-005` Ticket Colors

### Supporting references

- PRD: `F-02: Kitchen Display System`, `F-07: Printing`, `Reliability`
- Tech Stack: `PowerSync`, `PWA`, `Print Server`
- System Architecture: KDS flow, event bus, offline sync zones
- Database Schema: `Orders`, `order_items`, KDS-related action/event tables and indexes
- API Design Guide: subscriptions and order update contracts
- Engineering Runbook: POS offline, performance benchmarks, device debugging

### Required skills

- `supabase-postgres-best-practices`
- `nextjs-best-practices`
- `react-best-practices`
- `web-performance-optimization`
- `accessibility-auditor`
- `testing-patterns`

### Implementation steps

1. Build KDS station routing logic using dining option, station ownership, and prep metadata.
2. Add prep-time-based fire orchestration tied to course and kitchen pacing rules.
3. Deliver a dense grid view optimized for large ticket volume and weak tablet hardware.
4. Add visual ticket semantics for dine-in, takeaway, delivery, SLA breach, and recall states.
5. Tie all KDS actions to offline-safe queues and printer fallback where stations lose connectivity.
6. Validate realtime propagation and offline replay against the `<2s` target once online.
7. Add e2e coverage for station handoff, expeditor flow, outage recovery, and replay order.

### Success criteria

- KDS remains serviceable through internet outages and tablet reconnects.
- Station routing and prep timing reduce manual kitchen coordination.
- High-volume ticket views remain responsive on older Android tablets.

---

## CRIT-11 Table, Guest, and Notification Reliability Pack

### Blueprint scope

- Cross-cutting `TBL-001` SMS waitlist notifications
- Online ordering notification reliability gap
- Blueprint current-state and AGENTS emphasis on guest state notifications and delivery/multi-location readiness without weakening tenant safety

### Supporting references

- PRD: `F-03: Guest QR Ordering`, `F-04: Merchant Dashboard`, `F-06: Notifications & Communication`
- Tech Stack: `Supabase Edge Functions`, `Messaging & Events`, `Mobile (Phase 2)`
- System Architecture: guest ordering flow, event bus consumers, push/guest update paths
- Database Schema: `Tables`, `table_sessions`, `Guests & Loyalty`, `Delivery Channels`
- API Design Guide: `Notifications`-related event consumers, partner API credentials
- Engineering Runbook: monitoring, webhook failures, device compromise

### Required skills

- `api-patterns`
- `security-best-practices`
- `nextjs-best-practices`
- `react-best-practices`
- `testing-patterns`
- `deployment-procedures`

### Implementation steps

1. Route guest order-state notifications through the event bus instead of in-request side effects.
2. Implement SMS and push delivery with retry policy, deduplication, and suppression logic.
3. Add table waitlist notification flows with explicit state transitions and staff visibility.
4. Ensure guest tracking surfaces remain HMAC-scoped and do not leak restaurant data.
5. Add observability for notification send failures, delivery latency, and stale tracker updates.
6. Prepare delivery-partner and multi-location extensions on the GraphQL contract without broadening tenant-access boundaries.

### Success criteria

- Guest and host communication remains reliable during payment, waitlist, and fulfillment transitions.
- Notification retries do not spam users or lose state transitions.
- Delivery-readiness work can be layered in later without redesigning authz boundaries.

---

## Release Sequencing

### Wave 1: Immediate business-risk reduction

- `CRIT-01`
- `CRIT-02`
- `CRIT-03`
- `CRIT-08` baseline instrumentation

### Wave 2: Addis market readiness

- `CRIT-04`
- `CRIT-05`
- `CRIT-06`

### Wave 3: Contract and scale hardening

- `CRIT-07`
- `CRIT-08` full alerting and dashboards

### Wave 4: Feature parity on hardened platform

- `CRIT-09`
- `CRIT-10`
- `CRIT-11`

## Definition of Done Per Critical Stream

A Critical stream is complete only when all of the following pass:

- Correctness: matches the blueprint and PRD acceptance intent.
- Security: authn, authz, tenant scoping, validation, rate limiting, and log hygiene reviewed.
- Data: migrations are safe, RLS enforced, indexes added, Supabase advisors triaged.
- Performance: no regression against `docs/implementation/performance-slos.md` or blueprint benchmarks.
- Reliability: explicit feature flags or rollback levers exist for risky behavior changes.
- Testing: unit, integration, and e2e coverage updated for the changed critical path.
- Operations: runbook, health checks, and alerts updated.
- Documentation: `Tasks.md`, `CHANGELOG.md`, and affected implementation docs updated.
