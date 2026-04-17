# Settings Backend Implementation Tasks

> **Generated**: 2026-04-16
> **Status**: Active
> **Scope**: All 6 Settings tabs — Business Info, Financials, Locations, Security, Integrations, Modules
> **Current state**: UI complete. DB migration written. Zero backend API routes exist for settings tabs.

---

## Context — What Exists vs What Is Missing

### ✅ Already Built

| Layer                      | What exists                                                                                                                                                                                         |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **DB Migration**           | `20260416180000_ethiopian_financial_compliance.sql` — creates `merchant_tax_config`, `merchant_vat_ledger`, `merchant_wht_receipts`, `merchant_bank_accounts`, `merchant_fiscal_days` with full RLS |
| **ERCA service**           | `src/lib/fiscal/erca-service.ts` — order-level ERCA VAT submission                                                                                                                                  |
| **ERCA table**             | `erca_submissions` — order-level audit trail                                                                                                                                                        |
| **Chapa payments**         | `src/lib/payments/` — full implementation                                                                                                                                                           |
| **Settings API (partial)** | `/api/settings/kds`, `/api/settings/notifications`, `/api/settings/payments`, `/api/settings/security`                                                                                              |

### ❌ Missing — UI-Only, No Backend

Every feature listed below in the 6 Settings tabs is **UI-only**. `handleSave` is a stub. Data is hardcoded seed state. Nothing persists to DB or calls real APIs.

---

## Section 1 — Tab 1: Business Info

### BINFO-001 ☐ GET /api/settings/business-info — Load merchant legal identity

- Load from `restaurants` table: `name_am`, `name` (EN), `tin_number`, `vat_number`
- Load from `merchant_tax_config`: `tax_type`, `vat_registration_number`, `tot_rate`, `efm_id`
- Load business registration fields (legal name AM/EN, trade name, entity type) — **need columns on `restaurants`**
- **Migration needed**: Add `legal_name_am`, `legal_name_en`, `trade_name`, `business_entity_type`, `fayda_id`, `control_person_name`, `control_person_dob`, `nidp_status`, `trade_license_number`, `trade_license_expiry`, `sub_city`, `woreda`, `house_number` to `restaurants`
- **File**: New `src/app/api/settings/business-info/route.ts`
- **Priority**: P0

### BINFO-002 ☐ PATCH /api/settings/business-info — Save legal identity changes

- Input validation: TIN exactly 10 digits, Fayda ID exactly 12 digits, entity type in allowlist
- Tenant scope: `restaurant_id` from session only — never from body
- Audit log: Any TIN or VAT number change → write to `merchant_audit_log` (see SEC-001)
- Return 409 if TIN already registered to another restaurant
- **File**: Same route, PATCH handler
- **Priority**: P0

### BINFO-003 ☐ POST /api/settings/business-info/documents — Upload KYC documents

- Accept Kebele ID / Passport PDF/image upload
- Store in Supabase Storage bucket `kyc-documents` (private, service-role access only)
- Update `restaurants.id_document_url` after successful upload
- Max 5 MB, types: PDF/JPG/PNG
- **File**: `src/app/api/settings/business-info/documents/route.ts`
- **Priority**: P1

### BINFO-004 ☐ PATCH /api/settings/business-info/nidp-status — Admin-only NIDP status update

- Only callable by `control_person` or `platform_admin` role
- Updates `restaurants.nidp_status` ∈ `{pending, verified, rejected}`
- Writes audit log entry on every change
- **Priority**: P1

### BINFO-005 ☐ Docs update — Add Business Info settings to PRD

- `docs/03-product/product-requirements-document.md` has no mention of Ethiopian KYC/NIDP fields
- Add section: "Merchant Legal Identity & NIDP Compliance" with field specs
- **Priority**: P2

---

## Section 2 — Tab 2: Financials

### FIN-001 ☐ GET /api/settings/financials/tax-config — Load tax configuration

- Read `merchant_tax_config` for current restaurant
- If no row exists, return sensible defaults (TOT, 2%)
- **File**: `src/app/api/settings/financials/tax-config/route.ts`
- **Priority**: P0

