# Gebeta Merchant Platform - Execution Grade Master Tasks

Last updated: 2026-02-17
North star reference: `AUDIT.md`
Execution mode: Step-by-step, dependency-driven, release-gated

## 1) Operating Rules

- Work top-to-bottom unless a task explicitly says parallelizable.
- Do not start implementation tasks until governance and foundation tasks are complete.
- Every API mutation must include validation, authz, idempotency, and audit logging.
- Every user-facing task must ship with loading, error, and empty states.
- No task is done without tests and docs updates.

## 2) Definition of Done (Applies to All Tasks)

- [ ] Code completed and merged.
- [ ] Unit tests added/updated.
- [ ] Integration/E2E coverage added for critical behavior.
- [ ] Monitoring/logging added for runtime visibility.
- [ ] `AUDIT.md` and `CHANGELOG.md` updated where applicable.

## 3) Program Governance (Do First)

- [x] `GOV-001` Create owners matrix in `docs/implementation/owners.md`.
- [x] `GOV-002` Create release cadence in `docs/implementation/release-cadence.md`.
- [x] `GOV-003` Create PR checklist template in `.github/pull_request_template.md`.
- [x] `GOV-004` Create API contract template in `docs/api/template.md`.
- [x] `GOV-005` Create migration standards in `supabase/migrations/README.md`.
- [x] `GOV-006` Create risk register in `docs/implementation/risk-register.md`.
- [x] `GOV-007` Define performance SLOs for merchant command center.
- [x] `GOV-008` Define security checklist for all new endpoints.
- [x] `GOV-009` Define incident triage workflow and severity rubric.
- [x] `GOV-010` Set up weekly delivery review format.

## 4) Phase P0 (Weeks 1-4) - Trust and Core Operations

## 4.1 Data and Schema Foundation

- [x] `P0-001` Snapshot current schema and generate ERD.
- [x] `P0-002` Add migrations for `tables`.
- [x] `P0-003` Add migrations for `table_sessions`.
- [x] `P0-004` Add migrations for `order_events`.
- [x] `P0-005` Add migrations for `alert_rules`.
- [x] `P0-006` Add migrations for `alert_events`.
- [x] `P0-007` Add migrations for `support_tickets`.
- [x] `P0-008` Add indexes for order queue filters and sorts.
- [x] `P0-009` Add indexes for table state queries.
- [x] `P0-010` Add indexes for alert lookup and dashboard summary.
- [x] `P0-011` Add RLS policies for all new tables.
- [x] `P0-012` Add `updated_at` triggers and consistency checks.
- [x] `P0-013` Regenerate typed DB models.
- [x] `P0-014` Create seed script for local end-to-end merchant flow.

## 4.2 API Foundation and Hardening

- [x] `P0-015` Build shared API response helper (success/error envelope).
- [x] `P0-016` Build request validation helper (zod wrapper).
- [x] `P0-017` Build authz helper for restaurant-scoped staff access.
- [x] `P0-018` Build idempotency helper for write endpoints.
- [x] `P0-019` Build audit-log helper for mutation endpoints.
- [x] `P0-020` Add route-level rate-limit policies for critical APIs.
- [x] `P0-021` Implement `GET /api/merchant/command-center`.
- [x] `P0-022` Implement `GET /api/orders` with filter/sort/search/pagination.
- [x] `P0-023` Implement `PATCH /api/orders/:id/status`.
- [x] `P0-024` Implement `POST /api/orders/:id/assign`.
- [x] `P0-025` Implement `POST /api/orders/bulk-status`.
- [x] `P0-026` Implement `GET /api/tables`.
- [x] `P0-027` Implement `POST /api/tables`.
- [x] `P0-028` Implement `PATCH /api/tables/:id`.
- [x] `P0-029` Implement `DELETE /api/tables/:id`.
- [x] `P0-030` Implement `POST /api/tables/:id/qr/regenerate` returning signed URL (`slug`, `table`, `sig`, `exp`).
- [x] `P0-031` Implement `POST /api/table-sessions/open`.
- [x] `P0-032` Implement `POST /api/table-sessions/:id/transfer`.
- [x] `P0-033` Implement `POST /api/table-sessions/:id/close`.
- [x] `P0-034` Implement `GET /api/staff`.
- [x] `P0-035` Implement `POST /api/staff/invite`.
- [x] `P0-036` Implement `PATCH /api/staff/:id/role`.
- [x] `P0-037` Implement `PATCH /api/staff/:id/active`.
- [x] `P0-038` Implement `GET /api/analytics/overview`.
- [x] `P0-039` Implement `GET /api/settings/security`.
- [x] `P0-040` Implement `PATCH /api/settings/security`.
- [x] `P0-041` Implement `GET /api/support/articles`.
- [x] `P0-042` Implement `POST /api/support/tickets`.

