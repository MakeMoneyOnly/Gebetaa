# Changelog

All notable changes to the Gebeta Restaurant Operating System project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added - 2026-03-01

#### P0-007 Invoice Processing Automation (Inventory)

- Added OCR-assisted supplier invoice parsing API:
    - `POST /api/inventory/invoices/parse` in `src/app/api/inventory/invoices/parse/route.ts`
    - Parses OCR text into invoice draft fields and line items, then auto-maps lines to `inventory_items`.
- Added direct image/PDF invoice ingestion API for Addis operations:
    - `POST /api/inventory/invoices/ingest` in `src/app/api/inventory/invoices/ingest/route.ts`
    - Supports provider-specific extraction pipeline with Addis-first fallback order (`oss -> azure -> google -> aws`) and confidence-based review policy metadata.
- Added invoice receive automation endpoint:
    - `POST /api/inventory/invoices/:id/receive` in `src/app/api/inventory/invoices/[invoiceId]/receive/route.ts`
    - Posts inventory `stock_movements` from matched invoice lines (`reference_type: invoice`), enforces confidence gating, persists receive exceptions for low-confidence/unmatched lines, and adds idempotent replay protection.
- Added invoice OCR parsing utility:
    - `src/lib/inventory/invoiceOcr.ts`
- Extended supplier invoice create contract to persist OCR metadata and line-item mapping context:
    - `src/app/api/inventory/invoices/route.ts`
- Updated merchant Inventory UI for OCR-assisted invoice intake:
    - `src/components/merchant/InvoiceReviewQueue.tsx`
    - `src/app/(dashboard)/merchant/inventory/page.tsx`
- Added route-level rate limiting and tests for parse endpoint:
    - Added nested invoice receive rate-limit policy.
    - `src/lib/api/rateLimitPolicies.ts`
    - `src/app/api/__tests__/p2-inventory-api-routes.test.ts`
    - `src/app/api/__tests__/invoice-receive-flow.integration.test.ts`
- Updated Toast parity audit status for invoice processing:
    - `TOAST_FEATURE_AUDIT.md`

### Added - 2026-02-28

#### P1 KDS Hardening and Operational Readiness (Phase 8.1)

- Implemented dedicated KDS queue API hardening for `KDS-001`:
    - Upgraded `GET /api/kds/queue` with authenticated restaurant scoping (staff/device context), station filters, SLA filters, and cursor pagination.
    - Extended response payload with cursor metadata (`next`, `has_more`) and applied filter metadata.
    - Added queue route test coverage:
        - `src/app/api/__tests__/kds-api-routes.test.ts`
    - Added route-level rate limit policy for KDS queue:
        - `src/lib/api/rateLimitPolicies.ts`
    - Updated execution task tracking:
        - `Tasks.md` (`KDS-001` marked complete)
- Implemented item-level KDS production schema for `KDS-002`:
    - Added migration `supabase/migrations/20260228_p1_kds_item_state.sql` with:
        - New tables `kds_order_items` and `kds_item_events`
        - Backfill from `order_items`, sync trigger, indexes, and RLS policies
- Implemented item-level KDS actions for `KDS-003`:
    - Added `POST /api/kds/items/:kdsItemId/action` in `src/app/api/kds/items/[kdsItemId]/action/route.ts`
    - Supports `start`, `hold`, `ready`, `recall` with transition validation, audit logging, and event writes
    - Added KDS item action route-level rate limiting in `src/lib/api/rateLimitPolicies.ts`
- Implemented station-specific KDS board views for `KDS-004`:
    - Added shared board component `src/features/kds/components/StationBoard.tsx`
    - Added/updated station routes:
        - `src/app/(kds)/kds/page.tsx` (role-aware default + station selection)
        - `src/app/(kds)/bar/page.tsx`
        - `src/app/(kds)/dessert/page.tsx`
        - `src/app/(kds)/coffee/page.tsx`
    - Updated KDS layout role access in `src/app/(kds)/layout.tsx` (includes `bar`)
- Implemented expeditor consolidation view for `KDS-005`:
    - Added `src/features/kds/components/ExpeditorBoard.tsx`
    - Added route `src/app/(kds)/expeditor/page.tsx`
    - Includes readiness consolidation across stations and final handoff action to served state
