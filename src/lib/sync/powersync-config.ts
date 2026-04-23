/**
 * PowerSync Configuration
 *
 * CRIT-05: Offline sync consolidation for POS and KDS
 * Adds explicit bootstrap status, local journal tables, and client-safe config handling.
 */

import {
    PowerSyncDatabase as WebPowerSyncDatabase,
    Schema,
    Table,
    column,
    type Transaction,
} from '@powersync/web';
import { logger } from '@/lib/logger';
import { Connector, POWERSYNC_INSTANCE_URL } from './PowerSyncConnector';

export interface PowerSyncDatabase {
    execute(sql: string, params?: unknown[]): Promise<{ rowsAffected: number }>;
    getFirstAsync<T>(sql: string, params?: unknown[]): Promise<T | null>;
    getAllAsync<T>(sql: string, params?: unknown[]): Promise<T[]>;
    write(fn: () => Promise<void>): Promise<void>;
    close(): Promise<void>;
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

    CREATE TABLE IF NOT EXISTS order_check_splits (
        id TEXT PRIMARY KEY,
        restaurant_id TEXT NOT NULL,
        order_id TEXT NOT NULL,
        split_index INTEGER NOT NULL,
        split_label TEXT,
        requested_amount REAL,
        computed_amount REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'open',
        metadata_json TEXT,
        created_by TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id)
    );

    CREATE TABLE IF NOT EXISTS order_check_split_items (
        id TEXT PRIMARY KEY,
        restaurant_id TEXT NOT NULL,
        order_id TEXT NOT NULL,
        split_id TEXT NOT NULL,
        order_item_id TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        line_amount REAL NOT NULL DEFAULT 0,
        idempotency_key TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id),
        FOREIGN KEY (split_id) REFERENCES order_check_splits(id)
    );

    CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY,
        restaurant_id TEXT NOT NULL,
        order_id TEXT,
        split_id TEXT,
        amount REAL NOT NULL,
        tip_amount REAL NOT NULL DEFAULT 0,
        method TEXT NOT NULL,
        provider TEXT,
        provider_reference TEXT,
        transaction_number TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'captured',
        metadata_json TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id),
        FOREIGN KEY (split_id) REFERENCES order_check_splits(id)
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
    CREATE INDEX IF NOT EXISTS idx_order_check_splits_order ON order_check_splits(order_id, split_index);
    CREATE INDEX IF NOT EXISTS idx_order_check_split_items_order ON order_check_split_items(order_id, split_id);
    CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id, split_id, status);
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

type QueryContext = Pick<Transaction, 'execute' | 'getAll' | 'getOptional'> | WebPowerSyncDatabase;

function textColumns(names: string[]) {
    return Object.fromEntries(names.map(name => [name, column.text])) as Record<
        string,
        typeof column.text
    >;
}

function integerColumns(names: string[]) {
    return Object.fromEntries(names.map(name => [name, column.integer])) as Record<
        string,
        typeof column.integer
    >;
}

function realColumns(names: string[]) {
    return Object.fromEntries(names.map(name => [name, column.real])) as Record<
        string,
        typeof column.real
    >;
}

