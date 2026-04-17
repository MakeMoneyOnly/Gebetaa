#1 Pre-flight Security
failed 2 days ago in 11s

Run GitGuardian/ggshield-action@master
/usr/bin/docker run --name gitguardianggshieldv1490_89cdd2 --label e57d2e --workdir /github/workspace --rm -e "NODE_VERSION" -e "PNPM_VERSION" -e "GITHUB_PUSH_BEFORE_SHA" -e "GITHUB_PUSH_BASE_SHA" -e "GITHUB_PULL_BASE_SHA" -e "GITHUB_DEFAULT_BRANCH" -e "INPUT_ARGS" -e "HOME" -e "GITHUB_JOB" -e "GITHUB_REF" -e "GITHUB_SHA" -e "GITHUB_REPOSITORY" -e "GITHUB_REPOSITORY_OWNER" -e "GITHUB_REPOSITORY_OWNER_ID" -e "GITHUB_RUN_ID" -e "GITHUB_RUN_NUMBER" -e "GITHUB_RETENTION_DAYS" -e "GITHUB_RUN_ATTEMPT" -e "GITHUB_ACTOR_ID" -e "GITHUB_ACTOR" -e "GITHUB_WORKFLOW" -e "GITHUB_HEAD_REF" -e "GITHUB_BASE_REF" -e "GITHUB_EVENT_NAME" -e "GITHUB_SERVER_URL" -e "GITHUB_API_URL" -e "GITHUB_GRAPHQL_URL" -e "GITHUB_REF_NAME" -e "GITHUB_REF_PROTECTED" -e "GITHUB_REF_TYPE" -e "GITHUB_WORKFLOW_REF" -e "GITHUB_WORKFLOW_SHA" -e "GITHUB_REPOSITORY_ID" -e "GITHUB_TRIGGERING_ACTOR" -e "GITHUB_WORKSPACE" -e "GITHUB_ACTION" -e "GITHUB_EVENT_PATH" -e "GITHUB_ACTION_REPOSITORY" -e "GITHUB_ACTION_REF" -e "GITHUB_PATH" -e "GITHUB_ENV" -e "GITHUB_STEP_SUMMARY" -e "GITHUB_STATE" -e "GITHUB_OUTPUT" -e "RUNNER_OS" -e "RUNNER_ARCH" -e "RUNNER_NAME" -e "RUNNER_ENVIRONMENT" -e "RUNNER_TOOL_CACHE" -e "RUNNER_TEMP" -e "RUNNER_WORKSPACE" -e "ACTIONS_RUNTIME_URL" -e "ACTIONS_RUNTIME_TOKEN" -e "ACTIONS_CACHE_URL" -e "ACTIONS_RESULTS_URL" -e "ACTIONS_ORCHESTRATION_ID" -e GITHUB_ACTIONS=true -e CI=true --entrypoint "/app/docker/actions-secret-entrypoint.sh" -v "/var/run/docker.sock":"/var/run/docker.sock" -v "/home/runner/work/\_temp":"/github/runner_temp" -v "/home/runner/work/\_temp/\_github_home":"/github/home" -v "/home/runner/work/\_temp/\_github_workflow":"/github/workflow" -v "/home/runner/work/\_temp/\_runner_file_commands":"/github/file_commands" -v "/home/runner/work/Gebetaa/Gebetaa":"/github/workspace" gitguardian/ggshield:v1.49.0 ""
Error: A GitGuardian API key is needed to use ggshield.

To get one, authenticate to your dashboard by running:

    ggshield auth login

If you are using an on-prem version of GitGuardian, use the --instance option to point to it.
Read the following documentation for more information: https://docs.gitguardian.com/ggshield-docs/reference/auth/login

#2 Secret Scanning
failed 2 days ago in 17s

Run github/codeql-action/upload-sarif@v3
Warning: CodeQL Action v3 will be deprecated in December 2026. Please update all occurrences of the CodeQL Action in your workflow files to v4. For more information, see https://github.blog/changelog/2025-10-28-upcoming-deprecation-of-codeql-action-v3/
Error: Path does not exist: trivy-secrets.sarif

#3 Security Summary
failed 2 days ago in 4s

Run exit 1
Error: Process completed with exit code 1.

#4 check-migrations
failed 2 days ago in 11s

Run echo "=== Checking migration drift between local and remote ==="
=== Checking migration drift between local and remote ===
npm warn exec The following package was not found and will be installed: supabase@2.89.1
npm warn deprecated node-domexception@1.0.0: Use your platform's native DOMException instead
Invalid project ref format. Must be like `abcdefghijklmnopqrst`.
Try rerunning the command with --debug to troubleshoot the error.
Error: Process completed with exit code 1.

#5 Unit Tests
failed 2 days ago in 1m 11s

Run pnpm test:coverage

> gebeta-menu@0.1.0 test:coverage /home/runner/work/Gebetaa/Gebetaa
> vitest --coverage

RUN v4.0.18 /home/runner/work/Gebetaa/Gebetaa
Coverage enabled with v8

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

✓ src/lib/graphql/**tests**/dataloaders.test.ts (71 tests) 59ms
stderr | src/hooks/**tests**/useKDSRealtime.test.ts > useKDSRealtime > should create channel when enabled
[KDS Realtime] Subscription status: SUBSCRIBED

stderr | src/hooks/**tests**/useKDSRealtime.test.ts > useKDSRealtime > should subscribe to orders and external_orders tables
[KDS Realtime] Subscription status: SUBSCRIBED

stderr | src/hooks/**tests**/useKDSRealtime.test.ts > useKDSRealtime > should call onNewOrder callback for INSERT events
[KDS Realtime] Subscription status: SUBSCRIBED

stderr | src/hooks/**tests**/useKDSRealtime.test.ts > useKDSRealtime > should call onOrderUpdate callback for UPDATE events
[KDS Realtime] Subscription status: SUBSCRIBED

stderr | src/hooks/**tests**/useKDSRealtime.test.ts > useKDSRealtime > should call onOrderDelete callback for DELETE events
[KDS Realtime] Subscription status: SUBSCRIBED

✓ src/lib/fiscal/**tests**/erca-service.test.ts (52 tests) 78ms
stderr | src/hooks/**tests**/useKDSRealtime.test.ts > useKDSRealtime > should filter orders by restaurant_id
[KDS Realtime] Subscription status: SUBSCRIBED

stderr | src/hooks/**tests**/useKDSRealtime.test.ts > MessageDeduplicator > should detect duplicate messages within dedup window via hook
[KDS Realtime] Subscription status: SUBSCRIBED

stderr | src/hooks/**tests**/useKDSRealtime.test.ts > MessageDeduplicator > should detect duplicate messages within dedup window via hook
[KDS Realtime] Skipping duplicate message: orders:INSERT:order-dup-test

stderr | src/hooks/**tests**/useKDSRealtime.test.ts > Reconnection behavior > should track reconnection status
[KDS Realtime] Subscription status: SUBSCRIBED

stderr | src/hooks/**tests**/useKDSRealtime.test.ts > Reconnection behavior > should expose isConnected state
[KDS Realtime] Subscription status: SUBSCRIBED

stderr | src/hooks/**tests**/useKDSRealtime.test.ts > External orders handling > should subscribe to external_orders table
[KDS Realtime] Subscription status: SUBSCRIBED

stderr | src/hooks/**tests**/useKDSRealtime.test.ts > External orders handling > should handle INSERT events for external orders
[KDS Realtime] Subscription status: SUBSCRIBED

stderr | src/hooks/**tests**/useKDSRealtime.test.ts > External orders handling > should filter external orders by restaurant_id
[KDS Realtime] Subscription status: SUBSCRIBED

stderr | src/hooks/**tests**/useKDSRealtime.test.ts > Channel lifecycle > should handle channel subscription errors
[KDS Realtime] Subscription status: CHANNEL_ERROR
[KDS Realtime] Scheduling reconnect attempt 1/5 in 1061ms

stderr | src/hooks/**tests**/useKDSRealtime.test.ts > Channel lifecycle > should handle enabled/disabled toggling
[KDS Realtime] Subscription status: SUBSCRIBED

stderr | src/hooks/**tests**/useKDSRealtime.test.ts > External orders event handling > should call onNewOrder for external orders INSERT with delivery type
[KDS Realtime] Subscription status: SUBSCRIBED

stderr | src/hooks/**tests**/useKDSRealtime.test.ts > External orders event handling > should call onNewOrder for external orders INSERT with pickup type
[KDS Realtime] Subscription status: SUBSCRIBED

stderr | src/hooks/**tests**/useKDSRealtime.test.ts > External orders event handling > should call onOrderUpdate for external orders UPDATE events
[KDS Realtime] Subscription status: SUBSCRIBED

stderr | src/hooks/**tests**/useKDSRealtime.test.ts > External orders event handling > should filter external orders by restaurant_id
[KDS Realtime] Subscription status: SUBSCRIBED

stderr | src/hooks/**tests**/useKDSRealtime.test.ts > Reconnection with exponential backoff > should set isConnected to false on CHANNEL_ERROR
[KDS Realtime] Subscription status: CHANNEL_ERROR
[KDS Realtime] Scheduling reconnect attempt 1/5 in 1118ms

stderr | src/hooks/**tests**/useKDSRealtime.test.ts > Reconnection with exponential backoff > should set isConnected to false on CLOSED status
[KDS Realtime] Subscription status: CLOSED
[KDS Realtime] Scheduling reconnect attempt 1/5 in 1156ms

stderr | src/hooks/**tests**/useKDSRealtime.test.ts > Reconnection with exponential backoff > should set isConnected to false on TIMED_OUT status
[KDS Realtime] Subscription status: TIMED_OUT
[KDS Realtime] Scheduling reconnect attempt 1/5 in 1161ms

stderr | src/hooks/**tests**/useKDSRealtime.test.ts > Reconnection with exponential backoff > should set isConnected to true on SUBSCRIBED status
[KDS Realtime] Subscription status: SUBSCRIBED

stderr | src/hooks/**tests**/useKDSRealtime.test.ts > Channel cleanup on unmount > should handle unmount without errors
[KDS Realtime] Subscription status: SUBSCRIBED