## 4.3 Dashboard and Command Center UX

- [x] `P0-043` Replace static dashboard KPIs with live API-backed data.
- [x] `P0-044` Build `CommandCenterHeader` (range, refresh, sync state).
- [x] `P0-045` Build `LiveKPICard` with loading/error skeletons.
- [x] `P0-046` Build `AttentionQueuePanel` (orders + requests + alerts).
- [x] `P0-047` Add quick actions from queue into executable workflows.
- [x] `P0-048` Add stale-data indicator with retry and diagnostics.
- [x] `P0-049` Add global command bar shell for fast actions.

## 4.4 Service Ops UX (Orders + KDS + Requests)

- [x] `P0-050` Wire all orders tab actions to real APIs.
- [x] `P0-051` Build `OrdersQueueTable` with persistent filters.
- [x] `P0-052` Build `OrdersKanbanBoard` toggle.
- [x] `P0-053` Build `OrderDetailDrawer` with `order_events` timeline.
- [x] `P0-054` Build `BulkActionBar` for status and assignment.
- [x] `P0-055` Add SLA timers with threshold coloring.
- [x] `P0-056` Merge service requests into unified operational queue.
- [x] `P0-057` Implement optimistic update and rollback behavior.
- [x] `P0-058` Add invalid transition conflict messaging.
- [x] `P0-059` Add keyboard shortcuts for high-frequency actions.

## 4.5 Menu and Pricing UX

- [x] `P0-060` Replace prompt/alert CRUD with production UI.
- [x] `P0-061` Build `MenuGridEditor` (inline edit + validation).
- [x] `P0-062` Add multi-select and bulk availability actions.
- [x] `P0-063` Add bulk price update modal with preview.
- [x] `P0-064` Add category reorder and persist `order_index`.
- [x] `P0-065` Add publish diff view and publish action.
- [x] `P0-066` Add rollback control for latest publish.
- [x] `P0-067` Add unsaved changes protection.

## 4.6 Tables and QR UX

- [x] `P0-068` Build `TableGrid` backed by live table records.
- [x] `P0-069` Add create/edit/delete table flows.
- [x] `P0-070` Add seat/transfer/close table session actions.
- [x] `P0-071` Wire signed QR generation in merchant table UI.
- [x] `P0-072` Add batch QR print/download workflow.
- [x] `P0-073` Build `TableSessionDrawer` with real session state.
- [x] `P0-074` Add occupancy timeline and utilization view.
- [x] `P0-075` Remove legacy unsigned QR links from code paths.

## 4.7 Staff, Analytics, Settings, Help UX

- [x] `P0-076` Replace mock staff page with live data.
- [x] `P0-077` Build `InviteStaffModal`.
- [x] `P0-078` Build `RolePermissionDrawer`.
- [x] `P0-079` Add activate/deactivate controls with audit trail.
- [x] `P0-080` Replace analytics placeholder filters with real query wiring.
- [x] `P0-081` Add analytics drilldown table and export action.
- [x] `P0-082` Complete security settings persistence.
- [x] `P0-083` Add notification routing UI and backend persistence.
- [x] `P0-084` Replace static help cards with KB + ticket creation.
- [x] `P0-085` Add support ticket history/timeline view.

## 4.8 P0 Quality, Verification, and Release

