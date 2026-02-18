# Gebeta Merchant Platform North Star (Toast Parity) - Execution Checklist

Last updated: 2026-02-17
Owner: Product + Design + Engineering
Scope: Merchant dashboard and operating system for restaurants in Addis Ababa, Ethiopia

## 1) Objective

Build a high-utility merchant command center that matches the most valuable Toast capabilities while being:
- Fast under peak load
- Reliable with intermittent network conditions
- Enterprise-grade for chain operators
- Simple and non-bureaucratic for daily use

This document is the source of truth for phased execution.

## 2) Current Baseline (From Code)

### Current merchant tabs
- Dashboard
- Orders
- Menu
- Tables and QR
- Staff
- Analytics
- Settings
- Help

### Current API surface
- `GET /api/guest/context`
- `POST /api/orders`
- `POST /api/service-requests`
- `PATCH /api/kds/orders/:orderId`
- `GET /api/merchant/activity`
- `GET|POST /api/menu` (currently demo-style)
- `GET /api/restaurants` (currently demo-style)
- `GET|HEAD /api/health`

### Current DB entities already present
- `restaurants`
- `restaurant_staff`
- `categories`
- `menu_items`
- `orders`
- `order_items`
- `service_requests`
- `stations`
- `audit_logs`
- `rate_limit_logs`
- `reviews`
- `global_orders`
- `tenants`
- `workflow_audit_logs`
- `agency_users`
- `system_health`
- `system_health_monitor`

### Critical gaps already identified
- Trust gap: static or mock data in critical tabs
- Action gap: controls present but not fully wired
- Contract gap: QR generation and guest signature flow mismatch
- Shell gap: mobile and global command flow not complete

## 3) Target Information Architecture (Command Center)

### Core tabs to keep and harden first
- Command Center (Dashboard)
- Service Ops (Orders + KDS + Tables + Service Requests)
- Menu and Pricing
- Team
- Analytics
- Settings and Security
- Help and Support

### Enterprise tabs to add
- Guests (CRM, Loyalty, Gift Cards, Campaigns)
- Channels (Online Ordering, Delivery, Kiosk/Handheld)
- Inventory and Cost
- Finance and Reconciliation
- Integrations and Developer
- Multi-location (for chains)

## 4) Entity Catalog (Exact DB Tables by Domain)

Use existing tables where possible. Add the following tables in phases.

### Existing tables to reuse immediately
- `restaurants`
- `restaurant_staff`
- `categories`
- `menu_items`
- `orders`
- `order_items`
- `service_requests`
- `stations`
- `audit_logs`
- `rate_limit_logs`

### New tables for MVP hardening
- `tables`
  - `id`, `restaurant_id`, `table_number`, `status`, `capacity`, `zone`, `qr_version`, `created_at`, `updated_at`
- `table_sessions`
  - `id`, `restaurant_id`, `table_id`, `opened_at`, `closed_at`, `assigned_staff_id`, `guest_count`, `status`
- `order_events`
  - `id`, `restaurant_id`, `order_id`, `event_type`, `from_status`, `to_status`, `actor_user_id`, `metadata`, `created_at`
- `alert_rules`
  - `id`, `restaurant_id`, `name`, `condition_json`, `severity`, `enabled`, `target_json`, `created_at`
- `alert_events`
  - `id`, `restaurant_id`, `rule_id`, `entity_type`, `entity_id`, `severity`, `status`, `created_at`, `resolved_at`
- `support_tickets`
  - `id`, `restaurant_id`, `source`, `subject`, `description`, `priority`, `status`, `diagnostics_json`, `created_at`

### New tables for V2 (growth stack)
- `guests`
  - `id`, `restaurant_id`, `name`, `phone_hash`, `email_hash`, `language`, `tags`, `first_seen_at`, `last_seen_at`, `lifetime_value`
- `guest_visits`
  - `id`, `restaurant_id`, `guest_id`, `order_id`, `table_id`, `channel`, `visited_at`, `spend`
- `loyalty_programs`
  - `id`, `restaurant_id`, `name`, `points_rule_json`, `tier_rule_json`, `status`