✓ src/hooks/**tests**/useKDSRealtime.test.ts (43 tests) 159ms
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

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > start and stop > should start the worker and set isRunning to true
[2026-04-14T15:11:20.208Z] [INFO] [app] Starting sync cycle {}
[2026-04-14T15:11:20.208Z] [INFO] [app] SyncWorker started {}

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > start and stop > should start the worker and set isRunning to true
[2026-04-14T15:11:20.208Z] [INFO] [app] Sync complete { succeeded: 0, failed: 0 }
[2026-04-14T15:11:20.216Z] [INFO] [app] SyncWorker stopped {}

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > start and stop > should not start twice
[2026-04-14T15:11:20.216Z] [INFO] [app] Starting sync cycle {}
[2026-04-14T15:11:20.216Z] [INFO] [app] SyncWorker started {}

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > start and stop > should not start twice
[2026-04-14T15:11:20.216Z] [INFO] [app] Sync complete { succeeded: 0, failed: 0 }
[2026-04-14T15:11:20.217Z] [INFO] [app] SyncWorker stopped {}

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > start and stop > should stop the worker and set isRunning to false
[2026-04-14T15:11:20.217Z] [INFO] [app] Starting sync cycle {}
[2026-04-14T15:11:20.217Z] [INFO] [app] SyncWorker started {}
[2026-04-14T15:11:20.217Z] [INFO] [app] SyncWorker stopped {}

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > start and stop > should stop the worker and set isRunning to false
[2026-04-14T15:11:20.217Z] [INFO] [app] Sync complete { succeeded: 0, failed: 0 }

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > start and stop > should clear interval on stop
[2026-04-14T15:11:20.221Z] [INFO] [app] Starting sync cycle {}
[2026-04-14T15:11:20.221Z] [INFO] [app] SyncWorker started {}
[2026-04-14T15:11:20.221Z] [INFO] [app] SyncWorker stopped {}
✓ src/lib/supabase/**tests**/service-role.integration.test.ts (38 tests) 49ms

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > start and stop > should clear interval on stop
[2026-04-14T15:11:20.221Z] [INFO] [app] Sync complete { succeeded: 0, failed: 0 }

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > syncOnce > should skip sync when offline
[2026-04-14T15:11:20.230Z] [INFO] [app] Offline - skipping sync {}

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > syncOnce > should process pending operations when online
[2026-04-14T15:11:20.243Z] [INFO] [app] Starting sync cycle {}

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > syncOnce > should process pending operations when online
[2026-04-14T15:11:20.243Z] [INFO] [app] Processing operations via batch sync { count: 1 }

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > syncOnce > should process pending operations when online
[2026-04-14T15:11:20.243Z] [INFO] [app] Sync complete { succeeded: 1, failed: 0 }

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > syncOnce > should emit operation:success event for successful operations
[2026-04-14T15:11:20.249Z] [INFO] [app] Starting sync cycle {}

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > syncOnce > should emit operation:success event for successful operations
[2026-04-14T15:11:20.249Z] [INFO] [app] Processing operations via batch sync { count: 1 }

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > syncOnce > should emit operation:success event for successful operations
[2026-04-14T15:11:20.249Z] [INFO] [app] Sync complete { succeeded: 1, failed: 0 }

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > syncOnce > should emit operation:failed event for failed operations
[2026-04-14T15:11:20.251Z] [INFO] [app] Starting sync cycle {}

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > syncOnce > should emit operation:failed event for failed operations
[2026-04-14T15:11:20.251Z] [INFO] [app] Processing operations via batch sync { count: 1 }

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > syncOnce > should emit operation:failed event for failed operations
[2026-04-14T15:11:20.251Z] [INFO] [app] Sync complete { succeeded: 0, failed: 1 }

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > syncOnce > should emit sync:error event on error
[2026-04-14T15:11:20.253Z] [INFO] [app] Starting sync cycle {}

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > syncOnce > should emit sync:error event on error
Error: 39m[2026-04-14T15:11:20.253Z] [ERROR] [app] Sync error { error: 'Database error' }

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > syncOnce > should call onSyncProgress callback
[2026-04-14T15:11:20.256Z] [INFO] [app] Starting sync cycle {}

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > syncOnce > should call onSyncProgress callback
[2026-04-14T15:11:20.256Z] [INFO] [app] Sync complete { succeeded: 0, failed: 0 }

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > batch sync > should send batch sync request to /api/sync
[2026-04-14T15:11:20.258Z] [INFO] [app] Starting sync cycle {}

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > batch sync > should send batch sync request to /api/sync
[2026-04-14T15:11:20.258Z] [INFO] [app] Processing operations via batch sync { count: 2 }

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > batch sync > should send batch sync request to /api/sync
[2026-04-14T15:11:20.258Z] [INFO] [app] Sync complete { succeeded: 2, failed: 0 }

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > batch sync > should fall back to individual operations on batch failure
[2026-04-14T15:11:20.259Z] [INFO] [app] Starting sync cycle {}

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > batch sync > should fall back to individual operations on batch failure
[2026-04-14T15:11:20.259Z] [INFO] [app] Processing operations via batch sync { count: 1 }

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > batch sync > should fall back to individual operations on batch failure
[2026-04-14T15:11:20.259Z] [INFO] [app] Batch sync failed, falling back to individual operations {}

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > batch sync > should fall back to individual operations on batch failure
[2026-04-14T15:11:20.259Z] [INFO] [app] Sync complete { succeeded: 1, failed: 0 }

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > batch sync > should handle invalid JSON payload gracefully
[2026-04-14T15:11:20.261Z] [INFO] [app] Starting sync cycle {}

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > batch sync > should handle invalid JSON payload gracefully
[2026-04-14T15:11:20.261Z] [INFO] [app] Processing operations via batch sync { count: 1 }

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > batch sync > should handle invalid JSON payload gracefully
[2026-04-14T15:11:20.261Z] [INFO] [app] Sync complete { succeeded: 1, failed: 0 }

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > individual sync operations > should handle unknown table gracefully
[2026-04-14T15:11:20.262Z] [INFO] [app] Starting sync cycle {}

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > individual sync operations > should handle unknown table gracefully
[2026-04-14T15:11:20.262Z] [INFO] [app] Processing operations via batch sync { count: 1 }

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > individual sync operations > should handle unknown table gracefully
[2026-04-14T15:11:20.262Z] [INFO] [app] Sync complete { succeeded: 0, failed: 1 }

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > retry logic > should mark operation as failed after max retries
[2026-04-14T15:11:20.263Z] [INFO] [app] Starting sync cycle {}

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > retry logic > should mark operation as failed after max retries
[2026-04-14T15:11:20.263Z] [INFO] [app] Processing operations via batch sync { count: 1 }

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > retry logic > should mark operation as failed after max retries
[2026-04-14T15:11:20.263Z] [INFO] [app] Sync complete { succeeded: 0, failed: 1 }

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > retry logic > should not mark as failed if under max retries
[2026-04-14T15:11:20.265Z] [INFO] [app] Starting sync cycle {}

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > retry logic > should not mark as failed if under max retries
[2026-04-14T15:11:20.265Z] [INFO] [app] Processing operations via batch sync { count: 1 }

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > retry logic > should not mark as failed if under max retries
[2026-04-14T15:11:20.265Z] [INFO] [app] Sync complete { succeeded: 0, failed: 1 }

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > event emission > should emit all expected events during successful sync
[2026-04-14T15:11:20.266Z] [INFO] [app] Starting sync cycle {}

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > event emission > should emit all expected events during successful sync
[2026-04-14T15:11:20.266Z] [INFO] [app] Processing operations via batch sync { count: 1 }

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > event emission > should emit all expected events during successful sync
[2026-04-14T15:11:20.266Z] [INFO] [app] Sync complete { succeeded: 1, failed: 0 }

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > conflict detection > should detect conflict from batch sync response
[2026-04-14T15:11:20.267Z] [INFO] [app] Starting sync cycle {}

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > conflict detection > should detect conflict from batch sync response
[2026-04-14T15:11:20.267Z] [INFO] [app] Processing operations via batch sync { count: 1 }

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > conflict detection > should detect conflict from batch sync response
[2026-04-14T15:11:20.267Z] [INFO] [app] Sync complete { succeeded: 0, failed: 1 }

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > conflict detection > should detect conflict from HTTP 409 response
[2026-04-14T15:11:20.268Z] [INFO] [app] Starting sync cycle {}

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > conflict detection > should detect conflict from HTTP 409 response
[2026-04-14T15:11:20.268Z] [INFO] [app] Processing operations via batch sync { count: 1 }

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > conflict detection > should detect conflict from HTTP 409 response
[2026-04-14T15:11:20.268Z] [INFO] [app] Batch sync failed, falling back to individual operations {}

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > conflict detection > should detect conflict from HTTP 409 response
[2026-04-14T15:11:20.268Z] [INFO] [app] Sync complete { succeeded: 0, failed: 1 }

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > conflict detection > should include conflictsDetected in sync:complete event
[2026-04-14T15:11:20.270Z] [INFO] [app] Starting sync cycle {}

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > conflict detection > should include conflictsDetected in sync:complete event
[2026-04-14T15:11:20.270Z] [INFO] [app] Processing operations via batch sync { count: 1 }

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > conflict detection > should include conflictsDetected in sync:complete event
[2026-04-14T15:11:20.270Z] [INFO] [app] Sync complete { succeeded: 0, failed: 1 }

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > conflict detection > should call reconcileWithServer after successful individual sync
[2026-04-14T15:11:20.271Z] [INFO] [app] Starting sync cycle {}

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > conflict detection > should call reconcileWithServer after successful individual sync
[2026-04-14T15:11:20.271Z] [INFO] [app] Processing operations via batch sync { count: 1 }

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > conflict detection > should call reconcileWithServer after successful individual sync
[2026-04-14T15:11:20.271Z] [INFO] [app] Batch sync failed, falling back to individual operations {}

stderr | src/lib/sync/**tests**/syncWorker.test.ts > SyncWorker > conflict detection > should call reconcileWithServer after successful individual sync
[2026-04-14T15:11:20.271Z] [INFO] [app] Sync complete { succeeded: 1, failed: 0 }

stderr | src/lib/sync/**tests**/syncWorker.test.ts > Global sync worker functions > should start global sync worker
[2026-04-14T15:11:20.273Z] [INFO] [app] Starting sync cycle {}
[2026-04-14T15:11:20.273Z] [INFO] [app] SyncWorker started {}
[2026-04-14T15:11:20.273Z] [INFO] [app] SyncWorker stopped {}
[2026-04-14T15:11:20.273Z] [INFO] [app] Processing operations via batch sync { count: 1 }

stderr | src/lib/sync/**tests**/syncWorker.test.ts > Global sync worker functions > should start global sync worker
[2026-04-14T15:11:20.273Z] [INFO] [app] Sync complete { succeeded: 0, failed: 1 }

stderr | src/lib/sync/**tests**/syncWorker.test.ts > Global sync worker functions > should stop global sync worker
[2026-04-14T15:11:20.273Z] [INFO] [app] Starting sync cycle {}
[2026-04-14T15:11:20.274Z] [INFO] [app] SyncWorker started {}
[2026-04-14T15:11:20.274Z] [INFO] [app] SyncWorker stopped {}
[2026-04-14T15:11:20.274Z] [INFO] [app] Processing operations via batch sync { count: 1 }

stderr | src/lib/sync/**tests**/syncWorker.test.ts > Global sync worker functions > should stop global sync worker
[2026-04-14T15:11:20.274Z] [INFO] [app] Sync complete { succeeded: 0, failed: 1 }

stderr | src/lib/sync/**tests**/syncWorker.test.ts > Global sync worker functions > should trigger manual sync
[2026-04-14T15:11:20.274Z] [INFO] [app] Starting sync cycle {}

stderr | src/lib/sync/**tests**/syncWorker.test.ts > Global sync worker functions > should trigger manual sync
[2026-04-14T15:11:20.274Z] [INFO] [app] Processing operations via batch sync { count: 1 }

stderr | src/lib/sync/**tests**/syncWorker.test.ts > Global sync worker functions > should trigger manual sync
[2026-04-14T15:11:20.275Z] [INFO] [app] Sync complete { succeeded: 0, failed: 1 }

✓ src/lib/sync/**tests**/syncWorker.test.ts (34 tests) 77ms
✓ src/lib/graphql/**tests**/n-plus-one-detection.test.ts (11 tests) 16ms
✓ src/lib/sync/**tests**/conflict-resolution.test.ts (34 tests) 42ms
✓ src/lib/payments/**tests**/chapa.test.ts (39 tests) 23ms
✓ src/lib/validators/**tests**/graphql.test.ts (55 tests) 36ms
stderr | src/lib/services/**tests**/orderService.integration.test.ts > orderService integration tests > checkRateLimit > should fail open when rate limit check fails
[RateLimit] Failed to check: { message: 'Error' }

stderr | src/lib/services/**tests**/orderService.integration.test.ts > orderService integration tests > checkDuplicateOrder > should return null on database error
[OrderService] Failed to check duplicate: { message: 'Error' }

✓ src/lib/sync/**tests**/kdsSync.test.ts (32 tests) 39ms
stderr | src/lib/services/**tests**/orderService.integration.test.ts > orderService integration tests > createOrder > should fail when insert fails
[OrderService] Failed to create order: { message: 'Insert failed' }

