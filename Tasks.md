# Gebetaa CTO Audit and Production Readiness Roadmap

Date: 2026-02-15
Owner: CTO Office (Architecture + Product + Design)
Status: Red (not production ready)

## 0) Scope, Inputs, and Reality Check
This roadmap is based on code + docs review across:
- `RESTAURANT.md`
- `ENTERPRISE_PLATFORM_SETUP.md`
- `ENTERPRISE_SKILLS_COMPLETION_SUMMARY.md`
- `docs/1. Idea & Discovery/0. idea-canvas.md`
- `SDLC/1. Idea & Discovery/0. idea-to-vision.md`
- `docs/1. Idea & Discovery/2. product-strategy-prd.md`
- `SDLC/1. Idea & Discovery/2. product-strategy.md`
- `docs/1. Idea & Discovery/3. user-personas.md`
- Key implementation files in `src/` and migrations in `supabase/migrations/`

Operational checks completed in this repo:
- Added and validated `scripts/with_server.py` for browser/server orchestration.
- Supabase MCP check failed in this session: MCP server `supabase` is not registered (only `notion` is available).

## 1) Executive Assessment
Current state is a strong prototype with design momentum, but not enterprise-safe yet.

Top blockers:
1. Security model is bypassable in app and permissive in DB policies.
2. Core Toast-like workflow (guest order -> KDS acknowledge -> station routing -> waiter fulfillment) is only partially implemented and mostly mocked.
3. Production operations foundation is missing (SLOs, observability, incident response, backup/restore drills).
4. Architecture does not yet support sub-second reliable real-time under load.

## 2) Enterprise Gap Analysis

### 2.1 Security (AuthN/AuthZ, Encryption, OWASP)
Current evidence:
- Client-side auth bypass exists: `src/hooks/useRole.ts:15`, `src/app/auth/login/page.tsx:127`.
- RBAC short-circuits when `restaurantId` is null: `src/hooks/useRole.ts:21`; affected calls use null in multiple pages: `src/app/(dashboard)/merchant/orders/page.tsx:15`, `src/app/(dashboard)/merchant/tables/page.tsx:26`.
- RoleGuard is mounted without tenant context: `src/app/(dashboard)/layout.tsx:12`, `src/app/(kds)/layout.tsx:11`.
- Permissive RLS is widespread (`USING (true)` / `WITH CHECK (true)`), including orders/service requests:
  - `supabase/migrations/20260201_audit_compliance_updates.sql:75`
  - `supabase/migrations/20260201_audit_compliance_updates.sql:81`
  - `supabase/migrations/20260201_audit_compliance_updates.sql:86`
  - `supabase/migrations/20260126_create_service_requests.sql:27`
  - `supabase/migrations/20260126_create_service_requests.sql:31`
  - `supabase/migrations/20260126_create_service_requests.sql:35`
- HMAC signing falls back to public key/default secret: `src/lib/security/hmac.ts:12`, `src/lib/security/hmac.ts:13`.
- CSRF check explicitly skips API routes: `src/proxy.ts:86`.

Gap:
- No zero-trust tenant isolation.
- No hardened API boundary for guest/staff actions.
- OWASP controls are incomplete (broken access control is the largest issue).

Priority: P0

### 2.2 Scalability and Reliability
Current evidence:
- No implemented Socket.io service in runtime app (only references in SDLC docs, not active code path).
- KDS is mock-driven: `src/app/(kds)/kds/page.tsx:23`, `src/app/(kds)/kds/page.tsx:95`.
- Guest menu route does not scope by slug/table in query: `src/app/(guest)/[slug]/page.tsx:63`, `src/app/(guest)/[slug]/page.tsx:80`.
- Migrations are out of order and conflicting by date prefix (`20260126`, `20260201`, `20260204`, `20260214`).

Gap:
- No proven horizontal scaling path for bursts.
- No deterministic migration baseline.
- No queueing/backpressure strategy for kitchen spikes.

Priority: P0/P1

### 2.3 Observability (Logs, Metrics, Tracing, Alerts)
Current evidence:
- Logger exists but is unused: `src/lib/logger.ts` with no imports in app paths.
- No distributed tracing, SLI dashboards, or alert policy definitions.
- No incident response runbooks in active runtime paths.

