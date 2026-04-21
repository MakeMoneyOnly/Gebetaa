/**
 * PowerSync Configuration
 *
 * CRIT-05: Offline sync consolidation for POS and KDS
 * Adds explicit bootstrap status, local journal tables, and client-safe config handling.
 */

import { logger } from '@/lib/logger';

export interface PowerSyncDatabase {
    execute(sql: string, params?: unknown[]): Promise<{ rowsAffected: number }>;
    getFirstAsync<T>(sql: string, params?: unknown[]): Promise<T | null>;
    getAllAsync<T>(sql: string, params?: unknown[]): Promise<T[]>;
    write(fn: () => Promise<void>): Promise<void>;
    close(): Promise<void>;
}

interface PowerSyncWebModule {
    PowerSyncDatabase?: {
        connect?: (options: { schema: string; adapter: unknown }) => Promise<PowerSyncDatabase>;
    };
}

interface PowerSyncReactModule {
    PowerSyncOpenSQLiteAdapter?: new (options: { dbFilename: string }) => unknown;
}

export const powerSyncSchema = `
    CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        restaurant_id TEXT NOT NULL,
        order_number INTEGER NOT NULL,
        table_number INTEGER,
        guest_name TEXT,
        guest_phone TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        order_type TEXT NOT NULL DEFAULT 'dine_in',
        subtotal_santim INTEGER NOT NULL DEFAULT 0,
        discount_santim INTEGER NOT NULL DEFAULT 0,
        vat_santim INTEGER NOT NULL DEFAULT 0,
        total_santim INTEGER NOT NULL DEFAULT 0,
        notes TEXT,
        fire_mode TEXT,
        current_course TEXT,
        idempotency_key TEXT UNIQUE NOT NULL,
        guest_fingerprint TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        synced_at TEXT,
        last_modified TEXT NOT NULL,
        version INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS order_items (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        menu_item_id TEXT NOT NULL,
        menu_item_name TEXT NOT NULL,
        menu_item_name_am TEXT,
        quantity INTEGER NOT NULL DEFAULT 1,
        unit_price_santim INTEGER NOT NULL,
        total_price_santim INTEGER NOT NULL,
        modifiers_json TEXT,
        notes TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        station TEXT,
        fired_at TEXT,
        created_at TEXT NOT NULL,
        synced_at TEXT,
        FOREIGN KEY (order_id) REFERENCES orders(id)
    );

    CREATE TABLE IF NOT EXISTS kds_items (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        order_item_id TEXT NOT NULL,
        station TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'queued',
        started_at TEXT,
        ready_at TEXT,
        recalled_at TEXT,
        bumped_at TEXT,
        priority INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        synced_at TEXT,
        version INTEGER NOT NULL DEFAULT 1,
        last_modified TEXT,
        FOREIGN KEY (order_id) REFERENCES orders(id)
    );

    CREATE TABLE IF NOT EXISTS table_sessions (
        id TEXT PRIMARY KEY,
        restaurant_id TEXT NOT NULL,
        table_id TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'open',
        guest_count INTEGER NOT NULL DEFAULT 1,
        assigned_staff_id TEXT,
        notes TEXT,
        metadata_json TEXT NOT NULL DEFAULT '{}',
        opened_at TEXT NOT NULL,
        closed_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        operation TEXT NOT NULL,
        table_name TEXT NOT NULL,
        record_id TEXT NOT NULL,
        payload TEXT NOT NULL,
        idempotency_key TEXT UNIQUE NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        attempts INTEGER NOT NULL DEFAULT 0,
        last_error TEXT,
        created_at TEXT NOT NULL,
        processed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS printer_jobs (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        station TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        attempts INTEGER NOT NULL DEFAULT 0,
        last_error TEXT,
        created_at TEXT NOT NULL,
        printed_at TEXT,
        FOREIGN KEY (order_id) REFERENCES orders(id)
    );

    CREATE TABLE IF NOT EXISTS fiscal_jobs (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        queue_mode TEXT NOT NULL DEFAULT 'pending_upstream_submission',
        signature_json TEXT,
        signature_algorithm TEXT,
        signed_at TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        attempts INTEGER NOT NULL DEFAULT 0,
        last_error TEXT,
        warning_text TEXT,
        created_at TEXT NOT NULL,
        submitted_at TEXT,
        synced_at TEXT,
        FOREIGN KEY (order_id) REFERENCES orders(id)
    );

    CREATE TABLE IF NOT EXISTS restaurant_settings (
        restaurant_id TEXT PRIMARY KEY,
        settings_json TEXT NOT NULL,
        synced_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS local_journal (
        id TEXT PRIMARY KEY,
        restaurant_id TEXT NOT NULL,
        location_id TEXT,
        device_id TEXT NOT NULL,
        actor_id TEXT,
        entry_kind TEXT NOT NULL,
        aggregate_type TEXT NOT NULL,
        aggregate_id TEXT NOT NULL,
        operation_type TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        payload_hash TEXT NOT NULL,
        idempotency_key TEXT UNIQUE NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        error_text TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        replayed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        restaurant_id TEXT NOT NULL,
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        user_id TEXT,
        old_value TEXT,
        new_value TEXT,
        metadata TEXT,
        created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sync_conflict_logs (
        id TEXT PRIMARY KEY,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        conflict_type TEXT NOT NULL,
        client_timestamp TEXT NOT NULL,
        server_timestamp TEXT NOT NULL,
        resolution_strategy TEXT NOT NULL,
        resolution_details TEXT NOT NULL,
        created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_orders_restaurant ON orders(restaurant_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_idempotency ON orders(idempotency_key);
    CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
    CREATE INDEX IF NOT EXISTS idx_kds_items_order ON kds_items(order_id);
    CREATE INDEX IF NOT EXISTS idx_kds_items_station ON kds_items(station);
    CREATE INDEX IF NOT EXISTS idx_table_sessions_restaurant ON table_sessions(restaurant_id);
    CREATE INDEX IF NOT EXISTS idx_table_sessions_table ON table_sessions(table_id, status);
    CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);
    CREATE INDEX IF NOT EXISTS idx_printer_jobs_status ON printer_jobs(status);
    CREATE INDEX IF NOT EXISTS idx_fiscal_jobs_status ON fiscal_jobs(status);
    CREATE INDEX IF NOT EXISTS idx_local_journal_status ON local_journal(status);
    CREATE INDEX IF NOT EXISTS idx_local_journal_kind ON local_journal(entry_kind, created_at);
    CREATE INDEX IF NOT EXISTS idx_local_journal_idempotency ON local_journal(idempotency_key);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
    CREATE INDEX IF NOT EXISTS idx_sync_conflict_entity ON sync_conflict_logs(entity_type, entity_id);
`;