- Hardened Toast-style KDS operational workflow:
    - Enforced station lifecycle clarity (`Queued -> In Progress -> Ready`) in station boards, with final `Bump (served)` moved to expeditor handoff flow.
    - Added expeditor-only final handoff endpoint:
        - `POST /api/kds/orders/:orderId/handoff` in `src/app/api/kds/orders/[orderId]/handoff/route.ts`
        - Role-gated to override roles (`owner`, `admin`, `manager`) with served-status audit and order event writes.
    - Restricted recall action to manager/expeditor override paths:
        - Added recall permission checks in `src/app/api/kds/items/[kdsItemId]/action/route.ts`.
    - Added configurable ready-ticket auto-archive policy:
        - `GET|PATCH /api/settings/kds` in `src/app/api/settings/kds/route.ts`.
        - Queue route now applies `ready_auto_archive_minutes` policy and writes audit/order events for auto-archived tickets.
    - Updated expeditor UI policy controls and handoff integration:
        - `src/features/kds/components/ExpeditorBoard.tsx`
        - Added in-screen auto-archive setting control and handoff permission behavior.
    - Strengthened KDS route tests for handoff permissions:
        - `src/app/api/__tests__/kds-handoff.route.test.ts`
- Extended KDS API tests:
    - `src/app/api/__tests__/kds-api-routes.test.ts`
    - Added coverage for KDS item action endpoint auth/validation contracts
- Implemented high-volume station controls for `KDS-006`:
    - Added bump-bar hotkeys and selection model on station boards (`1-9`, `S`, `H`, `R`, `Enter`)
    - Added touch-optimized quick action rail and larger action controls in `src/features/kds/components/StationBoard.tsx`
    - Added expeditor bump hotkey (`B`) in `src/features/kds/components/ExpeditorBoard.tsx`
- Implemented KDS alert policy controls with quiet-hours support for `KDS-007`:
    - Extended `GET|PATCH /api/settings/kds` schema with `alert_policy`
    - Added expeditor policy controls for new-ticket sound, SLA breach visual, recall visual, and quiet-hours window
    - Applied policy behavior in station board (new-ticket audio cue, SLA breach banner, recall visual emphasis)
- Added end-to-end KDS lifecycle coverage for `KDS-008`:
    - `e2e/kds-operational-flow.spec.ts`
    - Covers queue ingest -> station prep -> expeditor handoff -> served completion
- Added KDS reliability telemetry and dashboard panel for `KDS-009`:
    - Added `GET|POST /api/kds/telemetry` in `src/app/api/kds/telemetry/route.ts`
    - Added heartbeat telemetry integration from station boards and websocket health tracking
    - Added merchant KDS reliability panel `src/components/merchant/KdsReliabilityPanel.tsx`
    - Added telemetry route tests `src/app/api/__tests__/kds-telemetry.route.test.ts`

#### Orders Schema Hardening (Enterprise Contract Fix)

- Added production migration to align `orders` schema with online ordering/payment contract:
    - `supabase/migrations/20260228_orders_online_columns_backfill.sql`
    - Adds `order_type`, `delivery_address`, and `chapa_tx_ref`
    - Adds `orders_order_type_check` constraint and defaults/indexes
- Applied migration to Supabase project:
    - `orders_online_columns_backfill` (version `20260228131918`)
- Removed temporary runtime fallback behavior and restored strict schema-contract writes:
    - `src/lib/services/orderService.ts`
    - `src/app/api/payments/chapa/initialize/route.ts`
- Updated local typed DB models for `orders` schema parity:
    - `src/types/database.ts`

#### Waiter POS Order Submit Reliability

- Fixed waiter POS device order submission contract mismatch causing `Failed to create order`:
    - Updated `POST /api/device/orders` to use canonical `orders` columns (`total_price`, `order_number`, `items`, `order_type`) instead of legacy fields.
    - Updated `order_items` insert mapping to canonical columns (`item_id`, `price`).
    - Added compensating delete if order-item insert fails.
    - Ensured table-session continuity by opening a `table_sessions` record when missing on first table order.
    - Added order event write for device-originated order creation (`source: waiter_pos_device`).
    - File: `src/app/api/device/orders/route.ts`
