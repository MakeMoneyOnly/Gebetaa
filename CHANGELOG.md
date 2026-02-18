# Changelog

All notable changes to the Gebeta Restaurant Operating System project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added - 2026-02-18

#### P1 Team Operations and Alerting
- Added migrations:
  - `supabase/migrations/20260218_p1_shifts.sql`
  - `supabase/migrations/20260218_p1_time_entries.sql`
- Added Team Operations APIs:
  - `GET /api/staff/schedule` and `POST /api/staff/schedule` in `src/app/api/staff/schedule/route.ts`
  - `POST /api/staff/time-entries/clock` in `src/app/api/staff/time-entries/clock/route.ts`
- Added Alerting and presets APIs:
  - `GET /api/alerts/rules` and `POST /api/alerts/rules` in `src/app/api/alerts/rules/route.ts`
  - `PATCH /api/alerts/rules/:id` in `src/app/api/alerts/rules/[ruleId]/route.ts`
  - `GET /api/merchant/dashboard-presets` and `PATCH /api/merchant/dashboard-presets` in `src/app/api/merchant/dashboard-presets/route.ts`
- Added Team Operations UI:
  - `ScheduleCalendar` in `src/components/merchant/ScheduleCalendar.tsx`
  - `TimeClockPanel` in `src/components/merchant/TimeClockPanel.tsx`
  - Staff page wiring in `src/app/(dashboard)/merchant/staff/page.tsx`
- Added Alerting and preset UI:
  - `DashboardPresetSwitcher` in `src/components/merchant/command-center/DashboardPresetSwitcher.tsx`
  - `AlertRuleBuilderDrawer` in `src/components/merchant/command-center/AlertRuleBuilderDrawer.tsx`
  - Dashboard integration in `src/app/(dashboard)/merchant/page.tsx`
- Added API route unit tests for Phase 5.3:
  - `src/app/api/__tests__/team-ops-alerting-api-routes.test.ts`
- Updated API rate-limit policy map:
  - `src/lib/api/rateLimitPolicies.ts`
- Updated local DB typings:
  - `src/types/database.ts`

#### P1 Channels (Online Ordering + Delivery V1)
- Added migrations:
  - `supabase/migrations/20260218_p1_delivery_partners.sql`
  - `supabase/migrations/20260218_p1_external_orders.sql`
- Added Channels APIs:
  - `GET /api/channels/summary` in `src/app/api/channels/summary/route.ts`
  - `GET /api/channels/online-ordering/settings` in `src/app/api/channels/online-ordering/settings/route.ts`
  - `PATCH /api/channels/online-ordering/settings` in `src/app/api/channels/online-ordering/settings/route.ts`
  - `POST /api/channels/delivery/connect` in `src/app/api/channels/delivery/connect/route.ts`
  - `GET /api/channels/delivery/orders` in `src/app/api/channels/delivery/orders/route.ts`
  - `POST /api/channels/delivery/orders/:id/ack` in `src/app/api/channels/delivery/orders/[externalOrderId]/ack/route.ts`
- Added Channels UI:
  - New page `src/app/(dashboard)/merchant/channels/page.tsx`
  - New `ChannelHealthBoard` component in `src/components/merchant/ChannelHealthBoard.tsx`
  - New `OnlineOrderingSettingsPanel` component in `src/components/merchant/OnlineOrderingSettingsPanel.tsx`
  - New `DeliveryPartnerHub` component in `src/components/merchant/DeliveryPartnerHub.tsx`
- Added Channels navigation wiring:
  - `src/components/merchant/Sidebar.tsx`
  - `src/components/merchant/MobileBottomNav.tsx`
  - `src/components/merchant/CommandBarShell.tsx`
- Added channels API unit tests:
  - `src/app/api/__tests__/channels-api-routes.test.ts`
- Updated route-level API rate limit policy map:
  - `src/lib/api/rateLimitPolicies.ts`
- Updated local DB typings for channels entities:
  - `src/types/database.ts`

#### P1 Growth Operations Kickoff (Guests CRM Starter)
- Added migrations:
  - `supabase/migrations/20260218_p1_guests.sql`
  - `supabase/migrations/20260218_p1_guest_visits.sql`