- `loyalty_accounts`
  - `id`, `restaurant_id`, `guest_id`, `program_id`, `points_balance`, `tier`, `status`
- `loyalty_transactions`
  - `id`, `restaurant_id`, `account_id`, `order_id`, `points_delta`, `reason`, `created_at`
- `gift_cards`
  - `id`, `restaurant_id`, `code`, `currency`, `initial_balance`, `current_balance`, `status`, `expires_at`
- `gift_card_transactions`
  - `id`, `restaurant_id`, `gift_card_id`, `order_id`, `amount_delta`, `type`, `created_at`
- `campaigns`
  - `id`, `restaurant_id`, `channel`, `name`, `segment_id`, `template_id`, `status`, `scheduled_at`
- `campaign_deliveries`
  - `id`, `campaign_id`, `guest_id`, `status`, `sent_at`, `opened_at`, `clicked_at`, `conversion_order_id`
- `segments`
  - `id`, `restaurant_id`, `name`, `rule_json`, `created_at`
- `delivery_partners`
  - `id`, `restaurant_id`, `provider`, `status`, `credentials_ref`, `settings_json`
- `external_orders`
  - `id`, `restaurant_id`, `provider`, `provider_order_id`, `payload_json`, `normalized_status`, `created_at`

### New tables for V3 (enterprise and chain)
- `locations`
  - `id`, `tenant_id`, `name`, `timezone`, `currency`, `tax_profile_id`, `status`
- `location_staff_roles`
  - `id`, `location_id`, `user_id`, `role`, `policy_version`, `active`
- `menu_versions`
  - `id`, `location_id`, `name`, `published_by`, `published_at`, `rollback_of`
- `inventory_items`
  - `id`, `location_id`, `name`, `sku`, `uom`, `par_level`, `on_hand_qty`, `cost_per_uom`, `active`
- `recipes`
  - `id`, `location_id`, `menu_item_id`, `yield_qty`, `yield_uom`
- `recipe_ingredients`
  - `id`, `recipe_id`, `inventory_item_id`, `qty_per_recipe`, `uom`
- `stock_movements`
  - `id`, `location_id`, `inventory_item_id`, `movement_type`, `qty`, `reason`, `reference_type`, `reference_id`, `created_at`
- `purchase_orders`
  - `id`, `location_id`, `supplier_id`, `status`, `ordered_at`, `received_at`, `total_cost`
- `supplier_invoices`
  - `id`, `location_id`, `supplier_id`, `invoice_number`, `invoice_date`, `total_amount`, `status`
- `payments`
  - `id`, `location_id`, `order_id`, `method`, `provider`, `amount`, `currency`, `status`, `captured_at`
- `refunds`
  - `id`, `location_id`, `payment_id`, `amount`, `reason`, `status`, `processed_at`
- `payouts`
  - `id`, `location_id`, `provider`, `period_start`, `period_end`, `gross`, `fees`, `net`, `status`
- `reconciliation_entries`
  - `id`, `location_id`, `source_type`, `source_id`, `ledger_type`, `ledger_id`, `delta_amount`, `status`
- `integration_apps`
  - `id`, `tenant_id`, `name`, `category`, `status`, `config_json`
- `webhook_subscriptions`
  - `id`, `tenant_id`, `event_type`, `target_url`, `secret_ref`, `active`
- `webhook_deliveries`
  - `id`, `subscription_id`, `event_id`, `status_code`, `attempt_count`, `last_attempt_at`
- `api_keys`
  - `id`, `tenant_id`, `key_prefix`, `hash`, `scope_json`, `created_at`, `revoked_at`

## 5) API Contract Roadmap (Exact Endpoints)

