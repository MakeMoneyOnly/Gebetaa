# Seed Data Audit Report - Cafe Lucia

## Summary

The provided `seed-data.sql` has **critical column mismatches** with the current database schema. The seed was designed for an older/different schema version and will fail on the current lole database.

---

## Issues Found

### 1. RESTAURANTS Table

| Seed Column       | Actual Column                      | Status           |
| ----------------- | ---------------------------------- | ---------------- |
| `name_en`         | `name`                             | ❌ Mismatch      |
| `name_am`         | (stored in `settings` or separate) | ❌ Not available |
| `address_en`      | `location`                         | ❌ Different     |
| `address_am`      | (stored in `settings`)             | ❌ Not available |
| `phone`           | `contact_phone`                    | ❌ Different     |
| `email`           | `contact_email`                    | ❌ Different     |
| `timezone`        | (stored in `settings`)             | ❌ Not available |
| `currency_code`   | `currency`                         | ❌ Different     |
| `tin_number`      | Not in schema                      | ❌ Missing       |
| `vat_number`      | Not in schema                      | ❌ Missing       |
| `plan`            | `subscription_plan`                | ❌ Different     |
| `plan_expires_at` | `subscription_ends_at`             | ❌ Different     |

### 2. TABLES Table

| Seed Column | Actual Column           | Status       |
| ----------- | ----------------------- | ------------ |
| `name`      | `table_number`          | ❌ Different |
| `qr_secret` | `qr_code_url`           | ❌ Different |
| `is_active` | `status` + `deleted_at` | ❌ Different |

**Missing**: `zone` column (used in current schema)

### 3. RESTAURANT_STAFF Table

| Seed Column        | Actual Column                                   | Status           |
| ------------------ | ----------------------------------------------- | ---------------- |
| `full_name`        | `name`                                          | ❌ Different     |
| `role` = 'cashier' | Allowed: owner/admin/manager/kitchen/waiter/bar | ❌ Invalid value |
| `hired_at`         | Not in schema                                   | ❌ Missing       |

### 4. CATEGORIES Table

| Seed Column   | Actual Column                   | Status                          |
| ------------- | ------------------------------- | ------------------------------- |
| `name_en`     | `name`                          | ❌ Different                    |
| `kds_station` | (derived from items' `station`) | ❌ Not stored at category level |
| `sort_order`  | `order_index`                   | ❌ Different                    |

### 5. MENU_ITEMS Table

| Seed Column                | Actual Column                  | Status           |
| -------------------------- | ------------------------------ | ---------------- |
| `name_en`                  | `name`                         | ❌ Different     |
| `restaurant_id`            | Not a column (via category FK) | ❌ Not available |
| `available_for_delivery`   | Not in schema                  | ❌ Missing       |
| `sort_order`               | Not in schema                  | ❌ Missing       |
| `preparation_time_minutes` | `prep_time_minutes`            | ❌ Different     |

**New columns**: `station` (kitchen/bar/dessert/coffee), `course`, `connected_stations`

### 6. ORDERS Table

| Seed Column | Actual Column                  | Status       |
| ----------- | ------------------------------ | ------------ |
| `table_id`  | `table_number` (text)          | ❌ Different |
| `source`    | `order_type`                   | ❌ Different |
| `waiter_id` | (not directly stored)          | ❌ Different |
| `items`     | JSONB with different structure | ❌ Different |

### 7. ORDER_ITEMS Table

| Seed Column    | Actual Column                 | Status        |
| -------------- | ----------------------------- | ------------- |
| `menu_item_id` | `item_id`                     | ❌ Different  |
| `unit_price`   | `price`                       | ❌ Different  |
| `kds_status`   | `status`                      | ❌ Different  |
| `kds_station`  | `station`                     | ❌ Different  |
| `line_total`   | (calculated from qty × price) | ❌ Not stored |

### 8. GUESTS Table

| Seed Column    | Actual Column                    | Status                |
| -------------- | -------------------------------- | --------------------- |
| `phone`        | `phone` (nullable)               | ✅ Exists             |
| `name`         | `name`                           | ✅ Exists             |
| `is_anonymous` | (use `identity_key` NULL vs set) | ❌ Different approach |
| `created_at`   | `first_seen_at`                  | ❌ Different          |

### 9. LOYALTY_PROGRAMS Table

| Seed Column       | Actual Column                           | Status              |
| ----------------- | --------------------------------------- | ------------------- |
| `name_en`         | `name`                                  | ❌ Different        |
| `points_per_etb`  | `points_rule_json`                      | ❌ Different format |
| `redemption_rate` | (in points_rule_json)                   | ❌ Different format |
| `is_active`       | `status` (draft/active/paused/archived) | ❌ Different        |

### 10. LOYALTY_ACCOUNTS Table

| Seed Column      | Actual Column | Status       |
| ---------------- | ------------- | ------------ |
| `total_earned`   | Not stored    | ❌ Missing   |
| `total_redeemed` | Not stored    | ❌ Missing   |
| `enrolled_at`    | `created_at`  | ❌ Different |

### 11. MISSING TABLES

- `inventory_items` - Table does not exist
- `feature_flags` - Table does not exist

### 12. PAYMENTS Table

| Seed Column               | Actual Column        | Status       |
| ------------------------- | -------------------- | ------------ |
| `provider_transaction_id` | `provider_reference` | ❌ Different |
| `captured_at`             | `captured_at`        | ✅ Exists    |

---

## Recommendations

1. **Update seed data** to match current schema (see corrected version below)
2. **Migrate inventory tracking** - Consider adding as a future feature
3. **Feature flags** - Should be stored in `settings` JSONB or a new table
4. **Consider keeping schema as-is** if this was a planned refactor - document the target state

---

## Corrected Seed Data Structure (Cafe Lucia)

The corrected version should use the actual column names from the database schema.