- Added historical backfill job from `orders` to CRM guest entities:
  - `scripts/backfill_p1_guests_from_orders.sql`
- Added new guest APIs:
  - `GET /api/guests` in `src/app/api/guests/route.ts`
  - `GET /api/guests/:id` in `src/app/api/guests/[guestId]/route.ts`
  - `PATCH /api/guests/:id` in `src/app/api/guests/[guestId]/route.ts`
  - `GET /api/guests/:id/visits` in `src/app/api/guests/[guestId]/visits/route.ts`
- Added API unit tests for guest routes:
  - `src/app/api/__tests__/guests-api-routes.test.ts`
- Updated local DB typings for new guest entities:
  - `src/types/database.ts`
- Added Guests tab UI implementation:
  - `GuestDirectory` component with search, segment filters, and tag filter chips
  - `GuestProfileDrawer` component with profile editing and visit timeline
  - New page `src/app/(dashboard)/merchant/guests/page.tsx` wired to guest APIs
  - Added Guests navigation link in desktop/mobile merchant navigation
  - `src/components/merchant/GuestDirectory.tsx`
  - `src/components/merchant/GuestProfileDrawer.tsx`
  - `src/components/merchant/Sidebar.tsx`
  - `src/components/merchant/MobileBottomNav.tsx`

### Added - 2026-02-17

#### P0 Implementation Kickoff (Task-driven)
- Added execution governance docs:
  - `docs/implementation/owners.md`
  - `docs/implementation/release-cadence.md`
  - `docs/implementation/performance-slos.md`
  - `docs/implementation/security-endpoint-checklist.md`
  - `docs/implementation/incident-triage-rubric.md`
  - `docs/implementation/weekly-delivery-review.md`
- Added implementation and standards docs:
  - `docs/api/template.md`
  - `supabase/migrations/README.md`
  - `docs/implementation/risk-register.md`
- Added database baseline snapshot:
  - `docs/TECHNICAL/database/schema-snapshot-2026-02-17.md`
- Added migration:
  - `supabase/migrations/20260217_p0_tables_sessions_foundation.sql`
    - Enhances `tables` with `capacity`, `zone`, `qr_version`
    - Adds `table_sessions` with indexes, trigger, and RLS policies
- Added shared API response helper:
  - `src/lib/api/response.ts`
- Added new API endpoint:
  - `GET /api/merchant/command-center` in `src/app/api/merchant/command-center/route.ts`
- Applied migration to Supabase via MCP:
  - `p0_tables_sessions_foundation` (2026-02-17)
- Added migration:
  - `supabase/migrations/20260217_p0_order_events.sql`
- Applied migration to Supabase via MCP:
  - `p0_order_events_foundation` (2026-02-17)
- Added migrations:
  - `supabase/migrations/20260217_p0_alert_rules.sql`
  - `supabase/migrations/20260217_p0_alert_events.sql`
  - `supabase/migrations/20260217_p0_support_tickets.sql`
  - `supabase/migrations/20260217_p0_queue_indexes.sql`
- Applied migrations to Supabase via MCP:
  - `p0_alert_rules_foundation` (2026-02-17)
  - `p0_alert_events_foundation` (2026-02-17)
  - `p0_support_tickets_foundation` (2026-02-17)
  - `p0_queue_indexes` (2026-02-17)
- Extended existing API endpoint:
  - `GET /api/orders` in `src/app/api/orders/route.ts` (status/search/limit query support)
- Added new order mutation endpoint:
  - `PATCH /api/orders/:id/status` in `src/app/api/orders/[orderId]/status/route.ts`
- Order status updates now append order event timeline records:
  - `src/app/api/orders/[orderId]/status/route.ts`
- Dashboard now reads live command-center metrics:
  - `src/app/(dashboard)/merchant/page.tsx`
- Orders tab now fetches from API with real search/filter wiring:
  - `src/app/(dashboard)/merchant/orders/page.tsx`
- Orders tab status updates are now API-backed from the Update action:
  - `src/app/(dashboard)/merchant/orders/page.tsx`