### FIN-002 ☐ PATCH /api/settings/financials/tax-config — Save tax config

- Validate: if `tax_type=VAT`, `vat_registration_number` required and 10 digits
- Validate: if `tax_type=TOT`, `tot_rate` must be `0.02` or `0.10`
- Validate: switching VAT↔TOT only allowed if no **open** (unlocked) `merchant_vat_ledger` row for current month
- Write audit log on every tax_type change
- Upsert `merchant_tax_config` row
- **Priority**: P0

### FIN-003 ☐ GET /api/settings/financials/vat-ledger — Load monthly declaration

- Query `merchant_vat_ledger` for `period_year=current_year`, `period_month=current_month`
- If no row, create draft row with zeros
- Return all computed columns (row11, row40, final) — these are DB-generated, no JS math needed
- **Priority**: P0

### FIN-004 ☐ PATCH /api/settings/financials/vat-ledger — Update editable rows

- Only editable if `is_locked=FALSE`
- Update: `row10_standardSales`, `row20_exemptSales`, `row25_zeroRatedSales`, `row30_inputVat`, `row50_whtCredit`, `tot_gross_sales`
- Validate: no negative values
- DB computed columns (row11, row40, final) auto-recalculate — no manual computation needed
- **Priority**: P0

### FIN-005 ☐ POST /api/settings/financials/z-report — Close fiscal day

- Create or close row in `merchant_fiscal_days` for `fiscal_date=today`
- Snapshot: `gross_sales`, `vat_collected`, `tot_collected`, `wht_deducted`, `net_deposit` from today's `orders`
- Set `is_closed=TRUE`, `closed_by=auth.uid()`, `closed_at=NOW()`
- Lock current `merchant_vat_ledger` periodrow (`is_locked=TRUE`) at month-end
- **Idempotent**: 409 if fiscal day already closed
- **Priority**: P0

### FIN-006 ☐ GET /api/settings/financials/export — MoR XML/CSV export

- Generate SIGTAS-compatible XML from `merchant_vat_ledger` current month row
- Generate CSV version (same data, CSV format)
- Set `mor_xml_exported_at` / `mor_csv_exported_at` timestamp on ledger row
- Return file download (Content-Disposition: attachment)
- **Priority**: P1

### FIN-007 ☐ GET /api/settings/financials/bank-accounts — List settlement accounts

- Read `merchant_bank_accounts` for current restaurant
- Mask `account_number`: return only last 4 digits (`****7891`)
- **Priority**: P0

### FIN-008 ☐ POST /api/settings/financials/bank-accounts — Add bank account

- Validate: `bank_name` in allowlist, `account_number` 10-13 digits
- Encrypt `account_number` at application layer before insert (AES-256)
- If `is_primary=TRUE`, clear existing primary first (atomic transaction)
- **Priority**: P0

### FIN-009 ☐ DELETE /api/settings/financials/bank-accounts/:id — Remove bank account

- Prevent deletion if it is the only primary account
- Write audit log
- **Priority**: P1

### FIN-010 ☐ GET /api/settings/financials/wht-receipts — List WHT receipts

- Read `merchant_wht_receipts` for current restaurant
- Filter by `ledger_id` (current month) or `all`
- **Priority**: P1

### FIN-011 ☐ POST /api/settings/financials/wht-receipts — Upload WHT receipt

- Store document in Supabase Storage (`wht-receipts` bucket)
- Insert `merchant_wht_receipts` row
- Auto-add `wht_amount` to `merchant_vat_ledger.row50_wht_credit` for current month
- Validate: `wht_amount` = `gross_amount * 0.02` ± 1 ETB tolerance
- **Priority**: P1

### FIN-012 ☐ Docs update — Add Ethiopian VAT/TOT engine to product docs

- No mention of VAT/TOT calculation engine, MoR form rows, or Z-Report in `docs/03-product/product-requirements-document.md`
- Add full financial compliance section with field codes (Row 10–50)
- **Priority**: P2

