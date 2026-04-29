1m 4s
Run pnpm test:coverage

> lole-menu@0.1.0 test:coverage /home/runner/work/lole/lole
> vitest --coverage

RUN v4.0.18 /home/runner/work/lole/lole
Coverage enabled with v8

stderr | src/domains/orders/**tests**/service.test.ts > OrdersService > validateRequiredModifiers (indirect via createOrder) > passes validation when RPC returns error (graceful fallback)
[OrdersService] Modifier validation error: { message: 'RPC error' }

stderr | src/domains/orders/**tests**/service.test.ts > OrdersService > validateRequiredModifiers (indirect via createOrder) > passes validation when RPC throws exception (graceful fallback)
[OrdersService] Modifier validation exception: Error: Connection failed
at /home/runner/work/lole/lole/src/domains/orders/**tests**/service.test.ts:591:39
at processTicksAndRejections (node:internal/process/task_queues:103:5)
at file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:915:20

stderr | src/lib/graphql/**tests**/dataloaders.test.ts > DataLoaders > modifierGroup loader > should enforce tenant isolation
[DataLoader] Tenant isolation violation: attempted access to group-1 by restaurant test-restaurant-123

stderr | src/lib/graphql/**tests**/dataloaders.test.ts > DataLoaders > modifierOption loader > should enforce tenant isolation
[DataLoader] Tenant isolation violation: attempted access to opt-1 by restaurant test-restaurant-123

stderr | src/lib/graphql/**tests**/dataloaders.test.ts > DataLoaders > tenant isolation verification > should filter menu items by tenant
[DataLoader] Tenant isolation violation: attempted access to item-2 by restaurant test-restaurant-123

stderr | src/lib/graphql/**tests**/dataloaders.test.ts > DataLoaders > tenant isolation verification > should filter categories by tenant
[DataLoader] Tenant isolation violation: attempted access to cat-2 by restaurant test-restaurant-123

stderr | src/lib/graphql/**tests**/dataloaders.test.ts > DataLoaders > error handling > should handle Supabase error for restaurants loader
[DataLoader] Error loading restaurants: DB error

stderr | src/lib/graphql/**tests**/dataloaders.test.ts > DataLoaders > error handling > should handle Supabase error for guests loader
[DataLoader] Error loading guests: DB error

stderr | src/lib/graphql/**tests**/dataloaders.test.ts > DataLoaders > error handling > should handle Supabase error for payments loader
[DataLoader] Error loading payments: DB error

✓ src/domains/orders/**tests**/service.test.ts (46 tests) 165ms
✓ src/lib/graphql/**tests**/dataloaders.test.ts (71 tests) 62ms
✓ src/lib/fiscal/**tests**/erca-service.test.ts (52 tests) 69ms
stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > start and stop > should start the worker and set isRunning to true
[2026-04-29T10:01:53.501Z] [INFO] [app] Starting sync cycle {}
[2026-04-29T10:01:53.501Z] [INFO] [app] SyncWorker started {}

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > start and stop > should start the worker and set isRunning to true
[2026-04-29T10:01:53.501Z] [INFO] [app] Sync complete { succeeded: 0, failed: 0 }
[2026-04-29T10:01:53.504Z] [INFO] [app] SyncWorker stopped {}

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > start and stop > should not start twice
[2026-04-29T10:01:53.504Z] [INFO] [app] Starting sync cycle {}
[2026-04-29T10:01:53.504Z] [INFO] [app] SyncWorker started {}

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > start and stop > should not start twice
[2026-04-29T10:01:53.504Z] [INFO] [app] Sync complete { succeeded: 0, failed: 0 }
[2026-04-29T10:01:53.505Z] [INFO] [app] SyncWorker stopped {}

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > start and stop > should stop the worker and set isRunning to false
[2026-04-29T10:01:53.506Z] [INFO] [app] Starting sync cycle {}
[2026-04-29T10:01:53.506Z] [INFO] [app] SyncWorker started {}
[2026-04-29T10:01:53.506Z] [INFO] [app] SyncWorker stopped {}

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > start and stop > should stop the worker and set isRunning to false
[2026-04-29T10:01:53.506Z] [INFO] [app] Sync complete { succeeded: 0, failed: 0 }

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > start and stop > should clear interval on stop
[2026-04-29T10:01:53.508Z] [INFO] [app] Starting sync cycle {}
[2026-04-29T10:01:53.508Z] [INFO] [app] SyncWorker started {}
[2026-04-29T10:01:53.508Z] [INFO] [app] SyncWorker stopped {}

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > start and stop > should clear interval on stop
[2026-04-29T10:01:53.508Z] [INFO] [app] Sync complete { succeeded: 0, failed: 0 }

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > syncOnce > should skip sync when offline
[2026-04-29T10:01:53.510Z] [INFO] [app] Offline - skipping sync {}

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > syncOnce > should process pending operations when online
[2026-04-29T10:01:53.515Z] [INFO] [app] Starting sync cycle {}

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > syncOnce > should process pending operations when online
[2026-04-29T10:01:53.515Z] [INFO] [app] Processing operations via batch sync { count: 1 }

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > syncOnce > should process pending operations when online
[2026-04-29T10:01:53.515Z] [INFO] [app] Sync complete { succeeded: 1, failed: 0 }

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > syncOnce > should emit operation:success event for successful operations
[2026-04-29T10:01:53.517Z] [INFO] [app] Starting sync cycle {}

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > syncOnce > should emit operation:success event for successful operations
[2026-04-29T10:01:53.517Z] [INFO] [app] Processing operations via batch sync { count: 1 }

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > syncOnce > should emit operation:success event for successful operations
[2026-04-29T10:01:53.517Z] [INFO] [app] Sync complete { succeeded: 1, failed: 0 }

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > syncOnce > should emit operation:failed event for failed operations
[2026-04-29T10:01:53.520Z] [INFO] [app] Starting sync cycle {}

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > syncOnce > should emit operation:failed event for failed operations
[2026-04-29T10:01:53.520Z] [INFO] [app] Processing operations via batch sync { count: 1 }

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > syncOnce > should emit operation:failed event for failed operations
[2026-04-29T10:01:53.520Z] [INFO] [app] Sync complete { succeeded: 0, failed: 1 }

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > syncOnce > should emit sync:error event on error
[2026-04-29T10:01:53.521Z] [INFO] [app] Starting sync cycle {}

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > syncOnce > should emit sync:error event on error
Error: 39m[2026-04-29T10:01:53.521Z] [ERROR] [app] Sync error { error: 'Database error' }

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > syncOnce > should call onSyncProgress callback
[2026-04-29T10:01:53.525Z] [INFO] [app] Starting sync cycle {}

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > syncOnce > should call onSyncProgress callback
[2026-04-29T10:01:53.525Z] [INFO] [app] Sync complete { succeeded: 0, failed: 0 }

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > batch sync > should send batch sync request to /api/sync
[2026-04-29T10:01:53.526Z] [INFO] [app] Starting sync cycle {}

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > batch sync > should send batch sync request to /api/sync
[2026-04-29T10:01:53.526Z] [INFO] [app] Processing operations via batch sync { count: 2 }

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > batch sync > should send batch sync request to /api/sync
[2026-04-29T10:01:53.526Z] [INFO] [app] Sync complete { succeeded: 2, failed: 0 }

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > batch sync > should fall back to individual operations on batch failure
[2026-04-29T10:01:53.528Z] [INFO] [app] Starting sync cycle {}

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > batch sync > should fall back to individual operations on batch failure
[2026-04-29T10:01:53.528Z] [INFO] [app] Processing operations via batch sync { count: 1 }

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > batch sync > should fall back to individual operations on batch failure
[2026-04-29T10:01:53.528Z] [INFO] [app] Batch sync failed, falling back to individual operations {}

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > batch sync > should fall back to individual operations on batch failure
[2026-04-29T10:01:53.528Z] [INFO] [app] Sync complete { succeeded: 1, failed: 0 }

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > batch sync > should handle invalid JSON payload gracefully
[2026-04-29T10:01:53.530Z] [INFO] [app] Starting sync cycle {}

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > batch sync > should handle invalid JSON payload gracefully
[2026-04-29T10:01:53.530Z] [INFO] [app] Processing operations via batch sync { count: 1 }

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > batch sync > should handle invalid JSON payload gracefully
[2026-04-29T10:01:53.530Z] [INFO] [app] Sync complete { succeeded: 1, failed: 0 }

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > individual sync operations > should handle unknown table gracefully
[2026-04-29T10:01:53.531Z] [INFO] [app] Starting sync cycle {}

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > individual sync operations > should handle unknown table gracefully
[2026-04-29T10:01:53.531Z] [INFO] [app] Processing operations via batch sync { count: 1 }

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > individual sync operations > should handle unknown table gracefully
[2026-04-29T10:01:53.531Z] [INFO] [app] Sync complete { succeeded: 0, failed: 1 }

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > retry logic > should mark operation as failed after max retries
[2026-04-29T10:01:53.535Z] [INFO] [app] Starting sync cycle {}

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > retry logic > should mark operation as failed after max retries
[2026-04-29T10:01:53.535Z] [INFO] [app] Processing operations via batch sync { count: 1 }

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > retry logic > should mark operation as failed after max retries
[2026-04-29T10:01:53.535Z] [INFO] [app] Sync complete { succeeded: 0, failed: 1 }

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > retry logic > should not mark as failed if under max retries
[2026-04-29T10:01:53.536Z] [INFO] [app] Starting sync cycle {}

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > retry logic > should not mark as failed if under max retries
[2026-04-29T10:01:53.536Z] [INFO] [app] Processing operations via batch sync { count: 1 }

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > retry logic > should not mark as failed if under max retries
[2026-04-29T10:01:53.536Z] [INFO] [app] Sync complete { succeeded: 0, failed: 1 }

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > event emission > should emit all expected events during successful sync
[2026-04-29T10:01:53.537Z] [INFO] [app] Starting sync cycle {}

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > event emission > should emit all expected events during successful sync
[2026-04-29T10:01:53.537Z] [INFO] [app] Processing operations via batch sync { count: 1 }

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > event emission > should emit all expected events during successful sync
[2026-04-29T10:01:53.537Z] [INFO] [app] Sync complete { succeeded: 1, failed: 0 }

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > conflict detection > should detect conflict from batch sync response
[2026-04-29T10:01:53.539Z] [INFO] [app] Starting sync cycle {}

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > conflict detection > should detect conflict from batch sync response
[2026-04-29T10:01:53.539Z] [INFO] [app] Processing operations via batch sync { count: 1 }

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > conflict detection > should detect conflict from batch sync response
[2026-04-29T10:01:53.539Z] [INFO] [app] Sync complete { succeeded: 0, failed: 1 }

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > conflict detection > should detect conflict from HTTP 409 response
[2026-04-29T10:01:53.540Z] [INFO] [app] Starting sync cycle {}

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > conflict detection > should detect conflict from HTTP 409 response
[2026-04-29T10:01:53.540Z] [INFO] [app] Processing operations via batch sync { count: 1 }

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > conflict detection > should detect conflict from HTTP 409 response
[2026-04-29T10:01:53.540Z] [INFO] [app] Batch sync failed, falling back to individual operations {}

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > conflict detection > should detect conflict from HTTP 409 response
[2026-04-29T10:01:53.540Z] [INFO] [app] Sync complete { succeeded: 0, failed: 1 }

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > conflict detection > should include conflictsDetected in sync:complete event
[2026-04-29T10:01:53.541Z] [INFO] [app] Starting sync cycle {}

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > conflict detection > should include conflictsDetected in sync:complete event
[2026-04-29T10:01:53.541Z] [INFO] [app] Processing operations via batch sync { count: 1 }

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > conflict detection > should include conflictsDetected in sync:complete event
[2026-04-29T10:01:53.541Z] [INFO] [app] Sync complete { succeeded: 0, failed: 1 }

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > conflict detection > should call reconcileWithServer after successful individual sync
[2026-04-29T10:01:53.543Z] [INFO] [app] Starting sync cycle {}

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > conflict detection > should call reconcileWithServer after successful individual sync
[2026-04-29T10:01:53.543Z] [INFO] [app] Processing operations via batch sync { count: 1 }

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > conflict detection > should call reconcileWithServer after successful individual sync
[2026-04-29T10:01:53.543Z] [INFO] [app] Batch sync failed, falling back to individual operations {}

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > conflict detection > should call reconcileWithServer after successful individual sync
[2026-04-29T10:01:53.543Z] [INFO] [app] Sync complete { succeeded: 1, failed: 0 }