- Added API-backed order details retrieval:
  - `GET /api/orders/:id` in `src/app/api/orders/[orderId]/route.ts`
- Orders details button now opens a live details modal backed by API:
  - `src/app/(dashboard)/merchant/orders/page.tsx`
- Extended order details API to include order event timeline data:
  - `GET /api/orders/:id` in `src/app/api/orders/[orderId]/route.ts`
- Orders details modal now renders `order_events` timeline:
  - `src/app/(dashboard)/merchant/orders/page.tsx`
- Orders tab now supports optimistic status updates with rollback on error:
  - `src/app/(dashboard)/merchant/orders/page.tsx`
- Orders tab now surfaces invalid transition conflict messaging:
  - `src/app/(dashboard)/merchant/orders/page.tsx`
- Orders tab now includes keyboard shortcuts (`/`, `1-4`) and persisted filters:
  - `src/app/(dashboard)/merchant/orders/page.tsx`
- Dashboard KPI cards aligned to existing Staff/Analytics stat-card visual system while keeping live command-center wiring:
  - `src/app/(dashboard)/merchant/page.tsx`
- Added `OrdersQueueTable` behavior with persisted queue preferences (view mode + sort key + direction):
  - `src/components/merchant/OrdersQueueTable.tsx`
  - `src/app/(dashboard)/merchant/orders/page.tsx`
- Added `OrdersKanbanBoard` toggle mode for operational workflow by status lanes:
  - `src/components/merchant/OrdersKanbanBoard.tsx`
  - `src/app/(dashboard)/merchant/orders/page.tsx`
- Added `BulkActionBar` for multi-select status updates and assignment workflows:
  - `src/components/merchant/BulkActionBar.tsx`
  - `src/app/(dashboard)/merchant/orders/page.tsx`
- Added merchant-side service requests API retrieval:
  - `GET /api/service-requests` in `src/app/api/service-requests/route.ts`
- Added service request status mutation endpoint:
  - `PATCH /api/service-requests/:id` in `src/app/api/service-requests/[requestId]/route.ts`
- Orders queue now merges service requests with orders across queue/table/kanban/card views:
  - `src/app/(dashboard)/merchant/orders/page.tsx`
  - `src/components/merchant/OrdersQueueTable.tsx`
  - `src/components/merchant/OrdersKanbanBoard.tsx`
- Regenerated local DB typings to include new P0 entities and columns:
  - `src/types/database.ts`
- Added local seed script for P0 merchant journey:
  - `scripts/seed_p0_merchant_flow.sql`
- Added API foundation helpers:
  - `src/lib/api/validation.ts`
  - `src/lib/api/authz.ts`
  - `src/lib/api/idempotency.ts`
  - `src/lib/api/audit.ts`
  - `src/lib/api/rateLimitPolicies.ts`
- Added route-level rate limit policy resolution in middleware:
  - `src/proxy.ts`
- Added new API endpoints:
  - `POST /api/orders/:id/assign` in `src/app/api/orders/[orderId]/assign/route.ts`
  - `POST /api/orders/bulk-status` in `src/app/api/orders/bulk-status/route.ts`
  - `GET /api/tables` and `POST /api/tables` in `src/app/api/tables/route.ts`
  - `PATCH /api/tables/:id` and `DELETE /api/tables/:id` in `src/app/api/tables/[tableId]/route.ts`
  - `POST /api/tables/:id/qr/regenerate` in `src/app/api/tables/[tableId]/qr/regenerate/route.ts`
  - `POST /api/table-sessions/open` in `src/app/api/table-sessions/open/route.ts`
  - `POST /api/table-sessions/:id/transfer` in `src/app/api/table-sessions/[sessionId]/transfer/route.ts`
  - `POST /api/table-sessions/:id/close` in `src/app/api/table-sessions/[sessionId]/close/route.ts`
  - `GET /api/staff` in `src/app/api/staff/route.ts`
  - `POST /api/staff/invite` in `src/app/api/staff/invite/route.ts`
  - `PATCH /api/staff/:id/role` in `src/app/api/staff/[staffId]/role/route.ts`
  - `PATCH /api/staff/:id/active` in `src/app/api/staff/[staffId]/active/route.ts`
  - `GET /api/analytics/overview` in `src/app/api/analytics/overview/route.ts`
  - `GET /api/settings/security` and `PATCH /api/settings/security` in `src/app/api/settings/security/route.ts`
  - `GET /api/support/articles` in `src/app/api/support/articles/route.ts`
  - `POST /api/support/tickets` in `src/app/api/support/tickets/route.ts`