- Implemented Toast-style waiter settlement and close-table flow:
    - Added `POST /api/device/tables/close` with device auth:
        - Verifies table and open table session
        - Blocks close when orders are unpaid/in-progress (`payment_pending`, `pending`, `acknowledged`, `preparing`)
        - Verifies Chapa transaction reference in live mode
        - Records settlement in `payments` (`method/provider: chapa`)
        - Finalizes ready/served orders to `completed` with `order_events`
        - Closes table session, clears `active_order_id`, sets table to `available`
        - Writes audit log `waiter_table_closed`
    - Added waiter UI settlement controls in table orders tab:
        - Chapa `tx_ref` input
        - `Settle & Close` action wired to `/api/device/tables/close`
    - Added API tests:
        - `src/app/api/__tests__/device-close-table.route.test.ts`
- Hardened waiter display connectivity and billing workflow:
    - Fixed waiter POS "Connecting..." stall for paired device mode by using device-safe polling and marking the station live after successful device-path bootstrapping.
    - Added dedicated `bill_requested` waiter table state in UI flow:
        - `Request Bill` action is shown before settlement.
        - Settlement panel and `Settle & Close` action are only shown when table is billing-ready.
    - Reduced settlement friction by making Chapa `tx_ref` optional at close-time:
        - If omitted, close only proceeds when active orders are already marked paid via Chapa.
    - Added `POST /api/device/tables/bill-request` route-level rate limit policy.
    - Guest `bill` service requests now also promote table status to `bill_requested` for waiter/table-state consistency.
- Added close-table session recovery hardening for legacy/inconsistent table state:
    - Added `POST /api/device/tables/ensure-open-session` to deterministically create/recover an open `table_sessions` row for a table.
    - Waiter POS `Settle & Close` now retries automatically once through ensure-session flow when it receives `TABLE_SESSION_NOT_OPEN`.
    - Added route-level rate limit policy and contract tests:
        - `src/app/api/__tests__/device-ensure-open-session.route.test.ts`
- Added permanent orders settlement schema contract (enterprise fix):
    - Added migration `supabase/migrations/20260228182000_orders_payment_settlement_columns.sql`
        - Adds `orders.paid_at` (`TIMESTAMPTZ`)
        - Adds `orders.chapa_verified` (`BOOLEAN NOT NULL DEFAULT FALSE`)
        - Backfills null verification flags and adds settlement index
    - Restored strict close-table schema contract:
        - `POST /api/device/tables/close` now relies on canonical `orders` payment columns directly (no compatibility fallback query path)
    - Updated local DB types for orders settlement fields:
        - `src/types/database.ts`

### Added - 2026-02-21

#### P2 Addis Localization and Payment Rail Adapters (Phase 6.4)

- Added payment adapter orchestration and fallback abstraction:
    - `src/lib/payments/adapters.ts`
    - Extended payment provider contracts in `src/lib/payments/types.ts`
- Implemented Telebirr adapter contract:
    - `src/lib/payments/telebirr.ts`
    - Callback handler `src/app/api/payments/callback/telebirr/route.ts`
- Hardened Chapa adapter contract to align with provider interface (initiate/verify/health):
    - `src/lib/payments/chapa.ts`
- Added payment provider API surfaces for P2 operations:
    - `POST /api/payments/initiate` in `src/app/api/payments/initiate/route.ts`
    - `POST /api/payments/verify` in `src/app/api/payments/verify/route.ts`
    - `GET /api/payments/providers/health` in `src/app/api/payments/providers/health/route.ts`
- Added provider health checks and fallback policy support:
    - `src/lib/payments/adapters.ts`
    - Route-level policy updates in `src/lib/api/rateLimitPolicies.ts`
    - Added payment rail env config in `.env.example` and `src/lib/config/env.ts`