stderr | src/lib/sync/**tests**/syncWorker.test.ts > Global sync worker functions > should start global sync worker
[2026-04-29T10:01:53.544Z] [INFO] [app] Starting sync cycle {}
[2026-04-29T10:01:53.545Z] [INFO] [app] SyncWorker started {}
[2026-04-29T10:01:53.545Z] [INFO] [app] SyncWorker stopped {}
[2026-04-29T10:01:53.545Z] [INFO] [app] Processing operations via batch sync { count: 1 }

stderr | src/lib/sync/**tests**/syncWorker.test.ts > Global sync worker functions > should start global sync worker
[2026-04-29T10:01:53.545Z] [INFO] [app] Sync complete { succeeded: 0, failed: 1 }

stderr | src/lib/sync/**tests**/syncWorker.test.ts > Global sync worker functions > should stop global sync worker
[2026-04-29T10:01:53.545Z] [INFO] [app] Starting sync cycle {}
[2026-04-29T10:01:53.545Z] [INFO] [app] SyncWorker started {}
[2026-04-29T10:01:53.545Z] [INFO] [app] SyncWorker stopped {}
[2026-04-29T10:01:53.545Z] [INFO] [app] Processing operations via batch sync { count: 1 }

stderr | src/lib/sync/**tests**/syncWorker.test.ts > Global sync worker functions > should stop global sync worker
[2026-04-29T10:01:53.545Z] [INFO] [app] Sync complete { succeeded: 0, failed: 1 }

stderr | src/lib/sync/**tests**/syncWorker.test.ts > Global sync worker functions > should trigger manual sync
[2026-04-29T10:01:53.546Z] [INFO] [app] Starting sync cycle {}

stderr | src/lib/sync/**tests**/syncWorker.test.ts > Global sync worker functions > should trigger manual sync
[2026-04-29T10:01:53.546Z] [INFO] [app] Processing operations via batch sync { count: 1 }

stderr | src/lib/sync/**tests**/syncWorker.test.ts > Global sync worker functions > should trigger manual sync
[2026-04-29T10:01:53.546Z] [INFO] [app] Sync complete { succeeded: 0, failed: 1 }

✓ src/lib/sync/**tests**/syncWorker.test.ts (34 tests) 55ms
✓ src/lib/monitoring/**tests**/metrics.test.ts (66 tests) 47ms
stderr | src/features/kds/hooks/**tests**/useKDSRealtime.test.ts > useKDSRealtime > should create channel when enabled
[KDS Realtime] Subscription status: SUBSCRIBED

stderr | src/features/kds/hooks/**tests**/useKDSRealtime.test.ts > useKDSRealtime > should subscribe to orders and external_orders tables
[KDS Realtime] Subscription status: SUBSCRIBED

stderr | src/features/kds/hooks/**tests**/useKDSRealtime.test.ts > useKDSRealtime > should call onNewOrder callback for INSERT events
[KDS Realtime] Subscription status: SUBSCRIBED

stderr | src/features/kds/hooks/**tests**/useKDSRealtime.test.ts > useKDSRealtime > should call onOrderUpdate callback for UPDATE events
[KDS Realtime] Subscription status: SUBSCRIBED

stderr | src/features/kds/hooks/**tests**/useKDSRealtime.test.ts > useKDSRealtime > should call onOrderDelete callback for DELETE events
[KDS Realtime] Subscription status: SUBSCRIBED

stderr | src/features/kds/hooks/**tests**/useKDSRealtime.test.ts > useKDSRealtime > should filter orders by restaurant_id
[KDS Realtime] Subscription status: SUBSCRIBED

stderr | src/features/kds/hooks/**tests**/useKDSRealtime.test.ts > MessageDeduplicator > should detect duplicate messages within dedup window via hook
[KDS Realtime] Subscription status: SUBSCRIBED

stderr | src/features/kds/hooks/**tests**/useKDSRealtime.test.ts > MessageDeduplicator > should detect duplicate messages within dedup window via hook
[KDS Realtime] Skipping duplicate message: orders:INSERT:order-dup-test

stderr | src/features/kds/hooks/**tests**/useKDSRealtime.test.ts > Reconnection behavior > should track reconnection status
[KDS Realtime] Subscription status: SUBSCRIBED

stderr | src/features/kds/hooks/**tests**/useKDSRealtime.test.ts > Reconnection behavior > should expose isConnected state
[KDS Realtime] Subscription status: SUBSCRIBED

stderr | src/features/kds/hooks/**tests**/useKDSRealtime.test.ts > External orders handling > should subscribe to external_orders table
[KDS Realtime] Subscription status: SUBSCRIBED

stderr | src/features/kds/hooks/**tests**/useKDSRealtime.test.ts > External orders handling > should handle INSERT events for external orders
[KDS Realtime] Subscription status: SUBSCRIBED

stderr | src/features/kds/hooks/**tests**/useKDSRealtime.test.ts > External orders handling > should filter external orders by restaurant_id
[KDS Realtime] Subscription status: SUBSCRIBED

stderr | src/features/kds/hooks/**tests**/useKDSRealtime.test.ts > Channel lifecycle > should handle channel subscription errors
[KDS Realtime] Subscription status: CHANNEL_ERROR
[KDS Realtime] Scheduling reconnect attempt 1/5 in 1206ms

stderr | src/features/kds/hooks/**tests**/useKDSRealtime.test.ts > Channel lifecycle > should handle enabled/disabled toggling
[KDS Realtime] Subscription status: SUBSCRIBED

stderr | src/features/kds/hooks/**tests**/useKDSRealtime.test.ts > External orders event handling > should call onNewOrder for external orders INSERT with delivery type
[KDS Realtime] Subscription status: SUBSCRIBED

stderr | src/features/kds/hooks/**tests**/useKDSRealtime.test.ts > External orders event handling > should call onNewOrder for external orders INSERT with pickup type
[KDS Realtime] Subscription status: SUBSCRIBED

stderr | src/features/kds/hooks/**tests**/useKDSRealtime.test.ts > External orders event handling > should call onOrderUpdate for external orders UPDATE events
[KDS Realtime] Subscription status: SUBSCRIBED

stderr | src/features/kds/hooks/**tests**/useKDSRealtime.test.ts > External orders event handling > should filter external orders by restaurant_id
[KDS Realtime] Subscription status: SUBSCRIBED

stderr | src/features/kds/hooks/**tests**/useKDSRealtime.test.ts > Reconnection with exponential backoff > should set isConnected to false on CHANNEL_ERROR
[KDS Realtime] Subscription status: CHANNEL_ERROR
[KDS Realtime] Scheduling reconnect attempt 1/5 in 1111ms

stderr | src/features/kds/hooks/**tests**/useKDSRealtime.test.ts > Reconnection with exponential backoff > should set isConnected to false on CLOSED status
[KDS Realtime] Subscription status: CLOSED
[KDS Realtime] Scheduling reconnect attempt 1/5 in 1154ms

stderr | src/features/kds/hooks/**tests**/useKDSRealtime.test.ts > Reconnection with exponential backoff > should set isConnected to false on TIMED_OUT status
[KDS Realtime] Subscription status: TIMED_OUT
[KDS Realtime] Scheduling reconnect attempt 1/5 in 1026ms

stderr | src/features/kds/hooks/**tests**/useKDSRealtime.test.ts > Reconnection with exponential backoff > should set isConnected to true on SUBSCRIBED status
[KDS Realtime] Subscription status: SUBSCRIBED

stderr | src/lib/supabase/**tests**/service-role.integration.test.ts > service-role integration tests > createServiceRoleClient > should throw when SUPABASE_SECRET_KEY is missing
CRITICAL ERROR: Supabase Administrative configuration missing.
NEXT_PUBLIC_SUPABASE_URL: Set
Administrative Key (Secret/Service): Missing
Full Environment Keys: [
'NEXT_PUBLIC_SUPABASE_URL',
'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY'
]

