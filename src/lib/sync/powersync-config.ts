/**
 * PowerSync Configuration
 *
 * CRIT-05: Offline sync consolidation for POS and KDS
 * Replaces Dexie.js/localStorage with PowerSync-backed sync
 *
 * Environment Variables Required:
 * - NEXT_PUBLIC_POWERSYNC_ENDPOINT: PowerSync Cloud instance URL
 * - POWERSYNC_API_KEY: API key for PowerSync authentication
 */

// Define types locally to avoid dependency on @powersync packages
// These will be replaced with actual imports when packages are installed
interface PowerSyncDatabase {
    execute(sql: string, params?: unknown[]): Promise<{ rowsAffected: number }>;
    getFirstAsync<T>(sql: string, params?: unknown[]): Promise<T | null>;
    getAllAsync<T>(sql: string, params?: unknown[]): Promise<T[]>;
    write(fn: () => Promise<void>): Promise<void>;
    close(): Promise<void>;
}

interface _PowerSyncAdapter {
    dbFilename: string;
}

/**
 * PowerSync schema definition
 * Defines the local SQLite database schema for offline operation
 */
export const powerSyncSchema = `
    -- Orders table (mirrors backend orders)
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
        idempotency_key TEXT UNIQUE NOT NULL,
        guest_fingerprint TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        synced_at TEXT,
        last_modified TEXT NOT NULL,
        version INTEGER NOT NULL DEFAULT 1
    );

    -- Order items table
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

    -- KDS order items for kitchen display
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
        FOREIGN KEY (order_id) REFERENCES orders(id)
    );

    -- Sync queue for pending operations
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

    -- Printer jobs for offline printing
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

    -- Restaurant settings cached locally
    CREATE TABLE IF NOT EXISTS restaurant_settings (
        restaurant_id TEXT PRIMARY KEY,
        settings_json TEXT NOT NULL,
        synced_at TEXT NOT NULL
    );

    -- Indexes for performance
    CREATE INDEX IF NOT EXISTS idx_orders_restaurant ON orders(restaurant_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_idempotency ON orders(idempotency_key);
    CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
    CREATE INDEX IF NOT EXISTS idx_kds_items_order ON kds_items(order_id);
    CREATE INDEX IF NOT EXISTS idx_kds_items_station ON kds_items(station);
    CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);
    CREATE INDEX IF NOT EXISTS idx_printer_jobs_status ON printer_jobs(status);
`;

/**
 * PowerSync configuration options
 */
export interface PowerSyncConfig {
    /** PowerSync Cloud endpoint URL */
    endpoint: string;
    /** Authentication token */
    apiKey: string;
    /** Current restaurant ID for multi-tenant sync */
    restaurantId?: string;
    /** Enable debug logging */
    debug?: boolean;
}

/**
 * Get PowerSync configuration from environment
 */
export function getPowerSyncConfig(): PowerSyncConfig {
    const endpoint = process.env.NEXT_PUBLIC_POWERSYNC_ENDPOINT;
    const apiKey = process.env.POWERSYNC_API_KEY;

    if (!endpoint || !apiKey) {
        console.warn('[PowerSync] Missing configuration - running in offline-only mode');
        return {
            endpoint: '',
            apiKey: '',
            debug: process.env.NODE_ENV === 'development',
        };
    }

    return {
        endpoint,
        apiKey,
        debug: process.env.NODE_ENV === 'development',
    };
}

// Export the PowerSyncDatabase type
export type { PowerSyncDatabase };

/**
 * Singleton PowerSync database instance
 */
let powerSyncDb: PowerSyncDatabase | null = null;

/**
 * Initialize PowerSync database
 * Must be called in a React context (Client Component)
 *
 * Note: When @powersync packages are installed, this will use the actual
 * PowerSync implementation. Until then, it returns null and runs in offline-only mode.
 */
export async function initPowerSync(): Promise<PowerSyncDatabase | null> {
    if (powerSyncDb) {
        return powerSyncDb;
    }

    const config = getPowerSyncConfig();

    if (!config.endpoint || !config.apiKey) {
        console.warn('[PowerSync] Not configured - offline mode only');
        return null;
    }

    // Dynamic import when packages are available
    // Uses @powersync/web for core functionality and @powersync/react for React integration
    try {
        // Use dynamic import to avoid build errors when packages aren't available
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let webModule: any;
        let reactModule: any;
        
        try {
            webModule = await import('@powersync/web');
        } catch {
            webModule = null;
        }
        
        try {
            reactModule = await import('@powersync/react');
        } catch {
            reactModule = null;
        }

        if (!webModule || !reactModule) {
            console.warn('[PowerSync] Packages not available - running in offline-only mode');
            return null;
        }

        const { PowerSyncDatabase } = webModule;
        const { PowerSyncOpenSQLiteAdapter } = reactModule;

        powerSyncDb = await PowerSyncDatabase.connect({
            schema: powerSyncSchema,
            adapter: new PowerSyncOpenSQLiteAdapter({
                dbFilename: 'gebeta_offline.db',
            }),
        });

        if (config.debug) {
            console.log('[PowerSync] Database initialized successfully');
        }

        return powerSyncDb;
    } catch (error) {
        // Packages not installed yet - run in offline-only mode
        console.warn('[PowerSync] Packages not available - running in offline-only mode:', error);
        return null;
    }
}

/**
 * Get the PowerSync database instance
 */
export function getPowerSync(): PowerSyncDatabase | null {
    return powerSyncDb;
}

/**
 * Close PowerSync connection
 */
export async function closePowerSync(): Promise<void> {
    if (powerSyncDb) {
        await powerSyncDb.close();
        powerSyncDb = null;
    }
}