## MVP APIs (must ship first)
- `GET /api/merchant/command-center?range=today`
- `GET /api/orders?status=&station=&assigned_to=&search=&cursor=`
- `PATCH /api/orders/:id/status`
- `POST /api/orders/:id/assign`
- `POST /api/orders/bulk-status`
- `GET /api/tables`
- `POST /api/tables`
- `PATCH /api/tables/:id`
- `DELETE /api/tables/:id`
- `POST /api/tables/:id/qr/regenerate` (must return signed URL with `sig` and `exp`)
- `POST /api/table-sessions/open`
- `POST /api/table-sessions/:id/transfer`
- `POST /api/table-sessions/:id/close`
- `GET /api/staff`
- `POST /api/staff/invite`
- `PATCH /api/staff/:id/role`
- `PATCH /api/staff/:id/active`
- `GET /api/analytics/overview?range=&channel=`
- `GET /api/support/articles?query=`
- `POST /api/support/tickets`
- `GET /api/settings/security`
- `PATCH /api/settings/security`

## V2 APIs (growth and guest stack)
- `GET /api/guests?query=&segment=&cursor=`
- `GET /api/guests/:id`
- `GET /api/guests/:id/visits`
- `GET /api/loyalty/programs`
- `POST /api/loyalty/programs`
- `POST /api/loyalty/accounts/:id/adjust`
- `GET /api/gift-cards?status=`
- `POST /api/gift-cards`
- `POST /api/gift-cards/:id/redeem`
- `GET /api/campaigns`
- `POST /api/campaigns`
- `POST /api/campaigns/:id/launch`
- `GET /api/channels/summary`
- `POST /api/channels/delivery/connect`
- `GET /api/channels/delivery/orders?provider=`
- `POST /api/channels/delivery/orders/:id/ack`
- `GET /api/channels/online-ordering/settings`
- `PATCH /api/channels/online-ordering/settings`

## V3 APIs (enterprise and platform)
- `GET /api/locations`
- `POST /api/locations`
- `PATCH /api/locations/:id`
- `POST /api/menu/versions/publish`
- `POST /api/menu/versions/:id/rollback`
- `GET /api/inventory/items`
- `POST /api/inventory/items`
- `POST /api/inventory/movements`
- `GET /api/inventory/variance`
- `GET /api/finance/payments?range=`
- `GET /api/finance/payouts?range=`
- `GET /api/finance/reconciliation?status=`
- `POST /api/finance/refunds`
- `GET /api/integrations/apps`
- `POST /api/integrations/apps`
- `GET /api/developer/webhooks`
- `POST /api/developer/webhooks`
- `GET /api/developer/webhook-deliveries`
- `POST /api/developer/api-keys`
- `DELETE /api/developer/api-keys/:id`

## 6) Tab-by-Tab Parity Checklist (MVP / V2 / V3)

Use this section to execute feature-by-feature.

## 6.1 Command Center (Dashboard)

### MVP
- [ ] Replace static KPIs with live metrics (`orders_in_flight`, `avg_ticket_time`, `active_tables`, `open_requests`, `payment_success_rate`)
- [ ] Add unified attention queue with priority sorting
- [ ] Add last-sync indicator and data health chip
- DB entities: `orders`, `service_requests`, `table_sessions`, `alert_events`, `audit_logs`
- APIs: `GET /api/merchant/command-center`, `GET /api/merchant/activity`
- UI components:
  - `CommandCenterHeader`
  - `AttentionQueuePanel`
  - `LiveKPICard`
  - `SyncHealthBadge`

### V2
- [x] Add role-based dashboard presets (owner, manager, kitchen lead)
- [x] Add configurable alert rules and escalation policy
- DB entities: `alert_rules`, `alert_events`, `restaurant_staff`
- APIs: `GET|PATCH /api/alerts/rules`, `GET /api/alerts/events`
- UI components:
  - `DashboardPresetSwitcher`
  - `AlertRuleBuilderDrawer`
  - `EscalationTimeline`

### V3
- [ ] Add multi-location cross-store command center
- [ ] Add AI-powered anomaly explanations and action suggestions
- DB entities: `locations`, `alert_events`, `workflow_audit_logs`
- APIs: `GET /api/command-center/multi-location`, `GET /api/anomalies/explanations`
- UI components:
  - `LocationComparator`
  - `AnomalyInsightPanel`

## 6.2 Service Ops (Orders + KDS + Tables + Requests)