Gap:
- Cannot operate enterprise uptime/SLA with current telemetry.

Priority: P1

### 2.4 Compliance (GDPR, SOC2, HIPAA applicability)
Current evidence:
- No data classification matrix, retention policy, DSR workflow, or privacy-by-design controls in runtime implementation.
- Audit tables exist, but access policies and immutability controls are not enterprise-grade yet.

Gap:
- Not audit-ready for SOC2.
- GDPR readiness incomplete for customer PII lifecycle.
- HIPAA likely not applicable to hospitality core, but if staff health data/payroll enters scope, controls are missing.

Priority: P1

### 2.5 Disaster Recovery and Business Continuity
Current evidence:
- No IaC footprint in `infrastructure/`.
- No documented backup restore drill cadence in executable ops.
- No multi-region failover plan.

Gap:
- Unknown RTO/RPO reality.

Priority: P1

### 2.6 Performance (SLA/SLO, Load/Capacity)
Current evidence:
- E2E tests are a title check only: `e2e/example.spec.ts`.
- Service worker runtime is configured in Next, but no checked-in static `public/sw.js` artifact and no production validation script.
- Lighthouse targets stale/nonexistent route variants (`/m/demo`, `/m/demo-table`) across configs.

Gap:
- No enforceable performance budget workflow tied to real user journeys.
- No load test proving sub-second order delivery at peak.

Priority: P1

## 3) Missing Features Inventory Against Target Toast-like Vision

### 3.1 Guest Experience (QR Web Link)
Missing or incomplete:
- Table-specific deterministic routing (`/{slug}/{table_id}` equivalent) not wired end-to-end.
- Direct order submission remains mock (`src/features/menu/components/CartDrawer.tsx:164`).
- Service request button uses local alerts, not backend workflow (`src/features/menu/components/ServiceRequestButton.tsx:38`, `src/features/menu/components/ServiceRequestButton.tsx:50`).
- Bill request does not lock cart or trigger waiter workflow.
- Real-time progress pipeline (Received -> Cooking -> Ready) is not production wired.

### 3.2 KDS
Missing or incomplete:
- Persistent siren-to-acknowledge behavior not implemented (`src/features/kds/components/TicketCard.tsx:64`).
- KDS feed still mock (`src/app/(kds)/kds/page.tsx:23`).
- Station isolation (bar vs kitchen) not enforced as runtime policy.
- Course firing and station routing engine missing.

### 3.3 Waiter/Staff App
Missing or incomplete:
- Push notifications for service/bill requests missing.
- Edit/void gates tied to kitchen start state missing.
- Invite/join flow partly placeholder (`src/app/(dashboard)/merchant/staff/page.tsx:119`).

### 3.4 Platform/Enterprise Requirements
Missing or incomplete:
- Local-network fallback (mDNS/P2P) not implemented in runtime code.
- Complete bilingual UX and localization system is incomplete in operational paths.
- ETB localization and reporting standards not consistently enforced.
- Asset budget target (<2MB total for core guest shell) not enforced by CI.

## 4) Bird's-Eye Architecture Review
Current architecture is a monolithic Next.js app with direct client-side DB calls for many workflows. This accelerates MVP speed but weakens enterprise control planes.

Target architecture for production:
1. Edge/API Boundary:
- Keep Next.js for UI/BFF but route all order/service mutations through hardened API endpoints.
- Enforce auth, tenant checks, validation, rate limits, idempotency at API boundary.

2. Evented Core:
- `orders` and `service_requests` emit canonical events.
- WebSocket gateway fan-out to KDS/Waiter channels with tenant+station scoping.
- Durable queue for retries/replays.

3. Data and Policy Layer:
- Strict RLS by tenant and role, no `USING (true)` production policies.
- Write-paths via service role only in controlled backend functions.

4. Offline Strategy:
- PWA cache for read-only menu and pending action queue.
- Conflict resolution for queued guest orders.
- Optional mDNS LAN bridge as phase-gated capability (pilot after cloud path hardening).

5. Operational Plane:
- OpenTelemetry traces, structured logs, SLO dashboards, pager alerts.
- Backup/restore automation with quarterly disaster game days.