✓ src/lib/services/**tests**/orderService.integration.test.ts (22 tests) 24ms
stderr | src/domains/menu/**tests**/repository.test.ts > MenuRepository > getMenuItems > should throw error on database failure
[menu/repository] Error fetching menu items: Error: Database error
at /home/runner/work/Gebetaa/Gebetaa/src/domains/menu/**tests**/repository.test.ts:124:29
at file:///home/runner/work/Gebetaa/Gebetaa/node*modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:145:11
at file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:915:26
at file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1243:20
at new Promise (<anonymous>)
at runWithTimeout (file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1209:10)
at file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1653:37
at Traces.$ (file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/vitest@4.0.18*@opentelemetry+api@1.9.0_@types+node@20.19.33_jiti@2.6.1_jsdom@28.1.0_lig_109b2b7b0f8561f79b9dce3a2356b642/node*modules/vitest/dist/chunks/traces.CCmnQaNT.js:142:27)
at trace (file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/vitest@4.0.18*@opentelemetry+api@1.9.0_@types+node@20.19.33_jiti@2.6.1_jsdom@28.1.0_lig_109b2b7b0f8561f79b9dce3a2356b642/node_modules/vitest/dist/chunks/test.B8ej_ZHS.js:239:21)
at runTest (file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1653:12)

stderr | src/domains/menu/**tests**/repository.test.ts > MenuRepository > getMenuItem > should throw error on database failure
[menu/repository] Error fetching menu item: Error: DB error
at /home/runner/work/Gebetaa/Gebetaa/src/domains/menu/**tests**/repository.test.ts:176:29
at file:///home/runner/work/Gebetaa/Gebetaa/node*modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:145:11
at file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:915:26
at file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1243:20
at new Promise (<anonymous>)
at runWithTimeout (file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1209:10)
at file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1653:37
at Traces.$ (file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/vitest@4.0.18*@opentelemetry+api@1.9.0_@types+node@20.19.33_jiti@2.6.1_jsdom@28.1.0_lig_109b2b7b0f8561f79b9dce3a2356b642/node*modules/vitest/dist/chunks/traces.CCmnQaNT.js:142:27)
at trace (file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/vitest@4.0.18*@opentelemetry+api@1.9.0_@types+node@20.19.33_jiti@2.6.1_jsdom@28.1.0_lig_109b2b7b0f8561f79b9dce3a2356b642/node_modules/vitest/dist/chunks/test.B8ej_ZHS.js:239:21)
at runTest (file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1653:12) {
code: 'OTHER_ERROR'
}

stderr | src/domains/menu/**tests**/repository.test.ts > MenuRepository > getMenuCategories > should throw error on database failure
[menu/repository] Error fetching categories: Error: DB error
at /home/runner/work/Gebetaa/Gebetaa/src/domains/menu/**tests**/repository.test.ts:207:29
at file:///home/runner/work/Gebetaa/Gebetaa/node*modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:145:11
at file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:915:26
at file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1243:20
at new Promise (<anonymous>)
at runWithTimeout (file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1209:10)
at file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1653:37
at Traces.$ (file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/vitest@4.0.18*@opentelemetry+api@1.9.0_@types+node@20.19.33_jiti@2.6.1_jsdom@28.1.0_lig_109b2b7b0f8561f79b9dce3a2356b642/node*modules/vitest/dist/chunks/traces.CCmnQaNT.js:142:27)
at trace (file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/vitest@4.0.18*@opentelemetry+api@1.9.0_@types+node@20.19.33_jiti@2.6.1_jsdom@28.1.0_lig_109b2b7b0f8561f79b9dce3a2356b642/node_modules/vitest/dist/chunks/test.B8ej_ZHS.js:239:21)
at runTest (file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1653:12)

stderr | src/domains/menu/**tests**/repository.test.ts > MenuRepository > getModifierGroups > should throw error on database failure
[menu/repository] Error fetching modifier groups: Error: DB error
at /home/runner/work/Gebetaa/Gebetaa/src/domains/menu/**tests**/repository.test.ts:246:29
at file:///home/runner/work/Gebetaa/Gebetaa/node*modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:145:11
at file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:915:26
at file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1243:20
at new Promise (<anonymous>)
at runWithTimeout (file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1209:10)
at file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1653:37
at Traces.$ (file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/vitest@4.0.18*@opentelemetry+api@1.9.0_@types+node@20.19.33_jiti@2.6.1_jsdom@28.1.0_lig_109b2b7b0f8561f79b9dce3a2356b642/node*modules/vitest/dist/chunks/traces.CCmnQaNT.js:142:27)
at trace (file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/vitest@4.0.18*@opentelemetry+api@1.9.0_@types+node@20.19.33_jiti@2.6.1_jsdom@28.1.0_lig_109b2b7b0f8561f79b9dce3a2356b642/node_modules/vitest/dist/chunks/test.B8ej_ZHS.js:239:21)
at runTest (file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1653:12)

stderr | src/domains/menu/**tests**/repository.test.ts > MenuRepository > getModifierOptions > should throw error on database failure
[menu/repository] Error fetching modifier options: Error: DB error
at /home/runner/work/Gebetaa/Gebetaa/src/domains/menu/**tests**/repository.test.ts:274:29
at file:///home/runner/work/Gebetaa/Gebetaa/node*modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:145:11
at file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:915:26
at file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1243:20
at new Promise (<anonymous>)
at runWithTimeout (file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1209:10)
at file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1653:37
at Traces.$ (file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/vitest@4.0.18*@opentelemetry+api@1.9.0_@types+node@20.19.33_jiti@2.6.1_jsdom@28.1.0_lig_109b2b7b0f8561f79b9dce3a2356b642/node*modules/vitest/dist/chunks/traces.CCmnQaNT.js:142:27)
at trace (file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/vitest@4.0.18*@opentelemetry+api@1.9.0_@types+node@20.19.33_jiti@2.6.1_jsdom@28.1.0_lig_109b2b7b0f8561f79b9dce3a2356b642/node_modules/vitest/dist/chunks/test.B8ej_ZHS.js:239:21)
at runTest (file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1653:12)

stderr | src/domains/menu/**tests**/repository.test.ts > MenuRepository > getMenuItemsByIds > should throw error on database failure
[menu/repository] Error fetching menu items by IDs: Error: DB error
at /home/runner/work/Gebetaa/Gebetaa/src/domains/menu/**tests**/repository.test.ts:312:29
at file:///home/runner/work/Gebetaa/Gebetaa/node*modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:145:11
at file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:915:26
at file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1243:20
at new Promise (<anonymous>)
at runWithTimeout (file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1209:10)
at file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1653:37
at Traces.$ (file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/vitest@4.0.18*@opentelemetry+api@1.9.0_@types+node@20.19.33_jiti@2.6.1_jsdom@28.1.0_lig_109b2b7b0f8561f79b9dce3a2356b642/node*modules/vitest/dist/chunks/traces.CCmnQaNT.js:142:27)
at trace (file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/vitest@4.0.18*@opentelemetry+api@1.9.0_@types+node@20.19.33_jiti@2.6.1_jsdom@28.1.0_lig_109b2b7b0f8561f79b9dce3a2356b642/node_modules/vitest/dist/chunks/test.B8ej_ZHS.js:239:21)
at runTest (file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1653:12)

stderr | src/domains/menu/**tests**/repository.test.ts > MenuRepository > getModifierGroupsByMenuItemIds > should throw error on database failure
[menu/repository] Error fetching modifier groups by menu item IDs: Error: DB error
at /home/runner/work/Gebetaa/Gebetaa/src/domains/menu/**tests**/repository.test.ts:348:29
at file:///home/runner/work/Gebetaa/Gebetaa/node*modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:145:11
at file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:915:26
at file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1243:20
at new Promise (<anonymous>)
at runWithTimeout (file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1209:10)
at file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1653:37
at Traces.$ (file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/vitest@4.0.18*@opentelemetry+api@1.9.0_@types+node@20.19.33_jiti@2.6.1_jsdom@28.1.0_lig_109b2b7b0f8561f79b9dce3a2356b642/node*modules/vitest/dist/chunks/traces.CCmnQaNT.js:142:27)
at trace (file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/vitest@4.0.18*@opentelemetry+api@1.9.0_@types+node@20.19.33_jiti@2.6.1_jsdom@28.1.0_lig_109b2b7b0f8561f79b9dce3a2356b642/node_modules/vitest/dist/chunks/test.B8ej_ZHS.js:239:21)
at runTest (file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1653:12)

stderr | src/domains/menu/**tests**/repository.test.ts > MenuRepository > getModifierOptionsByGroupIds > should throw error on database failure
[menu/repository] Error fetching modifier options by group IDs: Error: DB error
at /home/runner/work/Gebetaa/Gebetaa/src/domains/menu/**tests**/repository.test.ts:384:29
at file:///home/runner/work/Gebetaa/Gebetaa/node*modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:145:11
at file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:915:26
at file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1243:20
at new Promise (<anonymous>)
at runWithTimeout (file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1209:10)
at file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1653:37
at Traces.$ (file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/vitest@4.0.18*@opentelemetry+api@1.9.0_@types+node@20.19.33_jiti@2.6.1_jsdom@28.1.0_lig_109b2b7b0f8561f79b9dce3a2356b642/node*modules/vitest/dist/chunks/traces.CCmnQaNT.js:142:27)
at trace (file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/vitest@4.0.18*@opentelemetry+api@1.9.0_@types+node@20.19.33_jiti@2.6.1_jsdom@28.1.0_lig_109b2b7b0f8561f79b9dce3a2356b642/node_modules/vitest/dist/chunks/test.B8ej_ZHS.js:239:21)
at runTest (file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1653:12)

stderr | src/domains/menu/**tests**/repository.test.ts > MenuRepository > getCategoriesByIds > should throw error on database failure
[menu/repository] Error fetching categories by IDs: Error: DB error
at /home/runner/work/Gebetaa/Gebetaa/src/domains/menu/**tests**/repository.test.ts:419:29
at file:///home/runner/work/Gebetaa/Gebetaa/node*modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:145:11
at file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:915:26
at file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1243:20
at new Promise (<anonymous>)
at runWithTimeout (file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1209:10)
at file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1653:37
at Traces.$ (file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/vitest@4.0.18*@opentelemetry+api@1.9.0_@types+node@20.19.33_jiti@2.6.1_jsdom@28.1.0_lig_109b2b7b0f8561f79b9dce3a2356b642/node*modules/vitest/dist/chunks/traces.CCmnQaNT.js:142:27)
at trace (file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/vitest@4.0.18*@opentelemetry+api@1.9.0_@types+node@20.19.33_jiti@2.6.1_jsdom@28.1.0_lig_109b2b7b0f8561f79b9dce3a2356b642/node_modules/vitest/dist/chunks/test.B8ej_ZHS.js:239:21)
at runTest (file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1653:12)

stderr | src/domains/menu/**tests**/repository.test.ts > MenuRepository > getModifierGroupsByIds > should throw error on database failure
[menu/repository] Error fetching modifier groups by IDs: Error: DB error
at /home/runner/work/Gebetaa/Gebetaa/src/domains/menu/**tests**/repository.test.ts:454:29
at file:///home/runner/work/Gebetaa/Gebetaa/node*modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:145:11
at file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:915:26
at file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1243:20
at new Promise (<anonymous>)
at runWithTimeout (file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1209:10)
at file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1653:37
at Traces.$ (file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/vitest@4.0.18*@opentelemetry+api@1.9.0_@types+node@20.19.33_jiti@2.6.1_jsdom@28.1.0_lig_109b2b7b0f8561f79b9dce3a2356b642/node*modules/vitest/dist/chunks/traces.CCmnQaNT.js:142:27)
at trace (file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/vitest@4.0.18*@opentelemetry+api@1.9.0_@types+node@20.19.33_jiti@2.6.1_jsdom@28.1.0_lig_109b2b7b0f8561f79b9dce3a2356b642/node_modules/vitest/dist/chunks/test.B8ej_ZHS.js:239:21)
at runTest (file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1653:12)