- Replaced Menu tab prompt/alert/confirm CRUD flows with production modals and toast feedback:
  - Category create/edit modal form and delete confirmation dialog
  - Non-blocking error/success handling for category and item save/upload actions
  - `src/app/(dashboard)/merchant/menu/page.tsx`
  - `src/features/merchant/components/MenuItemModal.tsx`
- Added `MenuGridEditor` with inline edit and validation for menu item cards:
  - Inline name/price/description/availability editing with save/cancel states
  - Client-side validation for required name, numeric price, and max lengths
  - Advanced edit flow remains available via existing item modal
  - `src/components/merchant/MenuGridEditor.tsx`
  - `src/app/(dashboard)/merchant/menu/page.tsx`
- Added multi-select bulk availability controls in Menu Grid:
  - Selection mode with per-item pick checkboxes
  - Bulk `In Stock` / `Sold Out` actions wired to live `menu_items` updates
  - Local state sync and action-level feedback toasts
  - `src/components/merchant/MenuGridEditor.tsx`
  - `src/app/(dashboard)/merchant/menu/page.tsx`
- Added bulk price update modal with preview for selected menu items:
  - Supports absolute price set and percent-based adjustment
  - Includes preview rows before apply and validation for unsafe values
  - Applies live updates to `menu_items` and syncs UI state immediately
  - `src/components/merchant/MenuGridEditor.tsx`
  - `src/app/(dashboard)/merchant/menu/page.tsx`
- Added category reorder controls with persisted `order_index`:
  - Up/down category actions in menu section headers
  - Persists order via `categories` upsert and refreshes on failure
  - `src/app/(dashboard)/merchant/menu/page.tsx`
- Added publish workflow and diff preview for Menu drafts:
  - Publish modal with per-category/item diff entries against last published snapshot
  - Publish action updates in-session published baseline for draft tracking
  - `src/app/(dashboard)/merchant/menu/page.tsx`
- Added rollback control for latest published menu snapshot:
  - Re-applies previous published category/item values to live tables
  - Refreshes UI after rollback with user feedback
  - `src/app/(dashboard)/merchant/menu/page.tsx`
- Added unsaved changes protection on Menu screen:
  - Draft-change indicator in header
  - `beforeunload` guard when unpublished changes exist
  - `src/app/(dashboard)/merchant/menu/page.tsx`
- Added production `TableGrid` component backed by live table records:
  - New reusable table card grid with loading, empty, and action states
  - Tables page now fetches from `GET /api/tables` and maps live table status data
  - Retained QR modal and occupancy graph integrations on top of live table list
  - `src/components/merchant/TableGrid.tsx`
  - `src/app/(dashboard)/merchant/tables/page.tsx`
- Replaced table prompt/confirm CRUD with production create/edit/delete flows:
  - Added create/edit forms as modals with validation and mutation loading states
  - Added delete confirmation modal for table removal
  - Wired create/update/delete actions to `/api/tables` endpoints
  - `src/app/(dashboard)/merchant/tables/page.tsx`
  - `src/components/merchant/TableGrid.tsx`
- Added table-session actions to tables operations UI:
  - Seat table (`POST /api/table-sessions/open`) with guest count input
  - Close open session (`POST /api/table-sessions/:id/close`)
  - Transfer open session (`POST /api/table-sessions/:id/transfer`) to another table
  - `src/app/(dashboard)/merchant/tables/page.tsx`
- Wired signed QR generation into merchant tables UI:
  - QR action now calls `POST /api/tables/:id/qr/regenerate` before rendering modal
  - QR modal renders signed URL payload from API response
  - `src/app/(dashboard)/merchant/tables/page.tsx`