---

## Section 3 — Tab 3: Locations

### LOC-001 ☐ GET /api/settings/locations — List all restaurant locations

- For single-unit: return own `restaurants` row
- For multi-unit: query all `restaurants` where same `owner_user_id` or same `organization_id`
- Include: `license_status`, `regional_authority`, `sub_city_branch_id`
- **Migration needed**: Add `regional_authority`, `sub_city_branch_id`, `license_status` to `restaurants`
- **Priority**: P0

### LOC-002 ☐ POST /api/settings/locations — Add new location

- Create new `restaurants` row linked to same organization
- Set `is_active=FALSE` until license verified
- Send internal notification to compliance team
- **Priority**: P1

### LOC-003 ☐ PATCH /api/settings/locations/:id — Update location details

- Update: `name`, `sub_city_branch_id`, `trade_license_number`, `trade_license_expiry`, `license_status`, `regional_authority`
- Validate: `license_status` transition rules (e.g., `expired → active` requires license upload)
- Audit log on `license_status` changes
- **Priority**: P0

### LOC-004 ☐ DELETE /api/settings/locations/:id — Deactivate location

- Soft-delete only (`is_active=FALSE`, `deleted_at=NOW()`)
- Block if location has open table sessions or pending orders
- **Priority**: P1

### LOC-005 ☐ Scheduled job — License expiry alert

- pg_cron or QStash job runs daily
- Find all `restaurants` where `trade_license_expiry` is within 60 days
- Push notification + email to `control_person` email
- **Priority**: P1

---

## Section 4 — Tab 4: Security

### SEC-001 ☐ Create merchant_audit_log table (migration)

- Table: `merchant_audit_log(id, restaurant_id, actor_user_id, action, field, old_value, new_value, ip_address, created_at)`
- `action` ∈ `{tin_changed, vat_status_changed, bank_account_added, bank_account_removed, control_person_changed, tax_type_changed}`
- RLS: only `control_person` or `platform_admin` can SELECT; nobody can UPDATE/DELETE (immutable)
- **Priority**: P0 — needed by BINFO-002, FIN-002, FIN-009

### SEC-002 ☐ GET /api/settings/security/audit-log — Load audit log

- Read `merchant_audit_log` for current restaurant
- Paginated (cursor-based, 50/page)
- Filter by `action` type
- **File**: `src/app/api/settings/security/audit-log/route.ts`
- **Priority**: P0

### SEC-003 ☐ GET /api/settings/security/roles — Load admin roles

- Read `restaurant_staff` where `role IN ('owner', 'admin')` for current restaurant
- Include `is_control_person`, `can_sign_nbe_declarations` flags
- **Migration needed**: Add `is_control_person BOOLEAN DEFAULT FALSE`, `can_sign_nbe_declarations BOOLEAN DEFAULT FALSE` to `restaurant_staff`
- **Priority**: P0

### SEC-004 ☐ PATCH /api/settings/security/roles/:staff_id — Toggle Control Person

- Only current `control_person` can reassign
- Exactly one `is_control_person=TRUE` per restaurant at all times (atomic swap)
- Write `control_person_changed` audit log entry (old + new user ID)
- **Priority**: P0

### SEC-005 ☐ Docs update — Add security settings to security-policy.md

- `docs/02-security/security-policy.md` has no mention of Control Person concept, NBE declaration signing, or audit log immutability
- **Priority**: P2

---

## Section 5 — Tab 5: Integrations

### INT-001 ☐ GET /api/settings/integrations — Load integration statuses

- Read `restaurants.integration_flags` JSONB field (or separate table)
- Return: per-integration `{status, last_sync_at, error_message}`
- **Migration needed**: `merchant_integrations(restaurant_id, integration_id, status, config_json, last_sync_at, error_message)` table
- **Priority**: P1

### INT-002 ☐ POST /api/settings/integrations/:id/connect — Initiate integration