### MVP
- [ ] Ship executable order workflow (acknowledge, prepare, ready, served, complete)
- [ ] Enable bulk actions and assignment
- [ ] Add order SLA timers and stale-order alerts
- [ ] Merge table service requests into same queue
- DB entities: `orders`, `order_items`, `order_events`, `service_requests`, `table_sessions`, `stations`
- APIs: `GET /api/orders`, `PATCH /api/orders/:id/status`, `POST /api/orders/bulk-status`, `POST /api/orders/:id/assign`, `PATCH /api/kds/orders/:orderId`
- UI components:
  - `OrdersQueueTable`
  - `OrdersKanbanBoard`
  - `OrderDetailDrawer`
  - `SLATimerChip`
  - `BulkActionBar`

### V2
- [ ] Add station capacity load balancing
- [ ] Add coursing and fire timing controls
- [ ] Add transfer/merge/split order tools
- DB entities: `stations`, `order_events`, `order_items`
- APIs: `POST /api/orders/:id/fire-course`, `POST /api/orders/:id/split`, `POST /api/orders/:id/merge`
- UI components:
  - `StationLoadHeatmap`
  - `CoursingEditor`
  - `OrderSplitMergeModal`

### V3
- [ ] Add cross-location kitchen benchmarking
- [ ] Add predictive prep-time model and staffing recommendation
- DB entities: `locations`, `orders`, `order_events`, `restaurant_staff`
- APIs: `GET /api/ops/benchmarking`, `GET /api/ops/predicted-prep-time`
- UI components:
  - `KitchenBenchmarkBoard`
  - `PrepTimeForecastCard`

## 6.3 Menu and Pricing

### MVP
- [ ] Replace prompt/alert CRUD with inline grid editing
- [ ] Add bulk price and availability updates
- [ ] Add publish workflow with version label and rollback entry
- DB entities: `categories`, `menu_items`, `menu_versions` (new for publish history)
- APIs: `GET /api/menu/items`, `PATCH /api/menu/items/:id`, `POST /api/menu/items/bulk-update`, `POST /api/menu/versions/publish`
- UI components:
  - `MenuGridEditor`
  - `BulkPriceRuleModal`
  - `PublishDiffDrawer`

### V2
- [ ] Add channel-specific menus and pricing
- [ ] Add daypart rules and out-of-stock scheduling
- DB entities: `channel_menus` (new), `menu_items`, `categories`
- APIs: `GET /api/menu/channels`, `PATCH /api/menu/channels/:id`
- UI components:
  - `ChannelMenuMatrix`
  - `DaypartScheduler`

### V3
- [ ] Add AI menu engineering recommendations (margin, popularity, prep cost)
- [ ] Add chain-wide menu propagation with approval flow
- DB entities: `menu_versions`, `locations`, `inventory_items`, `recipes`
- APIs: `GET /api/menu/insights`, `POST /api/menu/rollout`
- UI components:
  - `MenuEngineeringPanel`
  - `RolloutApprovalFlow`

## 6.4 Tables and QR

### MVP
- [ ] Fix QR contract to always generate signed links (`slug`, `table`, `sig`, `exp`)
- [ ] Add batch QR print and download
- [ ] Add table lifecycle actions (seat, transfer, close)
- DB entities: `tables`, `table_sessions`, `restaurants`, `audit_logs`
- APIs: `GET /api/tables`, `POST /api/tables/:id/qr/regenerate`, `POST /api/table-sessions/open`, `POST /api/table-sessions/:id/transfer`, `POST /api/table-sessions/:id/close`
- UI components:
  - `TableGrid`
  - `QRBatchExporter`
  - `TableSessionDrawer`
  - `OccupancyTimeline`

### V2
- [ ] Add waitlist and reservation integration
- [ ] Add host stand optimization (next best table)
- DB entities: `reservations` (new), `waitlist_entries` (new), `table_sessions`
- APIs: `GET /api/waitlist`, `POST /api/waitlist`, `POST /api/reservations`
- UI components:
  - `HostStandBoard`
  - `WaitlistQueue`
  - `ReservationPlanner`