stderr | src/lib/supabase/**tests**/service-role.integration.test.ts > service-role integration tests > error handling > should handle missing environment variables during client creation
CRITICAL ERROR: Supabase Administrative configuration missing.
NEXT_PUBLIC_SUPABASE_URL: Missing
Administrative Key (Secret/Service): Missing
Full Environment Keys: [ 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY' ]

stderr | src/features/kds/hooks/**tests**/useKDSRealtime.test.ts > Channel cleanup on unmount > should handle unmount without errors
[KDS Realtime] Subscription status: SUBSCRIBED

✓ src/lib/graphql/**tests**/n-plus-one-detection.test.ts (11 tests) 11ms
✓ src/lib/supabase/**tests**/service-role.integration.test.ts (38 tests) 39ms
✓ src/features/kds/hooks/**tests**/useKDSRealtime.test.ts (43 tests) 969ms
✓ src/lib/payments/**tests**/chapa.test.ts (39 tests) 18ms
✓ src/lib/sync/**tests**/kdsSync.test.ts (32 tests) 83ms
✓ src/lib/sync/**tests**/orderSync.test.ts (26 tests) 86ms
stderr | src/lib/services/**tests**/orderService.integration.test.ts > orderService integration tests > checkRateLimit > should fail open when rate limit check fails
✓ src/domains/orders/**tests**/repository.test.ts (37 tests) 87ms
[RateLimit] Failed to check: { message: 'Error' }

stderr | src/lib/services/**tests**/orderService.integration.test.ts > orderService integration tests > checkDuplicateOrder > should return null on database error
[OrderService] Failed to check duplicate: { message: 'Error' }

stderr | src/lib/services/**tests**/orderService.integration.test.ts > orderService integration tests > createOrder > should fail when insert fails
[OrderService] Failed to create order: { message: 'Insert failed' }

✓ src/lib/services/**tests**/orderService.integration.test.ts (22 tests) 39ms
✓ src/lib/validators/**tests**/graphql.test.ts (55 tests) 33ms
stderr | src/domains/menu/**tests**/repository.test.ts > MenuRepository > getMenuItems > should throw error on database failure
[menu/repository] Error fetching menu items: Error: Database error
at /home/runner/work/lole/lole/src/domains/menu/**tests**/repository.test.ts:124:29
at file:///home/runner/work/lole/lole/node*modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:145:11
at file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:915:26
at file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1243:20
at new Promise (<anonymous>)
at runWithTimeout (file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1209:10)
at file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1653:37
at Traces.$ (file:///home/runner/work/lole/lole/node_modules/.pnpm/vitest@4.0.18*@opentelemetry+api@1.9.0_@types+node@20.19.33_jiti@2.6.1_jsdom@28.1.0_lig_109b2b7b0f8561f79b9dce3a2356b642/node*modules/vitest/dist/chunks/traces.CCmnQaNT.js:142:27)
at trace (file:///home/runner/work/lole/lole/node_modules/.pnpm/vitest@4.0.18*@opentelemetry+api@1.9.0_@types+node@20.19.33_jiti@2.6.1_jsdom@28.1.0_lig_109b2b7b0f8561f79b9dce3a2356b642/node_modules/vitest/dist/chunks/test.B8ej_ZHS.js:239:21)
at runTest (file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1653:12)

stderr | src/domains/menu/**tests**/repository.test.ts > MenuRepository > getMenuItem > should throw error on database failure
[menu/repository] Error fetching menu item: Error: DB error
at /home/runner/work/lole/lole/src/domains/menu/**tests**/repository.test.ts:176:29
at file:///home/runner/work/lole/lole/node*modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:145:11
at file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:915:26
at file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1243:20
at new Promise (<anonymous>)
at runWithTimeout (file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1209:10)
at file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1653:37
at Traces.$ (file:///home/runner/work/lole/lole/node_modules/.pnpm/vitest@4.0.18*@opentelemetry+api@1.9.0_@types+node@20.19.33_jiti@2.6.1_jsdom@28.1.0_lig_109b2b7b0f8561f79b9dce3a2356b642/node*modules/vitest/dist/chunks/traces.CCmnQaNT.js:142:27)
at trace (file:///home/runner/work/lole/lole/node_modules/.pnpm/vitest@4.0.18*@opentelemetry+api@1.9.0_@types+node@20.19.33_jiti@2.6.1_jsdom@28.1.0_lig_109b2b7b0f8561f79b9dce3a2356b642/node_modules/vitest/dist/chunks/test.B8ej_ZHS.js:239:21)
at runTest (file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1653:12) {
code: 'OTHER_ERROR'
}

stderr | src/domains/menu/**tests**/repository.test.ts > MenuRepository > getMenuCategories > should throw error on database failure
[menu/repository] Error fetching categories: Error: DB error
at /home/runner/work/lole/lole/src/domains/menu/**tests**/repository.test.ts:207:29
at file:///home/runner/work/lole/lole/node*modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:145:11
at file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:915:26
at file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1243:20
at new Promise (<anonymous>)
at runWithTimeout (file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1209:10)
at file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1653:37
at Traces.$ (file:///home/runner/work/lole/lole/node_modules/.pnpm/vitest@4.0.18*@opentelemetry+api@1.9.0_@types+node@20.19.33_jiti@2.6.1_jsdom@28.1.0_lig_109b2b7b0f8561f79b9dce3a2356b642/node*modules/vitest/dist/chunks/traces.CCmnQaNT.js:142:27)
at trace (file:///home/runner/work/lole/lole/node_modules/.pnpm/vitest@4.0.18*@opentelemetry+api@1.9.0_@types+node@20.19.33_jiti@2.6.1_jsdom@28.1.0_lig_109b2b7b0f8561f79b9dce3a2356b642/node_modules/vitest/dist/chunks/test.B8ej_ZHS.js:239:21)
at runTest (file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1653:12)

stderr | src/domains/menu/**tests**/repository.test.ts > MenuRepository > getModifierGroups > should throw error on database failure
[menu/repository] Error fetching modifier groups: Error: DB error
at /home/runner/work/lole/lole/src/domains/menu/**tests**/repository.test.ts:246:29
at file:///home/runner/work/lole/lole/node*modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:145:11
at file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:915:26
at file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1243:20
at new Promise (<anonymous>)
at runWithTimeout (file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1209:10)
at file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1653:37
at Traces.$ (file:///home/runner/work/lole/lole/node_modules/.pnpm/vitest@4.0.18*@opentelemetry+api@1.9.0_@types+node@20.19.33_jiti@2.6.1_jsdom@28.1.0_lig_109b2b7b0f8561f79b9dce3a2356b642/node*modules/vitest/dist/chunks/traces.CCmnQaNT.js:142:27)
at trace (file:///home/runner/work/lole/lole/node_modules/.pnpm/vitest@4.0.18*@opentelemetry+api@1.9.0_@types+node@20.19.33_jiti@2.6.1_jsdom@28.1.0_lig_109b2b7b0f8561f79b9dce3a2356b642/node_modules/vitest/dist/chunks/test.B8ej_ZHS.js:239:21)
at runTest (file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1653:12)

stderr | src/domains/menu/**tests**/repository.test.ts > MenuRepository > getModifierOptions > should throw error on database failure
[menu/repository] Error fetching modifier options: Error: DB error
at /home/runner/work/lole/lole/src/domains/menu/**tests**/repository.test.ts:274:29
at file:///home/runner/work/lole/lole/node*modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:145:11
at file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:915:26
at file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1243:20
at new Promise (<anonymous>)
at runWithTimeout (file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1209:10)
at file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1653:37
at Traces.$ (file:///home/runner/work/lole/lole/node_modules/.pnpm/vitest@4.0.18*@opentelemetry+api@1.9.0_@types+node@20.19.33_jiti@2.6.1_jsdom@28.1.0_lig_109b2b7b0f8561f79b9dce3a2356b642/node*modules/vitest/dist/chunks/traces.CCmnQaNT.js:142:27)
at trace (file:///home/runner/work/lole/lole/node_modules/.pnpm/vitest@4.0.18*@opentelemetry+api@1.9.0_@types+node@20.19.33_jiti@2.6.1_jsdom@28.1.0_lig_109b2b7b0f8561f79b9dce3a2356b642/node_modules/vitest/dist/chunks/test.B8ej_ZHS.js:239:21)
at runTest (file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1653:12)

stderr | src/domains/menu/**tests**/repository.test.ts > MenuRepository > getMenuItemsByIds > should throw error on database failure
[menu/repository] Error fetching menu items by IDs: Error: DB error
at /home/runner/work/lole/lole/src/domains/menu/**tests**/repository.test.ts:312:29
at file:///home/runner/work/lole/lole/node*modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:145:11
at file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:915:26
at file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1243:20
at new Promise (<anonymous>)
at runWithTimeout (file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1209:10)
at file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1653:37
at Traces.$ (file:///home/runner/work/lole/lole/node_modules/.pnpm/vitest@4.0.18*@opentelemetry+api@1.9.0_@types+node@20.19.33_jiti@2.6.1_jsdom@28.1.0_lig_109b2b7b0f8561f79b9dce3a2356b642/node*modules/vitest/dist/chunks/traces.CCmnQaNT.js:142:27)
at trace (file:///home/runner/work/lole/lole/node_modules/.pnpm/vitest@4.0.18*@opentelemetry+api@1.9.0_@types+node@20.19.33_jiti@2.6.1_jsdom@28.1.0_lig_109b2b7b0f8561f79b9dce3a2356b642/node_modules/vitest/dist/chunks/test.B8ej_ZHS.js:239:21)
at runTest (file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1653:12)

stderr | src/domains/menu/**tests**/repository.test.ts > MenuRepository > getModifierGroupsByMenuItemIds > should throw error on database failure
[menu/repository] Error fetching modifier groups by menu item IDs: Error: DB error
at /home/runner/work/lole/lole/src/domains/menu/**tests**/repository.test.ts:348:29
at file:///home/runner/work/lole/lole/node*modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:145:11
at file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:915:26
at file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1243:20
at new Promise (<anonymous>)
at runWithTimeout (file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1209:10)
at file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1653:37
at Traces.$ (file:///home/runner/work/lole/lole/node_modules/.pnpm/vitest@4.0.18*@opentelemetry+api@1.9.0_@types+node@20.19.33_jiti@2.6.1_jsdom@28.1.0_lig_109b2b7b0f8561f79b9dce3a2356b642/node*modules/vitest/dist/chunks/traces.CCmnQaNT.js:142:27)
at trace (file:///home/runner/work/lole/lole/node_modules/.pnpm/vitest@4.0.18*@opentelemetry+api@1.9.0_@types+node@20.19.33_jiti@2.6.1_jsdom@28.1.0_lig_109b2b7b0f8561f79b9dce3a2356b642/node_modules/vitest/dist/chunks/test.B8ej_ZHS.js:239:21)
at runTest (file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1653:12)

stderr | src/domains/menu/**tests**/repository.test.ts > MenuRepository > getModifierOptionsByGroupIds > should throw error on database failure
[menu/repository] Error fetching modifier options by group IDs: Error: DB error
at /home/runner/work/lole/lole/src/domains/menu/**tests**/repository.test.ts:384:29
at file:///home/runner/work/lole/lole/node*modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:145:11
at file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:915:26
at file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1243:20
at new Promise (<anonymous>)
at runWithTimeout (file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1209:10)
at file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1653:37
at Traces.$ (file:///home/runner/work/lole/lole/node_modules/.pnpm/vitest@4.0.18*@opentelemetry+api@1.9.0_@types+node@20.19.33_jiti@2.6.1_jsdom@28.1.0_lig_109b2b7b0f8561f79b9dce3a2356b642/node*modules/vitest/dist/chunks/traces.CCmnQaNT.js:142:27)
at trace (file:///home/runner/work/lole/lole/node_modules/.pnpm/vitest@4.0.18*@opentelemetry+api@1.9.0_@types+node@20.19.33_jiti@2.6.1_jsdom@28.1.0_lig_109b2b7b0f8561f79b9dce3a2356b642/node_modules/vitest/dist/chunks/test.B8ej_ZHS.js:239:21)
at runTest (file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1653:12)

stderr | src/domains/menu/**tests**/repository.test.ts > MenuRepository > getCategoriesByIds > should throw error on database failure
[menu/repository] Error fetching categories by IDs: Error: DB error
at /home/runner/work/lole/lole/src/domains/menu/**tests**/repository.test.ts:419:29
at file:///home/runner/work/lole/lole/node*modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:145:11
at file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:915:26
at file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1243:20
at new Promise (<anonymous>)
at runWithTimeout (file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1209:10)
at file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1653:37
at Traces.$ (file:///home/runner/work/lole/lole/node_modules/.pnpm/vitest@4.0.18*@opentelemetry+api@1.9.0_@types+node@20.19.33_jiti@2.6.1_jsdom@28.1.0_lig_109b2b7b0f8561f79b9dce3a2356b642/node*modules/vitest/dist/chunks/traces.CCmnQaNT.js:142:27)
at trace (file:///home/runner/work/lole/lole/node_modules/.pnpm/vitest@4.0.18*@opentelemetry+api@1.9.0_@types+node@20.19.33_jiti@2.6.1_jsdom@28.1.0_lig_109b2b7b0f8561f79b9dce3a2356b642/node_modules/vitest/dist/chunks/test.B8ej_ZHS.js:239:21)
at runTest (file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1653:12)

stderr | src/domains/menu/**tests**/repository.test.ts > MenuRepository > getModifierGroupsByIds > should throw error on database failure
[menu/repository] Error fetching modifier groups by IDs: Error: DB error
at /home/runner/work/lole/lole/src/domains/menu/**tests**/repository.test.ts:454:29
at file:///home/runner/work/lole/lole/node*modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:145:11
at file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:915:26
at file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1243:20
at new Promise (<anonymous>)
at runWithTimeout (file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1209:10)
at file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1653:37
at Traces.$ (file:///home/runner/work/lole/lole/node_modules/.pnpm/vitest@4.0.18*@opentelemetry+api@1.9.0_@types+node@20.19.33_jiti@2.6.1_jsdom@28.1.0_lig_109b2b7b0f8561f79b9dce3a2356b642/node*modules/vitest/dist/chunks/traces.CCmnQaNT.js:142:27)
at trace (file:///home/runner/work/lole/lole/node_modules/.pnpm/vitest@4.0.18*@opentelemetry+api@1.9.0_@types+node@20.19.33_jiti@2.6.1_jsdom@28.1.0_lig_109b2b7b0f8561f79b9dce3a2356b642/node_modules/vitest/dist/chunks/test.B8ej_ZHS.js:239:21)
at runTest (file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1653:12)

stderr | src/domains/menu/**tests**/repository.test.ts > MenuRepository > getModifierOptionsByIds > should throw error on database failure
[menu/repository] Error fetching modifier options by IDs: Error: DB error
at /home/runner/work/lole/lole/src/domains/menu/**tests**/repository.test.ts:489:29
at file:///home/runner/work/lole/lole/node*modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:145:11
at file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:915:26
at file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1243:20
at new Promise (<anonymous>)
at runWithTimeout (file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1209:10)
at file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1653:37
at Traces.$ (file:///home/runner/work/lole/lole/node_modules/.pnpm/vitest@4.0.18*@opentelemetry+api@1.9.0_@types+node@20.19.33_jiti@2.6.1_jsdom@28.1.0_lig_109b2b7b0f8561f79b9dce3a2356b642/node*modules/vitest/dist/chunks/traces.CCmnQaNT.js:142:27)
at trace (file:///home/runner/work/lole/lole/node_modules/.pnpm/vitest@4.0.18*@opentelemetry+api@1.9.0_@types+node@20.19.33_jiti@2.6.1_jsdom@28.1.0_lig_109b2b7b0f8561f79b9dce3a2356b642/node_modules/vitest/dist/chunks/test.B8ej_ZHS.js:239:21)
at runTest (file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1653:12)

stderr | src/lib/payments/**tests**/telebirr.test.ts > verifyTelebirrWebhookSignature > should return false when app key is missing
[Telebirr] Missing app key for webhook verification

stderr | src/lib/payments/**tests**/telebirr.test.ts > verifyTelebirrWebhookSignature > should return false when payload is invalid JSON
✓ src/domains/menu/**tests**/repository.test.ts (36 tests) 57ms
[Telebirr] Webhook signature verification failed: SyntaxError: Unexpected token 'o', "not valid json" is not valid JSON
at JSON.parse (<anonymous>)
at verifyTelebirrWebhookSignature (/home/runner/work/lole/lole/src/lib/payments/telebirr.ts:137:29)
at /home/runner/work/lole/lole/src/lib/payments/**tests**/telebirr.test.ts:463:24
at file:///home/runner/work/lole/lole/node*modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:145:11
at file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:915:26
at file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1243:20
at new Promise (<anonymous>)
at runWithTimeout (file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1209:10)
at file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1653:37
at Traces.$ (file:///home/runner/work/lole/lole/node_modules/.pnpm/vitest@4.0.18*@opentelemetry+api@1.9.0_@types+node@20.19.33_jiti@2.6.1_jsdom@28.1.0_lig_109b2b7b0f8561f79b9dce3a2356b642/node_modules/vitest/dist/chunks/traces.CCmnQaNT.js:142:27)

stderr | src/lib/payments/**tests**/telebirr.test.ts > verifyTelebirrWebhookSignature > should return false when signature is missing in payload
[Telebirr] No signature in webhook payload

✓ src/lib/payments/**tests**/telebirr.test.ts (34 tests) 48ms
✓ src/lib/printer/**tests**/transaction-print.test.ts (30 tests) 18ms
✓ src/lib/printer/**tests**/escpos.test.ts (39 tests) 22ms
stderr | src/lib/notifications/**tests**/sms.test.ts > SMS notifications > sendSms with log provider > should return success with log provider by default
[SMS:log] { toPhone: '+251911123456', message: 'Test message' }

stderr | src/lib/notifications/**tests**/sms.test.ts > SMS notifications > sendOrderStatusSms > should build preparing message and send
[SMS:log] {
toPhone: '+251911123456',
message: 'lole: Order ORD-001 is now being prepared.'
}

stderr | src/lib/notifications/**tests**/sms.test.ts > SMS notifications > sendOrderStatusSms > should build ready message and send
[SMS:log] {
toPhone: '+251911123456',
message: 'lole: Order ORD-001 is ready for pickup/service.'
}

stderr | src/lib/notifications/**tests**/sms.test.ts > SMS notifications > sendOrderStatusSms > should build served message and send
[SMS:log] {
toPhone: '+251911123456',
message: 'lole: Order ORD-001 has been completed. Thank you.'
}

stderr | src/lib/notifications/**tests**/sms.test.ts > SMS notifications > sendOrderStatusSms > should build completed message and send
[SMS:log] {
toPhone: '+251911123456',
message: 'lole: Order ORD-001 has been completed. Thank you.'
}

stderr | src/lib/notifications/**tests**/sms.test.ts > SMS notifications > sendOrderStatusSms > should build cancelled message and send
[SMS:log] {
toPhone: '+251911123456',
message: 'lole: Order ORD-001 was cancelled.'
}

stderr | src/lib/notifications/**tests**/sms.test.ts > SMS notifications > sendOrderStatusSms > should build default message for unknown status
[SMS:log] {
toPhone: '+251911123456',
message: 'lole: Order ORD-001 status is now pending.'
}

stderr | src/lib/notifications/**tests**/sms.test.ts > SMS notifications > resolveSmsProvider > should default to log provider for unknown provider name
[SMS:log] { toPhone: '+251911123456', message: 'Test' }

✓ src/lib/notifications/**tests**/sms.test.ts (27 tests) 34ms
✓ src/lib/**tests**/rate-limit.test.ts (20 tests) 37ms
✓ src/lib/errors/**tests**/sanitize.test.ts (47 tests) 27ms
✓ src/lib/offlineQueue.test.ts (21 tests) 105ms
✓ src/lib/fiscal/**tests**/mor-client.test.ts (20 tests) 28ms
✓ src/lib/devices/**tests**/schema-compat.test.ts (50 tests) 15ms
stderr | src/lib/services/**tests**/chapaService.test.ts > chapaService > listChapaBanks > returns normalized and sorted list of banks
Fetching banks from Chapa API...

stderr | src/lib/services/**tests**/chapaService.test.ts > chapaService > listChapaBanks > returns normalized and sorted list of banks
Chapa banks API response: {
status: 200,
ok: true,
payloadStatus: 'success',
payloadMessage: 'Banks retrieved',
dataLength: 3
}
Parsed 3 valid banks from Chapa response

stderr | src/lib/services/**tests**/chapaService.test.ts > chapaService > listChapaBanks > filters out banks without id or name
Fetching banks from Chapa API...

stderr | src/lib/services/**tests**/chapaService.test.ts > chapaService > listChapaBanks > filters out banks without id or name
Chapa banks API response: {
status: 200,
ok: true,
payloadStatus: 'success',
payloadMessage: undefined,
dataLength: 3
}
Parsed 1 valid banks from Chapa response

stderr | src/lib/services/**tests**/chapaService.test.ts > chapaService > listChapaBanks > throws when response is not ok
Fetching banks from Chapa API...

stderr | src/lib/services/**tests**/chapaService.test.ts > chapaService > listChapaBanks > throws when response is not ok
Chapa banks API response: {
status: 401,
ok: false,
payloadStatus: undefined,
payloadMessage: 'Unauthorized',
dataLength: 0
}
Chapa banks API error: Unauthorized

stderr | src/lib/services/**tests**/chapaService.test.ts > chapaService > listChapaBanks > throws when data is not an array
Fetching banks from Chapa API...

stderr | src/lib/services/**tests**/chapaService.test.ts > chapaService > listChapaBanks > throws when data is not an array
Chapa banks API response: {
status: 200,
ok: true,
payloadStatus: 'success',
payloadMessage: undefined,
dataLength: 0
}
Chapa banks API error: Failed to load Chapa banks (status: 200)

stderr | src/lib/services/**tests**/chapaService.test.ts > chapaService > createChapaSubaccount > returns success response with subaccount id
Creating Chapa subaccount with params: {
business_name: 'Test Restaurant',
account_name: 'Abebe Kebede',
bank_code: 'AB',
split_type: 'percentage',
split_value: 3
}

stderr | src/lib/services/**tests**/chapaService.test.ts > chapaService > createChapaSubaccount > returns success response with subaccount id
Chapa subaccount API response: {
httpStatus: 200,
ok: true,
status: 'success',
message: 'Subaccount created',
dataId: 'sub-123',
fullData: { id: 'sub-123' }
}

stderr | src/lib/services/**tests**/chapaService.test.ts > chapaService > createChapaSubaccount > defaults status to failed when response is not ok
Creating Chapa subaccount with params: {
business_name: 'Test Restaurant',
account_name: 'Abebe Kebede',
bank_code: 'AB',
split_type: 'percentage',
split_value: 3
}

stderr | src/lib/services/**tests**/chapaService.test.ts > chapaService > createChapaSubaccount > defaults status to failed when response is not ok
Chapa subaccount API response: {
httpStatus: 422,
ok: false,
status: undefined,
message: 'Invalid account number',
dataId: undefined,
fullData: undefined
}

stderr | src/lib/services/**tests**/chapaService.test.ts > chapaService > createChapaSubaccount > uses ok status to infer success when status field missing
Creating Chapa subaccount with params: {
business_name: 'Test Restaurant',
account_name: 'Abebe Kebede',
bank_code: 'AB',
split_type: 'percentage',
split_value: 3
}

stderr | src/lib/services/**tests**/chapaService.test.ts > chapaService > createChapaSubaccount > uses ok status to infer success when status field missing
Chapa subaccount API response: {
httpStatus: 200,
ok: true,
status: undefined,
message: 'Created',
dataId: 'sub-456',
fullData: { id: 'sub-456' }
}

✓ src/lib/services/**tests**/chapaService.test.ts (29 tests) 46ms
✓ src/lib/payments/payment-sessions.test.ts (19 tests) 20ms
✓ src/lib/notifications/**tests**/deduplication.test.ts (46 tests) 22ms
stderr | src/lib/sync/**tests**/idempotency.test.ts > Idempotency Key Manager > queueSyncOperation > should return empty string when PowerSync is not available
[2026-04-29T10:02:04.133Z] [WARN] [app] [SyncQueue] PowerSync not initialized {}

✓ src/lib/sync/**tests**/idempotency.test.ts (24 tests) 188ms
✓ src/lib/graphql/**tests**/authz.test.ts (21 tests) 17ms
✓ src/lib/fiscal/**tests**/offline-queue.test.ts (19 tests) 24ms
✓ src/lib/api/**tests**/errors.test.ts (43 tests) 27ms
stderr | src/app/api/**tests**/staff-and-device-provisioning.route.test.ts > staff and device provisioning routes > POST /api/devices/provision returns a migration-specific error for terminal constraint mismatch
Error: 6-04-29T10:02:05.705Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: '83856524-91e4-4593-bbc1-0148239b8b83',
error: 'Terminal provisioning requires the latest database migration. Apply the new hardware device migration and try again.'
}

✓ src/app/api/**tests**/staff-and-device-provisioning.route.test.ts (5 tests) 37ms
stderr | src/lib/services/**tests**/orderService.test.ts > orderService > checkRateLimit > fails open when database errors
[RateLimit] Failed to check: { message: 'DB error' }

stderr | src/lib/services/**tests**/orderService.test.ts > orderService > checkDuplicateOrder > returns null when query errors
[OrderService] Failed to check duplicate: { message: 'DB error' }

✓ src/lib/services/**tests**/orderService.test.ts (20 tests) 19ms
✓ src/app/api/**tests**/payment-sessions.route.test.ts (2 tests) 21ms
✓ src/lib/discounts/service.test.ts (16 tests) 17ms
✓ src/lib/events/**tests**/contract.test.ts (15 tests) 12ms
✓ src/lib/validators/menu.test.ts (26 tests) 18ms
stderr | src/lib/security/securityEvents.test.ts > securityEvents > logSecurityEvent > does not throw when insert errors
Error: 39m[2026-04-29T10:02:08.240Z] [ERROR] [app] Failed to log security event { error: { message: 'DB fail' } }

stderr | src/lib/security/securityEvents.test.ts > securityEvents > logSecurityEvent > triggers alert for critical severity immediately
[2026-04-29T10:02:08.243Z] [WARN] [app] SECURITY ALERT: auth_failure [CRITICAL]
Restaurant: N/A
User: Anonymous
IP: 192.168.1.1
Occurrences: 1
Details: undefined {}

stderr | src/lib/security/securityEvents.test.ts > securityEvents > detectBruteForce > returns true when at or above threshold
[2026-04-29T10:02:08.246Z] [WARN] [app] SECURITY ALERT: brute_force_detected [HIGH]
Restaurant: N/A
User: user@example.com
IP: unknown
Occurrences: 5
Details: {"action":"login","attempt_count":5} {}

stderr | src/lib/security/securityEvents.test.ts > securityEvents > detectBruteForce > returns false on query error (fail open)
Error: 39m[2026-04-29T10:02:08.247Z] [ERROR] [app] Failed to check brute force { error: { message: 'Timeout' } }

stderr | src/lib/security/securityEvents.test.ts > securityEvents > checkTenantIsolation > returns invalid on database error
Error: 39m[2026-04-29T10:02:08.250Z] [ERROR] [app] Failed to check tenant isolation { error: { message: 'Query failed' } }

stderr | src/lib/security/securityEvents.test.ts > securityEvents > logInvalidSignatureAttempt > does not throw on logging failure
Error: 39m[2026-04-29T10:02:08.251Z] [ERROR] [app] Failed to log security event { error: { message: 'fail' } }

✓ src/lib/security/securityEvents.test.ts (16 tests) 23ms
✓ src/lib/devices/**tests**/config.test.ts (41 tests) 23ms
↓ src/lib/supabase/**tests**/view-security-invoker.test.ts (15 tests | 15 skipped)
stderr | src/app/api/**tests**/table-session-lifecycle.integration.test.ts > Table session lifecycle integration > rejects opening a table session when one is already open
Error: 6-04-29T10:02:09.583Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: '54774445-b5f6-47c0-9bd2-737f7b5e003c',
error: 'Table already has an open session'
}

stderr | src/app/api/**tests**/table-session-lifecycle.integration.test.ts > Table session lifecycle integration > rejects transfer when destination table already has open session
Error: 6-04-29T10:02:09.587Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: '98bde728-6782-4433-8eb0-8d1cfc60266e',
error: 'Destination table already has an open session'
}

✓ src/app/api/**tests**/table-session-lifecycle.integration.test.ts (3 tests) 26ms
✓ src/lib/**tests**/logger.test.ts (29 tests) 25ms
✓ src/lib/monitoring/alerts.test.ts (16 tests) 41ms
✓ src/lib/db/**tests**/repository-base.test.ts (30 tests) 33ms
✓ src/lib/validators/order.test.ts (25 tests) 13ms
✓ src/lib/payments/chapa.test.ts (18 tests) 18ms
stderr | src/app/api/**tests**/kds-api-routes.test.ts > KDS API routes > GET /api/kds/queue returns 401 when unauthorized
Error: 6-04-29T10:02:12.222Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: '2edd7450-0d09-4c13-ab72-3e5994c9eaf8',
error: 'Unauthorized'
}

stderr | src/app/api/**tests**/kds-api-routes.test.ts > KDS API routes > GET /api/kds/queue returns 400 for invalid query
Error: 6-04-29T10:02:12.237Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: '0d93f9a1-b74c-4d21-970c-cf6d95d63b33',
error: 'Invalid query params'
}

stderr | src/app/api/**tests**/kds-api-routes.test.ts > KDS API routes > POST /api/kds/items/:id/action returns 401 when unauthorized
Error: 6-04-29T10:02:12.247Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: 'c8a355e8-8565-44c3-ac99-25b49aeed358',
error: 'Unauthorized'
}

stderr | src/app/api/**tests**/kds-api-routes.test.ts > KDS API routes > POST /api/kds/items/:id/action returns 400 for invalid payload
Error: 6-04-29T10:02:12.250Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: '9570ac1f-0291-41f0-a45f-af9d49170a5b',
error: 'Invalid request payload'
}

stderr | src/app/api/**tests**/kds-api-routes.test.ts > KDS API routes > POST /api/kds/items/:id/action returns 400 for invalid idempotency key
Error: 6-04-29T10:02:12.251Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: 'ef9fd0a0-e41b-43ab-864a-811dbb3be09f',
error: 'Invalid idempotency key'
}

✓ src/app/api/**tests**/kds-api-routes.test.ts (7 tests) 34ms
✓ src/lib/format/**tests**/et.test.ts (40 tests) 39ms
stderr | src/lib/**tests**/audit.integration.test.ts > audit integration tests > logServiceRoleAudit > should handle Supabase insert errors gracefully
[AUDIT] Failed to write service role audit log: { message: 'Database error', code: 'INSERT_FAILED' }

stderr | src/lib/**tests**/audit.integration.test.ts > audit integration tests > logServiceRoleAudit > should handle missing configuration gracefully
[AUDIT] Missing Supabase configuration for audit logging

stderr | src/lib/**tests**/audit.integration.test.ts > audit integration tests > logServiceRoleAudit > should handle missing configuration gracefully
[AUDIT] Failed to write service role audit log: { message: 'Database error', code: 'INSERT_FAILED' }

stderr | src/lib/**tests**/audit.integration.test.ts > audit integration tests > logServiceRoleAudit > should handle exceptions without throwing
[AUDIT] Exception in service role audit logging: Error: Client initialization failed
at /home/runner/work/lole/lole/src/lib/**tests**/audit.integration.test.ts:166:23
at Mock (file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+spy@4.0.18/node_modules/@vitest/spy/dist/index.js:285:34)
at createAuditClient (/home/runner/work/lole/lole/src/lib/audit.ts:60:12)
at Module.logServiceRoleAudit (/home/runner/work/lole/lole/src/lib/audit.ts:94:26)
at /home/runner/work/lole/lole/src/lib/**tests**/audit.integration.test.ts:178:34
at file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:145:11
at file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:915:26
at file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1243:20
at new Promise (<anonymous>)
at runWithTimeout (file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1209:10)

✓ src/lib/**tests**/audit.integration.test.ts (13 tests) 31ms
✓ src/lib/sync/**tests**/sync-conflict-resolution.test.ts (15 tests) 127ms
✓ src/lib/monitoring/**tests**/prometheus.test.ts (20 tests) 10ms
stderr | src/lib/services/**tests**/offlineOrderThrottle.test.ts > offlineOrderThrottle > getEstimatedWaitTime > returns base time on database error
Failed to count active orders: Error: DB error
at Object.<anonymous> (/home/runner/work/lole/lole/src/lib/services/**tests**/offlineOrderThrottle.test.ts:259:70)
at Object.Mock (file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+spy@4.0.18/node_modules/@vitest/spy/dist/index.js:285:34)
at Module.getEstimatedWaitTime (/home/runner/work/lole/lole/src/lib/services/offlineOrderThrottle.ts:208:10)
at processTicksAndRejections (node:internal/process/task_queues:103:5)
at /home/runner/work/lole/lole/src/lib/services/**tests**/offlineOrderThrottle.test.ts:263:30
at file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:915:20

✓ src/lib/services/**tests**/offlineOrderThrottle.test.ts (11 tests) 19ms
stderr | src/lib/notifications/sms.test.ts > sms > sendSms - log provider (default) > succeeds with log provider when SMS_PROVIDER is not set
[SMS:log] { toPhone: '+251911234567', message: 'Test message' }

stderr | src/lib/notifications/sms.test.ts > sms > sendSms - log provider (default) > normalizes phone by stripping whitespace
[SMS:log] { toPhone: '+251911234567', message: 'Test message' }

stderr | src/lib/notifications/sms.test.ts > sms > sendOrderStatusSms > sends with "preparing" message
[SMS:log] {
✓ src/lib/notifications/sms.test.ts (17 tests) 17ms
toPhone: '+251911111111',
message: 'lole: Order ORD-001 is now being prepared.'
}

stderr | src/lib/notifications/sms.test.ts > sms > sendOrderStatusSms > sends with "ready" message
[SMS:log] {
toPhone: '+251911111111',
message: 'lole: Order ORD-002 is ready for pickup/service.'
}

stderr | src/lib/notifications/sms.test.ts > sms > sendOrderStatusSms > sends with "completed" message for served status
[SMS:log] {
toPhone: '+251911111111',
message: 'lole: Order ORD-003 has been completed. Thank you.'
}

stderr | src/lib/notifications/sms.test.ts > sms > sendOrderStatusSms > sends with "cancelled" message
[SMS:log] {
toPhone: '+251911111111',
message: 'lole: Order ORD-004 was cancelled.'
}

stderr | src/lib/notifications/sms.test.ts > sms > sendOrderStatusSms > sends with generic status message for unknown status
[SMS:log] {
toPhone: '+251911111111',
message: 'lole: Order ORD-005 status is now dispatched.'
}

✓ src/lib/sync/**tests**/printerFallback.test.ts (3 tests) 50ms
✓ src/lib/devices/**tests**/pairing.test.ts (30 tests) 18ms
✓ src/lib/discounts/calculator.test.ts (17 tests) 6ms
✓ src/app/api/sync/**tests**/route.test.ts (3 tests) 107ms
✓ src/lib/graphql/**tests**/errors.test.ts (22 tests) 16ms
✓ src/lib/security/sessionStore.test.ts (15 tests) 14ms
✓ src/lib/sync/stale-device-monitor.test.ts (14 tests) 11ms
✓ src/lib/devices/**tests**/shell.test.ts (22 tests) 7ms
stderr | src/app/api/**tests**/guest-policy-hardening.integration.test.ts > Guest policy hardening integration
Missing secrets: { hasUrl: true, hasPublishableKey: false, hasServiceRoleKey: false }
Skipping policy hardening tests: Supabase secrets not configured

stderr | src/app/api/**tests**/guest-policy-hardening.integration.test.ts > Guest policy hardening integration > orders policy rejects insert without idempotency_key
Skipping test: testsShouldRun= false

✓ src/app/api/**tests**/guest-policy-hardening.integration.test.ts (7 tests) 7ms
✓ src/lib/payments/**tests**/adapters.test.ts (17 tests) 16ms
✓ src/lib/payments/payment-event-consumer.test.ts (2 tests) 8ms
✓ src/lib/devices/**tests**/ota.test.ts (23 tests) 8ms
✓ src/lib/terminal/**tests**/read-adapter.test.ts (2 tests) 137ms
✓ src/lib/api/**tests**/versioning.test.ts (26 tests) 16ms
✓ src/lib/api/**tests**/response.test.ts (22 tests) 22ms
✓ src/lib/payments/local-ledger.test.ts (3 tests) 21ms
✓ src/lib/i18n/**tests**/locale.test.ts (39 tests) 11ms
stderr | src/lib/errorHandler.test.ts > handleApiError > should handle AppError correctly
Error: 39m[2026-04-29T10:02:22.505Z] [ERROR] [app] [cffd8013-a756-4940-85f9-b045226b6d03] Test Context {
statusCode: 404,
userMessage: 'Resource not found',
internalMessage: 'The requested item does not exist in the database',
code: 'NOT*FOUND',
error: {
name: 'AppError',
message: 'Resource not found',
stack: 'AppError: Resource not found\n' +
' at /home/runner/work/lole/lole/src/lib/errorHandler.test.ts:32:26\n' +
' at file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:145:11\n' +
' at file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:915:26\n' +
' at file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1243:20\n' +
' at new Promise (<anonymous>)\n' +
' at runWithTimeout (file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1209:10)\n' +
' at file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1653:37\n' +
' at Traces.$ (file:///home/runner/work/lole/lole/node_modules/.pnpm/vitest@4.0.18*@opentelemetry+api@1.9.0_@types+node@20.19.33_jiti@2.6.1_jsdom@28.1.0_lig_109b2b7b0f8561f79b9dce3a2356b642/node*modules/vitest/dist/chunks/traces.CCmnQaNT.js:142:27)\n' +
' at trace (file:///home/runner/work/lole/lole/node_modules/.pnpm/vitest@4.0.18*@opentelemetry+api@1.9.0_@types+node@20.19.33_jiti@2.6.1_jsdom@28.1.0_lig_109b2b7b0f8561f79b9dce3a2356b642/node_modules/vitest/dist/chunks/test.B8ej_ZHS.js:239:21)\n' +
' at runTest (file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1653:12)'
}
}

stderr | src/lib/errorHandler.test.ts > handleApiError > should return sanitized error for AppError
Error: 39m[2026-04-29T10:02:22.510Z] [ERROR] [app] [6083b640-468e-458f-b844-8d21b397268f] Test Context {
statusCode: 500,
userMessage: 'Something went wrong',
internalMessage: 'Internal database connection failed',
code: 'DB*ERROR',
error: {
name: 'AppError',
message: 'Something went wrong',
stack: 'AppError: Something went wrong\n' +
' at /home/runner/work/lole/lole/src/lib/errorHandler.test.ts:46:26\n' +
' at file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:145:11\n' +
' at file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:915:26\n' +
' at file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1243:20\n' +
' at new Promise (<anonymous>)\n' +
' at runWithTimeout (file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1209:10)\n' +
' at file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1653:37\n' +
' at Traces.$ (file:///home/runner/work/lole/lole/node_modules/.pnpm/vitest@4.0.18*@opentelemetry+api@1.9.0_@types+node@20.19.33_jiti@2.6.1_jsdom@28.1.0_lig_109b2b7b0f8561f79b9dce3a2356b642/node*modules/vitest/dist/chunks/traces.CCmnQaNT.js:142:27)\n' +
' at trace (file:///home/runner/work/lole/lole/node_modules/.pnpm/vitest@4.0.18*@opentelemetry+api@1.9.0_@types+node@20.19.33_jiti@2.6.1_jsdom@28.1.0_lig_109b2b7b0f8561f79b9dce3a2356b642/node_modules/vitest/dist/chunks/test.B8ej_ZHS.js:239:21)\n' +
' at runTest (file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1653:12)'
}
}

stderr | src/lib/errorHandler.test.ts > handleApiError > should handle Zod validation errors
Error: 39m[2026-04-29T10:02:22.518Z] [ERROR] [app] [656cdda9-cb10-4b45-be0f-470cf09c82d8] Validation Test - Validation Error {
error: [
{
path: 'name',
message: 'Too small: expected string to have >=1 characters'
},
{ path: 'age', message: 'Too small: expected number to be >0' }
]
}

stderr | src/lib/errorHandler.test.ts > handleApiError > should handle standard Error objects
Error: 39m[2026-04-29T10:02:22.520Z] [ERROR] [app] [8edb737a-fbfa-4506-a670-817515323b87] Standard Error Test {
error: {
name: 'Error',
message: 'Something broke',
stack: 'Error: Something broke\n' +
' at /home/runner/work/lole/lole/src/lib/errorHandler.test.ts:85:23\n' +
' at file:///home/runner/work/lole/lole/node*modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:145:11\n' +
' at file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:915:26\n' +
' at file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1243:20\n' +
' at new Promise (<anonymous>)\n' +
' at runWithTimeout (file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1209:10)\n' +
' at file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1653:37\n' +
' at Traces.$ (file:///home/runner/work/lole/lole/node_modules/.pnpm/vitest@4.0.18*@opentelemetry+api@1.9.0_@types+node@20.19.33_jiti@2.6.1_jsdom@28.1.0_lig_109b2b7b0f8561f79b9dce3a2356b642/node*modules/vitest/dist/chunks/traces.CCmnQaNT.js:142:27)\n' +
' at trace (file:///home/runner/work/lole/lole/node_modules/.pnpm/vitest@4.0.18*@opentelemetry+api@1.9.0_@types+node@20.19.33_jiti@2.6.1_jsdom@28.1.0_lig_109b2b7b0f8561f79b9dce3a2356b642/node_modules/vitest/dist/chunks/test.B8ej_ZHS.js:239:21)\n' +
' at runTest (file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1653:12)'
}
}

stderr | src/lib/errorHandler.test.ts > handleApiError > should handle unknown errors
Error: 39m[2026-04-29T10:02:22.521Z] [ERROR] [app] [9424265b-6c2d-4279-a781-335185623330] Unknown Error Test - Unknown error { error: 'just a string error' }

stderr | src/lib/errorHandler.test.ts > handleApiError > should include requestId in all error responses
Error: 39m[2026-04-29T10:02:22.522Z] [ERROR] [app] [25daa5c3-c376-4825-9cb6-7ad19ee6fcbc] Test {
statusCode: 400,
userMessage: 'Bad Request',
internalMessage: undefined,
code: undefined,
error: {
name: 'AppError',
message: 'Bad Request',
stack: 'AppError: Bad Request\n' +
' at /home/runner/work/lole/lole/src/lib/errorHandler.test.ts:110:13\n' +
' at file:///home/runner/work/lole/lole/node*modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:145:11\n' +
' at file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:915:26\n' +
' at file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1243:20\n' +
' at new Promise (<anonymous>)\n' +
' at runWithTimeout (file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1209:10)\n' +
' at file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1653:37\n' +
' at Traces.$ (file:///home/runner/work/lole/lole/node_modules/.pnpm/vitest@4.0.18*@opentelemetry+api@1.9.0_@types+node@20.19.33_jiti@2.6.1_jsdom@28.1.0_lig_109b2b7b0f8561f79b9dce3a2356b642/node*modules/vitest/dist/chunks/traces.CCmnQaNT.js:142:27)\n' +
' at trace (file:///home/runner/work/lole/lole/node_modules/.pnpm/vitest@4.0.18*@opentelemetry+api@1.9.0_@types+node@20.19.33_jiti@2.6.1_jsdom@28.1.0_lig_109b2b7b0f8561f79b9dce3a2356b642/node_modules/vitest/dist/chunks/test.B8ej_ZHS.js:239:21)\n' +
' at runTest (file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1653:12)'
}
}

stderr | src/lib/errorHandler.test.ts > handleApiError > should include requestId in all error responses
Error: 39m[2026-04-29T10:02:22.523Z] [ERROR] [app] [707b400b-e49a-419b-818b-f4673715bfa0] Test {
error: {
name: 'Error',
message: 'Generic error',
stack: 'Error: Generic error\n' +
' at /home/runner/work/lole/lole/src/lib/errorHandler.test.ts:111:13\n' +
' at file:///home/runner/work/lole/lole/node*modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:145:11\n' +
' at file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:915:26\n' +
' at file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1243:20\n' +
' at new Promise (<anonymous>)\n' +
' at runWithTimeout (file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1209:10)\n' +
' at file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1653:37\n' +
' at Traces.$ (file:///home/runner/work/lole/lole/node_modules/.pnpm/vitest@4.0.18*@opentelemetry+api@1.9.0_@types+node@20.19.33_jiti@2.6.1_jsdom@28.1.0_lig_109b2b7b0f8561f79b9dce3a2356b642/node*modules/vitest/dist/chunks/traces.CCmnQaNT.js:142:27)\n' +
' at trace (file:///home/runner/work/lole/lole/node_modules/.pnpm/vitest@4.0.18*@opentelemetry+api@1.9.0_@types+node@20.19.33_jiti@2.6.1_jsdom@28.1.0_lig_109b2b7b0f8561f79b9dce3a2356b642/node_modules/vitest/dist/chunks/test.B8ej_ZHS.js:239:21)\n' +
' at runTest (file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1653:12)'
}
}

stderr | src/lib/errorHandler.test.ts > handleApiError > should include requestId in all error responses
Error: 39m[2026-04-29T10:02:22.523Z] [ERROR] [app] [5f706bbb-9750-47f1-ab61-f4eaa7a83c78] Test - Unknown error { error: 'string error' }

stderr | src/lib/errorHandler.test.ts > handleApiError > should include requestId in all error responses
Error: 39m[2026-04-29T10:02:22.524Z] [ERROR] [app] [6e7045ea-b6a9-49db-b162-c1b284c0bf8d] Test - Unknown error { error: null }

stderr | src/lib/errorHandler.test.ts > handleApiError > should include requestId in all error responses
Error: 39m[2026-04-29T10:02:22.524Z] [ERROR] [app] [d512fb10-ff32-4b9d-9ff5-f5291b7249a2] Test - Unknown error {}

stderr | src/lib/errorHandler.test.ts > safeParseJson > should return NextResponse for invalid JSON
Error: 39m[2026-04-29T10:02:22.532Z] [ERROR] [app] Failed to parse JSON body {
error: {
name: 'SyntaxError',
message: `Unexpected token 'o', "not valid json" is not valid JSON`,
stack: `SyntaxError: Unexpected token 'o', "not valid json" is not valid JSON\n` +
' at JSON.parse (<anonymous>)\n' +
' at parseJSONFromBytes (node:internal/deps/undici/undici:5880:19)\n' +
' at successSteps (node:internal/deps/undici/undici:5861:27)\n' +
' at fullyReadBody (node:internal/deps/undici/undici:4753:9)\n' +
' at processTicksAndRejections (node:internal/process/task_queues:103:5)\n' +
' at consumeBody (node:internal/deps/undici/undici:5870:7)\n' +
' at safeParseJson (/home/runner/work/lole/lole/src/lib/errorHandler.ts:92:16)\n' +
' at /home/runner/work/lole/lole/src/lib/errorHandler.test.ts:144:24\n' +
' at file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:915:20'
}
}

stderr | src/lib/errorHandler.test.ts > safeParseJson > should return error message for invalid JSON
Error: 39m[2026-04-29T10:02:22.534Z] [ERROR] [app] Failed to parse JSON body {
error: {
name: 'SyntaxError',
message: `Unexpected token 'o', "not valid json" is not valid JSON`,
stack: `SyntaxError: Unexpected token 'o', "not valid json" is not valid JSON\n` +
' at JSON.parse (<anonymous>)\n' +
' at parseJSONFromBytes (node:internal/deps/undici/undici:5880:19)\n' +
' at successSteps (node:internal/deps/undici/undici:5861:27)\n' +
' at fullyReadBody (node:internal/deps/undici/undici:4753:9)\n' +
' at processTicksAndRejections (node:internal/process/task_queues:103:5)\n' +
' at consumeBody (node:internal/deps/undici/undici:5870:7)\n' +
' at safeParseJson (/home/runner/work/lole/lole/src/lib/errorHandler.ts:92:16)\n' +
' at /home/runner/work/lole/lole/src/lib/errorHandler.test.ts:155:24\n' +
' at file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:915:20'
}
}

stderr | src/lib/errorHandler.test.ts > safeParseJson > should handle empty body
Error: 39m[2026-04-29T10:02:22.535Z] [ERROR] [app] Failed to parse JSON body {
error: {
name: 'SyntaxError',
message: 'Unexpected end of JSON input',
stack: 'SyntaxError: Unexpected end of JSON input\n' +
' at JSON.parse (<anonymous>)\n' +
' at parseJSONFromBytes (node:internal/deps/undici/undici:5880:19)\n' +
' at successSteps (node:internal/deps/undici/undici:5861:27)\n' +
' at fullyReadBody (node:internal/deps/undici/undici:4753:9)\n' +
' at processTicksAndRejections (node:internal/process/task_queues:103:5)\n' +
' at consumeBody (node:internal/deps/undici/undici:5870:7)\n' +
' at safeParseJson (/home/runner/work/lole/lole/src/lib/errorHandler.ts:92:16)\n' +
' at /home/runner/work/lole/lole/src/lib/errorHandler.test.ts:168:24\n' +
' at file:///home/runner/work/lole/lole/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:915:20'
}
}

✓ src/lib/errorHandler.test.ts (13 tests) 38ms
✓ src/lib/fetchUtils.test.ts (16 tests) 21ms
✓ src/lib/security/passwordPolicy.test.ts (18 tests) 13ms
✓ src/lib/sync/**tests**/conflict-resolution.test.ts (5 tests) 15ms
✓ src/lib/notifications/**tests**/retry.test.ts (18 tests) 8ms
stderr | src/app/api/**tests**/p2-revenue-api-routes.test.ts > P2 revenue API routes > GET /api/loyalty/programs returns 401 when unauthorized
Error: 6-04-29T10:02:24.518Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: '86d21215-cb6c-4c2b-9213-565aeff17686',
error: 'Unauthorized'
}

stderr | src/app/api/**tests**/p2-revenue-api-routes.test.ts > P2 revenue API routes > POST /api/loyalty/programs returns 400 for invalid payload
Error: 6-04-29T10:02:24.529Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: '834b918a-a5f5-4bbe-9510-0acce0878609',
error: 'Invalid request payload'
}

stderr | src/app/api/**tests**/p2-revenue-api-routes.test.ts > P2 revenue API routes > POST /api/loyalty/accounts/:id/adjust returns 400 for invalid id
Error: 6-04-29T10:02:24.531Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: '3b2140ea-ba53-4f7f-af7b-4db720f78d45',
error: 'Invalid account id'
}

stderr | src/app/api/**tests**/p2-revenue-api-routes.test.ts > P2 revenue API routes > GET /api/gift-cards returns 401 when unauthorized
Error: 6-04-29T10:02:24.532Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: 'ce0c31a6-5b8f-4947-a7ae-b1d7fa7b3c3e',
error: 'Unauthorized'
}

stderr | src/app/api/**tests**/p2-revenue-api-routes.test.ts > P2 revenue API routes > POST /api/gift-cards returns 400 for invalid payload
Error: 6-04-29T10:02:24.534Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: '9f1f833e-fa9a-496d-a3a6-7a122486ead9',
error: 'Invalid request payload'
}

stderr | src/app/api/**tests**/p2-revenue-api-routes.test.ts > P2 revenue API routes > POST /api/gift-cards/:id/redeem returns 400 for invalid idempotency key
Error: 6-04-29T10:02:24.535Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: '0b3286ad-b87b-4959-9f6f-89e1c4abce94',
error: 'Invalid idempotency key'
}

stderr | src/app/api/**tests**/p2-revenue-api-routes.test.ts > P2 revenue API routes > GET /api/campaigns returns 401 when unauthorized
Error: 6-04-29T10:02:24.536Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: 'c5399d4c-afde-4ea6-82d9-0a60ec751507',
error: 'Unauthorized'
}

stderr | src/app/api/**tests**/p2-revenue-api-routes.test.ts > P2 revenue API routes > POST /api/campaigns returns 400 for invalid payload
Error: 6-04-29T10:02:24.538Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: 'fa176374-9f3e-4aec-aef6-368f18ec2f99',
error: 'Invalid request payload'
}

stderr | src/app/api/**tests**/p2-revenue-api-routes.test.ts > P2 revenue API routes > POST /api/campaigns/:id/launch returns 400 for invalid campaign id
Error: 6-04-29T10:02:24.540Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: '2f893163-0a34-4e19-8d94-622ede317d03',
error: 'Invalid campaign id'
}

✓ src/app/api/**tests**/p2-revenue-api-routes.test.ts (9 tests) 27ms
✓ src/lib/terminal/**tests**/settlement-adapter.test.ts (4 tests) 21ms
✓ src/features/kds/hooks/**tests**/useKDSRealtime.local.test.ts (2 tests) 139ms
✓ src/lib/utils/monetary.test.ts (22 tests) 33ms
✓ src/lib/errors.test.ts (19 tests) 13ms
❯ src/lib/sync/**tests**/store-runtime-harness.test.ts (3 tests | 3 failed) 129ms
× ENT-019: simulates WAN cut and verifies local order create/update still work 114ms
× ENT-020: survives gateway restart during WAN outage without losing queued writes 6ms
× ENT-020: survives client restart and delayed reconnect without data loss 3ms
stderr | src/app/api/**tests**/kds-telemetry.route.test.ts > KDS telemetry API > GET /api/kds/telemetry returns 401 when unauthorized
Error: 6-04-29T10:02:27.128Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: 'eac45e57-70af-4b52-83c5-9b014a4778a9',
error: 'Unauthorized'
}

✓ src/app/api/**tests**/kds-telemetry.route.test.ts (3 tests) 27ms
✓ src/lib/tables/**tests**/session-adapter.test.ts (5 tests) 21ms
stderr | src/app/api/**tests**/kds-printer.route.test.ts > KDS printer route > POST /api/kds/orders/:id/print returns 401 when unauthorized
Error: 6-04-29T10:02:28.298Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: 'bad22aa7-1d92-4606-99f1-b173b6286b0d',
error: 'Unauthorized'
}

stderr | src/app/api/**tests**/kds-printer.route.test.ts > KDS printer route > POST /api/kds/orders/:id/print dispatches log fallback when enabled
[KDS_PRINTER_LOG] {
event: 'kds.ticket.print.v1',
event_id: '50004647-af87-482c-8f23-f6dc364f1010',
copies: 1,
payload: {
restaurantId: 'resto-1',
orderId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
orderNumber: 'ORD-123',
tableNumber: 'T-1',
firedAt: '2026-04-29T10:02:28.310Z',
reason: 'manual_print',
items: [ [Object] ]
}
}

✓ src/app/api/**tests**/kds-printer.route.test.ts (2 tests) 16ms
✓ src/app/api/**tests**/payment-webhooks.route.test.ts (3 tests) 27ms
✓ src/features/auth/hooks/**tests**/useRole.test.ts (5 tests) 245ms
stderr | src/lib/api/**tests**/pilotGate.test.ts > pilot gate phase controls > blocks non-allowlisted restaurant when p1 rollout is enabled
Error: 6-04-29T10:02:29.513Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: '4aa0729e-2ce9-4849-887b-4102476ea409',
error: 'Feature not enabled for this restaurant during pilot rollout'
}

stderr | src/lib/api/**tests**/pilotGate.test.ts > pilot gate phase controls > blocks p1 mutation when pilot mutation block is enabled
Error: 6-04-29T10:02:29.525Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: 'a3563150-c33a-4ee1-b34f-26677d9ddfbe',
error: 'Pilot mutation block is enabled'
}

stderr | src/lib/api/**tests**/pilotGate.test.ts > pilot gate phase controls > blocks non-allowlisted restaurant when p2 rollout is enabled
Error: 6-04-29T10:02:29.528Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: '188a7a4b-97e3-4764-9785-77fe2cd69c8b',
error: 'Feature not enabled for this restaurant during pilot rollout'
}

✓ src/lib/api/**tests**/pilotGate.test.ts (4 tests) 95ms
stderr | src/app/api/**tests**/team-ops-alerting-api-routes.test.ts > P1 Team Operations and Alerting API routes > GET /api/staff/schedule returns 401 when unauthorized
Error: 6-04-29T10:02:29.913Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: '6cc1d675-1fe4-41d0-a0f7-c8abd782393c',
error: 'Unauthorized'
}

stderr | src/app/api/**tests**/team-ops-alerting-api-routes.test.ts > P1 Team Operations and Alerting API routes > POST /api/staff/schedule returns 400 for invalid payload
Error: 6-04-29T10:02:29.925Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: '4773f590-7e8e-4dd2-b1fa-1256e7fc4489',
error: 'Invalid request payload'
}

