import type { PowerSyncDatabase } from '@/lib/sync/powersync-config';
import type { OfflineOrder, OfflineOrderItem } from '@/lib/sync/orderSync';
import type { LocalJournalEntry } from '@/lib/journal/local-journal';

type SyncQueueRow = {
    id: number;
    operation: string;
    table_name: string;
    record_id: string;
    payload: string;
    idempotency_key: string;
    status: string;
    attempts: number;
    last_error: string | null;
    created_at: string;
    processed_at: string | null;
};

type HarnessStore = {
    orders: OfflineOrder[];
    orderItems: OfflineOrderItem[];
    localJournal: LocalJournalEntry[];
    syncQueue: SyncQueueRow[];
    nextSyncQueueId: number;
};

function normalizeSql(sql: string): string {
    return sql.replace(/\s+/g, ' ').trim().toLowerCase();
}

function cloneStore(store: HarnessStore): HarnessStore {
    return {
        orders: structuredClone(store.orders),
        orderItems: structuredClone(store.orderItems),
        localJournal: structuredClone(store.localJournal),
        syncQueue: structuredClone(store.syncQueue),
        nextSyncQueueId: store.nextSyncQueueId,
    };
}

function restoreStore(target: HarnessStore, snapshot: HarnessStore): void {
    target.orders = snapshot.orders;
    target.orderItems = snapshot.orderItems;
    target.localJournal = snapshot.localJournal;
    target.syncQueue = snapshot.syncQueue;
    target.nextSyncQueueId = snapshot.nextSyncQueueId;
}

export class StoreRuntimeHarness {
    private readonly store: HarnessStore = {
        orders: [],
        orderItems: [],
        localJournal: [],
        syncQueue: [],
        nextSyncQueueId: 1,
    };

    private wanConnected = true;
    private gatewayRunning = true;

