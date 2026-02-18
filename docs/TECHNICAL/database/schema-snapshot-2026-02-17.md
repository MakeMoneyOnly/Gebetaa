# Schema Snapshot - 2026-02-17

Source: `src/types/database.ts`
Purpose: Baseline schema reference before P0 foundational migrations

## Public Tables Present

- `agency_users`
- `audit_logs`
- `categories`
- `global_orders`
- `menu_items`
- `order_items`
- `orders`
- `rate_limit_logs`
- `restaurant_staff`
- `restaurants`
- `reviews`
- `service_requests`
- `stations`
- `system_health`
- `system_health_monitor`
- `tables`
- `tenants`
- `workflow_audit_logs`

## Notes

- `tables` exists in baseline schema.
- `table_sessions`, `order_events`, `alert_rules`, `alert_events`, and `support_tickets` are not present in baseline.
- This snapshot is the reference point for P0 migration rollout and rollback verification.