- `ethswitch`: Store API credentials, send test ping, update status → `connected`
- `sigtas`: Validate MoR API key, trigger initial sync, update status
- `telebirr`: Already implemented in `src/lib/payments/telebirr.ts` — wire status here
- `chapa`: Already implemented — wire status here
- `erca`: Already implemented in `src/lib/fiscal/erca-service.ts` — wire status here
- `fayda`: Stub for now — status = `pending` with note "coming soon"
- **Priority**: P1

### INT-003 ☐ POST /api/settings/integrations/:id/disconnect — Disconnect integration

- Clear credentials from `merchant_integrations`
- Set `status = disconnected`
- Block if integration is required for compliance (ERCA, SIGTAS)
- **Priority**: P1

### INT-004 ☐ POST /api/settings/integrations/:id/sync — Manual sync trigger

- `sigtas`: Push current day's sales data to MoR SIGTAS API
- `erca`: Retry any `failed` or `pending` submissions in `erca_submissions`
- `chapa`: Fetch latest settlement report
- Update `last_sync_at`
- **Priority**: P1

### INT-005 ☐ Docs update — Add integration catalog to integrations docs

- `docs/06-integrations/` has `delivery-partners.md` and `developer-api.md` but no Ethiopian local integration catalog
- Add `ethiopian-local-integrations.md`: EthSwitch, SIGTAS, Telebirr, Fayda, ERCA
- **Priority**: P2

---

## Section 6 — Tab 6: Modules

### MOD-001 ☐ GET /api/settings/modules — Load module toggle states

- Read `merchant_tax_config` for tax tool states
- Read `merchant_integrations` for delivery app states
- Return unified modules config
- **Priority**: P1

### MOD-002 ☐ PATCH /api/settings/modules — Save module toggles

- Update `merchant_tax_config`: `auto_wht_enabled`, `tin_validation_enabled`, `vat_inclusive`, `auto_mor_export`, `z_report_auto_close`
- **Migration needed**: Add those boolean columns to `merchant_tax_config`
- Update delivery app toggles in `merchant_integrations`
- **Priority**: P1

### MOD-003 ☐ Scheduled job — Auto WHT receipt generation

- When `auto_wht_enabled=TRUE` and B2B order total > 3,000 ETB:
    - Auto-generate `merchant_wht_receipts` row
    - Attach to order record
    - Send receipt PDF to customer email
- Triggered from order completion webhook, not a cron
- **Priority**: P1

### MOD-004 ☐ Scheduled job — Auto Z-Report close at midnight

- When `z_report_auto_close=TRUE`:
    - pg_cron: runs at `23:59` local time per restaurant timezone
    - Calls same logic as FIN-005
- **Priority**: P1

### MOD-005 ☐ Scheduled job — Auto MoR XML export on 15th

- When `auto_mor_export=TRUE`:
    - QStash scheduled for 15th of each month at 08:00 Ethiopia time
    - Calls FIN-006 export, emails XML to `control_person` email
- **Priority**: P2

---

## Section 7 — Cross-Cutting Backend Work

### CROSS-001 ☐ Add document checklist download API endpoint

- Currently: client-side `.txt` file generation (works, no backend needed for MVP)
- Future: `GET /api/settings/documents/checklist?tab=financials` returns PDF
- **Priority**: P3 (current client-side impl is acceptable)

### CROSS-002 ☐ Zod validation schemas for all settings endpoints

- Create `src/lib/validation/settings.ts` with Zod schemas for:
    - `BusinessInfoSchema`, `TaxConfigSchema`, `BankAccountSchema`, `WhtReceiptSchema`, `LocationSchema`, `RoleUpdateSchema`
- All PATCH/POST handlers import and call `.parse()` before DB write
- **Priority**: P0 (required per AGENTS.md security guardrails)

### CROSS-003 ☐ Tenant scope middleware for settings routes

- All `/api/settings/*` routes must verify `restaurant_id` belongs to `auth.uid()` session
- Centralize in `src/lib/auth/settings-guard.ts`
- **Priority**: P0

### CROSS-004 ☐ Rate limiting on settings mutation endpoints