stderr | src/app/api/**tests**/team-ops-alerting-api-routes.test.ts > P1 Team Operations and Alerting API routes > POST /api/staff/time-entries/clock returns 400 for invalid payload
Error: 6-04-29T10:02:29.928Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: 'db7f0f6a-f467-4611-bc8a-1b65fceb85d9',
error: 'Invalid request payload'
}

stderr | src/app/api/**tests**/team-ops-alerting-api-routes.test.ts > P1 Team Operations and Alerting API routes > GET /api/alerts/rules returns 401 when unauthorized
Error: 6-04-29T10:02:29.928Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: '29fca312-3aca-4012-ab0b-9d3afa04a72c',
error: 'Unauthorized'
}

stderr | src/app/api/**tests**/team-ops-alerting-api-routes.test.ts > P1 Team Operations and Alerting API routes > POST /api/alerts/rules returns 400 for invalid payload
Error: 6-04-29T10:02:29.931Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: 'b33bf7d3-6182-4bec-8958-89e0bd50aaad',
error: 'Invalid request payload'
}

stderr | src/app/api/**tests**/team-ops-alerting-api-routes.test.ts > P1 Team Operations and Alerting API routes > PATCH /api/alerts/rules/:id returns 400 for invalid id
Error: 6-04-29T10:02:29.934Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: '50f0eb13-0053-49b9-8ddb-1963427458fe',
error: 'Invalid alert rule id'
}