## 5) Organizational Deployment Plan (Virtual Org Chart)

### 5.1 Platform Engineering Team
Mission: Core domain services, tenancy boundaries, migration hygiene.
Responsibilities:
- API contracts for orders, service requests, KDS state changes.
- Tenant-aware data model and migration consolidation.
- Idempotency and workflow state machine.

### 5.2 Security and Compliance Team
Mission: Zero-trust posture and audit readiness.
Responsibilities:
- RLS hardening and RBAC redesign.
- Secrets policy (remove fallback secrets), key rotation.
- OWASP ASVS baseline, SOC2 control mapping, GDPR DSR process.

### 5.3 DevOps/SRE Team
Mission: Reliability, release safety, cost-efficient scale.
Responsibilities:
- SLO definition, monitoring, alerting, on-call.
- CI/CD hardening, environment promotion, rollback strategy.
- Backup/restore automation and DR drills.

### 5.4 Quality Engineering Team
Mission: Shift-left verification and production confidence.
Responsibilities:
- Test pyramid expansion (contract, integration, e2e).
- Deterministic test data and environment orchestration using `scripts/with_server.py`.
- Performance/load and chaos tests.

### 5.5 Data Engineering and Analytics Team
Mission: Accurate decision intelligence.
Responsibilities:
- Event schema for order lifecycle and upsell attribution.
- KPI warehouse marts (AOV, prep SLA, service SLA, table turn).
- Data quality checks and governance.

### 5.6 API and Integrations Team
Mission: Third-party ecosystem and local-market integrations.
Responsibilities:
- Payment providers (Telebirr/Chapa), notifications, POS connectors.
- Webhook reliability and signature verification.

### 5.7 Frontend/UX Product Team
Mission: Mobile-first operational UX with premium finish.
Responsibilities:
- Guest ordering UX, KDS ergonomics, waiter workflow UX.
- Accessibility and localization (Amharic/English).
- Optimistic UI and offline failure-state design.

### 5.8 Branding + Agency Web Design + UI/UX Design Guild
Mission: Awwwards-grade premium visual system without sacrificing performance.
Responsibilities:
- Brand system, motion language, storytelling interaction patterns.
- Premium stack adoption:
  - Headless primitives: Radix UI or React Aria
  - Motion: GSAP + Motion
  - Smooth scroll: Lenis
  - Signature effects: React Three Fiber where justified
- Design QA gates for consistency and perceived quality.

## 6) Prioritized Execution Roadmap

### P0 - Critical Blockers (must complete before production)
| ID | Work Item | Effort | Risk | Dependencies | Success Criteria |
|---|---|---|---|---|---|
| P0-1 ✅ (Completed 2026-02-15) | Remove auth bypass and redesign RBAC hooks/guards | 1 week | High | none | No dev bypass in prod code; unauthorized access blocked in tests |
| P0-2 ✅ (Completed 2026-02-15) | Replace permissive RLS with tenant+role policies | 2 weeks | High | P0-1 | Cross-tenant access tests fail as expected (negative tests pass) |
| P0-3 ✅ (Completed 2026-02-15) | Implement canonical order/service APIs with idempotency and validation | 2 weeks | High | P0-2 | Guest order, service request, bill request complete via API with audit trail |
| P0-4 ✅ (Completed 2026-02-15) | Rework guest route to strict slug/table context with signed QR validation | 1 week | Medium | P0-2 | No table spoofing; QR signature verified server-side |
| P0-5 ✅ (Completed 2026-02-15) | Replace mock KDS data with realtime order feed and ack workflow | 2 weeks | High | P0-3 | New orders alert until accepted; state transitions persisted |
| P0-6 | Migration baseline reset and schema reconciliation | 1 week | High | P0-2 | Fresh environment bootstraps cleanly; no conflicting migration paths |
| P0-7 | Minimum release quality gates (lint clean, coverage plugin fixed, non-trivial e2e) | 1 week | Medium | P0-3 | CI green with meaningful functional e2e suite |