### V3
- [ ] Add smart seating recommendations by turn-time forecast
- [ ] Add multi-floor zoning and flow analytics
- DB entities: `tables`, `table_sessions`, `locations`
- APIs: `GET /api/tables/seating-recommendations`, `GET /api/tables/flow-analytics`
- UI components:
  - `SmartSeatingPanel`
  - `FloorFlowMap`

## 6.5 Team (Staff)

### MVP
- [ ] Replace mock staff list with real records and invite workflow
- [ ] Add role and permission controls
- [ ] Add activity and accountability timeline
- DB entities: `restaurant_staff`, `audit_logs`
- APIs: `GET /api/staff`, `POST /api/staff/invite`, `PATCH /api/staff/:id/role`, `PATCH /api/staff/:id/active`
- UI components:
  - `StaffDirectoryTable`
  - `InviteStaffModal`
  - `RolePermissionDrawer`

### V2
- [x] Add scheduling and clock-in/out
- [ ] Add shift-level performance and labor cost view
- DB entities: `shifts` (new), `time_entries` (new), `restaurant_staff`, `orders`
- APIs: `GET /api/staff/schedule`, `POST /api/staff/schedule`, `POST /api/staff/time-entries/clock`
- UI components:
  - `ScheduleCalendar`
  - `ShiftCoverageHeatmap`
  - `TimeClockPanel`

### V3
- [ ] Add payroll export and tips management
- [ ] Add cross-location staffing pool controls
- DB entities: `payroll_runs` (new), `tips` (new), `location_staff_roles`
- APIs: `GET /api/payroll/summary`, `POST /api/payroll/export`, `GET /api/tips/reconciliation`
- UI components:
  - `PayrollRunBoard`
  - `TipsDistributionTable`

## 6.6 Analytics

### MVP
- [ ] Build metric catalog with traceable formulas
- [ ] Support drilldowns by time, table, channel, staff, station
- [ ] Enable CSV export
- DB entities: `orders`, `order_items`, `table_sessions`, `service_requests`
- APIs: `GET /api/analytics/overview`, `GET /api/analytics/drilldown`, `GET /api/analytics/export`
- UI components:
  - `MetricCatalogPanel`
  - `DrilldownExplorer`
  - `ExportModal`

### V2
- [ ] Add scheduled reports and alert subscriptions
- [ ] Add retention and repeat-guest analytics
- DB entities: `campaigns`, `guests`, `guest_visits`, `alert_rules`
- APIs: `POST /api/analytics/reports/schedule`, `GET /api/analytics/retention`
- UI components:
  - `ReportScheduler`
  - `RetentionCohortChart`

### V3
- [ ] Add benchmarking across locations and peer groups
- [ ] Add predictive demand and margin forecasts
- DB entities: `locations`, `orders`, `inventory_items`, `stock_movements`
- APIs: `GET /api/analytics/benchmarking`, `GET /api/analytics/forecast`
- UI components:
  - `BenchmarkMatrix`
  - `ForecastWorkbench`

## 6.7 Settings and Security

### MVP
- [ ] Complete security tab (MFA policy, session controls, password policy)
- [ ] Complete notifications routing (email, SMS, in-app, escalation)
- [ ] Add audit log explorer
- DB entities: `restaurants.settings`, `audit_logs`, `alert_rules`
- APIs: `GET|PATCH /api/settings/security`, `GET|PATCH /api/settings/notifications`, `GET /api/settings/audit-logs`
- UI components:
  - `SecurityPolicyForm`
  - `SessionControlPanel`
  - `NotificationRoutingBuilder`
  - `AuditLogTable`

### V2
- [ ] Add approval workflow engine for sensitive changes
- [ ] Add key rotation and secrets management UI
- DB entities: `workflow_audit_logs`, `api_keys`, `integration_apps`
- APIs: `POST /api/settings/approvals`, `POST /api/developer/api-keys`, `DELETE /api/developer/api-keys/:id`
- UI components:
  - `ApprovalQueue`
  - `KeyManagementPanel`