- [x] `P0-086` Add unit tests for all new/updated P0 APIs.
- [x] `P0-087` Add integration tests for order lifecycle.
- [x] `P0-088` Add integration tests for table session lifecycle.
- [x] `P0-089` Add E2E for dashboard attention-queue workflow.
- [x] `P0-090` Add E2E for signed QR scan -> guest order path.
- [x] `P0-091` Add API latency and error metrics dashboards.
- [x] `P0-092` Run mobile regression across all merchant tabs.
- [x] `P0-093` Conduct release readiness review and rollback plan.
- [x] `P0-094` Roll out via feature flags to pilot group.
- [x] `P0-095` Capture pilot feedback and patch critical issues.

## 5) Phase P1 (Weeks 5-10) - Growth Operations

## 5.1 Guests (CRM Starter)

- [x] `P1-001` Add migrations for `guests`.
- [x] `P1-002` Add migrations for `guest_visits`.
- [x] `P1-003` Build backfill job from historical orders to guests.
- [x] `P1-004` Implement `GET /api/guests`.
- [x] `P1-005` Implement `GET /api/guests/:id`.
- [x] `P1-006` Implement `GET /api/guests/:id/visits`.
- [x] `P1-007` Implement `PATCH /api/guests/:id`.
- [x] `P1-008` Build `GuestDirectory`.
- [x] `P1-009` Build `GuestProfileDrawer`.
- [x] `P1-010` Add guest segmentation starter and tags.

## 5.2 Channels (Online Ordering + Delivery V1)

- [x] `P1-011` Add migrations for `delivery_partners`.
- [x] `P1-012` Add migrations for `external_orders`.
- [x] `P1-013` Implement `GET /api/channels/summary`.
- [x] `P1-014` Implement `GET /api/channels/online-ordering/settings`.
- [x] `P1-015` Implement `PATCH /api/channels/online-ordering/settings`.
- [x] `P1-016` Implement `POST /api/channels/delivery/connect`.
- [x] `P1-017` Implement `GET /api/channels/delivery/orders`.
- [x] `P1-018` Implement `POST /api/channels/delivery/orders/:id/ack`.
- [x] `P1-019` Build `ChannelHealthBoard`.
- [x] `P1-020` Build `OnlineOrderingSettingsPanel`.
- [x] `P1-021` Build `DeliveryPartnerHub`.

## 5.3 Team Operations and Alerting

- [x] `P1-022` Add migrations for `shifts`.
- [x] `P1-023` Add migrations for `time_entries`.
- [x] `P1-024` Implement `GET /api/staff/schedule`.
- [x] `P1-025` Implement `POST /api/staff/schedule`.
- [x] `P1-026` Implement `POST /api/staff/time-entries/clock`.
- [x] `P1-027` Build `ScheduleCalendar`.
- [x] `P1-028` Build `TimeClockPanel`.
- [x] `P1-029` Implement alert rules APIs and UI builder.
- [x] `P1-030` Add role-based dashboard presets.

## 5.4 P1 Quality and Release

- [x] `P1-031` Add E2E for guest directory and profile flows.
- [x] `P1-032` Add E2E for channel health and delivery ack.
- [x] `P1-033` Add localization regression pass for P1 screens.
- [x] `P1-034` Run accessibility pass.
- [x] `P1-035` Controlled rollout by merchant cohort.

## 6) Phase P2 (Weeks 11-18) - Revenue and Cost

## 6.1 Loyalty, Gift Cards, Campaigns

- [x] `P2-001` Add migrations for `loyalty_programs`.
- [x] `P2-002` Add migrations for `loyalty_accounts`.
- [x] `P2-003` Add migrations for `loyalty_transactions`.
- [x] `P2-004` Add migrations for `gift_cards`.
- [x] `P2-005` Add migrations for `gift_card_transactions`.
- [x] `P2-006` Add migrations for `campaigns`.
- [x] `P2-007` Add migrations for `campaign_deliveries`.
- [x] `P2-008` Add migrations for `segments`.
- [x] `P2-009` Implement loyalty APIs (`programs`, `adjustments`).
- [x] `P2-010` Implement gift card APIs (`create`, `redeem`, `list`).
- [x] `P2-011` Implement campaign APIs (`create`, `launch`, `tracking`).
- [x] `P2-012` Build `LoyaltyProgramBuilder`.
- [x] `P2-013` Build `GiftCardManager`.
- [x] `P2-014` Build `CampaignBuilder`.
- [x] `P2-015` Add conversion attribution from campaigns to orders.