- Added batch QR print/download workflow in Tables UI:
  - Batch QR action regenerates signed QR URLs for all tables
  - Added export modal with printable QR sheet and bulk PNG download
  - `src/app/(dashboard)/merchant/tables/page.tsx`
- Added `TableSessionDrawer` with real session state in Tables operations:
  - Status action opens right-side drawer showing latest table session details
  - Drawer is backed by live `table_sessions` query per table
  - `src/components/merchant/TableSessionDrawer.tsx`
  - `src/app/(dashboard)/merchant/tables/page.tsx`
- Added occupancy timeline and utilization trend view for tables:
  - New `TableOccupancyTimeline` component visualizing session opens/closes over recent intervals
  - Tables page now queries recent `table_sessions` and updates timeline with session actions
  - `src/components/merchant/TableOccupancyTimeline.tsx`
  - `src/app/(dashboard)/merchant/tables/page.tsx`
- Removed legacy unsigned QR fallback from merchant tables flow:
  - QR modal now renders only signed URL payloads from regenerate endpoint
  - Removed unsigned slug-based QR fallback path
  - `src/app/(dashboard)/merchant/tables/page.tsx`
- Replaced mock Staff page with live API-backed staff data:
  - Staff listing now loads from `GET /api/staff` with loading/error/empty states
  - `src/app/(dashboard)/merchant/staff/page.tsx`
- Added `InviteStaffModal` for role-based invite creation:
  - UI flow for creating staff invites via `POST /api/staff/invite`
  - Displays generated invite URL after creation
  - `src/components/merchant/InviteStaffModal.tsx`
  - `src/app/(dashboard)/merchant/staff/page.tsx`
- Added `RolePermissionDrawer` for role management:
  - Drawer workflow for updating member role via `PATCH /api/staff/:id/role`
  - `src/components/merchant/RolePermissionDrawer.tsx`
  - `src/app/(dashboard)/merchant/staff/page.tsx`
- Added activate/deactivate controls in Staff UI:
  - Per-member state toggles wired to `PATCH /api/staff/:id/active`
  - Endpoint-level audit logging already captures status changes
  - `src/app/(dashboard)/merchant/staff/page.tsx`
- Replaced Analytics placeholders with real query wiring:
  - Range filter now drives live metrics via `GET /api/analytics/overview`
  - Added order drilldown table from `GET /api/orders`
  - Added CSV export action for drilldown rows
  - `src/app/(dashboard)/merchant/analytics/page.tsx`
- Completed Settings persistence for Security controls:
  - Security tab now loads/saves using `GET|PATCH /api/settings/security`
  - `src/app/(dashboard)/merchant/settings/page.tsx`
- Added notification routing backend persistence and UI:
  - New endpoint `GET|PATCH /api/settings/notifications`
  - Settings notifications tab now persists routing configuration
  - `src/app/api/settings/notifications/route.ts`
  - `src/app/(dashboard)/merchant/settings/page.tsx`
- Replaced static Help cards with KB search and ticket creation:
  - Help page now queries `GET /api/support/articles`
  - Added ticket composer flow via `POST /api/support/tickets`
  - `src/app/(dashboard)/merchant/help/page.tsx`
- Added support ticket history/timeline view:
  - Extended `GET /api/support/tickets` for ticket history retrieval
  - Help page now renders timeline list of recent tickets
  - `src/app/api/support/tickets/route.ts`
  - `src/app/(dashboard)/merchant/help/page.tsx`
- Added unit tests for new/updated P0 API routes (`P0-086`):
  - Introduced consolidated API route contract tests covering auth guards, payload validation, and signed QR response shape.
  - `src/app/api/__tests__/p0-api-routes.test.ts`
- Added order lifecycle integration tests (`P0-087`):
  - Added integration coverage for guest create -> merchant assign -> status transitions -> order detail timeline.
  - Added integration coverage for invalid transition rejection and bulk status updates.
  - `src/app/api/__tests__/order-lifecycle.integration.test.ts`