### P1 - Enterprise Readiness (essential next)
| ID | Work Item | Effort | Risk | Dependencies | Success Criteria |
|---|---|---|---|---|---|
| P1-1 | Observability stack (logs, metrics, traces, alerting) | 2 weeks | Medium | P0 complete | SLO dashboard + pager alerts for error budget burn |
| P1-2 | DR foundations (backup, restore drills, runbooks, RTO/RPO) | 2 weeks | Medium | P0-6 | Restore drill documented and repeated successfully |
| P1-3 | Compliance baseline (SOC2 controls, GDPR workflows, data retention) | 3 weeks | Medium | P0-2 | Control matrix approved; DSR process test executed |
| P1-4 | Waiter app operational flow (push, void/edit gates, task inbox) | 2 weeks | Medium | P0-3, P0-5 | Waiter SLA metrics captured and under target |
| P1-5 | Performance hardening for 3G/4G and budget enforcement | 2 weeks | Medium | P0-7 | Core guest journey meets budget and Lighthouse thresholds |

### P2 - Operational Excellence (important)
| ID | Work Item | Effort | Risk | Dependencies | Success Criteria |
|---|---|---|---|---|---|
| P2-1 | Course firing and station routing engine | 3 weeks | Medium | P1-4 | Correct routing by station with configurable fire times |
| P2-2 | Advanced menu intelligence and upsell experimentation | 3 weeks | Medium | P1 telemetry | A/B framework with measured AOV lift |
| P2-3 | mDNS/P2P local fallback pilot (feature flagged) | 4 weeks | High | P1 stability | Controlled pilot succeeds under WAN outage simulation |
| P2-4 | Multi-location enterprise controls (RBAC scopes, analytics rollups) | 3 weeks | Medium | P1-3 | Chain-level dashboard and per-site policy controls live |

### P3 - Backlog (high-value enhancements)
| ID | Work Item | Effort | Risk | Dependencies | Success Criteria |
|---|---|---|---|---|---|
| P3-1 | White-label theming and agency management plane | 3 weeks | Low | P2-4 | Tenant branding safely isolated |
| P3-2 | Marketing-grade scrollytelling layer for public site | 2 weeks | Low | P1-5 | Premium experience with no core funnel regression |
| P3-3 | AI cross-sell personalization v2 | 4 weeks | Medium | P2-2 | Lift over rule-based baseline is statistically significant |

## 7) Premium Design Program (Awwwards-Level, Production-Safe)
Design direction: premium dark-by-default dining aesthetic with fast mobile execution.

Mandatory design system decisions:
1. UI primitives:
- Migrate from style-opinionated components to headless primitives (Radix UI or React Aria).
- Keep accessibility guarantees while owning full visual language.

2. Motion system:
- GSAP ScrollTrigger for hero scrollytelling.
- Motion for route/layout transitions and micro-interactions.
- Lenis for weighted smooth scrolling on marketing and storytelling surfaces.

3. Signature interactions:
- Custom cursor and magnetic CTA on desktop.
- Preloader with progressive reveal.
- Page transitions with continuity, not hard jumps.

4. Performance guardrails:
- No premium effect ships without performance budget proof.
- Mobile fallback paths for lower-end Android devices.

5. Brand and localization:
- Dual-language typography strategy (Amharic + English) with tuned type scale.
- ETB formatting as default in Ethiopian tenant contexts.

## 8) CTO Non-Negotiables (Production Exit Criteria)
Production launch is blocked until all are true:
1. Zero critical auth/RLS findings in security review.
2. End-to-end guest->kitchen->waiter workflow tested in CI and staging.
3. SLOs defined and monitored (availability, order latency, ack latency).
4. Backup restore drill pass with measured RTO/RPO.
5. Compliance baseline signed off by Security and Legal.
6. Mobile performance targets met on representative 3G/4G test devices.

## 9) External Benchmark Notes (Checked 2026-02-15)
- Toast KDS and kitchen ops references:
  - https://pos.toasttab.com/blog/on-the-line/kitchen-display-system
  - https://doc.toasttab.com/doc/platformguide/adminKDSOverview.html
  - https://doc.toasttab.com/doc/platformguide/adminRoutingOverview.html
  - https://doc.toasttab.com/doc/platformguide/adminTableServiceOverview.html
- Toast guest flow references:
  - https://www.toasttab.com/order-and-pay-at-the-table