export interface PowerSyncConfig {
    endpoint: string;
    accessToken: string;
    restaurantId?: string;
    debug?: boolean;
}

export type PowerSyncBootstrapState =
    | 'idle'
    | 'ready'
    | 'not_configured'
    | 'missing_runtime_adapter'
    | 'error';

export interface PowerSyncBootstrapStatus {
    state: PowerSyncBootstrapState;
    message: string;
    updatedAt: string;
}

function createBootstrapStatus(
    state: PowerSyncBootstrapState,
    message: string
): PowerSyncBootstrapStatus {
    return {
        state,
        message,
        updatedAt: new Date().toISOString(),
    };
}

let bootstrapStatus: PowerSyncBootstrapStatus = createBootstrapStatus(
    'idle',
    'PowerSync not initialized yet.'
);

export function getPowerSyncConfig(): PowerSyncConfig {
    const endpoint = process.env.NEXT_PUBLIC_POWERSYNC_ENDPOINT ?? '';
    const accessToken =
        process.env.NEXT_PUBLIC_POWERSYNC_ACCESS_TOKEN ??
        process.env.NEXT_PUBLIC_POWERSYNC_API_KEY ??
        '';

    if (!endpoint || !accessToken) {
        bootstrapStatus = createBootstrapStatus(
            'not_configured',
            'Missing NEXT_PUBLIC_POWERSYNC_ENDPOINT or NEXT_PUBLIC_POWERSYNC_ACCESS_TOKEN.'
        );

        return {
            endpoint: '',
            accessToken: '',
            restaurantId: process.env.NEXT_PUBLIC_RESTAURANT_ID,
            debug: process.env.NODE_ENV === 'development',
        };
    }

    return {
        endpoint,
        accessToken,
        restaurantId: process.env.NEXT_PUBLIC_RESTAURANT_ID,
        debug: process.env.NODE_ENV === 'development',
    };
}

export function getPowerSyncBootstrapStatus(): PowerSyncBootstrapStatus {
    return bootstrapStatus;
}

let powerSyncDb: PowerSyncDatabase | null = null;

async function loadPowerSyncModules(): Promise<{
    webModule: PowerSyncWebModule | null;
    reactModule: PowerSyncReactModule | null;
}> {
    let webModule: PowerSyncWebModule | null = null;
    let reactModule: PowerSyncReactModule | null = null;

    try {
        webModule = (await import('@powersync/web')) as PowerSyncWebModule;
    } catch {
        webModule = null;
    }

    try {
        reactModule = (await import('@powersync/react')) as PowerSyncReactModule;
    } catch {
        reactModule = null;
    }

    return { webModule, reactModule };
}

export async function initPowerSync(): Promise<PowerSyncDatabase | null> {
    if (powerSyncDb) {
        bootstrapStatus = createBootstrapStatus('ready', 'PowerSync already initialized.');
        return powerSyncDb;
    }

    const config = getPowerSyncConfig();
    if (!config.endpoint || !config.accessToken) {
        logger.warn('[PowerSync] Not configured - deterministic offline-local mode');
        return null;
    }

    try {
        const { webModule, reactModule } = await loadPowerSyncModules();
        const connectFn = webModule?.PowerSyncDatabase?.connect;
        const AdapterCtor = reactModule?.PowerSyncOpenSQLiteAdapter;

        if (!connectFn || !AdapterCtor) {
            bootstrapStatus = createBootstrapStatus(
                'missing_runtime_adapter',
                'PowerSync runtime adapter missing. App remains in offline-local bootstrap mode.'
            );
            logger.warn('[PowerSync] Runtime adapter missing - offline-local bootstrap mode');
            return null;
        }

        powerSyncDb = await connectFn({
            schema: powerSyncSchema,
            adapter: new AdapterCtor({
                dbFilename: 'lole_offline.db',
            }),
        });

        bootstrapStatus = createBootstrapStatus('ready', 'PowerSync initialized successfully.');

        if (config.debug) {
            logger.info('[PowerSync] Database initialized successfully');
        }

        return powerSyncDb;
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        bootstrapStatus = createBootstrapStatus('error', message);
        logger.warn('[PowerSync] Initialization failed - offline-local mode continues', {
            error: message,
        });
        return null;
    }
}

export function getPowerSync(): PowerSyncDatabase | null {
    return powerSyncDb;
}

export async function closePowerSync(): Promise<void> {
    if (powerSyncDb) {
        await powerSyncDb.close();
        powerSyncDb = null;
        bootstrapStatus = createBootstrapStatus('idle', 'PowerSync connection closed.');
    }
}