stderr | src/app/api/**tests**/team-ops-alerting-api-routes.test.ts > P1 Team Operations and Alerting API routes > GET /api/merchant/dashboard-presets returns 401 when unauthorized
Error: 6-04-29T10:02:29.935Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: '82675246-fa32-448f-8259-0644fdc687f2',
error: 'Unauthorized'
}

stderr | src/app/api/**tests**/team-ops-alerting-api-routes.test.ts > P1 Team Operations and Alerting API routes > PATCH /api/merchant/dashboard-presets returns 400 for invalid payload
Error: 6-04-29T10:02:29.936Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: 'ed1303e1-eb63-4240-997f-1cb2ddf5a41b',
error: 'Invalid request payload'
}

✓ src/app/api/**tests**/team-ops-alerting-api-routes.test.ts (8 tests) 26ms
stderr | src/app/api/**tests**/channels-api-routes.test.ts > Channels API routes > GET /api/channels/summary returns 401 when unauthorized
Error: 6-04-29T10:02:30.437Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: 'aa9da13d-d7f7-455e-9832-3c298c217018',
error: 'Unauthorized'
}

stderr | src/app/api/**tests**/channels-api-routes.test.ts > Channels API routes > PATCH /api/channels/online-ordering/settings returns 400 for empty payload
Error: 6-04-29T10:02:30.453Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: '61eca4b2-9f55-4233-9917-1658a0d3bd7f',
error: 'Invalid request payload'
}