- Comparable hospitality patterns:
  - https://www.gloriafood.com/how-online-ordering-system-works
  - https://www.gloriafood.com/restaurant-table-ordering-system
  - https://www.finedinemenu.com/features

Note on Menu.ae:
- Public technical documentation discoverability is limited from this environment. Keep Menu.ae in benchmark set, but base implementation decisions on validated observable behavior and direct product demos.

## 10) Immediate Next Week Plan
1. Completed: Security strike sprint (P0-1 + P0-2).
2. Completed: Guest mutation workflow sprint (P0-3).
3. Completed: Guest route hardening and QR signature validation (P0-4).
4. Completed: Realtime KDS replacement of mock ticket feed (P0-5).
5. Completed: CI quality gates (P0-7). Next: P1 enterprise readiness workstream kickoff.

## 11) Execution Status (Live)
- [x] P0-1: Remove auth bypass and redesign RBAC hooks/guards
- [x] P0-2: Replace permissive RLS with tenant+role policies
- [x] P0-3: Implement canonical order/service APIs with idempotency and validation
- [x] P0-4: Rework guest route to strict slug/table context with signed QR validation
- [x] P0-5: Replace mock KDS data with realtime order feed and ack workflow
- [x] P0-6: Migration baseline reset and schema reconciliation
- [x] P0-7: Minimum release quality gates (lint clean, coverage plugin fixed, non-trivial e2e)

## 12) Implementation Changelog
### Phase 1 - P0-1 Auth Hardening (2026-02-15)
Changed files:
- `src/hooks/useRole.ts`
- `src/app/auth/login/page.tsx`
- `Tasks.md`

Delivered:
- Removed client-side auth bypass behavior (`dev_bypass_auth`) so merchant access cannot be unlocked via local storage.
- Reworked `useRole` to always resolve authenticated user first, then fetch active staff role.
- Added fallback role-resolution behavior when `restaurantId` is null by selecting the user's first active restaurant membership.
- Added cancellation guards in `useRole` effect to avoid stale state writes.
- Removed the test-mode merchant backdoor button from login UI.
- Cleaned duplicated login copy ("By signing in, you agree to the").

### Phase 2 - P0-2 RLS Hardening (2026-02-15)
Changed files:
- `supabase/migrations/20260215_p0_rls_hardening.sql`
- `Tasks.md`

Delivered:
- Added and applied a new migration that removes permissive `USING/WITH CHECK (true)` access patterns on critical runtime tables.
- Replaced `orders` policies with:
  - constrained guest inserts (`anon/authenticated`) with tenant/data validation
  - tenant-scoped authenticated staff/agency read and update policies.
- Replaced `order_items` policies with authenticated tenant-scoped read/insert/update policies via parent-order restaurant ownership checks.
- Replaced `service_requests` policies with:
  - constrained guest inserts with tenant validation
  - tenant-scoped authenticated read/update policies.
- Tightened `tables` access:
  - public read only for active tables
  - authenticated tenant staff/agency management policy.
- Tightened `restaurant_staff` visibility policy to authenticated scope only.
- Verified live policy state in Supabase after migration apply.

### Phase 3 - P0-3 Canonical Guest Mutation APIs (2026-02-15)
Changed files:
- `src/app/api/orders/route.ts`
- `src/app/api/service-requests/route.ts`
- `src/features/menu/components/CartDrawer.tsx`
- `src/features/menu/components/ServiceRequestButton.tsx`
- `src/app/(guest)/[slug]/page.tsx`
- `src/app/(dashboard)/merchant/orders/page.tsx`
- `src/proxy.ts`
- `Tasks.md`

Delivered:
- Added `POST /api/orders` with:
  - schema validation
  - idempotency key generation/acceptance
  - guest fingerprint + rate-limit check
  - centralized `createOrder` service usage for item validation and safe order creation.
- Added `POST /api/service-requests` with payload validation and typed insert path.
- Wired guest UI to real APIs:
  - cart checkout now submits real orders
  - service actions now create real service requests (waiter/bill).
- Added API-level audit trail writes into `audit_logs` for both guest orders and service requests.
- Added middleware size limits for `/api/orders` and `/api/service-requests`.
- Resolved guest route context (`slug`, `table` query param) and propagated restaurant/table into order/service flows.

