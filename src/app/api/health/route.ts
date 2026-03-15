/**
 * Health Check API Endpoint
 *
 * Addresses CRIT-08 from ENTERPRISE_MASTER_BLUEPRINT Section 13
 * Provides comprehensive health status for monitoring and observability.
 *
 * Monitors:
 * - Database connectivity (Supabase)
 * - Redis connectivity (Upstash)
 * - QStash availability (job queue)
 * - Environment configuration
 *
 * Used by Better Uptime for monitoring with Telegram alerting on non-200.
 *
 * @see docs/1. Engineering Foundation/0. ENTERPRISE_MASTER_BLUEPRINT.md - Sprint 1.7
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Health check response interface
 */
interface HealthStatus {
    status: 'healthy' | 'unhealthy' | 'degraded';
    timestamp: string;
    version: string;
    uptime: number;
    checks: {
        database: {
            status: 'up' | 'down';
            latency?: number;
            error?: string;
        };
        redis: {
            status: 'up' | 'down' | 'not_configured';
            latency?: number;
            error?: string;
        };
        qstash: {
            status: 'up' | 'down' | 'not_configured';
            latency?: number;
            error?: string;
        };
        environment: {
            status: 'up' | 'down';
            configured: string[];
            missing: string[];
        };
    };
    region?: string;
}

/**
 * Time when the server started
 * Note: In serverless, this resets per cold start
 */
const startTime = Date.now();

/**
 * Required environment variables for critical functionality
 */
const REQUIRED_ENV_VARS = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    'SUPABASE_SECRET_KEY',
];

/**
 * Optional environment variables for enhanced features
 */
const OPTIONAL_ENV_VARS = [
    'DATABASE_URL',
    'REDIS_URL',
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
    'QSTASH_TOKEN',
    'QSTASH_CURRENT_SIGNING_KEY',
    'CHAPA_SECRET_KEY',
    'CHAPA_WEBHOOK_SECRET',
    'SENTRY_AUTH_TOKEN',
    'TELEGRAM_BOT_TOKEN',
    'TELEGRAM_ALERT_CHAT_ID',
];

/**
 * Check database connectivity
 */