### V3
- [ ] Add organization policy packs for multi-location
- [ ] Add compliance exports and immutable audit snapshots
- DB entities: `locations`, `workflow_audit_logs`, `audit_logs`
- APIs: `GET /api/compliance/exports`, `POST /api/compliance/snapshots`
- UI components:
  - `PolicyPackManager`
  - `ComplianceExportCenter`

## 6.8 Help and Support

### MVP
- [ ] Replace static CTA cards with functional support center
- [ ] Implement KB search and in-app ticketing with diagnostics attached
- DB entities: `support_tickets`, `system_health`, `audit_logs`
- APIs: `GET /api/support/articles`, `POST /api/support/tickets`, `GET /api/support/tickets/:id`
- UI components:
  - `KnowledgeBaseSearch`
  - `SupportTicketComposer`
  - `TicketStatusTimeline`

### V2
- [ ] Add guided troubleshooting flows by context
- [ ] Add live chat handoff
- DB entities: `support_tickets`, `workflow_audit_logs`
- APIs: `POST /api/support/troubleshoot`, `POST /api/support/chat/start`
- UI components:
  - `DiagnosticWizard`
  - `LiveChatDock`

### V3
- [ ] Add proactive incident notifications and service status by merchant
- DB entities: `system_health`, `support_tickets`, `alert_events`
- APIs: `GET /api/status/incidents`, `POST /api/status/subscriptions`
- UI components:
  - `IncidentBanner`
  - `StatusSubscriptionPanel`

## 6.9 Guests (New Tab)

### MVP
- [ ] Add guest profile unification from orders and visits
- [ ] Add guest notes, tags, VIP markers
- DB entities: `guests`, `guest_visits`, `orders`
- APIs: `GET /api/guests`, `GET /api/guests/:id`, `PATCH /api/guests/:id`
- UI components:
  - `GuestDirectory`
  - `GuestProfileDrawer`

### V2
- [ ] Add loyalty and gift cards
- [ ] Add campaign launch and conversion tracking
- DB entities: `loyalty_programs`, `loyalty_accounts`, `loyalty_transactions`, `gift_cards`, `gift_card_transactions`, `campaigns`, `campaign_deliveries`, `segments`
- APIs: `GET|POST /api/loyalty/programs`, `POST /api/gift-cards`, `POST /api/campaigns/:id/launch`
- UI components:
  - `LoyaltyProgramBuilder`
  - `GiftCardManager`
  - `CampaignBuilder`

### V3
- [ ] Add cross-location guest identity and lifetime value analytics
- DB entities: `locations`, `guests`, `guest_visits`
- APIs: `GET /api/guests/enterprise-profile`
- UI components:
  - `Guest360EnterpriseView`

## 6.10 Channels (New Tab)

### MVP
- [x] Add online ordering settings and channel health
- [ ] Add order-source attribution in real time
- DB entities: `orders`, `external_orders`
- APIs: `GET /api/channels/summary`, `GET|PATCH /api/channels/online-ordering/settings`
- UI components:
  - `ChannelHealthBoard`
  - `OnlineOrderingSettingsPanel`

### V2
- [x] Add delivery partner integrations with status sync
- [ ] Add menu mapping and outage controls per provider
- DB entities: `delivery_partners`, `external_orders`, `channel_menus`
- APIs: `POST /api/channels/delivery/connect`, `GET /api/channels/delivery/orders`, `PATCH /api/channels/delivery/provider-status`
- UI components:
  - `DeliveryPartnerHub`
  - `ChannelMenuMapper`

### V3
- [ ] Add kiosk and handheld orchestration views
- [ ] Add omni-channel profitability model
- DB entities: `orders`, `payments`, `reconciliation_entries`
- APIs: `GET /api/channels/devices/health`, `GET /api/channels/profitability`
- UI components:
  - `DeviceFleetStatus`
  - `ChannelProfitabilityMatrix`

## 6.11 Inventory and Cost (New Tab)

### MVP
- [ ] Add stock counts and low-stock alerts for critical ingredients
- [ ] Add menu-item to ingredient mapping starter
- DB entities: `inventory_items`, `recipes`, `recipe_ingredients`, `stock_movements`
- APIs: `GET|POST /api/inventory/items`, `POST /api/inventory/movements`
- UI components:
  - `InventoryTable`
  - `RecipeMapper`
  - `LowStockAlertPanel`

