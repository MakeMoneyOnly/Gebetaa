/**
 * Database Connection Pooling Configuration
 * HIGH-016: Configure connection pooling for production load
 *
 * This module provides connection pooling configuration for Supabase/Postgres
 * to handle production load efficiently.
 */

/**
 * Connection pooling configuration
 */
export interface ConnectionPoolConfig {
    /**
     * Maximum number of connections in the pool
     * Default: 10 for serverless, 20 for long-running processes
     */
    maxConnections: number;

    /**
     * Minimum number of connections to maintain
     * Only applicable for long-running processes
     */
    minConnections: number;

    /**
     * Maximum time (ms) to wait for a connection from the pool
     */
    connectionTimeoutMs: number;

    /**
     * Maximum time (ms) a connection can be idle before being closed
     */
    idleTimeoutMs: number;

    /**
     * Connection mode for Supabase
     * - 'transaction': Best for serverless functions (short-lived transactions)
     * - 'session': Best for long-running processes (maintains session state)
     */
    poolMode: 'transaction' | 'session';

    /**
     * Whether to use Supabase's built-in connection pooling (PgBouncer)
     */
    useSupabasePooler: boolean;
}

/**
 * Default configuration for serverless environments (Vercel, etc.)
 * Uses transaction mode for optimal performance with serverless functions
 */
export const SERVERLESS_POOL_CONFIG: ConnectionPoolConfig = {
    maxConnections: 10,
    minConnections: 0,
    connectionTimeoutMs: 30000, // 30 seconds
    idleTimeoutMs: 30000, // 30 seconds
    poolMode: 'transaction',
    useSupabasePooler: true,
};

/**
 * Default configuration for long-running processes
 * Uses session mode for maintaining prepared statements and session state
 */
export const LONG_RUNNING_POOL_CONFIG: ConnectionPoolConfig = {
    maxConnections: 20,
    minConnections: 2,
    connectionTimeoutMs: 60000, // 60 seconds
    idleTimeoutMs: 300000, // 5 minutes
    poolMode: 'session',
    useSupabasePooler: true,
};

/**
 * Get the appropriate connection pool configuration based on environment
 */
export function getConnectionPoolConfig(): ConnectionPoolConfig {
    const isServerless =
        process.env.VERCEL === '1' ||
        process.env.AWS_LAMBDA_FUNCTION_NAME !== undefined ||
        process.env.NETLIFY === 'true';

    return isServerless ? SERVERLESS_POOL_CONFIG : LONG_RUNNING_POOL_CONFIG;
}

/**
 * Get the Supabase connection URL with pooling enabled
 *
 * Supabase provides connection pooling through PgBouncer on port 6543
 * For transaction mode: use port 6543
 * For session mode: use port 6543 with prepare statements disabled
 *
 * @param mode - The pooling mode to use
 * @returns The connection URL with pooling enabled
 */
export function getPooledConnectionUrl(mode: 'transaction' | 'session' = 'transaction'): string {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!supabaseUrl) {
        throw new Error('NEXT_PUBLIC_SUPABASE_URL is not configured');
    }

    // Parse the Supabase URL to get the project reference
    const url = new URL(supabaseUrl);
    const projectRef = url.hostname.split('.')[0];

    // Use the pooler URL (port 6543 for transaction mode)
    // Format: postgres://[user]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
    const poolerHost = `aws-0-${process.env.SUPABASE_REGION || 'eu-central-1'}.pooler.supabase.com`;

    // For direct connection (bypass pooler), use the standard URL
    const usePooler = process.env.SUPABASE_USE_POOLER !== 'false';

    if (usePooler) {
        // Return pooler URL
        return `postgres://postgres.${projectRef}:${process.env.SUPABASE_DB_PASSWORD}@${poolerHost}:6543/postgres`;
    }

    // Return direct connection URL
    return supabaseUrl;
}

/**
 * Connection pool health check
 * Returns the current pool status for monitoring
 */
export interface PoolHealthStatus {
    healthy: boolean;
    activeConnections: number;
    idleConnections: number;
    waitingRequests: number;
    lastChecked: string;
}

/**
 * Check connection pool health
 * This is a placeholder for actual health check implementation
 * In production, this would query pg_stat_activity or PgBouncer stats
 */
export async function checkPoolHealth(): Promise<PoolHealthStatus> {
    // This would be implemented with actual database queries
    // For now, return a placeholder response
    return {
        healthy: true,
        activeConnections: 0,
        idleConnections: 0,
        waitingRequests: 0,
        lastChecked: new Date().toISOString(),
    };
}

/**
 * Configuration for Supabase client with connection pooling
 */
export function getSupabasePoolerConfig() {
    const config = getConnectionPoolConfig();

    return {
        db: {
            schema: 'public',
        },
        auth: {
            autoRefreshToken: true,
            persistSession: false,
        },
        global: {
            headers: {
                // Add connection pooling headers
                'x-connection-mode': config.poolMode,
            },
        },
    };
}

/**
 * Environment variable documentation for connection pooling
 *
 * Required environment variables:
 *
 * - NEXT_PUBLIC_SUPABASE_URL: Your Supabase project URL
 * - SUPABASE_SECRET_KEY: Service role key for admin operations
 * - SUPABASE_DB_PASSWORD: Database password for direct connections
 *
 * Optional environment variables:
 *
 * - SUPABASE_USE_POOLER: Set to 'false' to disable pooler (default: true)
 * - SUPABASE_REGION: AWS region for pooler endpoint (default: 'eu-central-1')
 *
 * Supabase Connection Pooling Setup:
 *
 * 1. Enable connection pooling in Supabase Dashboard:
 *    - Go to Project Settings > Database
 *    - Enable "Connection Pooling"
 *    - Choose "Transaction" mode for serverless
 *
 * 2. Configure environment variables:
 *    SUPABASE_USE_POOLER=true
 *    SUPABASE_REGION=eu-central-1
 *
 * 3. For production, ensure these settings in Supabase:
 *    - Pool Size: 15-20 (adjust based on your plan)
 *    - Mode: Transaction (for serverless)
 *
 * Best Practices:
 *
 * - Use transaction mode for serverless functions (Vercel, Netlify)
 * - Use session mode for long-running servers
 * - Monitor connection count with pg_stat_activity
 * - Set appropriate timeouts to prevent connection leaks
 * - Use prepared statements only in session mode
 */

export default {
    getConnectionPoolConfig,
    getPooledConnectionUrl,
    checkPoolHealth,
    getSupabasePoolerConfig,
    SERVERLESS_POOL_CONFIG,
    LONG_RUNNING_POOL_CONFIG,
};