stderr | src/app/api/**tests**/channels-api-routes.test.ts > Channels API routes > GET /api/channels/online-ordering/settings returns 401 when unauthorized
Error: 6-04-29T10:02:30.455Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: 'f9f1b38a-38db-497e-97e5-dce970d6080e',
error: 'Unauthorized'
}

stderr | src/app/api/**tests**/channels-api-routes.test.ts > Channels API routes > POST /api/channels/delivery/connect returns 400 for invalid payload
Error: 6-04-29T10:02:30.457Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: '877dfa1d-17fb-4680-bc0d-f7e76f333726',
error: 'Invalid request payload'
}

stderr | src/app/api/**tests**/channels-api-routes.test.ts > Channels API routes > GET /api/channels/delivery/orders returns 400 for invalid query
Error: 6-04-29T10:02:30.459Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: 'c85ce6cc-7929-4685-8975-1dda4ad05451',
error: 'Invalid query params'
}

stderr | src/app/api/**tests**/channels-api-routes.test.ts > Channels API routes > POST /api/channels/delivery/orders/:id/ack returns 400 for invalid id
Error: 6-04-29T10:02:30.461Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: 'abb8ac5d-34ce-4201-96fd-667322ff058f',
error: 'Invalid external order id'
}

stderr | src/app/api/**tests**/channels-api-routes.test.ts > Channels API routes > POST /api/channels/delivery/orders/:id/ack returns 400 for invalid idempotency key
Error: 6-04-29T10:02:30.462Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: '48a9676a-f621-40c8-af37-10ae2a662a66',
error: 'Invalid idempotency key'
}

