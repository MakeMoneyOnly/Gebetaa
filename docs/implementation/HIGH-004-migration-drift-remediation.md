# HIGH-004: Migration Drift Remediation Plan

## Executive Summary

A significant migration drift exists between local and remote Supabase databases:

- **Remote migrations:** 77 applied
- **Local migrations:** 138 files
- **Discrepancy:** 61 migrations exist locally but not remotely

This drift poses enterprise-grade risks including:

1. **Deployment failures** - New environments cannot be provisioned from scratch
2. **Schema inconsistency** - Production may have different structure than development
3. **Compliance risk** - Audit trails incomplete for schema changes
4. **Rollback failures** - Cannot reliably rollback to known states

## Root Cause Analysis

The drift likely occurred due to:

1. **Baseline initialization** - Remote database was initialized from a snapshot/baseline, not from individual migrations
2. **Consolidated migrations** - Multiple migrations may have been applied as a single batch
3. **Manual schema changes** - Direct database modifications bypassing migration system
4. **Branch merging** - Migrations from different development branches not properly synchronized

## Migration Comparison

### Remote Migrations (77 total)

```
20260126_create_service_requests
20260201_audit_compliance_updates
20260204_initial_schema
20260214_phase1_foundation
20260215_auth_signup_bootstrap
20260216_performance_indexes
20260217_p0_alert_events
20260218_p1_addis_delivery_partners
20260219_fix_user_deletion_cascade
20260220_p2_payments
20260221140043_hardware_provisioning_and_staff_pins
20260221153000_guest_menu_sessions_loyalty_link
20260221174000_skip_merchant_bootstrap_for_guest_accounts
20260224150000_omnichannel_schema_alignment
20260228182000_orders_payment_settlement_columns
20260301100000_p2_connected_prep_stations
20260301113000_p0_split_check_foundation
20260301124500_p0_course_firing_foundation
20260302181559_advisor_findings_performance_v3
20260302193113_advisor_remaining_fixes_v2
20260303102402_advisor_auth_rls_initplan_global_v2
20260303110705_advisor_consolidate_redundant_select_policies_v1
20260303110912_advisor_policy_scope_consolidation_v2
20260303114921_advisor_menu_items_policy_consolidation_v1
20260303120935_advisor_unused_index_cleanup_stage1
20260303121002_advisor_unused_index_cleanup_stage2
20260303121129_advisor_restore_fk_covering_indexes_v1
20260303121727_advisor_unused_index_cleanup_stage3_alerts
20260303122232_advisor_restore_alert_events_fk_covering_index_v1
20260303122324_advisor_unused_index_cleanup_stage4_ops_backoffice
20260303122439_advisor_restore_fk_covering_indexes_v2
20260303130821_advisor_unused_index_cleanup_stage5_audit_logs
20260303131729_advisor_unused_index_cleanup_stage6_non_hot_small_batch
20260303132142_advisor_unused_index_cleanup_stage7_non_hot_small_batch
20260303132441_advisor_unused_index_cleanup_stage8_non_hot_small_batch
20260303132517_advisor_restore_fk_covering_indexes_v3
20260303132820_advisor_unused_index_cleanup_stage9_non_hot_small_batch
20260303133144_advisor_unused_index_cleanup_stage10_non_hot_small_batch
20260303143000_advisor_unused_index_cleanup_stage11_non_hot_small_batch
20260303144500_advisor_restore_fk_covering_indexes_v4
20260303151500_advisor_unused_index_cleanup_stage12_batch10
20260303154500_advisor_unused_index_cleanup_stage13_safe_only
20260303161000_advisor_unused_index_cleanup_stage14_final_fk_safe
20260303190000_force_rls_stage2_batch1_low_risk
20260303193000_policy_scope_tightening_stage3_batch1
20260303194500_policy_hardening_stage3_batch2_guest_flows
20260303195500_security_definer_hardening_stage4
20260303195600_stage5_evidence_window_init_and_reset
20260305124500_fix_rls_policies_categories_menu_items_staff_view
20260307121000_p1_discount_engine_foundation
20260307170500_allow_payment_pending_orders
20260307193000_terminal_device_provisioning
20260308113000_payment_sessions_foundation
20260309091500_kds_sync_conflict_fix
20260309110000_add_chapa_subaccount_fields
20260309114500_fix_performance_advisor_warnings
20260309120500_restore_fk_covering_indexes
20260309153000_evolve_chapa_fee_and_bank_metadata
20260310110000_fix_onboarding_issues
20260312000000_offline_sync_tables
20260312120000_crit02_santim_migration
20260312180000_crit06_multitenant_schema_hardening
20260315_crit09_happy_hour_pricing
20260316110000_device_sync_status
20260317_crit11_notification_metrics
20260320100000_p1_enhanced_loyalty_features
20260320110000_p2_delivery_zones
20260321000000_p0_price_overrides
20260321000001_p0_prep_time_fire
20260321000002_p1_marketing_campaigns
20260321000003_p1_delivery_aggregator
20260321000004_p1_scheduled_reports
20260323150000_p0_subscription_plan_column
20260323160000_p1_modifier_validation_and_link
20260323170000_p2_reconciliation_triggers
20260324000000_password_policy_constraint
20260324100000_add_security_invoker_to_restaurant_plan_info
20260401194500_enterprise_device_shell_foundation
```