    createClientDatabase(): PowerSyncDatabase {
        const store = this.store;

        return {
            execute: async (sql, params = []) => {
                const normalized = normalizeSql(sql);

                if (normalized.startsWith('insert into orders')) {
                    const row: OfflineOrder = {
                        id: String(params[0]),
                        restaurant_id: String(params[1]),
                        order_number: Number(params[2]),
                        table_number: (params[3] as number | null | undefined) ?? undefined,
                        guest_name: (params[4] as string | null | undefined) ?? undefined,
                        guest_phone: (params[5] as string | null | undefined) ?? undefined,
                        status: String(params[6]) as OfflineOrder['status'],
                        order_type: String(params[7]),
                        subtotal_santim: Number(params[8]),
                        discount_santim: Number(params[9]),
                        vat_santim: Number(params[10]),
                        total_santim: Number(params[11]),
                        notes: (params[12] as string | null | undefined) ?? undefined,
                        idempotency_key: String(params[13]),
                        guest_fingerprint: (params[14] as string | null | undefined) ?? undefined,
                        created_at: String(params[15]),
                        updated_at: String(params[16]),
                        last_modified: String(params[17]),
                        version: Number(params[18]),
                    };
                    store.orders.push(row);
                    return { rowsAffected: 1 };
                }

                if (normalized.startsWith('insert into order_items')) {
                    const item: OfflineOrderItem = {
                        id: String(params[0]),
                        order_id: String(params[1]),
                        menu_item_id: String(params[2]),
                        menu_item_name: String(params[3]),
                        menu_item_name_am: (params[4] as string | null | undefined) ?? undefined,
                        quantity: Number(params[5]),
                        unit_price_santim: Number(params[6]),
                        total_price_santim: Number(params[7]),
                        modifiers_json: (params[8] as string | null | undefined) ?? undefined,
                        notes: (params[9] as string | null | undefined) ?? undefined,
                        status: String(params[10]),
                        station: (params[11] as string | null | undefined) ?? undefined,
                        created_at: String(params[12]),
                    };
                    store.orderItems.push(item);
                    return { rowsAffected: 1 };
                }

                if (normalized.startsWith('insert into local_journal')) {
                    const entry: LocalJournalEntry = {
                        id: String(params[0]),
                        restaurantId: String(params[1]),
                        locationId: (params[2] as string | null | undefined) ?? null,
                        deviceId: String(params[3]),
                        actorId: (params[4] as string | null | undefined) ?? null,
                        entryKind: params[5] as LocalJournalEntry['entryKind'],
                        aggregateType: String(params[6]),
                        aggregateId: String(params[7]),
                        operationType: String(params[8]),
                        payload: JSON.parse(String(params[9])) as Record<string, unknown>,
                        payloadHash: String(params[10]),
                        idempotencyKey: String(params[11]),
                        status: params[12] as LocalJournalEntry['status'],
                        errorText: (params[13] as string | null | undefined) ?? null,
                        createdAt: String(params[14]),
                        updatedAt: String(params[15]),
                        replayedAt: (params[16] as string | null | undefined) ?? null,
                    };
                    store.localJournal.push(entry);
                    return { rowsAffected: 1 };
                }

                if (normalized.startsWith('insert into sync_queue')) {
                    const row: SyncQueueRow = {
                        id: store.nextSyncQueueId++,
                        operation: String(params[0]),
                        table_name: String(params[1]),
                        record_id: String(params[2]),
                        payload: String(params[3]),
                        idempotency_key: String(params[4]),
                        status: 'pending',
                        attempts: 0,
                        last_error: null,
                        created_at: String(params[5]),
                        processed_at: null,
                    };
                    store.syncQueue.push(row);
                    return { rowsAffected: 1 };
                }

                if (normalized.startsWith('update orders set status = ?')) {
                    const order = store.orders.find(row => row.id === String(params[3]));
                    if (!order) {
                        return { rowsAffected: 0 };
                    }
                    order.status = String(params[0]) as OfflineOrder['status'];
                    order.updated_at = String(params[1]);
                    order.last_modified = String(params[2]);
                    order.version += 1;
                    return { rowsAffected: 1 };
                }

                if (normalized.startsWith("update orders set status = 'cancelled'")) {
                    const order = store.orders.find(row => row.id === String(params[2]));
                    if (!order) {
                        return { rowsAffected: 0 };
                    }
                    order.status = 'cancelled';
                    order.updated_at = String(params[0]);
                    order.last_modified = String(params[1]);
                    order.version += 1;
                    return { rowsAffected: 1 };
                }

                if (normalized.startsWith('update sync_queue set status =')) {
                    const row = store.syncQueue.find(item => item.id === Number(params[1]));
                    if (!row) {
                        return { rowsAffected: 0 };
                    }
                    row.status = 'completed';
                    row.processed_at = String(params[0]);
                    return { rowsAffected: 1 };
                }

                if (normalized.startsWith('delete from sync_queue where table_name =')) {
                    const before = store.syncQueue.length;
                    store.syncQueue = store.syncQueue.filter(
                        row => !(row.table_name === 'kds_items' && row.status === 'completed')
                    );
                    return { rowsAffected: before - store.syncQueue.length };
                }

                throw new Error(`Unsupported SQL in harness execute(): ${sql}`);
            },
            getFirstAsync: async <T>(sql: string, params: unknown[] = []) => {
                const normalized = normalizeSql(sql);

                if (normalized.startsWith('select * from orders where id = ?')) {
                    const order = store.orders.find(row => row.id === String(params[0])) ?? null;
                    return (order ? structuredClone(order) : null) as T | null;
                }

                if (
                    normalized.includes(
                        "select count(*) as count from sync_queue where status = 'pending'"
                    )
                ) {
                    return {
                        count: store.syncQueue.filter(row => row.status === 'pending').length,
                    } as T;
                }

                if (
                    normalized.includes(
                        "select count(*) as count from sync_queue where table_name = 'kds_items' and status = 'pending'"
                    )
                ) {
                    return {
                        count: store.syncQueue.filter(
                            row => row.table_name === 'kds_items' && row.status === 'pending'
                        ).length,
                    } as T;
                }

                return null;
            },
            getAllAsync: async <T>(sql: string, params: unknown[] = []) => {
                const normalized = normalizeSql(sql);

                if (normalized.startsWith('select * from order_items where order_id = ?')) {
                    return store.orderItems
                        .filter(item => item.order_id === String(params[0]))
                        .map(item => structuredClone(item)) as T[];
                }

                if (
                    normalized.startsWith(
                        "select * from orders where status = 'pending' order by created_at desc"
                    )
                ) {
                    return store.orders
                        .filter(order => order.status === 'pending')
                        .map(order => structuredClone(order)) as T[];
                }

                if (
                    normalized.includes(
                        "from sync_queue where table_name = 'kds_items' and status = 'pending'"
                    )
                ) {
                    return store.syncQueue
                        .filter(row => row.table_name === 'kds_items' && row.status === 'pending')
                        .map(row => structuredClone(row)) as T[];
                }

                if (normalized.startsWith("select * from sync_queue where status = 'pending'")) {
                    return store.syncQueue
                        .filter(row => row.status === 'pending')
                        .map(row => structuredClone(row)) as T[];
                }

                return [];
            },
            write: async fn => {
                const snapshot = cloneStore(store);
                try {
                    await fn();
                } catch (error) {
                    restoreStore(store, snapshot);
                    throw error;
                }
            },
            close: async () => undefined,
        };
    }

    disconnectWan(): void {
        this.wanConnected = false;
    }

    reconnectWan(): void {
        this.wanConnected = true;
    }

    isWanConnected(): boolean {
        return this.wanConnected;
    }

    restartGateway(): void {
        this.gatewayRunning = false;
        this.gatewayRunning = true;
    }

    isGatewayRunning(): boolean {
        return this.gatewayRunning;
    }

    getOrder(orderId: string): OfflineOrder | undefined {
        return this.store.orders.find(order => order.id === orderId);
    }

    getOrders(): OfflineOrder[] {
        return structuredClone(this.store.orders);
    }

    getLocalJournal(): LocalJournalEntry[] {
        return structuredClone(this.store.localJournal);
    }

    getPendingSyncQueue(): SyncQueueRow[] {
        return structuredClone(this.store.syncQueue.filter(row => row.status === 'pending'));
    }

    markAllPendingSyncCompleted(now: string = new Date().toISOString()): void {
        this.store.syncQueue = this.store.syncQueue.map(row =>
            row.status === 'pending'
                ? {
                      ...row,
                      status: 'completed',
                      processed_at: now,
                  }
                : row
        );
    }
}