stderr | src/domains/menu/**tests**/repository.test.ts > MenuRepository > getModifierOptionsByIds > should throw error on database failure
[menu/repository] Error fetching modifier options by IDs: Error: DB error
at /home/runner/work/Gebetaa/Gebetaa/src/domains/menu/**tests**/repository.test.ts:489:29
at file:///home/runner/work/Gebetaa/Gebetaa/node*modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:145:11
at file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:915:26
at file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1243:20
at new Promise (<anonymous>)
at runWithTimeout (file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1209:10)
at file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1653:37
at Traces.$ (file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/vitest@4.0.18*@opentelemetry+api@1.9.0_@types+node@20.19.33_jiti@2.6.1_jsdom@28.1.0_lig_109b2b7b0f8561f79b9dce3a2356b642/node*modules/vitest/dist/chunks/traces.CCmnQaNT.js:142:27)
at trace (file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/vitest@4.0.18*@opentelemetry+api@1.9.0_@types+node@20.19.33_jiti@2.6.1_jsdom@28.1.0_lig_109b2b7b0f8561f79b9dce3a2356b642/node_modules/vitest/dist/chunks/test.B8ej_ZHS.js:239:21)
at runTest (file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1653:12)

✓ src/domains/menu/**tests**/repository.test.ts (36 tests) 72ms
✓ src/lib/sync/**tests**/orderSync.test.ts (25 tests) 36ms
stderr | src/lib/payments/**tests**/telebirr.test.ts > verifyTelebirrWebhookSignature > should return false when app key is missing
[Telebirr] Missing app key for webhook verification

stderr | src/lib/payments/**tests**/telebirr.test.ts > verifyTelebirrWebhookSignature > should return false when payload is invalid JSON
[Telebirr] Webhook signature verification failed: SyntaxError: Unexpected token 'o', "not valid json" is not valid JSON
at JSON.parse (<anonymous>)
at verifyTelebirrWebhookSignature (/home/runner/work/Gebetaa/Gebetaa/src/lib/payments/telebirr.ts:137:29)
at /home/runner/work/Gebetaa/Gebetaa/src/lib/payments/**tests**/telebirr.test.ts:463:24
at file:///home/runner/work/Gebetaa/Gebetaa/node*modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:145:11
at file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:915:26
✓ src/lib/payments/**tests**/telebirr.test.ts (34 tests) 41ms
at file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1243:20
at new Promise (<anonymous>)
at runWithTimeout (file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1209:10)
at file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1653:37
at Traces.$ (file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/vitest@4.0.18*@opentelemetry+api@1.9.0_@types+node@20.19.33_jiti@2.6.1_jsdom@28.1.0_lig_109b2b7b0f8561f79b9dce3a2356b642/node_modules/vitest/dist/chunks/traces.CCmnQaNT.js:142:27)

stderr | src/lib/payments/**tests**/telebirr.test.ts > verifyTelebirrWebhookSignature > should return false when signature is missing in payload
[Telebirr] No signature in webhook payload

✓ src/lib/printer/**tests**/transaction-print.test.ts (30 tests) 19ms
✓ src/lib/printer/**tests**/escpos.test.ts (39 tests) 23ms
stderr | src/lib/notifications/**tests**/sms.test.ts > SMS notifications > sendSms with log provider > should return success with log provider by default
[SMS:log] { toPhone: '+251911123456', message: 'Test message' }

stderr | src/lib/notifications/**tests**/sms.test.ts > SMS notifications > sendOrderStatusSms > should build preparing message and send
[SMS:log] {
toPhone: '+251911123456',
message: 'Gebeta: Order ORD-001 is now being prepared.'
}

stderr | src/lib/notifications/**tests**/sms.test.ts > SMS notifications > sendOrderStatusSms > should build ready message and send
[SMS:log] {
toPhone: '+251911123456',
message: 'Gebeta: Order ORD-001 is ready for pickup/service.'
}

stderr | src/lib/notifications/**tests**/sms.test.ts > SMS notifications > sendOrderStatusSms > should build served message and send
[SMS:log] {
toPhone: '+251911123456',
message: 'Gebeta: Order ORD-001 has been completed. Thank you.'
}

stderr | src/lib/notifications/**tests**/sms.test.ts > SMS notifications > sendOrderStatusSms > should build completed message and send
[SMS:log] {
toPhone: '+251911123456',
message: 'Gebeta: Order ORD-001 has been completed. Thank you.'
}

stderr | src/lib/notifications/**tests**/sms.test.ts > SMS notifications > sendOrderStatusSms > should build cancelled message and send
[SMS:log] {
toPhone: '+251911123456',
message: 'Gebeta: Order ORD-001 was cancelled.'
}

stderr | src/lib/notifications/**tests**/sms.test.ts > SMS notifications > sendOrderStatusSms > should build default message for unknown status
[SMS:log] {
toPhone: '+251911123456',
message: 'Gebeta: Order ORD-001 status is now pending.'
}

stderr | src/lib/notifications/**tests**/sms.test.ts > SMS notifications > resolveSmsProvider > should default to log provider for unknown provider name
[SMS:log] { toPhone: '+251911123456', message: 'Test' }

✓ src/lib/notifications/**tests**/sms.test.ts (27 tests) 37ms
✓ src/lib/**tests**/rate-limit.test.ts (20 tests) 39ms
✓ src/lib/errors/**tests**/sanitize.test.ts (47 tests) 23ms
✓ src/lib/offlineQueue.test.ts (21 tests) 110ms
✓ src/lib/devices/**tests**/schema-compat.test.ts (50 tests) 26ms
stderr | src/lib/services/chapaService.test.ts > chapaService > listChapaBanks > returns normalized and sorted list of banks
Fetching banks from Chapa API...

stderr | src/lib/services/chapaService.test.ts > chapaService > listChapaBanks > returns normalized and sorted list of banks
Chapa banks API response: {
status: 200,
ok: true,
payloadStatus: 'success',
payloadMessage: 'Banks retrieved',
dataLength: 3
}
Parsed 3 valid banks from Chapa response

stderr | src/lib/services/chapaService.test.ts > chapaService > listChapaBanks > filters out banks without id or name
Fetching banks from Chapa API...

stderr | src/lib/services/chapaService.test.ts > chapaService > listChapaBanks > filters out banks without id or name
Chapa banks API response: {
status: 200,
ok: true,
payloadStatus: 'success',
payloadMessage: undefined,
dataLength: 3
}
Parsed 1 valid banks from Chapa response

stderr | src/lib/services/chapaService.test.ts > chapaService > listChapaBanks > throws when response is not ok
Fetching banks from Chapa API...

stderr | src/lib/services/chapaService.test.ts > chapaService > listChapaBanks > throws when response is not ok
Chapa banks API response: {
status: 401,
ok: false,
payloadStatus: undefined,
payloadMessage: 'Unauthorized',
dataLength: 0
}
Chapa banks API error: Unauthorized

stderr | src/lib/services/chapaService.test.ts > chapaService > listChapaBanks > throws when data is not an array
Fetching banks from Chapa API...

stderr | src/lib/services/chapaService.test.ts > chapaService > listChapaBanks > throws when data is not an array
Chapa banks API response: {
status: 200,
ok: true,
payloadStatus: 'success',
payloadMessage: undefined,
dataLength: 0
}
Chapa banks API error: Failed to load Chapa banks (status: 200)

stderr | src/lib/services/chapaService.test.ts > chapaService > createChapaSubaccount > returns success response with subaccount id
Creating Chapa subaccount with params: {
business_name: 'Test Restaurant',
account_name: 'Abebe Kebede',
bank_code: 'AB',
split_type: 'percentage',
split_value: 3
}

stderr | src/lib/services/chapaService.test.ts > chapaService > createChapaSubaccount > returns success response with subaccount id
Chapa subaccount API response: {
httpStatus: 200,
ok: true,
status: 'success',
message: 'Subaccount created',
dataId: 'sub-123',
fullData: { id: 'sub-123' }
}

stderr | src/lib/services/chapaService.test.ts > chapaService > createChapaSubaccount > defaults status to failed when response is not ok
Creating Chapa subaccount with params: {
business_name: 'Test Restaurant',
account_name: 'Abebe Kebede',
bank_code: 'AB',
split_type: 'percentage',
split_value: 3
}

stderr | src/lib/services/chapaService.test.ts > chapaService > createChapaSubaccount > defaults status to failed when response is not ok
Chapa subaccount API response: {
httpStatus: 422,
ok: false,
status: undefined,
message: 'Invalid account number',
dataId: undefined,
fullData: undefined
}

stderr | src/lib/services/chapaService.test.ts > chapaService > createChapaSubaccount > uses ok status to infer success when status field missing
Creating Chapa subaccount with params: {
business_name: 'Test Restaurant',
account_name: 'Abebe Kebede',
bank_code: 'AB',
split_type: 'percentage',
split_value: 3
}

stderr | src/lib/services/chapaService.test.ts > chapaService > createChapaSubaccount > uses ok status to infer success when status field missing
Chapa subaccount API response: {
httpStatus: 200,
ok: true,
status: undefined,
message: 'Created',
dataId: 'sub-456',
fullData: { id: 'sub-456' }
}

✓ src/lib/services/chapaService.test.ts (29 tests) 46ms
✓ src/lib/payments/payment-sessions.test.ts (19 tests) 26ms
✓ src/lib/fiscal/**tests**/mor-client.test.ts (19 tests) 13ms
✓ src/lib/notifications/**tests**/deduplication.test.ts (46 tests) 27ms
✓ src/lib/graphql/**tests**/authz.test.ts (21 tests) 15ms
✓ src/lib/api/**tests**/errors.test.ts (43 tests) 24ms
stderr | src/lib/services/orderService.test.ts > orderService > checkRateLimit > fails open when database errors
[RateLimit] Failed to check: { message: 'DB error' }

stderr | src/lib/services/orderService.test.ts > orderService > checkDuplicateOrder > returns null when query errors
[OrderService] Failed to check duplicate: { message: 'DB error' }

✓ src/lib/services/orderService.test.ts (20 tests) 18ms
✓ src/lib/discounts/service.test.ts (16 tests) 17ms
✓ src/app/api/**tests**/payment-sessions.route.test.ts (2 tests) 18ms
stderr | src/lib/sync/**tests**/idempotency.test.ts > Idempotency Key Manager > queueSyncOperation > should return empty string when PowerSync is not available
[2026-04-14T15:11:31.411Z] [WARN] [app] [SyncQueue] PowerSync not initialized {}

✓ src/lib/sync/**tests**/idempotency.test.ts (23 tests) 31ms
✓ src/lib/events/**tests**/contract.test.ts (15 tests) 10ms
✓ src/lib/validators/menu.test.ts (26 tests) 12ms
stderr | src/lib/security/securityEvents.test.ts > securityEvents > logSecurityEvent > does not throw when insert errors
Error: 39m[2026-04-14T15:11:32.635Z] [ERROR] [app] Failed to log security event { error: { message: 'DB fail' } }

stderr | src/lib/security/securityEvents.test.ts > securityEvents > logSecurityEvent > triggers alert for critical severity immediately
[2026-04-14T15:11:32.638Z] [WARN] [app] SECURITY ALERT: auth_failure [CRITICAL]
Restaurant: N/A
User: Anonymous
IP: 192.168.1.1
Occurrences: 1
Details: undefined {}