### Phase 4 - P0-4 Strict Guest Context + Signed QR Validation (2026-02-15)
Changed files:
- `src/lib/security/guestContext.ts`
- `src/app/api/guest/context/route.ts`
- `src/app/api/orders/route.ts`
- `src/app/api/service-requests/route.ts`
- `src/app/(guest)/[slug]/page.tsx`
- `src/features/menu/components/CartDrawer.tsx`
- `src/features/menu/components/ServiceRequestButton.tsx`
- `Tasks.md`

Delivered:
- Added a shared server-side guest context resolver that validates `slug/table/sig/exp`, verifies HMAC signature + expiry, and resolves active restaurant/table records.
- Added `GET /api/guest/context` for guest-session context validation from signed QR links.
- Hardened `POST /api/orders` and `POST /api/service-requests` to derive `restaurant_id`/`table_number` only from validated guest context (no trust in client restaurant/table payload).
- Added guest-context metadata (`slug`) into audit logs for orders and service requests.
- Reworked guest route loading to validate QR context first and block access on invalid/expired links.
- Scoped guest menu fetching to the validated restaurant context instead of querying globally across restaurants.

### Phase 5 - P0-5 Realtime KDS Feed + Ack Workflow (2026-02-15)
Changed files:
- `src/app/(kds)/kds/page.tsx`
- `src/features/kds/components/TicketCard.tsx`
- `src/app/api/kds/orders/[orderId]/route.ts`
- `Tasks.md`

Delivered:
- Replaced mock KDS ticket generation with live order data from `orders`, tenant-scoped to the authenticated staff member’s restaurant.
- Added Supabase realtime subscription for `orders` changes (`INSERT/UPDATE/DELETE`) and automatic queue refresh.
- Added `PATCH /api/kds/orders/[orderId]` for persisted KDS status transitions (`pending -> acknowledged -> preparing -> ready`) with auth checks, staff tenancy checks, and transition validation.
- Wired ticket actions to persist status changes through API calls and remove completed tickets from active KDS queue.
- Updated ticket behavior so new tickets continue siren flashing until explicitly accepted, satisfying the ack requirement.

### Phase 6 - Auth Enablement Before P0-6 (2026-02-16)
Changed files:
- `src/app/auth/login/page.tsx`
- `src/app/auth/signup/page.tsx`
- `src/app/auth/actions.ts`
- `src/lib/supabase/middleware.ts`
- `supabase/migrations/20260215_auth_signup_bootstrap.sql`
- `CHANGELOG.md`
- `Tasks.md`

Delivered:
- Replaced visual-only login flow with real Supabase email/password authentication and role-aware redirects.
- Replaced visual-only signup flow with real Supabase account creation flow and callback redirect support.
- Added and applied Supabase trigger migration so each new `auth.users` signup automatically gets:
  - a default merchant restaurant
  - an active `owner` membership in `restaurant_staff`.
- Added migration backfill logic for existing auth users missing merchant staff records.
- Hardened middleware auth protection for operational surfaces: `/merchant`, `/kds`, `/staff`, and `/app`.
- Updated server auth action redirect from demo route to `/merchant`.

### Phase 7 - Auth Sign-In Reliability + UI Redesign (2026-02-16)
Changed files:
- `src/app/auth/login/page.tsx`
- `src/app/auth/signup/page.tsx`
- `CHANGELOG.md`
- `Tasks.md`

Delivered:
- Fixed fragile login behavior by making post-auth role lookup non-blocking so valid credentials always establish a session and continue to merchant/kitchen routing.
- Improved auth error handling to surface concrete messages (invalid credentials, email confirmation required) instead of generic failure text.
- Replaced current auth layouts with a new SoftQA-inspired split-screen design adapted to Gebeta brand language:
  - preserved motion/background animation style
  - applied Gebeta color palette, typography, and product messaging
  - aligned login/signup visual system for consistency.

### Phase 8 - Post-Confirm Access Denied Resolution (2026-02-16)
Changed files:
- `src/hooks/useRole.ts`
- `src/components/auth/RoleGuard.tsx`
- `src/app/auth/signup/page.tsx`
- `CHANGELOG.md`
- `Tasks.md`