## 6.2 Inventory and Cost

- [x] `P2-016` Add migrations for `inventory_items`.
- [x] `P2-017` Add migrations for `recipes`.
- [x] `P2-018` Add migrations for `recipe_ingredients`.
- [x] `P2-019` Add migrations for `stock_movements`.
- [x] `P2-020` Add migrations for `purchase_orders`.
- [x] `P2-021` Add migrations for `supplier_invoices`.
- [x] `P2-022` Implement inventory APIs (`items`, `movements`, `variance`).
- [x] `P2-023` Implement procurement APIs (`purchase-orders`, `invoices`).
- [x] `P2-024` Build `InventoryTable`.
- [x] `P2-025` Build `RecipeMapper`.
- [x] `P2-026` Build `PurchaseOrderBoard`.
- [x] `P2-027` Build `InvoiceReviewQueue`.
- [x] `P2-028` Build `VarianceDashboard`.

## 6.3 Finance and Reconciliation

- [x] `P2-029` Add migrations for `payments`.
- [x] `P2-030` Add migrations for `refunds`.
- [x] `P2-031` Add migrations for `payouts`.
- [x] `P2-032` Add migrations for `reconciliation_entries`.
- [x] `P2-033` Implement finance APIs (`payments`, `refunds`, `exceptions`).
- [x] `P2-034` Implement reconciliation APIs (`payouts`, `reconciliation`, `exports`).
- [x] `P2-035` Build `SettlementSummaryCard`.
- [x] `P2-036` Build `PaymentMethodBreakdown`.
- [x] `P2-037` Build `RefundQueue`.
- [x] `P2-038` Build `PayoutReconciliationTable`.
- [x] `P2-039` Build `AccountingExportPanel`.

## 6.4 Addis Localization and Payment Rail Adapters

- [ ] `P2-040` Build payment adapter abstraction layer.
- [ ] `P2-041` Implement telebirr adapter contract.
- [ ] `P2-042` Implement Chapa adapter contract.
- [ ] `P2-044` Add provider health checks and fallback policy.
- [ ] `P2-045` Add EN/AM localization coverage for P2 tabs.
- [ ] `P2-046` Add ETB formatting and reporting consistency checks.

## 6.5 P2 Quality and Release

- [ ] `P2-047` Add E2E for loyalty and gift-card redemption.
- [ ] `P2-048` Add E2E for inventory variance.
- [ ] `P2-049` Add E2E for finance reconciliation.
- [ ] `P2-050` Execute load tests for peak flows.
- [ ] `P2-051` Progressive rollout with rollback safeguards.

## 7) Phase P3 (Weeks 19-28) - Enterprise Scale

## 7.1 Multi-location Control Plane

- [ ] `P3-001` Add migrations for `locations`.
- [ ] `P3-002` Add migrations for `location_staff_roles`.
- [ ] `P3-003` Add migrations for `menu_versions`.
- [ ] `P3-004` Implement locations APIs (`list`, `create`, `update`).
- [ ] `P3-005` Implement central menu publish and rollback APIs.
- [ ] `P3-006` Build `LocationSwitcher`.
- [ ] `P3-007` Build `LocationSummaryGrid`.
- [ ] `P3-008` Build `CentralMenuPublisher`.
- [ ] `P3-009` Build `RoleTemplateManager`.

## 7.2 Integrations and Developer Platform

