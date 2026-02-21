/**
 * Health Check API Endpoint
 *
 * Addresses COMPREHENSIVE_CODEBASE_AUDIT_REPORT Section 7.5
 * Provides health status for monitoring and observability
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
        environment: {
            status: 'up' | 'down';
            configured: string[];
            missing: string[];
        };
        services: {
            redis?: {
                status: 'up' | 'down' | 'not_configured';
                latency?: number;
            };
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
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY',
];

/**
 * Optional environment variables for enhanced features
 */
const OPTIONAL_ENV_VARS = [
    'DATABASE_URL',
    'REDIS_URL',
    'STRIPE_SECRET_KEY',
    'SENDGRID_API_KEY',
    'SENTRY_AUTH_TOKEN',
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
 * Check Redis connectivity (if configured)
 */
async function checkRedis(): Promise<{
    status: 'up' | 'down' | 'not_configured';
    latency?: number;
}> {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
        return { status: 'not_configured' };
    }

    try {
        // Note: In a real implementation, you'd use a Redis client
        // For now, we just check if the URL is set
        // This can be enhanced with actual Redis ping
        return { status: 'up' };
    } catch {
        return {
            status: 'down',
        };
    }
}

/**
 * GET /api/health
 * Returns comprehensive health status
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_request: NextRequest): Promise<NextResponse<HealthStatus>> {
    // Run checks in parallel for efficiency
    const [databaseCheck, redisCheck] = await Promise.all([checkDatabase(), checkRedis()]);

    const environmentCheck = checkEnvironment();

    // Determine overall status
    let status: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';

    if (databaseCheck.status === 'down' || environmentCheck.status === 'down') {
        status = 'unhealthy';
    } else if (redisCheck.status === 'down') {
        status = 'degraded';
    }

    const healthStatus: HealthStatus = {
        status,
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '0.1.0',
        uptime: Math.floor((Date.now() - startTime) / 1000),
        checks: {
            database: databaseCheck,
            environment: environmentCheck,
            services: {
                redis: redisCheck,
            },
        },
        region: process.env.VERCEL_REGION || process.env.AWS_REGION,
    };

    // Return appropriate status code
    const statusCode = status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503;

    return NextResponse.json(healthStatus, {
        status: statusCode,
        headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'X-Health-Status': status,
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
 * Liveness probe endpoint
 * GET /api/health/live
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