- Added EN/AM localization scaffolding for P2 tabs and hooked P2 page copy:
    - `src/lib/i18n/locale.ts`
    - `src/lib/i18n/p2.ts`
    - `src/hooks/useAppLocale.ts`
    - Updated pages:
        - `src/app/(dashboard)/merchant/finance/page.tsx`
        - `src/app/(dashboard)/merchant/inventory/page.tsx`
        - `src/app/(dashboard)/merchant/guests/page.tsx`
- Added ETB formatting consistency utilities and integrated into finance/inventory/guests P2 components:
    - `src/lib/format/et.ts`
    - `src/lib/utils.ts`
    - Updated components:
        - `src/components/merchant/SettlementSummaryCard.tsx`
        - `src/components/merchant/PaymentMethodBreakdown.tsx`
        - `src/components/merchant/RefundQueue.tsx`
        - `src/components/merchant/PayoutReconciliationTable.tsx`
        - `src/components/merchant/VarianceDashboard.tsx`
        - `src/components/merchant/InvoiceReviewQueue.tsx`
        - `src/components/merchant/PurchaseOrderBoard.tsx`
        - `src/components/merchant/GiftCardManager.tsx`
        - `src/components/merchant/LoyaltyProgramBuilder.tsx`
- Added unit and API route tests for phase 6.4:
    - `src/lib/payments/adapters.test.ts`
    - `src/lib/format/et.test.ts`
    - `src/app/api/__tests__/p2-payments-adapters-api-routes.test.ts`

#### P2 Quality and Release (Phase 6.5)

- Added P2 E2E coverage for growth, inventory, and finance release gates:
    - `e2e/p2-loyalty-gift-card.spec.ts`
    - `e2e/p2-inventory-variance.spec.ts`
    - `e2e/p2-finance-reconciliation.spec.ts`
    - Shared auth fixture: `e2e/fixtures/dashboard-auth.ts`
- Added peak-flow load test runner for key P2 operational APIs:
    - `scripts/load-tests/p2-peak-flows.mjs`
    - npm script: `test:load:p2` in `package.json`
- Added P2 release runbooks:
    - `docs/implementation/p2-peak-flow-load-tests.md`
    - `docs/implementation/p2-progressive-rollout-and-rollback-safeguards.md`

### Added - 2026-02-20

#### P2 Finance and Reconciliation (Phase 6.3)

- Added migrations:
    - `supabase/migrations/20260220_p2_payments.sql`
    - `supabase/migrations/20260220_p2_refunds.sql`
    - `supabase/migrations/20260220_p2_payouts.sql`
    - `supabase/migrations/20260220_p2_reconciliation_entries.sql`
- Added Finance and Reconciliation APIs:
    - `GET /api/finance/payments` and `POST /api/finance/payments` in `src/app/api/finance/payments/route.ts`
    - `GET /api/finance/refunds` and `POST /api/finance/refunds` in `src/app/api/finance/refunds/route.ts`
    - `GET /api/finance/exceptions` in `src/app/api/finance/exceptions/route.ts`
    - `GET /api/finance/payouts` and `POST /api/finance/payouts` in `src/app/api/finance/payouts/route.ts`
    - `GET /api/finance/reconciliation` in `src/app/api/finance/reconciliation/route.ts`
    - `GET /api/finance/export` in `src/app/api/finance/export/route.ts`
- Added Finance and Reconciliation UI components:
    - `SettlementSummaryCard` in `src/components/merchant/SettlementSummaryCard.tsx`
    - `PaymentMethodBreakdown` in `src/components/merchant/PaymentMethodBreakdown.tsx`
    - `RefundQueue` in `src/components/merchant/RefundQueue.tsx`
    - `PayoutReconciliationTable` in `src/components/merchant/PayoutReconciliationTable.tsx`
    - `AccountingExportPanel` in `src/components/merchant/AccountingExportPanel.tsx`
- Added merchant finance page and navigation wiring:
    - New page `src/app/(dashboard)/merchant/finance/page.tsx`
    - Navigation updates:
        - `src/components/merchant/Sidebar.tsx`
        - `src/components/merchant/MobileBottomNav.tsx`
        - `src/components/merchant/CommandBarShell.tsx`
- Added API route unit tests for Phase 6.3:
    - `src/app/api/__tests__/p2-finance-api-routes.test.ts`