stderr | src/lib/security/securityEvents.test.ts > securityEvents > detectBruteForce > returns true when at or above threshold
[2026-04-14T15:11:32.641Z] [WARN] [app] SECURITY ALERT: brute_force_detected [HIGH]
Restaurant: N/A
User: user@example.com
IP: unknown
Occurrences: 5
Details: {"action":"login","attempt_count":5} {}

stderr | src/lib/security/securityEvents.test.ts > securityEvents > detectBruteForce > returns false on query error (fail open)
Error: 39m[2026-04-14T15:11:32.642Z] [ERROR] [app] Failed to check brute force { error: { message: 'Timeout' } }

stderr | src/lib/security/securityEvents.test.ts > securityEvents > checkTenantIsolation > returns invalid on database error
Error: 39m[2026-04-14T15:11:32.645Z] [ERROR] [app] Failed to check tenant isolation { error: { message: 'Query failed' } }

stderr | src/lib/security/securityEvents.test.ts > securityEvents > logInvalidSignatureAttempt > does not throw on logging failure
Error: 39m[2026-04-14T15:11:32.647Z] [ERROR] [app] Failed to log security event { error: { message: 'fail' } }

✓ src/lib/security/securityEvents.test.ts (16 tests) 24ms
↓ src/lib/supabase/**tests**/view-security-invoker.test.ts (15 tests | 15 skipped)
✓ src/lib/devices/**tests**/config.test.ts (41 tests) 15ms
stderr | src/app/api/**tests**/table-session-lifecycle.integration.test.ts > Table session lifecycle integration > rejects opening a table session when one is already open
Error: 6-04-14T15:11:33.963Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: '7dedab25-b495-4d21-b85c-3862fd10bf28',
error: 'Table already has an open session'
✓ src/app/api/**tests**/table-session-lifecycle.integration.test.ts (3 tests) 26ms
}

stderr | src/app/api/**tests**/table-session-lifecycle.integration.test.ts > Table session lifecycle integration > rejects transfer when destination table already has open session
Error: 6-04-14T15:11:33.968Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: '48d2fb7c-db96-4303-9644-b4686af10484',
error: 'Destination table already has an open session'
}

✓ src/lib/db/**tests**/repository-base.test.ts (30 tests) 34ms
✓ src/lib/monitoring/alerts.test.ts (16 tests) 28ms
✓ src/lib/validators/order.test.ts (25 tests) 19ms
✓ src/lib/payments/chapa.test.ts (18 tests) 18ms
stderr | src/app/api/**tests**/kds-api-routes.test.ts > KDS API routes > GET /api/kds/queue returns 401 when unauthorized
Error: 6-04-14T15:11:35.522Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: 'bdf23db7-be03-401f-b9b7-388fc8c56b8c',
error: 'Unauthorized'
}

stderr | src/app/api/**tests**/kds-api-routes.test.ts > KDS API routes > GET /api/kds/queue returns 400 for invalid query
Error: 6-04-14T15:11:35.537Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: '931f2b4a-ee78-4b5d-9d74-28c0e2c87e14',
error: 'Invalid query params'
}

stderr | src/app/api/**tests**/kds-api-routes.test.ts > KDS API routes > POST /api/kds/items/:id/action returns 401 when unauthorized
Error: 6-04-14T15:11:35.548Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: 'c1fa3fe6-5130-43b3-8104-5a51267c6cfa',
error: 'Unauthorized'
}

stderr | src/app/api/**tests**/kds-api-routes.test.ts > KDS API routes > POST /api/kds/items/:id/action returns 400 for invalid payload
Error: 6-04-14T15:11:35.552Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: '1d1a78cd-a8b8-4d58-ba55-dda96a83388d',
error: 'Invalid request payload'
}

stderr | src/app/api/**tests**/kds-api-routes.test.ts > KDS API routes > POST /api/kds/items/:id/action returns 400 for invalid idempotency key
Error: 6-04-14T15:11:35.553Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: '8847ebae-269f-4734-9883-c9556e2d6846',
error: 'Invalid idempotency key'
}

✓ src/app/api/**tests**/kds-api-routes.test.ts (7 tests) 35ms
✓ src/lib/format/**tests**/et.test.ts (40 tests) 37ms
stderr | src/lib/**tests**/audit.integration.test.ts > audit integration tests > logServiceRoleAudit > should handle Supabase insert errors gracefully
[AUDIT] Failed to write service role audit log: { message: 'Database error', code: 'INSERT_FAILED' }

stderr | src/lib/**tests**/audit.integration.test.ts > audit integration tests > logServiceRoleAudit > should handle missing configuration gracefully
[AUDIT] Missing Supabase configuration for audit logging

stderr | src/lib/**tests**/audit.integration.test.ts > audit integration tests > logServiceRoleAudit > should handle missing configuration gracefully
[AUDIT] Failed to write service role audit log: { message: 'Database error', code: 'INSERT_FAILED' }

stderr | src/lib/**tests**/audit.integration.test.ts > audit integration tests > logServiceRoleAudit > should handle exceptions without throwing
[AUDIT] Exception in service role audit logging: Error: Client initialization failed
at /home/runner/work/Gebetaa/Gebetaa/src/lib/**tests**/audit.integration.test.ts:166:23
at Mock (file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+spy@4.0.18/node_modules/@vitest/spy/dist/index.js:285:34)
at createAuditClient (/home/runner/work/Gebetaa/Gebetaa/src/lib/audit.ts:60:12)
at Module.logServiceRoleAudit (/home/runner/work/Gebetaa/Gebetaa/src/lib/audit.ts:94:26)
at /home/runner/work/Gebetaa/Gebetaa/src/lib/**tests**/audit.integration.test.ts:178:34
at file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:145:11
at file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:915:26
at file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1243:20
at new Promise (<anonymous>)
at runWithTimeout (file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1209:10)

✓ src/lib/**tests**/audit.integration.test.ts (13 tests) 31ms
✓ src/lib/sync/**tests**/sync-conflict-resolution.test.ts (15 tests) 31ms
stderr | src/lib/services/offlineOrderThrottle.test.ts > offlineOrderThrottle > getEstimatedWaitTime > returns base time on database error
Failed to count active orders: Error: DB error
at Object.<anonymous> (/home/runner/work/Gebetaa/Gebetaa/src/lib/services/offlineOrderThrottle.test.ts:259:70)
at Object.Mock (file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+spy@4.0.18/node_modules/@vitest/spy/dist/index.js:285:34)
at Module.getEstimatedWaitTime (/home/runner/work/Gebetaa/Gebetaa/src/lib/services/offlineOrderThrottle.ts:208:10)
at processTicksAndRejections (node:internal/process/task_queues:103:5)
at /home/runner/work/Gebetaa/Gebetaa/src/lib/services/offlineOrderThrottle.test.ts:263:30
at file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:915:20

✓ src/lib/services/offlineOrderThrottle.test.ts (11 tests) 24ms
stderr | src/lib/notifications/sms.test.ts > sms > sendSms - log provider (default) > succeeds with log provider when SMS_PROVIDER is not set
[SMS:log] { toPhone: '+251911234567', message: 'Test message' }

stderr | src/lib/notifications/sms.test.ts > sms > sendSms - log provider (default) > normalizes phone by stripping whitespace
[SMS:log] { toPhone: '+251911234567', message: 'Test message' }

stderr | src/lib/notifications/sms.test.ts > sms > sendOrderStatusSms > sends with "preparing" message
[SMS:log] {
toPhone: '+251911111111',
message: 'Gebeta: Order ORD-001 is now being prepared.'
}

stderr | src/lib/notifications/sms.test.ts > sms > sendOrderStatusSms > sends with "ready" message
[SMS:log] {
toPhone: '+251911111111',
message: 'Gebeta: Order ORD-002 is ready for pickup/service.'
}

stderr | src/lib/notifications/sms.test.ts > sms > sendOrderStatusSms > sends with "completed" message for served status
[SMS:log] {
toPhone: '+251911111111',
message: 'Gebeta: Order ORD-003 has been completed. Thank you.'
}

stderr | src/lib/notifications/sms.test.ts > sms > sendOrderStatusSms > sends with "cancelled" message
[SMS:log] {
toPhone: '+251911111111',
message: 'Gebeta: Order ORD-004 was cancelled.'
}

stderr | src/lib/notifications/sms.test.ts > sms > sendOrderStatusSms > sends with generic status message for unknown status
[SMS:log] {
toPhone: '+251911111111',
message: 'Gebeta: Order ORD-005 status is now dispatched.'
}

✓ src/lib/notifications/sms.test.ts (17 tests) 17ms
✓ src/lib/fiscal/**tests**/offline-queue.test.ts (16 tests) 20ms
✓ src/lib/discounts/calculator.test.ts (17 tests) 9ms
✓ src/lib/devices/**tests**/pairing.test.ts (30 tests) 17ms
✓ src/app/api/sync/**tests**/route.test.ts (3 tests) 106ms
✓ src/lib/graphql/**tests**/errors.test.ts (22 tests) 17ms
✓ src/lib/security/sessionStore.test.ts (15 tests) 10ms
✓ src/lib/sync/stale-device-monitor.test.ts (14 tests) 15ms
✓ src/lib/devices/**tests**/shell.test.ts (22 tests) 10ms
stderr | src/app/api/**tests**/guest-policy-hardening.integration.test.ts > Guest policy hardening integration
Missing secrets: { hasUrl: true, hasPublishableKey: false, hasServiceRoleKey: false }
Skipping policy hardening tests: Supabase secrets not configured

stderr | src/app/api/**tests**/guest-policy-hardening.integration.test.ts > Guest policy hardening integration > orders policy rejects insert without idempotency_key
Skipping test: testsShouldRun= false

✓ src/app/api/**tests**/guest-policy-hardening.integration.test.ts (7 tests) 6ms
✓ src/lib/payments/**tests**/adapters.test.ts (17 tests) 19ms
✓ src/lib/payments/payment-event-consumer.test.ts (2 tests) 7ms
✓ src/lib/devices/**tests**/ota.test.ts (23 tests) 8ms
stderr | src/hooks/**tests**/useStaff.test.ts > useStaff > should handle fetch error
Error: Server error
at /home/runner/work/Gebetaa/Gebetaa/src/hooks/useStaff.ts:82:23

✓ src/hooks/**tests**/useStaff.test.ts (6 tests) 304ms
stderr | src/app/api/**tests**/staff-and-device-provisioning.route.test.ts > staff and device provisioning routes > POST /api/devices/provision returns a migration-specific error for terminal constraint mismatch
Error: 6-04-14T15:11:43.676Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: '78a0fe57-4fc9-4643-bbbe-2dda5a56983c',
error: 'Terminal provisioning requires the latest database migration. Apply the new hardware device migration and try again.'
}

✓ src/app/api/**tests**/staff-and-device-provisioning.route.test.ts (3 tests) 23ms
✓ src/lib/api/**tests**/versioning.test.ts (26 tests) 14ms
✓ src/lib/api/**tests**/response.test.ts (22 tests) 22ms
✓ src/lib/i18n/**tests**/locale.test.ts (39 tests) 10ms
stderr | src/lib/errorHandler.test.ts > handleApiError > should handle AppError correctly
Error: 39m[2026-04-14T15:11:45.008Z] [ERROR] [app] [6bcbfd41-9dee-4b60-b00f-4230e7ba6853] Test Context {
statusCode: 404,
userMessage: 'Resource not found',
internalMessage: 'The requested item does not exist in the database',
code: 'NOT*FOUND',
error: {
name: 'AppError',
message: 'Resource not found',
stack: 'AppError: Resource not found\n' +
' at /home/runner/work/Gebetaa/Gebetaa/src/lib/errorHandler.test.ts:32:26\n' +
' at file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:145:11\n' +
' at file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:915:26\n' +
' at file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1243:20\n' +
' at new Promise (<anonymous>)\n' +
' at runWithTimeout (file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1209:10)\n' +
' at file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1653:37\n' +
' at Traces.$ (file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/vitest@4.0.18*@opentelemetry+api@1.9.0_@types+node@20.19.33_jiti@2.6.1_jsdom@28.1.0_lig_109b2b7b0f8561f79b9dce3a2356b642/node*modules/vitest/dist/chunks/traces.CCmnQaNT.js:142:27)\n' +
' at trace (file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/vitest@4.0.18*@opentelemetry+api@1.9.0_@types+node@20.19.33_jiti@2.6.1_jsdom@28.1.0_lig_109b2b7b0f8561f79b9dce3a2356b642/node_modules/vitest/dist/chunks/test.B8ej_ZHS.js:239:21)\n' +
' at runTest (file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1653:12)'
}
}