const powerSyncAppSchema = new Schema({
    orders: new Table({
        ...textColumns([
            'restaurant_id',
            'guest_name',
            'guest_phone',
            'status',
            'order_type',
            'notes',
            'fire_mode',
            'current_course',
            'idempotency_key',
            'guest_fingerprint',
            'created_at',
            'updated_at',
            'synced_at',
            'last_modified',
        ]),
        ...integerColumns([
            'order_number',
            'table_number',
            'subtotal_santim',
            'discount_santim',
            'vat_santim',
            'total_santim',
            'version',
        ]),
    }),
    order_items: new Table({
        ...textColumns([
            'order_id',
            'menu_item_id',
            'menu_item_name',
            'menu_item_name_am',
            'modifiers_json',
            'notes',
            'status',
            'station',
            'fired_at',
            'created_at',
            'synced_at',
        ]),
        ...integerColumns(['quantity', 'unit_price_santim', 'total_price_santim']),
    }),
    kds_items: new Table({
        ...textColumns([
            'order_id',
            'order_item_id',
            'station',
            'status',
            'started_at',
            'ready_at',
            'recalled_at',
            'bumped_at',
            'created_at',
            'synced_at',
            'last_modified',
        ]),
        ...integerColumns(['priority', 'version']),
    }),
    table_sessions: new Table({
        ...textColumns([
            'restaurant_id',
            'table_id',
            'status',
            'assigned_staff_id',
            'notes',
            'metadata_json',
            'opened_at',
            'closed_at',
            'created_at',
            'updated_at',
        ]),
        ...integerColumns(['guest_count']),
    }),
    order_check_splits: new Table({
        ...textColumns([
            'restaurant_id',
            'order_id',
            'split_label',
            'status',
            'metadata_json',
            'created_by',
            'created_at',
            'updated_at',
        ]),
        ...integerColumns(['split_index']),
        ...realColumns(['requested_amount', 'computed_amount']),
    }),
    order_check_split_items: new Table({
        ...textColumns([
            'restaurant_id',
            'order_id',
            'split_id',
            'order_item_id',
            'idempotency_key',
            'created_at',
        ]),
        ...integerColumns(['quantity']),
        ...realColumns(['line_amount']),
    }),
    payments: new Table({
        ...textColumns([
            'restaurant_id',
            'order_id',
            'split_id',
            'method',
            'provider',
            'provider_reference',
            'transaction_number',
            'status',
            'metadata_json',
            'created_at',
            'updated_at',
        ]),
        ...realColumns(['amount', 'tip_amount']),
    }),
    restaurant_settings: new Table({
        ...textColumns(['restaurant_id', 'settings_json', 'synced_at']),
    }),
    sync_queue: new Table(
        {
            ...textColumns([
                'operation',
                'table_name',
                'record_id',
                'payload',
                'idempotency_key',
                'status',
                'last_error',
                'created_at',
                'processed_at',
            ]),
            ...integerColumns(['attempts']),
        },
        { localOnly: true }
    ),
    printer_jobs: new Table(
        {
            ...textColumns([
                'order_id',
                'station',
                'payload_json',
                'status',
                'last_error',
                'created_at',
                'printed_at',
            ]),
            ...integerColumns(['attempts']),
        },
        { localOnly: true }
    ),
    fiscal_jobs: new Table(
        {
            ...textColumns([
                'order_id',
                'payload_json',
                'queue_mode',
                'signature_json',
                'signature_algorithm',
                'signed_at',
                'status',
                'last_error',
                'warning_text',
                'created_at',
                'submitted_at',
                'synced_at',
            ]),
            ...integerColumns(['attempts']),
        },
        { localOnly: true }
    ),
    local_journal: new Table(
        {
            ...textColumns([
                'restaurant_id',
                'location_id',
                'device_id',
                'actor_id',
                'entry_kind',
                'aggregate_type',
                'aggregate_id',
                'operation_type',
                'payload_json',
                'payload_hash',
                'idempotency_key',
                'status',
                'error_text',
                'created_at',
                'updated_at',
                'replayed_at',
            ]),
        },
        { localOnly: true }
    ),
    audit_logs: new Table(
        {
            ...textColumns([
                'restaurant_id',
                'action',
                'entity_type',
                'entity_id',
                'user_id',
                'old_value',
                'new_value',
                'metadata',
                'created_at',
            ]),
        },
        { localOnly: true }
    ),
    sync_conflict_logs: new Table(
        {
            ...textColumns([
                'entity_type',
                'entity_id',
                'conflict_type',
                'client_timestamp',
                'server_timestamp',
                'resolution_strategy',
                'resolution_details',
                'created_at',
            ]),
        },
        { localOnly: true }
    ),
});

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
    const endpoint = process.env.NEXT_PUBLIC_POWERSYNC_ENDPOINT ?? POWERSYNC_INSTANCE_URL;
    const accessToken =
        process.env.NEXT_PUBLIC_POWERSYNC_DEV_TOKEN ??
        process.env.NEXT_PUBLIC_POWERSYNC_ACCESS_TOKEN ??
        process.env.NEXT_PUBLIC_POWERSYNC_API_KEY ??
        '';

    if (!endpoint) {
        bootstrapStatus = createBootstrapStatus(
            'not_configured',
            'Missing PowerSync endpoint configuration.'
        );

        return {
            endpoint: '',
            accessToken,
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

class WrappedPowerSyncDatabase implements PowerSyncDatabase {
    private activeTransaction: Transaction | null = null;

    constructor(private readonly database: WebPowerSyncDatabase) {}

    private get queryContext(): QueryContext {
        return this.activeTransaction ?? this.database;
    }

    async execute(sql: string, params: unknown[] = []): Promise<{ rowsAffected: number }> {
        const result = await this.queryContext.execute(sql, params);
        return { rowsAffected: result.rowsAffected };
    }

    async getFirstAsync<T>(sql: string, params: unknown[] = []): Promise<T | null> {
        return this.queryContext.getOptional<T>(sql, params);
    }

    async getAllAsync<T>(sql: string, params: unknown[] = []): Promise<T[]> {
        return this.queryContext.getAll<T>(sql, params);
    }

    async write(fn: () => Promise<void>): Promise<void> {
        if (this.activeTransaction) {
            await fn();
            return;
        }

        await this.database.writeTransaction(async tx => {
            const previousTransaction = this.activeTransaction;
            this.activeTransaction = tx;

            try {
                await fn();
            } finally {
                this.activeTransaction = previousTransaction;
            }

            return undefined;
        });
    }

    async close(): Promise<void> {
        await this.database.close();
    }
}

let rawPowerSyncDb: WebPowerSyncDatabase | null = null;
let powerSyncDb: PowerSyncDatabase | null = null;

async function ensureLocalSchema(database: WebPowerSyncDatabase): Promise<void> {
    const statements = powerSyncSchema
        .split(';')
        .map(statement => statement.trim())
        .filter(statement => statement.length > 0);

    for (const statement of statements) {
        await database.execute(`${statement};`);
    }
}

export async function initPowerSync(): Promise<PowerSyncDatabase | null> {
    if (powerSyncDb) {
        bootstrapStatus = createBootstrapStatus('ready', 'PowerSync already initialized.');
        return powerSyncDb;
    }

    const config = getPowerSyncConfig();
    if (typeof window === 'undefined') {
        bootstrapStatus = createBootstrapStatus(
            'missing_runtime_adapter',
            'PowerSync only initializes in browser runtime.'
        );
        return null;
    }

    try {
        rawPowerSyncDb = new WebPowerSyncDatabase({
            schema: powerSyncAppSchema,
            database: {
                dbFilename: 'lole_offline.db',
            },
        });

        await rawPowerSyncDb.init();
        await ensureLocalSchema(rawPowerSyncDb);

        powerSyncDb = new WrappedPowerSyncDatabase(rawPowerSyncDb);

        const connector = new Connector();
        const credentials = await connector.fetchCredentials();

        if (!config.endpoint || !credentials) {
            bootstrapStatus = createBootstrapStatus(
                'not_configured',
                'PowerSync local database ready. Remote sync waiting for auth token or dev token.'
            );
            logger.warn('[PowerSync] Remote sync not configured yet - local database only');
            return powerSyncDb;
        }

        await rawPowerSyncDb.connect(connector);

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
        return powerSyncDb;
    }
}

export function getPowerSync(): PowerSyncDatabase | null {
    return powerSyncDb;
}

export async function closePowerSync(): Promise<void> {
    if (powerSyncDb) {
        await powerSyncDb.close();
        powerSyncDb = null;
        rawPowerSyncDb = null;
        bootstrapStatus = createBootstrapStatus('idle', 'PowerSync connection closed.');
    }
}