✓ src/app/api/**tests**/channels-api-routes.test.ts (7 tests) 30ms
✓ src/lib/payments/adapters.test.ts (6 tests) 13ms
✓ src/lib/domain/core/**tests**/events.test.ts (4 tests) 7ms
✓ src/lib/auth/**tests**/offline-authz.test.ts (6 tests) 8ms
✓ src/lib/sync/**tests**/powersync-config.test.ts (4 tests) 6ms
✓ src/lib/printer/transaction-print.test.ts (2 tests) 7ms
✓ src/lib/gateway/**tests**/http-server.test.ts (2 tests) 60ms
✓ src/lib/supabase/client.test.ts (7 tests) 13ms
✓ src/lib/gateway/**tests**/device-bootstrap.test.ts (2 tests) 62ms
✓ src/lib/api/**tests**/idempotency.test.ts (17 tests) 10ms
✓ src/lib/sync/**tests**/tableSessionSync.test.ts (3 tests) 29ms
stderr | src/app/api/**tests**/api-metrics.route.test.ts > GET /api/analytics/api-metrics > returns 401 when not authenticated
Error: 6-04-29T10:02:35.041Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: 'e4c61ba3-2506-49e8-8d49-55f8d1fe27e2',
error: 'Unauthorized'
}

✓ src/app/api/**tests**/api-metrics.route.test.ts (2 tests) 19ms
stderr | src/app/api/**tests**/happy-hour.route.test.ts > Happy Hour API > GET /api/happy-hour returns 401 when unauthorized
Error: 6-04-29T10:02:35.513Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: 'a2db0f09-a3d4-4d11-a05f-b243183eb2bf',
error: 'Unauthorized'
}