stderr | src/lib/errorHandler.test.ts > handleApiError > should return sanitized error for AppError
Error: 39m[2026-04-14T15:11:45.015Z] [ERROR] [app] [40761781-8f6e-404b-b9e0-d8f1483a8608] Test Context {
statusCode: 500,
userMessage: 'Something went wrong',
internalMessage: 'Internal database connection failed',
code: 'DB*ERROR',
error: {
name: 'AppError',
message: 'Something went wrong',
stack: 'AppError: Something went wrong\n' +
' at /home/runner/work/Gebetaa/Gebetaa/src/lib/errorHandler.test.ts:46:26\n' +
' at file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:145:11\n' +
' at file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:915:26\n' +
' at file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1243:20\n' +
' at new Promise (<anonymous>)\n' +
' at runWithTimeout (file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1209:10)\n' +
' at file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1653:37\n' +
' at Traces.$ (file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/vitest@4.0.18*@opentelemetry+api@1.9.0_@types+node@20.19.33_jiti@2.6.1_jsdom@28.1.0_lig_109b2b7b0f8561f79b9dce3a2356b642/node*modules/vitest/dist/chunks/traces.CCmnQaNT.js:142:27)\n' +
' at trace (file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/vitest@4.0.18*@opentelemetry+api@1.9.0_@types+node@20.19.33_jiti@2.6.1_jsdom@28.1.0_lig_109b2b7b0f8561f79b9dce3a2356b642/node_modules/vitest/dist/chunks/test.B8ej_ZHS.js:239:21)\n' +
' at runTest (file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1653:12)'
}
}

stderr | src/lib/errorHandler.test.ts > handleApiError > should handle Zod validation errors
Error: 39m[2026-04-14T15:11:45.025Z] [ERROR] [app] [ee26955e-9678-4861-bfae-80644068352e] Validation Test - Validation Error {
error: [
{
path: 'name',
message: 'Too small: expected string to have >=1 characters'
},
{ path: 'age', message: 'Too small: expected number to be >0' }
]
}

stderr | src/lib/errorHandler.test.ts > handleApiError > should handle standard Error objects
Error: 39m[2026-04-14T15:11:45.026Z] [ERROR] [app] [86f0a2cc-5d55-449b-9465-5e6956d70114] Standard Error Test {
error: {
name: 'Error',
message: 'Something broke',
stack: 'Error: Something broke\n' +
' at /home/runner/work/Gebetaa/Gebetaa/src/lib/errorHandler.test.ts:85:23\n' +
' at file:///home/runner/work/Gebetaa/Gebetaa/node*modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:145:11\n' +
' at file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:915:26\n' +
' at file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1243:20\n' +
' at new Promise (<anonymous>)\n' +
' at runWithTimeout (file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1209:10)\n' +
' at file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1653:37\n' +
' at Traces.$ (file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/vitest@4.0.18*@opentelemetry+api@1.9.0_@types+node@20.19.33_jiti@2.6.1_jsdom@28.1.0_lig_109b2b7b0f8561f79b9dce3a2356b642/node*modules/vitest/dist/chunks/traces.CCmnQaNT.js:142:27)\n' +
' at trace (file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/vitest@4.0.18*@opentelemetry+api@1.9.0_@types+node@20.19.33_jiti@2.6.1_jsdom@28.1.0_lig_109b2b7b0f8561f79b9dce3a2356b642/node_modules/vitest/dist/chunks/test.B8ej_ZHS.js:239:21)\n' +
' at runTest (file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1653:12)'
}
}

stderr | src/lib/errorHandler.test.ts > handleApiError > should handle unknown errors
Error: 39m[2026-04-14T15:11:45.027Z] [ERROR] [app] [8acc6584-99fb-4360-b71d-1e3a8df72269] Unknown Error Test - Unknown error { error: 'just a string error' }

stderr | src/lib/errorHandler.test.ts > handleApiError > should include requestId in all error responses
Error: 39m[2026-04-14T15:11:45.028Z] [ERROR] [app] [c24fd8da-a452-4b2e-a4f4-2064f6957b4d] Test {
statusCode: 400,
userMessage: 'Bad Request',
internalMessage: undefined,
code: undefined,
error: {
name: 'AppError',
message: 'Bad Request',
stack: 'AppError: Bad Request\n' +
' at /home/runner/work/Gebetaa/Gebetaa/src/lib/errorHandler.test.ts:110:13\n' +
' at file:///home/runner/work/Gebetaa/Gebetaa/node*modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:145:11\n' +
' at file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:915:26\n' +
' at file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1243:20\n' +
' at new Promise (<anonymous>)\n' +
' at runWithTimeout (file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1209:10)\n' +
' at file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1653:37\n' +
' at Traces.$ (file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/vitest@4.0.18*@opentelemetry+api@1.9.0_@types+node@20.19.33_jiti@2.6.1_jsdom@28.1.0_lig_109b2b7b0f8561f79b9dce3a2356b642/node*modules/vitest/dist/chunks/traces.CCmnQaNT.js:142:27)\n' +
' at trace (file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/vitest@4.0.18*@opentelemetry+api@1.9.0_@types+node@20.19.33_jiti@2.6.1_jsdom@28.1.0_lig_109b2b7b0f8561f79b9dce3a2356b642/node_modules/vitest/dist/chunks/test.B8ej_ZHS.js:239:21)\n' +
' at runTest (file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1653:12)'
}
}

stderr | src/lib/errorHandler.test.ts > handleApiError > should include requestId in all error responses
Error: 39m[2026-04-14T15:11:45.030Z] [ERROR] [app] [c5e9f2ac-3141-4d49-91a7-07eed09c3e82] Test {
error: {
name: 'Error',
message: 'Generic error',
stack: 'Error: Generic error\n' +
' at /home/runner/work/Gebetaa/Gebetaa/src/lib/errorHandler.test.ts:111:13\n' +
' at file:///home/runner/work/Gebetaa/Gebetaa/node*modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:145:11\n' +
' at file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:915:26\n' +
' at file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1243:20\n' +
' at new Promise (<anonymous>)\n' +
' at runWithTimeout (file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1209:10)\n' +
' at file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1653:37\n' +
' at Traces.$ (file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/vitest@4.0.18*@opentelemetry+api@1.9.0_@types+node@20.19.33_jiti@2.6.1_jsdom@28.1.0_lig_109b2b7b0f8561f79b9dce3a2356b642/node*modules/vitest/dist/chunks/traces.CCmnQaNT.js:142:27)\n' +
' at trace (file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/vitest@4.0.18*@opentelemetry+api@1.9.0_@types+node@20.19.33_jiti@2.6.1_jsdom@28.1.0_lig_109b2b7b0f8561f79b9dce3a2356b642/node_modules/vitest/dist/chunks/test.B8ej_ZHS.js:239:21)\n' +
' at runTest (file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:1653:12)'
}
}

stderr | src/lib/errorHandler.test.ts > handleApiError > should include requestId in all error responses
Error: 39m[2026-04-14T15:11:45.030Z] [ERROR] [app] [b5423743-b772-4639-b5e6-83b16f478dbc] Test - Unknown error { error: 'string error' }

stderr | src/lib/errorHandler.test.ts > handleApiError > should include requestId in all error responses
Error: 39m[2026-04-14T15:11:45.031Z] [ERROR] [app] [168b0003-9dbf-43f2-b39c-61df05e059cd] Test - Unknown error { error: null }

stderr | src/lib/errorHandler.test.ts > handleApiError > should include requestId in all error responses
Error: 39m[2026-04-14T15:11:45.031Z] [ERROR] [app] [f8ac286c-9733-4b84-9483-e4f6d99626ec] Test - Unknown error {}

stderr | src/lib/errorHandler.test.ts > safeParseJson > should return NextResponse for invalid JSON
Error: 39m[2026-04-14T15:11:45.040Z] [ERROR] [app] Failed to parse JSON body {
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
' at safeParseJson (/home/runner/work/Gebetaa/Gebetaa/src/lib/errorHandler.ts:92:16)\n' +
' at /home/runner/work/Gebetaa/Gebetaa/src/lib/errorHandler.test.ts:144:24\n' +
' at file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:915:20'
}
}

stderr | src/lib/errorHandler.test.ts > safeParseJson > should return error message for invalid JSON
Error: 39m[2026-04-14T15:11:45.041Z] [ERROR] [app] Failed to parse JSON body {
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
' at safeParseJson (/home/runner/work/Gebetaa/Gebetaa/src/lib/errorHandler.ts:92:16)\n' +
' at /home/runner/work/Gebetaa/Gebetaa/src/lib/errorHandler.test.ts:155:24\n' +
' at file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:915:20'
}
}

stderr | src/lib/errorHandler.test.ts > safeParseJson > should handle empty body
Error: 39m[2026-04-14T15:11:45.042Z] [ERROR] [app] Failed to parse JSON body {
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
' at safeParseJson (/home/runner/work/Gebetaa/Gebetaa/src/lib/errorHandler.ts:92:16)\n' +
' at /home/runner/work/Gebetaa/Gebetaa/src/lib/errorHandler.test.ts:168:24\n' +
' at file:///home/runner/work/Gebetaa/Gebetaa/node_modules/.pnpm/@vitest+runner@4.0.18/node_modules/@vitest/runner/dist/index.js:915:20'
}
}

✓ src/lib/errorHandler.test.ts (13 tests) 46ms
✓ src/lib/fetchUtils.test.ts (16 tests) 16ms
✓ src/lib/security/passwordPolicy.test.ts (18 tests) 12ms
✓ src/domains/orders/**tests**/service.test.ts (19 tests) 93ms
✓ src/lib/notifications/**tests**/retry.test.ts (18 tests) 9ms
stderr | src/app/api/**tests**/p2-revenue-api-routes.test.ts > P2 revenue API routes > GET /api/loyalty/programs returns 401 when unauthorized
Error: 6-04-14T15:11:47.342Z] [ERROR] [app] [Error] {
✓ src/domains/orders/**tests**/repository.test.ts (12 tests) 46ms
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: 'b36d7c7e-17bb-4585-b1e7-2e73099e4d50',
error: 'Unauthorized'
}

stderr | src/app/api/**tests**/p2-revenue-api-routes.test.ts > P2 revenue API routes > POST /api/loyalty/programs returns 400 for invalid payload
Error: 6-04-14T15:11:47.357Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: 'de88d929-fac4-461f-8ece-58b96491fadb',
error: 'Invalid request payload'
}

stderr | src/app/api/**tests**/p2-revenue-api-routes.test.ts > P2 revenue API routes > POST /api/loyalty/accounts/:id/adjust returns 400 for invalid id
Error: 6-04-14T15:11:47.360Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: '148ca5a3-8a05-49a1-aab2-fbe134d668e7',
error: 'Invalid account id'
}