async function checkDatabase(): Promise<{
    status: 'up' | 'down';
    latency?: number;
    error?: string;
}> {
    try {
        const start = Date.now();
        const supabase = await createClient();

        // Simple query to check connectivity
        const { error } = await supabase.from('restaurants').select('id').limit(1);

        const latency = Date.now() - start;

        if (error && error.code !== 'PGRST116') {
            // PGRST116 = no rows found, which is fine
            return {
                status: 'down',
                latency,
                error: error.message,
            };
        }

        return {
            status: 'up',
            latency,
        };
    } catch (error) {
        return {
            status: 'down',
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Check Redis connectivity via Upstash REST API
 */
async function checkRedis(): Promise<{
    status: 'up' | 'down' | 'not_configured';
    latency?: number;
    error?: string;
}> {
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!redisUrl || !redisToken) {
        // Fallback to legacy Redis URL
        const legacyRedisUrl = process.env.REDIS_URL;
        if (!legacyRedisUrl) {
            return { status: 'not_configured' };
        }
        // Legacy Redis doesn't support HTTP ping, just check URL exists
        return { status: 'up' };
    }

    try {
        const start = Date.now();

        // Use Upstash REST API to ping Redis
        // @see https://upstash.com/docs/redis/features/restapi
        const response = await fetch(`${redisUrl}/ping`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${redisToken}`,
            },
        });

        const latency = Date.now() - start;

        if (!response.ok) {
            const errorText = await response.text();
            return {
                status: 'down',
                latency,
                error: `Redis ping failed: ${response.status} ${errorText}`,
            };
        }

        const result = await response.text();
        if (result !== 'PONG' && result !== '"PONG"' && !result.includes('PONG')) {
            return {
                status: 'down',
                latency,
                error: `Unexpected Redis response: ${result}`,
            };
        }

        return {
            status: 'up',
            latency,
        };
    } catch (error) {
        return {
            status: 'down',
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Check QStash availability
 * QStash is critical for background jobs: payment retries, ERCA submissions, EOD reports
 */
async function checkQStash(): Promise<{
    status: 'up' | 'down' | 'not_configured';
    latency?: number;
    error?: string;
}> {
    const qstashToken = process.env.QSTASH_TOKEN;

    if (!qstashToken) {
        return { status: 'not_configured' };
    }

    try {
        const start = Date.now();

        // Query QStash API to check queue status
        // @see https://upstash.com/docs/qstash/api/overview
        const response = await fetch('https://qstash.upstash.io/v2/messages', {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${qstashToken}`,
            },
        });

        const latency = Date.now() - start;

        if (!response.ok) {
            const errorText = await response.text();
            // 401 = invalid token
            // 403 = token doesn't have access
            // 5xx = QStash service issue
            return {
                status: 'down',
                latency,
                error: `QStash check failed: ${response.status} ${errorText}`,
            };
        }

        // Response is OK, QStash is available
        return {
            status: 'up',
            latency,
        };
    } catch (error) {
        return {
            status: 'down',
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Check environment variables configuration
 */
function checkEnvironment(): {
    status: 'up' | 'down';
    configured: string[];
    missing: string[];
} {
    const configured: string[] = [];
    const missing: string[] = [];

    // Check required variables
    for (const varName of REQUIRED_ENV_VARS) {
        if (process.env[varName]) {
            configured.push(varName);
        } else {
            missing.push(varName);
        }
    }

    // Check optional variables
    for (const varName of OPTIONAL_ENV_VARS) {
        if (process.env[varName]) {
            configured.push(varName);
        }
    }

    return {
        status: missing.length > 0 ? 'down' : 'up',
        configured,
        missing,
    };
}

/**
 * GET /api/health
 * Returns comprehensive health status
 *
 * @returns {HealthStatus} Health check response with 200 or 503 status
 *
 * Better Uptime configuration:
 * - Poll this endpoint every 60 seconds
 * - Alert via Telegram on non-200 response
 * - Set timeout to 30 seconds
 *
 * Status codes:
 * - 200: Healthy or Degraded (service is running)
 * - 503: Unhealthy (critical dependency down)
 */
export async function GET(_request: NextRequest): Promise<NextResponse<HealthStatus>> {
    // Run checks in parallel for efficiency
    const [databaseCheck, redisCheck, qstashCheck] = await Promise.all([
        checkDatabase(),
        checkRedis(),
        checkQStash(),
    ]);

    const environmentCheck = checkEnvironment();

    // Determine overall status
    // Unhealthy: Database is down (critical dependency)
    // Degraded: Non-critical services (Redis, QStash) are down but database is up
    // Healthy: All services up
    let status: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';

    if (databaseCheck.status === 'down' || environmentCheck.status === 'down') {
        status = 'unhealthy';
    } else if (
        redisCheck.status === 'down' ||
        qstashCheck.status === 'down' ||
        redisCheck.status === 'not_configured' ||
        qstashCheck.status === 'not_configured'
    ) {
        // Degraded if non-critical services are down or not configured
        // In production, we expect these to be configured
        const isProduction = process.env.NODE_ENV === 'production';
        if (
            isProduction &&
            (redisCheck.status === 'not_configured' || qstashCheck.status === 'not_configured')
        ) {
            status = 'unhealthy'; // Production must have all services
        } else {
            status = 'degraded';
        }
    }

    const healthStatus: HealthStatus = {
        status,
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '0.1.0',
        uptime: Math.floor((Date.now() - startTime) / 1000),
        checks: {
            database: databaseCheck,
            redis: redisCheck,
            qstash: qstashCheck,
            environment: environmentCheck,
        },
        region: process.env.VERCEL_REGION || process.env.AWS_REGION,
    };

    // Return appropriate status code
    // Better Uptime expects non-200 for unhealthy states
    const statusCode = status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503;

    return NextResponse.json(healthStatus, {
        status: statusCode,
        headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'X-Health-Status': status,
            'X-Response-Time': `${Date.now() - startTime}ms`,
        },
    });
}

/**
 * HEAD /api/health
 * Simple health check without detailed response
 * Useful for load balancers and simple uptime checks
 */
export async function HEAD(): Promise<Response> {
    const dbCheck = await checkDatabase();

    if (dbCheck.status === 'up') {
        return new Response(null, { status: 200 });
    }

    return new Response(null, { status: 503 });
}

/**
 * OPTIONS /api/health
 * Liveness probe endpoint
 * Simple check to confirm the server is responding
 */
export async function OPTIONS(): Promise<Response> {
    return new Response(null, {
        status: 200,
        headers: {
            'X-Server-Status': 'alive',
        },
    });
}