- Added table session lifecycle integration tests (`P0-088`):
  - Added integration coverage for open -> transfer -> close flow with table status updates.
  - Added integration coverage for open-session conflict and destination-table-occupied transfer conflict.
  - `src/app/api/__tests__/table-session-lifecycle.integration.test.ts`
- Added dashboard attention-queue E2E coverage (`P0-089`):
  - Added Playwright scenario for queue render, order status advance action, and open-orders navigation.
  - Added Playwright scenario for manual refresh updating queue payload state.
  - Added non-production E2E auth bypass hooks for deterministic route access in tests.
  - `e2e/dashboard-attention-queue.spec.ts`
  - `src/proxy.ts`
  - `src/components/auth/RoleGuard.tsx`
- Added signed QR scan -> guest order E2E coverage (`P0-090`):
  - Added Playwright scenario validating signed QR context query params and `/api/guest/context` handshake.
  - Added Playwright scenario for guest menu load, add-to-cart flow, and `/api/orders` submission payload contract (`guest_context` + items).
  - `e2e/guest-signed-qr-order.spec.ts`
- Added API latency and error metrics dashboards (`P0-091`):
  - Added shared API telemetry writer and endpoint-level instrumentation for key SLO APIs.
  - Added `GET /api/analytics/api-metrics` for per-endpoint P50/P95/error-rate and trend aggregation.
  - Added API reliability dashboard section in analytics UI (SLO status, endpoint table, trend rows).
  - Added API metrics route unit coverage.
  - `src/lib/api/metrics.ts`
  - `src/app/api/merchant/command-center/route.ts`
  - `src/app/api/orders/route.ts`
  - `src/app/api/orders/[orderId]/status/route.ts`
  - `src/app/api/analytics/api-metrics/route.ts`
  - `src/app/(dashboard)/merchant/analytics/page.tsx`
  - `src/app/api/__tests__/api-metrics.route.test.ts`
  - `docs/OPERATIONS/monitoring/api-reliability-dashboard.md`
- Completed mobile regression across merchant tabs (`P0-092`):
  - Added mobile dashboard shell navigation via bottom nav for merchant tab traversal.
  - Updated dashboard layout spacing to support mobile-safe content and nav inset.
  - Added Playwright mobile regression coverage for all merchant tabs, including overflow checks.
  - `src/components/merchant/MobileBottomNav.tsx`
  - `src/app/(dashboard)/layout.tsx`
  - `src/components/merchant/Sidebar.tsx`
  - `e2e/mobile-merchant-tabs.spec.ts`
- Added P0 release readiness and rollback runbook (`P0-093`):
  - Defined go/no-go gates, rollback trigger conditions, rollback levers, and verification steps.
  - `docs/implementation/p0-release-readiness-and-rollback.md`
- Added pilot rollout feature-flag controls and enforcement (`P0-094`):
  - Added rollout env flags and pilot allowlist strategy in config.
  - Enforced pilot cohort and optional mutation block in merchant P0 API surfaces.
  - `src/lib/config/env.ts`
  - `.env.example`
  - `src/lib/config/pilotRollout.ts`
  - `src/lib/api/pilotGate.ts`
  - `src/lib/api/authz.ts`
  - `src/app/api/merchant/command-center/route.ts`
  - `src/app/api/merchant/activity/route.ts`
  - `src/app/api/orders/route.ts`
  - `src/app/api/orders/[orderId]/route.ts`
  - `src/app/api/orders/[orderId]/status/route.ts`
  - `src/app/api/orders/[orderId]/assign/route.ts`
  - `src/app/api/orders/bulk-status/route.ts`
  - `src/app/api/service-requests/[requestId]/route.ts`
- Added pilot feedback and critical patch workflow (`P0-095`):
  - Added severity classification, patch loop, and pilot issue tracking template.
  - `docs/implementation/p0-pilot-rollout-feature-flags.md`
  - `docs/implementation/p0-pilot-feedback-and-critical-patches.md`

#### Project Organization & Developer Experience
- **MAJOR**: Complete codebase reorganization for enterprise-grade structure
- **MAJOR**: Created comprehensive documentation hub at `docs/`
- **MAJOR**: Added AI agent context files for improved developer experience