- PATCH/POST/DELETE on settings endpoints: 30 req/min per restaurant
- Stricter on sensitive: TIN change, Control Person change → 3 req/10min
- **Priority**: P1

### CROSS-005 ☐ Docs — Create settings architecture doc

- `docs/implementation/settings-architecture.md`
- Document: 6 tabs → API routes → DB tables mapping
- Ethiopian compliance context for each section
- **Priority**: P2

---

## Section 8 — DB Schema Gaps (Migrations Needed)

| Migration   | Change                                                                                                                                                                                                                                                    | Needed By           |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| `BINFO-001` | Add `legal_name_am`, `legal_name_en`, `trade_name`, `business_entity_type`, `fayda_id`, `control_person_name`, `control_person_dob`, `nidp_status`, `trade_license_number`, `trade_license_expiry`, `sub_city`, `woreda`, `house_number` to `restaurants` | BINFO-001,002       |
| `SEC-001`   | Create `merchant_audit_log` table                                                                                                                                                                                                                         | SEC-001             |
| `SEC-003`   | Add `is_control_person`, `can_sign_nbe_declarations` to `restaurant_staff`                                                                                                                                                                                | SEC-003,004         |
| `LOC-001`   | Add `regional_authority`, `sub_city_branch_id`, `license_status` to `restaurants`                                                                                                                                                                         | LOC-001,003         |
| `INT-001`   | Create `merchant_integrations` table                                                                                                                                                                                                                      | INT-001,002,003,004 |
| `MOD-002`   | Add module toggle columns to `merchant_tax_config`                                                                                                                                                                                                        | MOD-002,003,004     |

---

## Implementation Order (Recommended)

```
Phase 1 — DB (1 day)
  → All 6 migrations above
  → CROSS-002 Zod schemas
  → CROSS-003 settings guard middleware

Phase 2 — Business Info + Tax Config (2 days)
  → BINFO-001, BINFO-002, BINFO-003
  → FIN-001, FIN-002, FIN-003, FIN-004
  → SEC-001 (audit log table + writes from above)

Phase 3 — Financial Operations (1 day)
  → FIN-005 (Z-Report)
  → FIN-006 (MoR export)
  → FIN-007 through FIN-011 (bank accounts + WHT)

Phase 4 — Locations + Security (1 day)
  → LOC-001, LOC-002, LOC-003
  → SEC-002, SEC-003, SEC-004

Phase 5 — Integrations + Modules (1 day)
  → INT-001, INT-002, INT-003, INT-004
  → MOD-001, MOD-002

Phase 6 — Jobs + Alerts (1 day)
  → LOC-005 (license expiry alert)
  → MOD-003 (auto WHT)
  → MOD-004 (auto Z-Report)
  → MOD-005 (auto MoR export)

Phase 7 — Docs (parallel)
  → BINFO-005, FIN-012, LOC-004 doc, SEC-005, INT-005, CROSS-005
```

---

## Status Summary

| Tab               | API routes exist            | DB tables exist                            | Fully functional |
| ----------------- | --------------------------- | ------------------------------------------ | ---------------- |
| Business Info     | ❌ 0 of 4                   | ⚠️ Partial (`restaurants` missing columns) | ❌               |
| Financials        | ❌ 0 of 11                  | ✅ Migration written (not yet applied)     | ❌               |
| Locations         | ❌ 0 of 4                   | ⚠️ Partial (`restaurants` missing columns) | ❌               |
| Security          | ❌ 0 of 3                   | ❌ `merchant_audit_log` missing            | ❌               |
| Integrations      | ❌ 0 of 4                   | ❌ `merchant_integrations` missing         | ❌               |
| Modules           | ❌ 0 of 2                   | ⚠️ Partial (toggle columns missing)        | ❌               |
| **Cross-cutting** | ❌ Validation/guard missing | —                                          | ❌               |

**Total backend tasks**: 38 API/job tasks + 6 migrations + 5 doc updates = **49 items**

---

_Update task status with `[x]` as items complete. Implement in Phase order above. Do not ship settings tab data to production until Phase 1 and Phase 2 complete._
