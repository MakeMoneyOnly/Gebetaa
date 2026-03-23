# Gebeta Implementation Tasks

> Track remaining features to implement based on Check.md blueprint audit

## ✅ All Tasks Completed - 2026-03-23

### 1. Subscription / PRO Feature Gating ✅

**Priority**: P1 | **Status**: COMPLETED

**Completed Work**:

- Database migration: `20260323150000_p0_subscription_plan_column.sql`
- Added `plan` column to restaurants table (enum: 'free', 'pro', 'enterprise')
- Added `plan_expires_at` for subscription management
- Created feature flag utilities: `src/lib/subscription/plan-types.ts`, `src/lib/subscription/plan-gates.ts`
- Created React hook: `src/hooks/usePlanFeature.ts`
- Updated Settings UI with Plan tab showing pricing and upgrade options

---

### 2. Modifier Tables Migration ✅

**Priority**: P1 | **Status**: COMPLETED

**Completed Work**:

- Database migration: `20260323160000_p1_modifier_validation_and_link.sql`
- Added `modifier_group_id` FK to `menu_items` table
- Created `validate_required_modifiers()` and `validate_order_modifiers()` functions
- Added required-field validation in orders service
- Integrated modifier validation into order creation flow

---

### 3. Delivery Channel APIs ✅

**Priority**: P2 | **Status**: COMPLETED

**Completed Work**:

- Created `src/lib/delivery/beu.ts` - BEU API client
- Created `src/lib/delivery/deliver-addis.ts` - Deliver Addis API client
- Created `src/lib/delivery/zmall.ts` - Zmall API client
- Created `src/lib/delivery/esoora.ts` - Esoora API client
- Created `src/lib/delivery/index.ts` - Unified exports and factory
- All clients include: createOrder, updateOrderStatus, cancelOrder, getDeliveryFee, webhook verification

---

### 4. Reconciliation Triggers ✅

**Priority**: P2 | **Status**: COMPLETED

**Completed Work**:

- Database migration: `20260323170000_p2_reconciliation_triggers.sql`
- Created `create_reconciliation_on_capture()` trigger function
- Created `reconcile_daily_payments()` function
- Created `match_payments_to_payouts()` function
- Created daily reconciliation job: `src/app/api/jobs/cron/daily-reconciliation/route.ts`
- Created payout matching job: `src/app/api/jobs/cron/payout-matching/route.ts`
- Enhanced existing reconciliation API

---

### 5. TimescaleDB for Analytics ✅

**Priority**: P2 | **Status**: COMPLETED

**Completed Work**:

- Database migration: `20260324000000_timescale_analytics.sql`
- Enabled TimescaleDB extension
- Created hypertables: `hourly_sales`, `daily_sales`
- Created continuous aggregates: `hourly_sales_agg_30d`, `daily_sales_agg_1y`
- Configured retention policies and compression
- Created `src/lib/services/timescaleAnalyticsService.ts`
- Updated analytics API to use TimescaleDB queries with fallback

---

## Previously Completed Features (from original audit)

- Payment Webhooks (Chapa) ✅
- ERCA VAT Compliance ✅
- Event Bus (Redis Streams) ✅
- GraphQL Federation (5 subgraphs) ✅
- Sentry Monitoring ✅
- Discounts Engine ✅

## Removed/Deferred Items

- Telebirr Webhook (covered by Chapa)
- Inventory Feature (removed from codebase)
- Amharic UI (deferred until English finalized)
- Manager Mobile App (Phase 2)

---

## Database Migrations to Run

After pulling these changes, run these migrations:

1. `20260323150000_p0_subscription_plan_column.sql` - Plan column
2. `20260323160000_p1_modifier_validation_and_link.sql` - Modifier validation
3. `20260323_remove_inventory_tables.sql` - Remove inventory tables
4. `20260323170000_p2_reconciliation_triggers.sql` - Reconciliation
5. `20260324000000_timescale_analytics.sql` - TimescaleDB

_Last Updated: 2026-03-23_
_All Check.md blueprint tasks now complete_