#### Documentation
- `README.md` - Comprehensive project entry point with quick start guide
- `docs/README.md` - Documentation hub with navigation
- `docs/PRODUCT/product-requirements-document.md` - Full PRD with features and specifications
- `docs/TECHNICAL/tech-stack.md` - Complete technology stack documentation
- `docs/STANDARDS/coding-standards.md` - Coding standards and conventions

#### AI Agent Context Files
- `.clinerules` - Cline AI rules for context-aware assistance
- `.cursorrules` - Cursor AI rules for IDE integration

#### Developer Tooling
- Updated `.gitignore` with comprehensive ignore patterns
- Created `docs/` folder structure:
  - `docs/PRODUCT/` - Product documentation
  - `docs/TECHNICAL/` - Technical documentation
  - `docs/STANDARDS/` - Coding standards
  - `docs/OPERATIONS/` - Operational runbooks
  - `docs/DEVELOPMENT/` - Developer guides
  - `docs/COMPLIANCE/` - Compliance documentation
  - `docs/historical/` - Historical documentation

### Changed
- Consolidated scattered documentation into organized structure
- Removed redundant SDLC folder (was duplicate of docs)
- Removed cloned repositories from SKILLS folder (kept enterprise/)
- Removed empty/generated directories (infrastructure/, playwright-report/, test-results/)

### Removed
- `SDLC/` folder - Redundant with docs/ structure
- `SKILLS/agent-skills-main/` - External clone
- `SKILLS/anthropics-skills/` - External clone
- `SKILLS/awesome-cursorrules-main/` - External clone
- `SKILLS/claude-code-skills-main/` - External clone
- `SKILLS/superpowers-main/` - External clone
- `SKILLS/vibe-coding-ai-rules-main/` - External clone
- `SKILLS/backend-dev/` - External clone
- `SKILLS/brand-designer/` - External clone
- `SKILLS/design-system-engineer/` - External clone
- `SKILLS/devops-sre/` - External clone
- `SKILLS/frontend-dev/` - External clone
- `SKILLS/maintenance-scaler/` - External clone
- `SKILLS/ops-runbooks/` - External clone
- `SKILLS/orchestration/` - External clone
- `SKILLS/product-planner/` - External clone
- `SKILLS/qa-auto/` - External clone
- `SKILLS/security-gate/` - External clone
- `SKILLS/ux-researcher/` - External clone
- `SKILLS/ENTERPRISE_SKILLS_COMPLETION_SUMMARY.md` - Moved to docs
- `SKILLS/RESTAURANT.md` - Redundant
- `infrastructure/` - Empty directory
- `playwright-report/` - Generated files
- `test-results/` - Generated files

---

## [0.1.0] - 2026-02-14

### Added
- P0 Security Hardening complete
- Row-Level Security (RLS) policies on all tables
- HMAC signing for guest sessions
- Rate limiting with Redis
- CSRF protection
- Audit logging infrastructure

### Added - Infrastructure
- CI/CD pipeline with GitHub Actions
- Automated testing with Vitest
- E2E testing setup with Playwright
- Lighthouse CI integration

### Added - Core Features
- Kitchen Display System (KDS) with real-time updates
- Guest ordering via QR codes
- Merchant dashboard foundation
- Menu management basics
- Order management basics

### Added - Database
- Initial schema migrations
- Performance indexes
- Role resolution RPC functions
- Real-time subscriptions setup

---

## Version History

| Version | Date | Description |
|---------|------|-------------|
| Unreleased | 2026-02-17 | Codebase reorganization, documentation hub |
| 0.1.0 | 2026-02-14 | P0 Security hardening complete |
| 0.0.1 | 2026-01-26 | Initial project setup |

---

## Upcoming Milestones

### [0.2.0] - P1 Enterprise Readiness
- Observability stack (Sentry, logging)
- Payment integrations (Telebirr, Chapa)
- Staff management features
- Analytics dashboard

### [0.3.0] - P2 Production Ready
- Inventory management
- Loyalty programs
- Multi-location support
- Advanced reporting

---

**Last Updated:** February 17, 2026