- [ ] `P3-010` Add migrations for `integration_apps`.
- [ ] `P3-011` Add migrations for `webhook_subscriptions`.
- [ ] `P3-012` Add migrations for `webhook_deliveries`.
- [ ] `P3-013` Add migrations for `api_keys`.
- [ ] `P3-014` Implement integrations APIs.
- [ ] `P3-015` Implement webhook APIs + retry.
- [ ] `P3-016` Implement API key lifecycle APIs.
- [ ] `P3-017` Build `IntegrationDirectory`.
- [ ] `P3-018` Build `WebhookSubscriptionTable`.
- [ ] `P3-019` Build `WebhookDeliveryInspector`.
- [ ] `P3-020` Build `APIKeyManager`.

## 7.3 Advanced Analytics and Enterprise Governance

- [ ] `P3-021` Implement benchmarking APIs.
- [ ] `P3-022` Implement forecasting APIs.
- [ ] `P3-023` Implement anomaly explanation APIs.
- [ ] `P3-024` Build `BenchmarkMatrix`.
- [ ] `P3-025` Build `ForecastWorkbench`.
- [ ] `P3-026` Build `AnomalyInsightPanel`.
- [ ] `P3-027` Implement compliance export engine.
- [ ] `P3-028` Implement immutable audit snapshots.
- [ ] `P3-029` Build `ComplianceExportCenter`.
- [ ] `P3-030` Build `PolicyPackManager`.

## 7.4 P3 Quality and Launch

- [ ] `P3-031` Enterprise load test across multi-location data.
- [ ] `P3-032` Disaster recovery simulation and restore validation.
- [ ] `P3-033` Security penetration test and remediation.
- [ ] `P3-034` Enterprise UAT and signoff.
- [ ] `P3-035` General availability release.

## 8) Dedicated KDS Toast-Parity Track (P1-P3)

## 8.1 P1 KDS Hardening and Operational Readiness

- [ ] `KDS-001` Add dedicated `GET /api/kds/queue` with station/sla filters and cursor pagination.
- [ ] `KDS-002` Add migrations for item-level production state (`kds_order_items` and `kds_item_events`).
- [ ] `KDS-003` Implement item-level KDS actions (`start`, `hold`, `ready`, `recall`) with audit logging.
- [ ] `KDS-004` Build station-specific KDS board views (kitchen/bar/dessert/coffee) with role-based defaults.
- [ ] `KDS-005` Build expeditor view for cross-station consolidation and final handoff.
- [ ] `KDS-006` Add bump-bar hotkeys and touch-optimized controls for high-volume service windows.
- [ ] `KDS-007` Add audio/visual alert policy controls (new ticket, SLA breach, recall) with quiet-hours support.
- [ ] `KDS-008` Add KDS E2E coverage for queue ingest -> station prep -> expeditor handoff -> served.
- [ ] `KDS-009` Add KDS reliability telemetry (queue lag, websocket health, ticket SLA breaches) and dashboard panels.

## 8.2 P2 KDS Throughput, Routing, and Hardware

- [ ] `KDS-010` Implement coursing and fire-time orchestration (fire now, fire on ready, hold/release).
- [ ] `KDS-011` Implement cross-station transfer and re-route workflows with reason capture.
- [ ] `KDS-012` Integrate smart queue prioritization (`src/lib/kds/smartQueue.ts`) into live KDS sorting.
- [ ] `KDS-013` Add prep-time prediction and dynamic station load balancing.
- [ ] `KDS-014` Add kitchen chit/label printer adapter abstraction and fallback print queue.
- [ ] `KDS-015` Add void/comp/86 propagation from merchant ops to KDS tickets in real time.
- [ ] `KDS-016` Build KDS performance analytics (ticket cycle time, station bottlenecks, staff throughput).
- [ ] `KDS-017` Add offline-safe action queue + replay for KDS mutations with idempotent recovery.

## 8.3 P3 Enterprise KDS Control Plane

- [ ] `KDS-018` Add multi-location KDS template management (station map, SLA policy, alert policy).
- [ ] `KDS-019` Add enterprise expeditor console with cross-store escalation and incident routing.
- [ ] `KDS-020` Add predictive prep and labor recommendations using historical ticket/event data.
- [ ] `KDS-021` Add kitchen device fleet controls (screen heartbeat, remote restart, policy sync).
- [ ] `KDS-022` Add immutable KDS event replay and compliance exports for dispute investigation.
- [ ] `KDS-023` Run large-scale KDS load/chaos tests and validate rollback playbooks.