stderr | src/app/api/**tests**/p2-revenue-api-routes.test.ts > P2 revenue API routes > GET /api/gift-cards returns 401 when unauthorized
Error: 6-04-14T15:11:47.361Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: '1cd6acd2-6b2d-435b-aa9b-295bcb8f3923',
error: 'Unauthorized'
}

stderr | src/app/api/**tests**/p2-revenue-api-routes.test.ts > P2 revenue API routes > POST /api/gift-cards returns 400 for invalid payload
Error: 6-04-14T15:11:47.364Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: '2cb89296-cf0e-4a09-9f74-b2f40bede2ae',
error: 'Invalid request payload'
}

stderr | src/app/api/**tests**/p2-revenue-api-routes.test.ts > P2 revenue API routes > POST /api/gift-cards/:id/redeem returns 400 for invalid idempotency key
Error: 6-04-14T15:11:47.365Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: '4fbec10a-2861-4bab-adde-be240c3275ab',
error: 'Invalid idempotency key'
}

stderr | src/app/api/**tests**/p2-revenue-api-routes.test.ts > P2 revenue API routes > GET /api/campaigns returns 401 when unauthorized
Error: 6-04-14T15:11:47.366Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: 'fce8c31a-00a8-4947-afd1-5e6fb565b2c2',
error: 'Unauthorized'
}

stderr | src/app/api/**tests**/p2-revenue-api-routes.test.ts > P2 revenue API routes > POST /api/campaigns returns 400 for invalid payload
Error: 6-04-14T15:11:47.368Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: 'c756635f-8b31-4002-a323-ef9e30af53cb',
error: 'Invalid request payload'
}

stderr | src/app/api/**tests**/p2-revenue-api-routes.test.ts > P2 revenue API routes > POST /api/campaigns/:id/launch returns 400 for invalid campaign id
Error: 6-04-14T15:11:47.371Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: 'c6561860-75a5-417f-b7d0-29410c38aa13',
error: 'Invalid campaign id'
}

✓ src/app/api/**tests**/p2-revenue-api-routes.test.ts (9 tests) 32ms
✓ src/lib/utils/monetary.test.ts (22 tests) 27ms
✓ src/hooks/**tests**/useReducedMotion.test.ts (6 tests) 32ms
✓ src/components/merchant/OrdersKanbanBoard.test.tsx (10 tests) 852ms
✓ renders all four columns 553ms
stderr | src/app/api/**tests**/kds-telemetry.route.test.ts > KDS telemetry API > GET /api/kds/telemetry returns 401 when unauthorized
Error: 6-04-14T15:11:49.854Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: '4d6a2e6b-bd0a-44a2-a485-3869c95fde0d',
error: 'Unauthorized'
}

✓ src/lib/errors.test.ts (19 tests) 10ms
✓ src/app/api/**tests**/kds-telemetry.route.test.ts (3 tests) 27ms
stderr | src/app/api/**tests**/kds-printer.route.test.ts > KDS printer route > POST /api/kds/orders/:id/print returns 401 when unauthorized
Error: 6-04-14T15:11:50.843Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: 'e59cc646-ab74-49b9-8fce-f17f72a33e03',
error: 'Unauthorized'
}

stderr | src/app/api/**tests**/kds-printer.route.test.ts > KDS printer route > POST /api/kds/orders/:id/print dispatches log fallback when enabled
[KDS_PRINTER_LOG] {
event: 'kds.ticket.print.v1',
event_id: '68895b10-8470-4483-85c9-14701d15ee5b',
copies: 1,
payload: {
restaurantId: 'resto-1',
orderId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
orderNumber: 'ORD-123',
tableNumber: 'T-1',
firedAt: '2026-04-14T15:11:50.863Z',
reason: 'manual_print',
items: [ [Object] ]
}
}

✓ src/app/api/**tests**/kds-printer.route.test.ts (2 tests) 26ms
✓ src/app/api/**tests**/payment-webhooks.route.test.ts (3 tests) 22ms
✓ src/hooks/**tests**/useRole.test.ts (5 tests) 256ms
stderr | src/lib/api/**tests**/pilotGate.test.ts > pilot gate phase controls > blocks non-allowlisted restaurant when p1 rollout is enabled
Error: 6-04-14T15:11:52.070Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: 'e4012526-99ef-43ae-b74d-3a1663e0d967',
error: 'Feature not enabled for this restaurant during pilot rollout'
}

stderr | src/lib/api/**tests**/pilotGate.test.ts > pilot gate phase controls > blocks p1 mutation when pilot mutation block is enabled
Error: 6-04-14T15:11:52.086Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: '3c2b867a-8177-4278-982d-dd0e394d88f7',
error: 'Pilot mutation block is enabled'
}

stderr | src/lib/api/**tests**/pilotGate.test.ts > pilot gate phase controls > blocks non-allowlisted restaurant when p2 rollout is enabled
Error: 6-04-14T15:11:52.090Z] [ERROR] [app] [Error] {
operation: 'api_error',
✓ src/lib/api/**tests**/pilotGate.test.ts (4 tests) 114ms
userId: undefined,
restaurantId: undefined,
requestId: '5378dd6b-f747-4dbf-97ee-be8efebf7431',
error: 'Feature not enabled for this restaurant during pilot rollout'
}

stderr | src/app/api/**tests**/team-ops-alerting-api-routes.test.ts > P1 Team Operations and Alerting API routes > GET /api/staff/schedule returns 401 when unauthorized
Error: 6-04-14T15:11:52.447Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: '930fb129-c9a8-475c-a523-3c2adfbc6eb8',
error: 'Unauthorized'
}

stderr | src/app/api/**tests**/team-ops-alerting-api-routes.test.ts > P1 Team Operations and Alerting API routes > POST /api/staff/schedule returns 400 for invalid payload
Error: 6-04-14T15:11:52.467Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: '157482fe-85ce-42fe-bb96-c44063201a5d',
error: 'Invalid request payload'
}

stderr | src/app/api/**tests**/team-ops-alerting-api-routes.test.ts > P1 Team Operations and Alerting API routes > POST /api/staff/time-entries/clock returns 400 for invalid payload
Error: 6-04-14T15:11:52.470Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: '5929a286-0afc-4229-9387-602e9e168069',
error: 'Invalid request payload'
}

stderr | src/app/api/**tests**/team-ops-alerting-api-routes.test.ts > P1 Team Operations and Alerting API routes > GET /api/alerts/rules returns 401 when unauthorized
Error: 6-04-14T15:11:52.474Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: '26b7d0c6-1f3b-4d40-bfd8-196a3d3e2802',
error: 'Unauthorized'
}

stderr | src/app/api/**tests**/team-ops-alerting-api-routes.test.ts > P1 Team Operations and Alerting API routes > POST /api/alerts/rules returns 400 for invalid payload
Error: 6-04-14T15:11:52.477Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: 'f317f7eb-0b32-4ee6-b75a-9b0f9ff84c56',
error: 'Invalid request payload'
}

stderr | src/app/api/**tests**/team-ops-alerting-api-routes.test.ts > P1 Team Operations and Alerting API routes > PATCH /api/alerts/rules/:id returns 400 for invalid id
Error: 6-04-14T15:11:52.479Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: '1ebf63b5-0dfd-4567-8e54-4a9c423064f0',
error: 'Invalid alert rule id'
}

stderr | src/app/api/**tests**/team-ops-alerting-api-routes.test.ts > P1 Team Operations and Alerting API routes > GET /api/merchant/dashboard-presets returns 401 when unauthorized
Error: 6-04-14T15:11:52.480Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: 'b5c053ad-a3e0-4fe0-a198-8b510cff2b5d',
error: 'Unauthorized'
}

stderr | src/app/api/**tests**/team-ops-alerting-api-routes.test.ts > P1 Team Operations and Alerting API routes > PATCH /api/merchant/dashboard-presets returns 400 for invalid payload
Error: 6-04-14T15:11:52.485Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: '44b63dc5-e552-4e78-827e-e7a2696503cc',
error: 'Invalid request payload'
}

✓ src/app/api/**tests**/team-ops-alerting-api-routes.test.ts (8 tests) 44ms
stderr | src/app/api/**tests**/channels-api-routes.test.ts > Channels API routes > GET /api/channels/summary returns 401 when unauthorized
Error: 6-04-14T15:11:52.727Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: 'fb2f42f5-99f8-4c49-b8be-e06256945a12',
error: 'Unauthorized'
}

stderr | src/app/api/**tests**/channels-api-routes.test.ts > Channels API routes > PATCH /api/channels/online-ordering/settings returns 400 for empty payload
Error: 6-04-14T15:11:52.742Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: 'eb53f550-d3ef-4d10-ac3b-75acb5c74877',
error: 'Invalid request payload'
}

stderr | src/app/api/**tests**/channels-api-routes.test.ts > Channels API routes > GET /api/channels/online-ordering/settings returns 401 when unauthorized
Error: 6-04-14T15:11:52.744Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: '2db2100f-e97a-409e-9e1e-edb11d2bed70',
error: 'Unauthorized'
}

stderr | src/app/api/**tests**/channels-api-routes.test.ts > Channels API routes > POST /api/channels/delivery/connect returns 400 for invalid payload
Error: 6-04-14T15:11:52.747Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: '9ae30667-a78f-4dd8-b204-69e91b7cfc7a',
error: 'Invalid request payload'
}

stderr | src/app/api/**tests**/channels-api-routes.test.ts > Channels API routes > GET /api/channels/delivery/orders returns 400 for invalid query
Error: 6-04-14T15:11:52.749Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: 'cb899494-fd6f-47fa-bdae-f62869e3e929',
error: 'Invalid query params'
}

stderr | src/app/api/**tests**/channels-api-routes.test.ts > Channels API routes > POST /api/channels/delivery/orders/:id/ack returns 400 for invalid id
Error: 6-04-14T15:11:52.751Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: '7211b10f-ec95-4a21-ada3-ad7c0a06a3c7',
error: 'Invalid external order id'
}

stderr | src/app/api/**tests**/channels-api-routes.test.ts > Channels API routes > POST /api/channels/delivery/orders/:id/ack returns 400 for invalid idempotency key
Error: 6-04-14T15:11:52.752Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: 'bf14a1e3-7eb6-4136-8407-d897b3c2a4d4',
error: 'Invalid idempotency key'
}

✓ src/app/api/**tests**/channels-api-routes.test.ts (7 tests) 30ms
✓ src/lib/payments/adapters.test.ts (6 tests) 11ms
✓ src/hooks/useCurrency.test.ts (14 tests) 5ms
✓ src/lib/printer/transaction-print.test.ts (2 tests) 8ms
✓ src/lib/supabase/client.test.ts (7 tests) 17ms
✓ src/lib/api/**tests**/idempotency.test.ts (17 tests) 7ms
stderr | src/app/api/**tests**/api-metrics.route.test.ts > GET /api/analytics/api-metrics > returns 401 when not authenticated
Error: 6-04-14T15:11:55.151Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: '499b33f0-d7df-41eb-9911-8016eb5c6c36',
error: 'Unauthorized'
}

✓ src/app/api/**tests**/api-metrics.route.test.ts (2 tests) 18ms
stderr | src/app/api/**tests**/happy-hour.route.test.ts > Happy Hour API > GET /api/happy-hour returns 401 when unauthorized
Error: 6-04-14T15:11:55.768Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: 'a8183ea5-ef5e-4898-8c60-edae532f46f6',
error: 'Unauthorized'
}

stderr | src/app/api/**tests**/happy-hour.route.test.ts > Happy Hour API > POST /api/happy-hour returns 401 when unauthorized
Error: 6-04-14T15:11:55.778Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: 'b170e3f7-b28d-4c1c-9eb8-d028629b7703',
error: 'Unauthorized'
}

stderr | src/app/api/**tests**/happy-hour.route.test.ts > Happy Hour API > POST /api/happy-hour returns 400 for invalid time range
Error: 6-04-14T15:11:55.787Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: 'e10a465b-3722-482d-b6a8-7dabc01ebd53',
error: 'End time must be after start time'
}