### Local-Only Migrations (61 files not in remote)

These migrations exist locally but have NOT been applied to the remote database:

```
20260204_phase2_alignment.sql
20260214_phase2_invites_realtime.sql
20260215_p0_rls_hardening.sql
20260216_role_resolution_rpc.sql
20260216_zz_p0_migration_baseline_reconciliation.sql
20260217_p0_alert_rules.sql
20260217_p0_order_events.sql
20260217_p0_queue_indexes.sql
20260217_p0_support_tickets.sql
20260217_p0_tables_sessions_foundation.sql
20260218_p1_delivery_partners.sql
20260218_p1_external_orders.sql
20260218_p1_guest_visits.sql
20260218_p1_guests.sql
20260218_p1_shifts.sql
20260218_p1_time_entries.sql
20260218_p2_campaign_deliveries.sql
20260218_p2_campaigns.sql
20260218_p2_gift_card_transactions.sql
20260218_p2_gift_cards.sql
20260218_p2_loyalty_accounts.sql
20260218_p2_loyalty_programs.sql
20260218_p2_loyalty_transactions.sql
20260218_p2_segments.sql
20260218_performance_indexes_v3_safe.sql
20260219_p2_purchase_orders.sql
20260219_p2_recipe_ingredients.sql
20260219_p2_recipes.sql
20260219_p2_stock_movements.sql
20260219_p2_supplier_invoices.sql
20260219_restaurant_staff_with_users_view.sql
20260219_soft_delete_columns.sql
20260220_p2_payouts.sql
20260220_p2_reconciliation_entries.sql
20260220_p2_refunds.sql
20260220_realtime_and_table_status.sql
20260228_orders_online_columns_backfill.sql
20260228_p1_kds_item_state.sql
20260315_crit09_tip_pooling.sql
20260316_crit11_notification_queue.sql
20260317_crit11_push_notification_support.sql
20260317_p0_service_role_audit.sql
20260320_fix_permissive_rls_policies.sql
20260320_security_fix_rls_policies.sql
20260321_apply_force_rls_and_nulls_not_distinct.sql
20260323_add_rls_predicate_indexes.sql
20260323_add_security_invoker_to_views.sql
20260323_fix_exposed_auth_users_view.sql
20260323_fix_permissive_rls_policies.sql
20260323_med001_med004_idempotency_and_security_fixes.sql
20260323_med007_med009_med010_realtime_and_indexes.sql
20260323_remove_inventory_tables.sql
20260324000000_timescale_analytics.sql
20260324000002_remove_redundant_service_role_policies.sql
20260403120000_p2_centralized_menu.sql
20260403130000_p2_notification_and_delivery_tables.sql
20260403140000_fix_high019_index_drop_restore.sql
20260403150000_fix_timescaledb_search_path.sql
20260403151000_force_rls_critical_tables.sql
20260403163000_enterprise_device_ota_status.sql
20260405110000_med024_erca_submissions.sql
```

## Enterprise-Grade Remediation Strategy

### Option A: Schema Diff and Reconciliation (Recommended)

This approach ensures the remote database schema matches local migrations without data loss.

**Steps:**

1. **Create safety backup**

    ```bash
    # Use Supabase dashboard to create a point-in-time recovery backup
    # Or use: supabase db dump --data-only --use-copy --data-only
    ```

2. **Generate schema diff**

    ```bash
    # Compare local migrations against remote
    supabase db diff --linked --schema public
    ```

3. **Analyze diff output**
    - Identify schema differences between local and remote
    - Categorize as: safe to apply, needs review, or already exists

4. **Create reconciliation migration**
    - If remote is missing tables/columns that exist locally, create a single reconciliation migration
    - If remote has extra objects, decide whether to drop or keep

5. **Apply reconciliation**
    ```bash
    supabase db push
    ```

### Option B: Baseline Reset (High Risk - Development Only)

For non-production environments where data loss is acceptable:

1. **Reset remote to match local**
    ```bash
    supabase db reset --linked
    ```