stderr | src/app/api/**tests**/happy-hour.route.test.ts > Happy Hour API > POST /api/happy-hour returns 401 when unauthorized
Error: 6-04-29T10:02:35.521Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: '4fd00fc2-7b4d-4423-8d37-1827c93cafe7',
error: 'Unauthorized'
}

stderr | src/app/api/**tests**/happy-hour.route.test.ts > Happy Hour API > POST /api/happy-hour returns 400 for invalid time range
Error: 6-04-29T10:02:35.531Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: '42767af8-16e7-4f56-b47e-1d3a3b524883',
error: 'End time must be after start time'
}

stderr | src/app/api/**tests**/happy-hour.route.test.ts > Happy Hour API > POST /api/happy-hour returns 400 when no discount provided
Error: 6-04-29T10:02:35.532Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: '16d5d22c-b8cc-4543-bbf9-7bd5d56601a8',
error: 'Either discount_percentage or discount_fixed_amount is required'
}

✓ src/app/api/**tests**/happy-hour.route.test.ts (4 tests) 44ms
✓ src/features/kds/lib/**tests**/read-adapter.test.ts (2 tests) 26ms
✓ src/features/kds/lib/printer.test.ts (3 tests) 165ms
✓ src/lib/utils.test.ts (19 tests) 46ms
stderr | src/app/api/**tests**/kds-handoff.route.test.ts > POST /api/kds/orders/:id/handoff > returns 401 when unauthorized
Error: 6-04-29T10:02:36.963Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: '6e7d1133-5df6-4283-a256-8d08fb483d8a',
error: 'Unauthorized'
}

stderr | src/app/api/**tests**/kds-handoff.route.test.ts > POST /api/kds/orders/:id/handoff > returns 403 for non-expeditor roles
Error: 6-04-29T10:02:36.978Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: 'b75d4e16-f56c-4149-9dd4-ec355dfcaf60',
error: 'Final handoff is restricted to expeditor override roles'
}

✓ src/app/api/**tests**/kds-handoff.route.test.ts (2 tests) 20ms
✓ src/features/kds/lib/**tests**/command-adapter.test.ts (4 tests) 16ms
✓ src/lib/sync/**tests**/enterprise-runtime-drills.test.ts (2 tests) 51ms
✓ src/lib/db/**tests**/connection-lanes.test.ts (6 tests) 12ms
✓ src/lib/domain/core/**tests**/identifiers.test.ts (2 tests) 24ms
✓ src/lib/devices/config.test.ts (5 tests) 10ms
✓ src/features/kds/lib/**tests**/syncAdapter.test.ts (2 tests) 17ms
✓ src/lib/orders/**tests**/command-adapter.test.ts (3 tests) 17ms
✓ src/lib/lan/**tests**/discovery-client.test.ts (2 tests) 10ms
✓ src/lib/gateway/**tests**/local-events.test.ts (2 tests) 7ms
✓ src/lib/journal/**tests**/local-journal.test.ts (2 tests) 14ms
✓ src/lib/auth/**tests**/gateway-session.test.ts (3 tests) 8ms
✓ src/lib/domain/orders/**tests**/commands.test.ts (3 tests) 7ms
✓ src/components/providers/**tests**/OfflineIndicator.test.tsx (2 tests) 89ms
stderr | src/app/api/**tests**/device-close-table.route.test.ts > POST /api/device/tables/close > returns 401 when device token is missing/invalid
Error: 6-04-29T10:02:43.268Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: '1a295e15-4746-47bd-9df9-51ad2641fd3c',
error: 'Missing device token'
}

stderr | src/app/api/**tests**/device-ensure-open-session.route.test.ts > POST /api/device/tables/ensure-open-session > returns 401 when device token is missing/invalid
Error: 6-04-29T10:02:43.270Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: '69dd8637-0ba0-4d25-990b-118ba65c4c2c',
error: 'Missing device token'
}

stderr | src/app/api/**tests**/device-close-table.route.test.ts > POST /api/device/tables/close > returns 400 for invalid payload
Error: 6-04-29T10:02:43.282Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: '1249a834-21a3-4a96-a53a-7224c4fcd025',
error: 'Invalid request payload'
}

stderr | src/app/api/**tests**/device-ensure-open-session.route.test.ts > POST /api/device/tables/ensure-open-session > returns 400 for invalid payload
Error: 6-04-29T10:02:43.284Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: '91428a85-ac54-4066-a6b4-e5404569b2ee',
error: 'table_id or table_number is required'
}

✓ src/app/api/**tests**/device-close-table.route.test.ts (2 tests) 20ms
✓ src/app/api/**tests**/device-ensure-open-session.route.test.ts (2 tests) 23ms
✓ src/lib/fiscal/**tests**/local-signing.test.ts (4 tests) 11ms
✓ src/lib/devices/**tests**/hardware-abstraction.test.ts (1 test) 4ms
stderr | src/app/api/**tests**/device-bill-request.route.test.ts > POST /api/device/tables/bill-request > returns 401 when device token is missing/invalid
Error: 6-04-29T10:02:44.642Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: '48560ae0-557f-4f23-9b69-6cd241231641',
error: 'Missing device token'
}

stderr | src/app/api/**tests**/device-bill-request.route.test.ts > POST /api/device/tables/bill-request > returns 400 for invalid payload
Error: 6-04-29T10:02:44.656Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: '1cedab8d-f2ee-4ece-b5f0-f89de042707e',
error: 'table_id or table_number is required'
}

✓ src/app/api/**tests**/device-bill-request.route.test.ts (2 tests) 20ms
✓ src/lib/domain/tables/**tests**/commands.test.ts (3 tests) 6ms
✓ src/features/kds/lib/**tests**/handoff-adapter.test.ts (2 tests) 14ms
✓ src/lib/gateway/**tests**/entrypoint.test.ts (2 tests) 7ms
✓ src/lib/lan/**tests**/discovery.test.ts (2 tests) 6ms
✓ src/lib/gateway/**tests**/bootstrap.test.ts (1 test) 5ms
✓ src/lib/devices/shell.test.ts (3 tests) 7ms
✓ src/lib/domain/kds/**tests**/commands.test.ts (2 tests) 5ms
✓ src/lib/devices/pairing.test.ts (5 tests) 5ms
✓ src/lib/gateway/**tests**/dispatcher.test.ts (2 tests) 5ms
✓ src/components/merchant/**tests**/RevenueChart.test.tsx (3 tests) 41ms
✓ src/lib/gateway/**tests**/runtime-mode.test.ts (3 tests) 5ms
✓ src/lib/domain/printer/**tests**/commands.test.ts (1 test) 5ms
✓ src/lib/lan/**tests**/mqtt-topics.test.ts (3 tests) 4ms
✓ src/lib/domain/orders/**tests**/course-pacing.test.ts (2 tests) 7ms
✓ src/lib/printer/escpos.test.ts (1 test) 4ms
✓ src/lib/format/et.test.ts (3 tests) 46ms
✓ src/lib/devices/ota.test.ts (3 tests) 5ms
✓ src/components/**tests**/smoke.test.tsx (1 test) 26ms
✓ src/**tests**/integration/app-smoke.test.tsx (1 test) 3ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 3 ⎯⎯⎯⎯⎯⎯⎯

FAIL src/lib/sync/**tests**/store-runtime-harness.test.ts > store runtime harness > ENT-019: simulates WAN cut and verifies local order create/update still work
AssertionError: expected false to be true // Object.is equality

- Expected

* Received

- true

* false

❯ src/lib/sync/**tests**/store-runtime-harness.test.ts:59:33
57|
58| expect(harness.isWanConnected()).toBe(false);
59| expect(created.success).toBe(true);
| ^
60| expect(created.order?.id).toBeDefined();
61|

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/3]⎯

FAIL src/lib/sync/**tests**/store-runtime-harness.test.ts > store runtime harness > ENT-020: survives gateway restart during WAN outage without losing queued writes
TypeError: Cannot read properties of undefined (reading 'id')
❯ src/lib/sync/**tests**/store-runtime-harness.test.ts:95:71
93|
94| harness.restartGateway();
95| const updated = await updateOfflineOrderStatus(created.order!.…
| ^
96|
97| expect(harness.isGatewayRunning()).toBe(true);

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[2/3]⎯

FAIL src/lib/sync/**tests**/store-runtime-harness.test.ts > store runtime harness > ENT-020: survives client restart and delayed reconnect without data loss
TypeError: Cannot read properties of undefined (reading 'id')
❯ src/lib/sync/**tests**/store-runtime-harness.test.ts:127:65
125| });
126|
127| await orderSync.updateOfflineOrderStatus(created.order!.id, 'r…
| ^
128|
129| currentDb = harness.createClientDatabase();

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[3/3]⎯

Test Files 1 failed | 140 passed | 1 skipped (142)
Tests 3 failed | 2089 passed | 15 skipped (2107)
Start at 10:01:50
Duration 63.03s (transform 4.95s, setup 22.69s, import 11.19s, tests 5.61s, environment 110.76s)

Error: AssertionError: expected false to be true // Object.is equality

- Expected

* Received

- true

* false

❯ src/lib/sync/**tests**/store-runtime-harness.test.ts:59:33

Error: TypeError: Cannot read properties of undefined (reading 'id')
❯ src/lib/sync/**tests**/store-runtime-harness.test.ts:95:71

Error: TypeError: Cannot read properties of undefined (reading 'id')
❯ src/lib/sync/**tests**/store-runtime-harness.test.ts:127:65

 ELIFECYCLE  Command failed with exit code 1.