### V2
- [ ] Add purchase orders and invoice capture
- [ ] Add variance and waste tracking
- DB entities: `purchase_orders`, `supplier_invoices`, `stock_movements`
- APIs: `GET|POST /api/inventory/purchase-orders`, `POST /api/inventory/invoices`, `GET /api/inventory/variance`
- UI components:
  - `PurchaseOrderBoard`
  - `InvoiceReviewQueue`
  - `VarianceDashboard`

### V3
- [ ] Add margin optimization and predictive replenishment
- DB entities: `inventory_items`, `recipes`, `orders`, `stock_movements`
- APIs: `GET /api/inventory/replenishment-forecast`, `GET /api/inventory/margin-insights`
- UI components:
  - `ReplenishmentPlanner`
  - `CostOptimizationPanel`

## 6.12 Finance and Reconciliation (New Tab)

### MVP
- [ ] Add daily settlement and payment method breakdown
- [ ] Add refunds and exception queue
- DB entities: `payments`, `refunds`, `orders`
- APIs: `GET /api/finance/payments`, `POST /api/finance/refunds`, `GET /api/finance/exceptions`
- UI components:
  - `SettlementSummaryCard`
  - `PaymentMethodBreakdown`
  - `RefundQueue`

### V2
- [ ] Add payout reconciliation by provider and channel
- [ ] Add downloadable accounting exports
- DB entities: `payouts`, `reconciliation_entries`, `payments`
- APIs: `GET /api/finance/payouts`, `GET /api/finance/reconciliation`, `GET /api/finance/export`
- UI components:
  - `PayoutReconciliationTable`
  - `AccountingExportPanel`

### V3
- [ ] Add cashflow forecasting and capital readiness score
- DB entities: `payouts`, `orders`, `payments`
- APIs: `GET /api/finance/cashflow-forecast`, `GET /api/finance/capital-readiness`
- UI components:
  - `CashflowForecastChart`
  - `CapitalReadinessCard`

## 6.13 Integrations and Developer (New Tab)

### MVP
- [ ] Add integration directory and install state
- [ ] Add webhook subscription basics
- DB entities: `integration_apps`, `webhook_subscriptions`, `webhook_deliveries`
- APIs: `GET /api/integrations/apps`, `POST /api/developer/webhooks`, `GET /api/developer/webhook-deliveries`
- UI components:
  - `IntegrationDirectory`
  - `WebhookSubscriptionTable`

### V2
- [ ] Add API key management with scopes
- [ ] Add retry and dead-letter handling for webhook failures
- DB entities: `api_keys`, `webhook_deliveries`
- APIs: `POST /api/developer/api-keys`, `DELETE /api/developer/api-keys/:id`, `POST /api/developer/webhook-deliveries/:id/retry`
- UI components:
  - `APIKeyManager`
  - `WebhookDeliveryInspector`

### V3
- [ ] Add app marketplace and partner certification workflow
- DB entities: `integration_apps`, `workflow_audit_logs`
- APIs: `POST /api/integrations/apps/:id/submit`, `POST /api/integrations/apps/:id/certify`
- UI components:
  - `PartnerSubmissionQueue`
  - `CertificationChecklist`

## 6.14 Multi-location (New Tab, Enterprise)

### MVP
- [ ] Add location switcher and shared reporting
- DB entities: `locations`, `orders`, `restaurants`
- APIs: `GET /api/locations`, `GET /api/locations/:id/summary`
- UI components:
  - `LocationSwitcher`
  - `LocationSummaryGrid`

### V2
- [ ] Add centralized menu publishing and role templates
- DB entities: `menu_versions`, `location_staff_roles`
- APIs: `POST /api/locations/:id/menu/publish`, `POST /api/locations/roles/templates`
- UI components:
  - `CentralMenuPublisher`
  - `RoleTemplateManager`

