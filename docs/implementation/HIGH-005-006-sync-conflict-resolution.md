# HIGH-005, HIGH-006: Sync Worker and Conflict Resolution Implementation

## Summary

This implementation completes the sync worker functionality and integrates conflict resolution for the lole Restaurant OS offline-first architecture.

## Changes Made

### HIGH-005: Sync Worker Implementation

The sync worker was already largely implemented with actual API calls. The following enhancements were made:

#### 1. Sync Status Events (`src/lib/sync/syncWorker.ts`)

Added event emission system for UI updates:

```typescript
export type SyncEventType =
    | 'sync:start'
    | 'sync:complete'
    | 'sync:error'
    | 'sync:conflict'
    | 'sync:offline'
    | 'sync:online'
    | 'operation:success'
    | 'operation:failed'
    | 'operation:retry';

export interface SyncEvent {
    type: SyncEventType;
    timestamp: string;
    data?: Record<string, unknown>;
}
```

#### 2. Enhanced SyncProgress Interface

Added `conflictsDetected` field to track conflicts:

```typescript
export interface SyncProgress {
    pendingOperations: number;
    completedOperations: number;
    failedOperations: number;
    printerJobsProcessed: number;
    printerJobsSucceeded: number;
    printerJobsFailed: number;
    lastSyncAt: string | null;
    isOnline: boolean;
    conflictsDetected?: number; // NEW
}
```

### HIGH-006: Conflict Resolution Integration

#### 1. Order Sync Conflict Resolution (`src/lib/sync/orderSync.ts`)

Added the following functions:

- `resolveOrderConflict()` - Resolves order sync conflicts with:
    - Last-write-wins for non-critical fields (names, notes)
    - Server-wins for financial data (prices, totals)
    - Automatic logging to both `sync_conflict_logs` and `audit_logs` tables

- `getConflictedOrders()` - Retrieves orders with conflict status

- `markOrderConflict()` - Marks an order as having a conflict for manual resolution

- `batchResolveOrderConflicts()` - Batch resolves multiple order conflicts

#### 2. KDS Sync Conflict Resolution (`src/lib/sync/kdsSync.ts`)

Added the following functions:

- `resolveKdsConflict()` - Resolves KDS item conflicts with:
    - Server-wins as default strategy (kitchen state is authoritative)
    - Automatic logging to both `sync_conflict_logs` and `audit_logs` tables

- `getConflictedKdsItems()` - Retrieves KDS items with conflicts

- `batchResolveKdsConflicts()` - Batch resolves multiple KDS conflicts

### UI Integration

#### useSyncStatus Hook (`src/hooks/useSyncStatus.ts`)

Created a React hook for tracking sync status in UI components:

```typescript
const { status, triggerSync, refreshStatus, isLoading } = useSyncStatus({
    pollIntervalMs: 5000,
    onSyncComplete: status => console.log('Sync complete', status),
    onSyncError: error => toast.error(error),
    onConflict: count => toast.warning(`${count} conflicts detected`),
});
```

Features:

- Polls sync status at configurable intervals
- Tracks online/offline status
- Monitors pending, completed, and failed operations
- Tracks unresolved conflicts
- Auto-triggers sync when coming back online
- Provides callbacks for sync events

### Testing

Added comprehensive tests in `src/lib/sync/__tests__/sync-conflict-resolution.test.ts`:

- Conflict detection tests
- Conflict type identification tests
- Resolution strategy tests (server_wins, client_wins, last_write_wins)
- Sync worker event emission tests
- Idempotency key generation tests

## Conflict Resolution Strategies

### Entity-Specific Defaults

| Entity      | Default Strategy | Rationale                            |
| ----------- | ---------------- | ------------------------------------ |
| orders      | last_write_wins  | User intent matters most             |
| order_items | last_write_wins  | User intent matters most             |
| kds_items   | server_wins      | Kitchen state is authoritative       |
| menu_items  | server_wins      | Menu changes should come from server |
| tables      | last_write_wins  | User intent matters most             |
| guests      | last_write_wins  | User intent matters most             |

### Financial Data Protection

For orders, even when using `last_write_wins`, financial fields are protected:

```typescript
// Server wins for financial data regardless of strategy
resolvedData.subtotal_santim = serverData.subtotal_santim ?? clientData.subtotal_santim;
resolvedData.discount_santim = serverData.discount_santim ?? clientData.discount_santim;
resolvedData.vat_santim = serverData.vat_santim ?? clientData.vat_santim;
resolvedData.total_santim = serverData.total_santim ?? clientData.total_santim;
```

## Audit Logging

All conflicts are logged to two tables:

1. **sync_conflict_logs** - Detailed conflict resolution log with:
    - Entity type and ID
    - Conflict type (version_mismatch, concurrent_edit, delete_update)
    - Client and server timestamps
    - Resolution strategy
    - Resolution details (JSON)

2. **audit_logs** - Compliance audit log with:
    - Action: `sync_conflict:{strategy}`
    - Old value: Server data
    - New value: Client data
    - Metadata: Resolution details

## Idempotency

All mutations use idempotency keys:

```typescript
const idempotencyKey = generateIdempotencyKey('order');
// Format: order-{timestamp}-{random}
```

The sync queue tracks operations with idempotency keys to prevent duplicate processing.

## Usage Examples

### Manual Conflict Resolution

```typescript
import { resolveOrderConflict, getConflictedOrders } from '@/lib/sync';

// Get conflicted orders
const conflicts = await getConflictedOrders(restaurantId);

// Resolve a specific conflict
const result = await resolveOrderConflict(
    orderId,
    clientData,
    serverData,
    'server_wins' // optional override
);
```

### UI Sync Status Display

```typescript
import { useSyncStatus } from '@/hooks/useSyncStatus';

function SyncIndicator() {
    const { status, triggerSync } = useSyncStatus();

    return (
        <div>
            {status.isOnline ? (
                <span>{status.pendingOperations} pending</span>
            ) : (
                <span>Offline</span>
            )}
            {status.unresolvedConflicts > 0 && (
                <button onClick={() => navigate('/conflicts')}>
                    {status.unresolvedConflicts} conflicts
                </button>
            )}
        </div>
    );
}
```

## Files Modified

1. `src/lib/sync/syncWorker.ts` - Added event emission and conflict tracking
2. `src/lib/sync/orderSync.ts` - Added conflict resolution integration
3. `src/lib/sync/kdsSync.ts` - Added conflict resolution integration
4. `src/lib/sync/index.ts` - Updated exports
5. `src/hooks/useSyncStatus.ts` - New hook for UI sync status
6. `src/lib/sync/__tests__/sync-conflict-resolution.test.ts` - New test file

## Acceptance Criteria Status

- [x] Sync worker makes actual API calls (not placeholders) - Already implemented
- [x] All mutations use idempotency keys - Already implemented
- [x] Failed operations are queued for retry - Already implemented
- [x] Conflict resolution is integrated into orderSync and kdsSync
- [x] Conflicts are logged to audit_logs
- [x] Sync status is available to UI components
- [x] Offline operations queue locally and sync when online

## Related Documentation

- `docs/TECHNICAL/tech-stack.md` - PowerSync configuration
- `AGENTS.md` - Offline-first patterns
- `SKILLS/database/supabase-postgres-best-practices/SKILL.md` - RLS and indexing