- Updated route-level API rate limit policy map:
    - `src/lib/api/rateLimitPolicies.ts`
- Updated local DB typings:
    - `src/types/database.ts`

### Added - 2026-02-19

#### P2 Inventory and Cost (Phase 6.2)

- Added migrations:
    - `supabase/migrations/20260219_p2_inventory_items.sql`
    - `supabase/migrations/20260219_p2_recipes.sql`
    - `supabase/migrations/20260219_p2_recipe_ingredients.sql`
    - `supabase/migrations/20260219_p2_stock_movements.sql`
    - `supabase/migrations/20260219_p2_purchase_orders.sql`
    - `supabase/migrations/20260219_p2_supplier_invoices.sql`
- Added Inventory and Cost APIs:
    - `GET /api/inventory/items` and `POST /api/inventory/items` in `src/app/api/inventory/items/route.ts`
    - `POST /api/inventory/movements` in `src/app/api/inventory/movements/route.ts`
    - `GET /api/inventory/variance` in `src/app/api/inventory/variance/route.ts`
    - `GET /api/inventory/purchase-orders` and `POST /api/inventory/purchase-orders` in `src/app/api/inventory/purchase-orders/route.ts`
    - `GET /api/inventory/invoices` and `POST /api/inventory/invoices` in `src/app/api/inventory/invoices/route.ts`
    - `GET /api/inventory/recipes` and `POST /api/inventory/recipes` in `src/app/api/inventory/recipes/route.ts`
- Added Inventory and Cost UI components:
    - `InventoryTable` in `src/components/merchant/InventoryTable.tsx`
    - `RecipeMapper` in `src/components/merchant/RecipeMapper.tsx`
    - `PurchaseOrderBoard` in `src/components/merchant/PurchaseOrderBoard.tsx`
    - `InvoiceReviewQueue` in `src/components/merchant/InvoiceReviewQueue.tsx`
    - `VarianceDashboard` in `src/components/merchant/VarianceDashboard.tsx`
    - `LowStockAlertPanel` in `src/components/merchant/LowStockAlertPanel.tsx`
- Added merchant inventory page and navigation wiring:
    - New page `src/app/(dashboard)/merchant/inventory/page.tsx`
    - Navigation updates:
        - `src/components/merchant/Sidebar.tsx`
        - `src/components/merchant/MobileBottomNav.tsx`
        - `src/components/merchant/CommandBarShell.tsx`
- Added API route unit tests for Phase 6.2:
    - `src/app/api/__tests__/p2-inventory-api-routes.test.ts`
- Updated route-level API rate limit policy map:
    - `src/lib/api/rateLimitPolicies.ts`

### Added - 2026-02-18

#### P2 Revenue and Cost Kickoff (Loyalty, Gift Cards, Campaigns)

- Added migrations:
    - `supabase/migrations/20260218_p2_loyalty_programs.sql`
    - `supabase/migrations/20260218_p2_loyalty_accounts.sql`
    - `supabase/migrations/20260218_p2_loyalty_transactions.sql`
    - `supabase/migrations/20260218_p2_gift_cards.sql`
    - `supabase/migrations/20260218_p2_gift_card_transactions.sql`
    - `supabase/migrations/20260218_p2_campaigns.sql`
    - `supabase/migrations/20260218_p2_campaign_deliveries.sql`
    - `supabase/migrations/20260218_p2_segments.sql`
- Added P2 revenue APIs:
    - `GET /api/loyalty/programs` and `POST /api/loyalty/programs` in `src/app/api/loyalty/programs/route.ts`
    - `POST /api/loyalty/accounts/:id/adjust` in `src/app/api/loyalty/accounts/[accountId]/adjust/route.ts`
    - `GET /api/gift-cards` and `POST /api/gift-cards` in `src/app/api/gift-cards/route.ts`
    - `POST /api/gift-cards/:id/redeem` in `src/app/api/gift-cards/[giftCardId]/redeem/route.ts`
    - `GET /api/campaigns` and `POST /api/campaigns` in `src/app/api/campaigns/route.ts`
    - `POST /api/campaigns/:id/launch` in `src/app/api/campaigns/[campaignId]/launch/route.ts`