Delivered:
- Fixed the post-confirmation/post-login `/merchant` access issue by stabilizing role resolution and refreshing role state on auth events.
- Added `onAuthStateChange` handling so callback-based sign-ins and token refreshes correctly propagate to role checks.
- Improved guard behavior to redirect unauthenticated users to `/auth/login` rather than trapping them on a permission dead-end state.

### Phase 9 - Supabase SSR Session Settlement + RPC Role Resolution (2026-02-16)
Changed files:
- `supabase/migrations/20260216_role_resolution_rpc.sql`
- `src/hooks/useRole.ts`
- `src/app/auth/post-login/page.tsx`
- `src/app/auth/login/page.tsx`
- `src/app/auth/signup/page.tsx`
- `src/app/auth/actions.ts`
- `src/app/auth/callback/route.ts`
- `CHANGELOG.md`
- `Tasks.md`

Delivered:
- Added a security-definer Supabase RPC (`get_my_staff_role`) for deterministic role lookup when client-side RLS reads are inconsistent.
- Routed login/signup/callback through `/auth/post-login` to allow session cookies/tokens to settle before entering protected `/merchant` routes.
- Aligned implementation with Supabase SSR guidance for post-auth navigation stability in Next.js.

### Phase 10 - P0-6 Migration Baseline Reconciliation (2026-02-16)
Changed files:
- `supabase/migrations/20260126_create_service_requests.sql`
- `supabase/migrations/20260201_audit_compliance_updates.sql`
- `supabase/migrations/20260214_phase1_foundation.sql`
- `supabase/migrations/20260215_auth_signup_bootstrap.sql`
- `supabase/migrations/20260215_p0_rls_hardening.sql`
- `supabase/migrations/20260216_zz_p0_migration_baseline_reconciliation.sql`
- `CHANGELOG.md`
- `Tasks.md`

Delivered:
- Reworked early migrations to be baseline-safe for fresh environments (guarded table/policy/publication operations, no hard dependency on out-of-order tables).
- Removed migration-chain bootstrap failures by adding compatibility guards for:
  - `service_requests` creation before `restaurants`
  - audit/index operations before canonical audit table is present
  - realtime publication creation before table registration.
- Added schema compatibility upgrades before RLS hardening runs:
  - guaranteed `orders.table_number`, `orders.items`, `orders.total_price`, and operational KDS fields exist
  - ensured `restaurants.contact_email` exists before auth bootstrap inserts.
- Added safety bootstrap for `agency_users` so tenant/agency RLS policy creation does not fail on fresh DBs.
- Added a dedicated reconciliation migration that normalizes canonical runtime schema and backfills legacy variants:
  - audit table naming (`audit_log` -> `audit_logs`) and column compatibility
  - orders/order_items legacy column backfills
  - missing foreign keys for `service_requests` and `rate_limit_logs`
  - canonical realtime publication membership for core operational tables.

### Phase 11 - P0-7 Minimum Release Quality Gates (2026-02-16)
Changed files:
- `package.json`
- `pnpm-lock.yaml`
- `vitest.config.ts`
- `eslint.config.mjs`
- `e2e/example.spec.ts`
- `.github/workflows/ci.yml`
- `CHANGELOG.md`
- `Tasks.md`

Delivered:
- Fixed coverage execution by adding the missing Vitest V8 coverage provider dependency (`@vitest/coverage-v8`).
- Strengthened unit-test quality gates:
  - retained coverage execution in CI path
  - added minimum coverage thresholds in `vitest.config.ts` (statements/functions/lines/branches).
- Added a single local quality gate command (`pnpm test:ci`) that runs:
  - lint
  - type-check
  - coverage tests
  - Playwright E2E (Chromium).
- Replaced trivial title-only Playwright check with non-trivial user-journey E2E coverage:
  - landing hero + merchant CTA routing
  - login password-visibility toggle + signup route navigation
  - signup form field presence + login route navigation.
- Aligned GitHub Actions to run:
  - `pnpm run test:coverage` for unit coverage
  - Playwright E2E on Chromium for deterministic CI execution time and stability.