## 9) Cross-Cutting Tracks (Parallel Through All Phases)

## 9.1 Security

- [ ] `SEC-001` Remove insecure secret fallbacks in signing paths.
- [ ] `SEC-002` Enforce strict tenant scoping on all protected queries.
- [ ] `SEC-003` Add sensitive-action confirmation tokens.
- [ ] `SEC-004` Add session/device management and revocation.
- [ ] `SEC-005` Add security event detection alerts.

## 9.2 Reliability and Observability

- [ ] `REL-001` Define retries/backoff by endpoint class.
- [ ] `REL-002` Add dead-letter handling for async failures.
- [ ] `REL-003` Verify offline queue replay safety.
- [ ] `OBS-001` Add structured logs for lifecycle transitions.
- [ ] `OBS-002` Add P95 latency and error dashboards.
- [ ] `OBS-003` Add queue staleness alerts.

## 9.3 Performance and UX Consistency

- [ ] `PERF-001` Add endpoint query-performance audits.
- [ ] `PERF-002` Add virtualization for heavy tables.
- [ ] `PERF-003` Add CI performance checks on key routes.
- [ ] `UX-001` Standardize filter bar interactions across tabs.
- [ ] `UX-002` Standardize right-side detail drawers.
- [ ] `UX-003` Standardize bulk action confirmation patterns.

## 10) Digital-First Operations (Replaces Proprietary POS)

## 10.1 Digital Payment & Mobile Checkout

- [ ] `DIG-001` Implement "Tap to Pay" on mobile (NFC reading via generic Android/iOS devices).
- [x] `DIG-002` Integrate Chapa and Telebirr natively into the Menu/Order flow.
    - [x] Create payment provider abstraction (`src/lib/payments/types.ts`).
    - [x] Implement Chapa provider (`src/lib/payments/chapa.ts`).
    - [ ] Implement Telebirr provider.
    - [ ] Connect payment flow to order checkout.
- [ ] `DIG-003` Build QR-based "Table Ordering" that bypasses server terminals completely.
- [ ] `DIG-004` Build "Direct Online Ordering" web module (Owner.com style) for pickup/delivery.
- [ ] `DIG-005` Implement "Split Check" logic on customer mobile devices.

## 10.2 Hardware-Agnostic KDS

- [ ] `KDS-001` Verify KDS performance on generic iPads, Android tablets, and Smart TVs.
- [ ] `KDS-002` Implement browser-based "Kitchen Display" that requires no install.
- [ ] `KDS-003` Add offline-mode support for KDS (Local-First Architecture).

## 10.3 Offline-First & Resiliency

- [ ] `OFF-001` Implement Service Workers for full offline app caching.
- [ ] `OFF-002` Build "Local Sync Engine" (CRDTs or similar) for conflict resolution when internet returns.
- [ ] `OFF-003` Ensure order taking persists locally in IndexDB before syncing.

## 10.4 Staff & AI Operations

- [x] `OPS-001` Integrate Resend for transactional email onboarding.
    - [x] Configure `RESEND_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` in `.env`.
    - [x] Verify domain in Resend for production email sending.
- [ ] `OPS-002` Build "Loman AI" style phone order taker integration.
- [ ] `OPS-003` Add "Digital Tips" and shift management for mobile staff.

## 10.5 Ethiopia Compliance and Fiscal Operations

- [ ] `TPG-036` Implement VAT/tax profile engine with branch-level overrides.
- [ ] `TPG-037` Add fiscal receipt/invoice compliance output and immutable receipt archive.
- [ ] `TPG-038` Add compliance export bundles for tax filing and audit requests.
- [ ] `TPG-039` Add localized receipt templates (EN/AM) with legal field validation.
- [ ] `TPG-040` Add compliance monitoring alerts for out-of-policy transactions.

## 10.6 Quality & Rollout

- [ ] `REL-004` Load test "Tablet Web KDS" with 500+ active tickers.
- [ ] `REL-005` Verify "Offline Mode" recovery in poor network conditions.