stderr | src/app/api/**tests**/happy-hour.route.test.ts > Happy Hour API > POST /api/happy-hour returns 400 when no discount provided
Error: 6-04-14T15:11:55.789Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: '17d682bd-1bd4-4df3-8253-4bd29af08af9',
error: 'Either discount_percentage or discount_fixed_amount is required'
}

✓ src/app/api/**tests**/happy-hour.route.test.ts (4 tests) 52ms
✓ src/lib/kds/printer.test.ts (3 tests) 155ms
✓ src/lib/utils.test.ts (19 tests) 42ms
stderr | src/app/api/**tests**/kds-handoff.route.test.ts > POST /api/kds/orders/:id/handoff > returns 401 when unauthorized
Error: 6-04-14T15:11:57.058Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: '6fc333ce-8da3-494f-a38c-4637a30e323c',
error: 'Unauthorized'
}

stderr | src/app/api/**tests**/kds-handoff.route.test.ts > POST /api/kds/orders/:id/handoff > returns 403 for non-expeditor roles
Error: 6-04-14T15:11:57.072Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: '3e8febfb-65f7-49d5-8c8c-50ae496fa1ae',
error: 'Final handoff is restricted to expeditor override roles'
}

✓ src/app/api/**tests**/kds-handoff.route.test.ts (2 tests) 20ms
✓ src/hooks/useFocusTrap.test.ts (7 tests) 47ms
✓ src/lib/devices/config.test.ts (5 tests) 9ms
✓ src/components/merchant/MetricCard.test.tsx (7 tests) 193ms
stderr | src/app/api/**tests**/device-ensure-open-session.route.test.ts > POST /api/device/tables/ensure-open-session > returns 401 when device token is missing/invalid
Error: 6-04-14T15:11:58.773Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: '0dbff3ec-750f-473b-b799-939d0fe1060f',
error: 'Missing device token'
}

stderr | src/app/api/**tests**/device-ensure-open-session.route.test.ts > POST /api/device/tables/ensure-open-session > returns 400 for invalid payload
Error: 6-04-14T15:11:58.788Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: '1cff09c7-466a-4d68-83ed-b7c1e4803589',
error: 'table_id or table_number is required'
}

stderr | src/app/api/**tests**/device-close-table.route.test.ts > POST /api/device/tables/close > returns 401 when device token is missing/invalid
Error: 6-04-14T15:11:58.804Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: '3995d61e-a944-4546-b4ce-31c6dbad79c4',
error: 'Missing device token'
}

stderr | src/app/api/**tests**/device-close-table.route.test.ts > POST /api/device/tables/close > returns 400 for invalid payload
Error: 6-04-14T15:11:58.817Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: '1b56d89e-7295-445c-ad75-5106657b328a',
error: 'Invalid request payload'
}

✓ src/app/api/**tests**/device-ensure-open-session.route.test.ts (2 tests) 20ms
✓ src/app/api/**tests**/device-close-table.route.test.ts (2 tests) 18ms
✓ src/lib/devices/shell.test.ts (3 tests) 6ms
stderr | src/app/api/**tests**/device-bill-request.route.test.ts > POST /api/device/tables/bill-request > returns 401 when device token is missing/invalid
Error: 6-04-14T15:12:00.100Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: '3cb5c952-db29-478d-9409-79aad0e1f123',
error: 'Missing device token'
}

stderr | src/app/api/**tests**/device-bill-request.route.test.ts > POST /api/device/tables/bill-request > returns 400 for invalid payload
Error: 6-04-14T15:12:00.112Z] [ERROR] [app] [Error] {
operation: 'api_error',
userId: undefined,
restaurantId: undefined,
requestId: 'd7e4a313-92e2-4301-a63f-b0ba1a162f06',
error: 'table_id or table_number is required'
}

✓ src/lib/devices/pairing.test.ts (5 tests) 7ms
✓ src/app/api/**tests**/device-bill-request.route.test.ts (2 tests) 17ms
✓ src/components/merchant/RevenueChart.test.tsx (3 tests) 53ms
✓ src/lib/printer/escpos.test.ts (1 test) 6ms
✓ src/lib/format/et.test.ts (3 tests) 27ms
✓ src/lib/devices/ota.test.ts (3 tests) 3ms
✓ src/integration/app-smoke.test.tsx (1 test) 3ms
✓ src/components/**tests**/smoke.test.tsx (1 test) 26ms

Test Files 105 passed | 1 skipped (106)
Tests 1890 passed | 15 skipped (1905)
Start at 15:11:17
Duration 45.86s (transform 3.64s, setup 17.24s, import 10.04s, tests 4.71s, environment 77.27s)

% Coverage report from v8
-------------------|---------|----------|---------|---------|-------------------
File | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
-------------------|---------|----------|---------|---------|-------------------
All files | 80.46 | 74.66 | 82.24 | 81.29 |
...nents/merchant | 88.63 | 80.28 | 92.3 | 94.73 |
MetricCard.tsx | 100 | 91.3 | 100 | 100 | 41,60
...anbanCard.tsx | 77.27 | 73.8 | 85.71 | 87.5 | 26,128
...nbanBoard.tsx | 100 | 83.33 | 100 | 100 | 69
domains/menu | 100 | 87.09 | 100 | 100 |
repository.ts | 100 | 87.09 | 100 | 100 | ...17,239,261,283
domains/orders | 2.41 | 0 | 0 | 2.56 |
repository.ts | 1.96 | 0 | 0 | 2.22 | 21-261
service.ts | 2.73 | 0 | 0 | 2.77 | 38-62,69-313
hooks | 72.87 | 55.39 | 73.21 | 77.28 |
...DSRealtime.ts | 86.5 | 75 | 89.28 | 90.78 | ...75-379,390-401
...ucedMotion.ts | 72 | 25 | 83.33 | 72 | 43,84,111-118
useRole.ts | 65.38 | 50 | 71.42 | 74.62 | ...09,121,131-133
useStaff.ts | 56.56 | 32 | 40 | 58.94 | ...96-215,221-233
lib | 78.17 | 76.08 | 82.08 | 78.27 |
audit.ts | 92.59 | 92.59 | 75 | 92.59 | 161,181
errorHandler.ts | 100 | 100 | 100 | 100 |
errors.ts | 100 | 100 | 100 | 100 |
fetchUtils.ts | 95 | 94.11 | 83.33 | 100 | 78
logger.ts | 72.34 | 47.61 | 57.14 | 72.34 | ...99-100,155-184
offlineQueue.ts | 81.81 | 80 | 100 | 81.81 | ...24,176,190-191
rate-limit.ts | 68.02 | 66.23 | 76.47 | 68.02 | ...80-508,539,733
utils.ts | 100 | 100 | 100 | 100 |
lib/api | 98.59 | 94.04 | 100 | 98.59 |
errors.ts | 100 | 96 | 100 | 100 | 52
idempotency.ts | 100 | 100 | 100 | 100 |
pilotGate.ts | 88.88 | 75 | 100 | 88.88 | 37
response.ts | 100 | 100 | 100 | 100 |
validation.ts | 90.9 | 100 | 100 | 90.9 | 12
versioning.ts | 100 | 95.65 | 100 | 100 | 48
lib/constants | 94.73 | 100 | 0 | 94.73 |
query-columns.ts | 94.73 | 100 | 0 | 94.73 | 366
lib/db | 100 | 100 | 100 | 100 |
...itory-base.ts | 100 | 100 | 100 | 100 |
lib/devices | 100 | 100 | 100 | 100 |
ota.ts | 100 | 100 | 100 | 100 |
pairing.ts | 100 | 100 | 100 | 100 |
schema-compat.ts | 100 | 100 | 100 | 100 |
shell.ts | 100 | 100 | 100 | 100 |
lib/discounts | 100 | 100 | 100 | 100 |
calculator.ts | 100 | 100 | 100 | 100 |
lib/errors | 89.77 | 83.33 | 100 | 95.12 |
sanitize.ts | 89.77 | 83.33 | 100 | 95.12 | 110,112,123,186
lib/fiscal | 96.79 | 79.85 | 100 | 96.62 |
erca-service.ts | 95.79 | 72.63 | 100 | 95.53 | ...00,533,555,601
mor-client.ts | 100 | 100 | 100 | 100 |
offline-queue.ts | 100 | 93.33 | 100 | 100 | 56
lib/format | 100 | 100 | 100 | 100 |
et.ts | 100 | 100 | 100 | 100 |
lib/graphql | 87.58 | 73.07 | 93.18 | 87.4 |
authz.ts | 100 | 100 | 100 | 100 |
dataloaders.ts | 84.07 | 67.18 | 91.42 | 83.15 | ...85-386,392-397
errors.ts | 100 | 100 | 100 | 100 |
lib/i18n | 91.42 | 95.83 | 100 | 88.88 |
locale.ts | 91.42 | 95.83 | 100 | 88.88 | 90,92-96
lib/monitoring | 11.8 | 4.76 | 4 | 12.59 |
metrics.ts | 5.69 | 3.27 | 5.88 | 6.14 | ...14,432,451-487
prometheus.ts | 47.61 | 50 | 0 | 47.61 | 128-181
lib/notifications | 100 | 97.77 | 100 | 100 |
sms.ts | 100 | 97.77 | 100 | 100 | 126
lib/payments | 99.35 | 93.78 | 100 | 99.35 |
adapters.ts | 100 | 100 | 100 | 100 |
chapa.ts | 97.5 | 98.5 | 100 | 97.5 | 30
telebirr.ts | 100 | 89.18 | 100 | 100 | ...03-304,343,389
types.ts | 100 | 50 | 100 | 100 | 78
lib/printer | 79.23 | 76.4 | 85.71 | 79.84 |
escpos.ts | 72.44 | 50 | 82.35 | 73.19 | ...34,141-150,162
...tion-print.ts | 100 | 97.95 | 100 | 100 | 37
lib/security | 94.91 | 84.61 | 100 | 95.19 |
...wordPolicy.ts | 94.36 | 77.96 | 100 | 94.73 | 123,158-159
...rityEvents.ts | 95.74 | 96.87 | 100 | 95.74 | 103-104
lib/services | 99.09 | 77.66 | 100 | 99.06 |
chapaService.ts | 100 | 72.91 | 100 | 100 | 156-160,223-224
orderService.ts | 98.27 | 81.81 | 100 | 98.14 | 80
lib/supabase | 96.34 | 89.74 | 100 | 96 |
client.ts | 100 | 100 | 100 | 100 |
service-role.ts | 95.65 | 87.87 | 100 | 95.23 | 72,153,158
lib/sync | 82.15 | 73.54 | 86.95 | 82.34 |
...resolution.ts | 91.66 | 77.21 | 100 | 91.36 | ...10-411,483-484
idempotency.ts | 100 | 100 | 100 | 100 |
kdsSync.ts | 98.61 | 85 | 100 | 99.24 | 476
orderSync.ts | 74.1 | 77.31 | 80 | 74.41 | 277-280,558-651
syncWorker.ts | 65.53 | 55.81 | 72.72 | 66.33 | ...37,361,411-552
lib/utils | 89.13 | 94.33 | 75 | 90 |
monetary.ts | 89.13 | 94.33 | 75 | 90 | 173,203-235
lib/validators | 100 | 83.33 | 100 | 100 |
graphql.ts | 100 | 83.33 | 100 | 100 | 256
menu.ts | 100 | 100 | 100 | 100 |
order.ts | 100 | 100 | 100 | 100 |
-------------------|---------|----------|---------|---------|-------------------
ERROR: Coverage for branches (74.66%) does not meet global threshold (77%)
 ELIFECYCLE  Command failed with exit code 1.
Error: Process completed with exit code 1.