### V3
- [ ] Add chain-wide benchmarking and policy enforcement
- DB entities: `locations`, `workflow_audit_logs`, `alert_rules`
- APIs: `GET /api/locations/benchmarking`, `POST /api/locations/policies/enforce`
- UI components:
  - `ChainBenchmarkDashboard`
  - `PolicyEnforcementBoard`

## 7) Addis Ababa Localization Requirements (Must Not Be Deferred)

### Payments and settlement
- [ ] Support Ethiopian payment rails through abstraction layer (provider adapters)
- [ ] Keep method-level reconciliation by provider and branch
- [ ] Add graceful fallback when provider API fails

### Language and UX
- [ ] Full English + Amharic support for merchant and guest surfaces
- [ ] Operator-first labeling for high-volume service moments

### Connectivity and resilience
- [ ] Offline-first queueing for critical order actions
- [ ] Retry with idempotency for every write API
- [ ] Clear sync-state visibility on every operational screen

### Compliance and audit readiness
- [ ] Configurable tax profiles and receipt fields
- [ ] Immutable audit logs for operational and financial actions

## 8) Execution Plan (Step by Step)

## Phase P0 (Weeks 1-4) - Trust and Workflow Foundation
- [ ] Remove mock/static fallback from merchant tabs
- [ ] Wire all visible controls to real APIs
- [ ] Fix signed QR generation and guest context validation
- [ ] Ship command center attention queue
- [ ] Ship order assignment + bulk transitions + SLA timers

## Phase P1 (Weeks 5-10) - Growth Operations
- [ ] Ship Team workflows (invite, role, activation)
- [ ] Ship Guests tab (profiles + segmentation starter)
- [ ] Ship Channels tab (online ordering settings + delivery adapter v1)
- [ ] Ship Settings security controls and support ticketing

## Phase P2 (Weeks 11-18) - Revenue and Cost Stack
- [ ] Ship Loyalty + Gift Cards + Campaigns
- [ ] Ship Inventory and Cost (stock + purchase + variance)
- [ ] Ship Finance and Reconciliation core

## Phase P3 (Weeks 19-28) - Enterprise Scale
- [ ] Ship Multi-location control plane
- [ ] Ship integrations/developer platform
- [ ] Ship benchmarking and predictive analytics

## 9) Definition of Done (Per Feature)

- Data source is production-backed and traceable
- API has validation, authorization, idempotency, and audit logging
- UI supports mobile and desktop operational usage
- Error states are explicit and actionable
- Performance target met for peak service windows
- Analytics include source-of-truth definition

## 10) Sources

### Toast product and platform references
- https://www.toasttab.com/products
- https://www.toasttab.com/products/point-of-sale
- https://www.toasttab.com/products/online-ordering
- https://www.toasttab.com/products/delivery-services
- https://www.toasttab.com/products/loyalty
- https://www.toasttab.com/products/gift-cards
- https://www.toasttab.com/products/email-marketing
- https://www.toasttab.com/products/inventory-management
- https://www.toasttab.com/products/xtrachef-by-toast
- https://www.toasttab.com/products/multi-location-management
- https://www.toasttab.com/products/benchmarking
- https://www.toasttab.com/products/integrations

### Toast technical docs
- https://doc.toasttab.com/doc/devguide/apiOverview.html
- https://doc.toasttab.com/doc/devguide/webhookEventsList.html
- https://toastintegrations.redoc.ly/openapi/ordersv2/operation/ordersV2BulkDelete/
- https://doc.toasttab.com/doc/devguide/apiUsingMenuDataAsPOSMenuIntegrationChecklist.html

### Ethiopia payment ecosystem references
- https://www.ethiotelecom.et/telebirr/telebirr-registration-requirements-with-registration-form/
- https://www.ethiotelecom.et/telebirr/%E1%88%88%E1%8B%95%E1%89%83%E1%8B%8O%E1%89%BD-%E1%8A%A5%E1%8A%93-%E1%8A%A0%E1%8C%88%E1%88%8D%E1%8C%8D%E1%88%8E%E1%89%B6%E1%89%BD-%E1%8B%AD%E1%8A%AD%E1%8D%88%E1%88%89/
- https://developer.chapa.co/api-reference/overview
- https://api.webirr.com/