- Added P2 Guests UI growth components and page integration:
    - `LoyaltyProgramBuilder` in `src/components/merchant/LoyaltyProgramBuilder.tsx`
    - `GiftCardManager` in `src/components/merchant/GiftCardManager.tsx`
    - `CampaignBuilder` in `src/components/merchant/CampaignBuilder.tsx`
    - Guests page integration in `src/app/(dashboard)/merchant/guests/page.tsx`
- Added campaign-to-order conversion attribution (`P2-015`):
    - Guest menu flow now forwards optional campaign attribution (`cdid`/`cid`) from URL query params to order submit payload:
        - `src/app/(guest)/[slug]/page.tsx`
        - `src/features/menu/components/CartDrawer.tsx`
    - `POST /api/orders` now accepts optional `campaign_attribution`, validates campaign ownership, and marks matching `campaign_deliveries` rows as converted (`status='converted'`, `conversion_order_id`):
        - `src/app/api/orders/route.ts`
    - Campaign tracking now counts conversions by either converted status or populated `conversion_order_id`:
        - `src/app/api/campaigns/route.ts`
    - Order lifecycle integration coverage extended for conversion attribution:
        - `src/app/api/__tests__/order-lifecycle.integration.test.ts`
- Added P2 API route unit tests:
    - `src/app/api/__tests__/p2-revenue-api-routes.test.ts`
- Extended rollout + rate-limit config for P2:
    - Added `ENABLE_P2_PILOT_ROLLOUT` in `.env.example` and `src/lib/config/env.ts`
    - Added P2 phase support in `src/lib/config/pilotRollout.ts`, `src/lib/api/pilotGate.ts`, and `src/lib/api/authz.ts`
    - Updated `src/lib/api/rateLimitPolicies.ts`
    - Extended pilot gate tests in `src/lib/api/__tests__/pilotGate.test.ts`

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

#### P1 Quality and Release

- Added Phase 5.4 E2E coverage:
    - Guest directory + profile edit flow in `e2e/guests-directory-profile.spec.ts`
    - Channels health + delivery acknowledge flow in `e2e/channels-health-delivery-ack.spec.ts`
- Added localization/accessibility regression E2E for P1 surfaces:
    - `e2e/p1-localization-accessibility.spec.ts`
- Improved P1 Guests and Channels UI accessibility:
    - Added dialog semantics, label associations, aria-labels, and alert roles
    - Added table caption/column scope semantics for external orders table
    - Files:
        - `src/components/merchant/GuestDirectory.tsx`
        - `src/components/merchant/GuestProfileDrawer.tsx`
        - `src/components/merchant/ChannelHealthBoard.tsx`
        - `src/components/merchant/OnlineOrderingSettingsPanel.tsx`
        - `src/components/merchant/DeliveryPartnerHub.tsx`
- Applied P1 locale formatting regression fixes on key date/currency displays:
    - `src/app/(dashboard)/merchant/guests/page.tsx`
    - `src/components/merchant/GuestDirectory.tsx`
    - `src/components/merchant/GuestProfileDrawer.tsx`
    - `src/components/merchant/DeliveryPartnerHub.tsx`
- Added P1 cohort rollout controls and docs:
    - New flag `ENABLE_P1_PILOT_ROLLOUT` in `.env.example` and `src/lib/config/env.ts`
    - Phase-aware pilot gating updates:
        - `src/lib/config/pilotRollout.ts`
        - `src/lib/api/pilotGate.ts`
        - `src/lib/api/authz.ts`
    - Applied P1 phase gating on Guests, Channels, Team Ops, and Alerting APIs
    - Added rollout runbook: `docs/implementation/p1-controlled-rollout-by-cohort.md`
    - Added pilot gate phase unit tests: `src/lib/api/__tests__/pilotGate.test.ts`

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

| Version    | Date       | Description                                |
| ---------- | ---------- | ------------------------------------------ |
| Unreleased | 2026-02-17 | Codebase reorganization, documentation hub |
| 0.1.0      | 2026-02-14 | P0 Security hardening complete             |
| 0.0.1      | 2026-01-26 | Initial project setup                      |

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