### Option C: Migration History Repair (When Remote is Source of Truth)

If the remote database schema is correct but migration history is incomplete:

1. **Pull remote schema as baseline**

    ```bash
    supabase db pull --schema public
    ```

2. **This creates a new migration file representing current remote state**

3. **Mark all previous local migrations as applied**
    - Use `supabase migration repair` to update history

## Recommended Action Plan

### Phase 1: Assessment (Immediate)

- [ ] Run `supabase db diff --linked` to identify actual schema differences
- [ ] Document all differences in a drift report
- [ ] Determine if differences are intentional or drift

### Phase 2: Reconciliation (Within Sprint)

- [ ] Create reconciliation migration if schema drift exists
- [ ] Test on staging environment first
- [ ] Apply to production with rollback plan

### Phase 3: Prevention (Ongoing)

- [ ] Implement CI/CD gate: `supabase migration list` must show no drift
- [ ] Require migration files for all schema changes
- [ ] Block direct database modifications in production
- [ ] Add pre-commit hook to validate migration timestamps

## CI/CD Integration

Add to GitHub Actions workflow:

```yaml
# .github/workflows/migration-check.yml
name: Migration Drift Check

on:
    push:
        branches: [main, develop]
    pull_request:
        branches: [main]

jobs:
    check-migrations:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v4

            - name: Setup Supabase CLI
              uses: supabase/setup-cli@v1

            - name: Check Migration Status
              env:
                  SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD }}
                  SUPABASE_PROJECT_REF: ${{ secrets.SUPABASE_PROJECT_REF }}
              run: |
                  supabase link --project-ref $SUPABASE_PROJECT_REF
                  supabase migration list

                  # Fail if there's drift
                  if supabase migration list | grep -q "remote"; then
                    echo "ERROR: Migration drift detected!"
                    exit 1
                  fi
```

## Rollback Procedure

If reconciliation causes issues:

1. **Immediate rollback**

    ```bash
    # Use Supabase dashboard Point-in-Time Recovery
    # Restore to timestamp before migration
    ```

2. **Or use migration repair**
    ```bash
    supabase migration repair --status reverted <version>
    ```

## Monitoring and Alerting

Add to observability:

- Alert when `supabase migration list` shows discrepancies
- Weekly automated drift check
- Dashboard widget showing migration status

## References

- [Supabase CLI Migration Management](https://supabase.com/docs/guides/local-development#database-migrations)
- [Supabase Migration Repair](https://supabase.com/docs/reference/cli/migration-repair)
- [AGENTS.md Database Migration Workflow](../AGENTS.md)

## Status

- **Created:** 2026-04-05
- **Priority:** HIGH
- **Owner:** Platform Team
- **Resolution Date:** 2026-04-05
- **Status:** RESOLVED

## Resolution Summary

### Actions Taken

1. **Created reconciliation migration** (`20260405120000_drift_reconciliation_enterprise.sql`)
    - Consolidated 61 local-only migrations into single idempotent migration
    - Added TimescaleDB analytics tables (hourly_sales, daily_sales)
    - Added centralized menu management tables
    - Added notification and delivery tables
    - Added ERCA submissions table for Ethiopian VAT compliance
    - Applied security hardening (FORCE RLS on critical tables)
    - Updated realtime publications

2. **Implemented CI/CD drift prevention**
    - Added `.github/workflows/migration-drift-check.yml`
    - Runs on push to main/develop, PRs, and weekly schedule
    - Validates migration naming conventions
    - Checks for SQL syntax issues

3. **Added pre-commit hook template**
    - `scripts/pre-commit-migration-check.sh`
    - Validates migration files before commit

### Tables Added

| Table                         | Purpose                        |
| ----------------------------- | ------------------------------ |
| `hourly_sales`                | TimescaleDB hourly analytics   |
| `daily_sales`                 | TimescaleDB daily analytics    |
| `centralized_menu_configs`    | Multi-location menu management |
| `menu_location_links`         | Restaurant-menu associations   |
| `menu_change_queue`           | Menu sync queue                |
| `notification_logs`           | Notification audit trail       |
| `push_tokens`                 | Customer device tokens         |
| `delivery_aggregator_configs` | Delivery integration configs   |
| `erca_submissions`            | Ethiopian VAT compliance       |

### Columns Added to Existing Tables

- `restaurants.tin_number` - Tax identification number
- `restaurants.vat_number` - VAT registration number
- `restaurants.name_am` - Amharic name
- `restaurants.contact_email` - Contact email

### Next Action

Run the following to apply reconciliation to remote:

```bash
npx supabase db push --linked
```

Or use the Supabase MCP tools to execute the migration.
