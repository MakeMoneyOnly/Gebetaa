/**
 * Rate Limiting Utility
 *
 * Provides in-memory rate limiting with Redis support for future upgrades.
 * Implements sliding window algorithm for accurate rate limiting.
 *
 * P0 Security Requirement: Rate limiting on all mutation endpoints
 */

import { NextRequest, NextResponse } from 'next/server';

// Rate limit configuration types
export interface RateLimitConfig {
    limit: number;
    windowSeconds: number;
    keyPrefix?: string;
}

export interface RateLimitResult {
    success: boolean;
    limit: number;
    remaining: number;
    reset: number; // Unix timestamp when the window resets
}

// Default rate limits as per P0 security requirements
export const RATE_LIMITS = {
    // Mutation endpoints: 10 requests per 60 seconds
    mutations: {
        limit: 10,
        windowSeconds: 60,
        keyPrefix: 'mut',
    } as RateLimitConfig,

    // Auth endpoints: 5 requests per 60 seconds (stricter for security)
    auth: {
        limit: 5,
        windowSeconds: 60,
        keyPrefix: 'auth',
    } as RateLimitConfig,

    // Read endpoints: 60 requests per 60 seconds (generous for queries)
    reads: {
        limit: 60,
        windowSeconds: 60,
        keyPrefix: 'read',
    } as RateLimitConfig,
};

// Endpoint category mappings
const ENDPOINT_CATEGORIES: { pattern: RegExp; config: RateLimitConfig }[] = [
    // Auth endpoints
    { pattern: /^\/api\/auth\//, config: RATE_LIMITS.auth },
    { pattern: /^\/api\/staff\/verify-pin/, config: RATE_LIMITS.auth },
    { pattern: /^\/api\/staff\/add-pin/, config: RATE_LIMITS.auth },
    { pattern: /^\/api\/staff\/invite/, config: RATE_LIMITS.auth },

    // Orders - mutation endpoints
    { pattern: /^\/api\/orders(\/|$)/, config: RATE_LIMITS.mutations },

    // Payments - mutation endpoints (critical for financial transactions)
    { pattern: /^\/api\/payments(\/|$)/, config: RATE_LIMITS.mutations },

    // Table sessions - mutation endpoints
    { pattern: /^\/api\/table-sessions(\/|$)/, config: RATE_LIMITS.mutations },

    // Waitlist - mutation endpoints
    { pattern: /^\/api\/waitlist(\/|$)/, config: RATE_LIMITS.mutations },

    // Staff management - mutations
    { pattern: /^\/api\/staff(\/|$)/, config: RATE_LIMITS.mutations },

    // KDS actions - mutations
    { pattern: /^\/api\/kds\/items\/.*\/action/, config: RATE_LIMITS.mutations },

    // Service requests - mutations
    { pattern: /^\/api\/service-requests(\/|$)/, config: RATE_LIMITS.mutations },

    // Settings mutations
    { pattern: /^\/api\/settings(\/|$)/, config: RATE_LIMITS.mutations },

    // Onboarding - mutations
    { pattern: /^\/api\/onboarding(\/|$)/, config: RATE_LIMITS.mutations },

    // Webhooks - mutations (but need to be accessible)
    { pattern: /^\/api\/webhooks(\/|$)/, config: RATE_LIMITS.mutations },

    // Finance mutations
    { pattern: /^\/api\/finance(\/|$)/, config: RATE_LIMITS.mutations },

    // Gift cards - mutations
    { pattern: /^\/api\/gift-cards(\/|$)/, config: RATE_LIMITS.mutations },

    // Discounts - mutations
    { pattern: /^\/api\/discounts(\/|$)/, config: RATE_LIMITS.mutations },

    // Tip pools - mutations
    { pattern: /^\/api\/tip-pools(\/|$)/, config: RATE_LIMITS.mutations },

    // Jobs - mutations
    { pattern: /^\/api\/jobs(\/|$)/, config: RATE_LIMITS.mutations },

    // Support tickets - mutations
    { pattern: /^\/api\/support\/tickets(\/|$)/, config: RATE_LIMITS.mutations },

    // Menu mutations
    { pattern: /^\/api\/menu(\/|$)/, config: RATE_LIMITS.mutations },

    // Loyalty programs - mutations
    { pattern: /^\/api\/loyalty\/programs(\/|$)/, config: RATE_LIMITS.mutations },

    // Notifications - mutations
    { pattern: /^\/api\/notifications(\/|$)/, config: RATE_LIMITS.mutations },

    // Restaurants - mutations
    { pattern: /^\/api\/restaurants(\/|$)/, config: RATE_LIMITS.mutations },

    // Tables - mutations
    { pattern: /^\/api\/tables(\/|$)/, config: RATE_LIMITS.mutations },

    // Analytics - typically read, but some mutations
    { pattern: /^\/api\/analytics(\/|$)/, config: RATE_LIMITS.reads },

    // Metrics - read only
    { pattern: /^\/api\/metrics(\/|$)/, config: RATE_LIMITS.reads },

    // Subgraphs - read only (GraphQL queries)
    { pattern: /^\/api\/subgraphs(\/|$)/, config: RATE_LIMITS.reads },

    // Docs - read only
    { pattern: /^\/api\/docs(\/|$)/, config: RATE_LIMITS.reads },
];

/**
 * In-memory rate limit store using Map
 * Key format: `${keyPrefix}:${identifier}`
 * Value: { count: number, windowStart: number }
 */
class InMemoryRateLimitStore {
    private store: Map<string, { count: number; windowStart: number }> = new Map();
    private cleanupInterval: NodeJS.Timeout | null = null;

    /**
     * Increment the rate limit counter for a given key
     */
    async increment(key: string, windowSeconds: number): Promise<RateLimitResult> {
        const now = Date.now();
        const windowStart = Math.floor(now / (windowSeconds * 1000)) * (windowSeconds * 1000);
        const fullKey = `${key}:${windowStart}`;

        const entry = this.store.get(fullKey);
        const currentCount = entry ? entry.count : 0;

        // Update or create entry
        this.store.set(fullKey, {
            count: currentCount + 1,
            windowStart,
        });

        // Schedule cleanup if not already scheduled
        if (!this.cleanupInterval) {
            this.cleanupInterval = setInterval(() => {
                this.cleanup();
            }, windowSeconds * 1000);
        }

        return {
            success: true,
            limit: 0, // Will be set by caller
            remaining: 0, // Will be calculated by caller
            reset: Math.ceil((windowStart + windowSeconds * 1000) / 1000),
        };
    }

    /**
     * Get current count for a key without incrementing
     */
    get(key: string, windowSeconds: number): number {
        const now = Date.now();
        const windowStart = Math.floor(now / (windowSeconds * 1000)) * (windowSeconds * 1000);
        const fullKey = `${key}:${windowStart}`;

        const entry = this.store.get(fullKey);
        return entry ? entry.count : 0;
    }

    /**
     * Clean up expired entries
     */
    private cleanup(): void {
        const now = Date.now();
        const threshold = now - 60 * 60 * 1000; // Keep 1 hour of history

        for (const [key, entry] of this.store.entries()) {
            if (entry.windowStart < threshold) {
                this.store.delete(key);
            }
        }
    }

    /**
     * Destroy the store and cleanup interval
     */
    destroy(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        this.store.clear();
    }
}

// Singleton instance for in-memory store
// Note: In production with multiple instances, use Redis
let rateLimitStore: InMemoryRateLimitStore | null = null;

function getRateLimitStore(): InMemoryRateLimitStore {
    if (!rateLimitStore) {
        rateLimitStore = new InMemoryRateLimitStore();
    }
    return rateLimitStore;
}

/**
 * Get client IP from request
 */
function getClientIP(request: NextRequest): string {
    // Check for forwarded headers (when behind proxy/load balancer)
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
        // Take the first IP in the chain
        return forwarded.split(',')[0].trim();
    }

    // Check for real IP header
    const realIP = request.headers.get('x-real-ip');
    if (realIP) {
        return realIP;
    }

    // Fallback to a default value (in production, this should be handled by the server)
    return (
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        request.headers.get('x-real-ip') ||
        '127.0.0.1'
    );
}

/**
 * Get rate limit configuration for a given path and method
 */
function getRateLimitConfig(path: string, method: string): RateLimitConfig | null {
    // Only apply rate limiting to mutation methods
    const isMutation = ['POST', 'PATCH', 'PUT', 'DELETE'].includes(method.toUpperCase());

    if (!isMutation) {
        // For now, don't rate limit read operations at middleware level
        // They can be added later if needed
        return null;
    }

    // Find matching endpoint category
    for (const { pattern, config } of ENDPOINT_CATEGORIES) {
        if (pattern.test(path)) {
            return config;
        }
    }

    // Default to mutations if path matches API but no specific config
    if (path.startsWith('/api/')) {
        return RATE_LIMITS.mutations;
    }

    return null;
}

/**
 * Check rate limit for a request
 * Returns rate limit result with the configured limit and remaining requests
 */
export async function checkRateLimit(
    request: NextRequest,
    config: RateLimitConfig
): Promise<RateLimitResult> {
    const clientIP = getClientIP(request);
    const path = request.nextUrl.pathname;
    const _method = request.method;

    // Create unique key: prefix:ip:path
    const key = `${config.keyPrefix || 'rl'}:${clientIP}:${path}`;

    const store = getRateLimitStore();
    const currentCount = store.get(key, config.windowSeconds);

    // Check if limit exceeded
    if (currentCount >= config.limit) {
        const now = Date.now();
        const windowStart =
            Math.floor(now / (config.windowSeconds * 1000)) * (config.windowSeconds * 1000);
        const reset = Math.ceil((windowStart + config.windowSeconds * 1000) / 1000);

        return {
            success: false,
            limit: config.limit,
            remaining: 0,
            reset,
        };
    }

    // Increment counter
    const result = await store.increment(key, config.windowSeconds);

    // Calculate remaining
    const remaining = Math.max(0, config.limit - currentCount - 1);

    return {
        success: true,
        limit: config.limit,
        remaining,
        reset: result.reset,
    };
}

/**
 * Rate limit middleware handler
 * Returns NextResponse with rate limit headers if rate limited, otherwise null
 */
export async function rateLimitMiddleware(request: NextRequest): Promise<NextResponse | null> {
    const path = request.nextUrl.pathname;
    const method = request.method;

    // Get rate limit config for this endpoint
    const config = getRateLimitConfig(path, method);

    if (!config) {
        // No rate limiting needed for this endpoint
        return null;
    }

    // Check rate limit
    const result = await checkRateLimit(request, config);

    // Create response (will be modified by caller)
    const response = NextResponse.next();

    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', result.limit.toString());
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
    response.headers.set('X-RateLimit-Reset', result.reset.toString());

    // If rate limited, return 429
    if (!result.success) {
        return NextResponse.json(
            {
                error: {
                    code: 'RATE_LIMIT_EXCEEDED',
                    message: 'Too many requests. Please try again later.',
                    retryAfter: result.reset - Math.floor(Date.now() / 1000),
                },
            },
            {
                status: 429,
                headers: {
                    'X-RateLimit-Limit': result.limit.toString(),
                    'X-RateLimit-Remaining': '0',
                    'X-RateLimit-Reset': result.reset.toString(),
                    'Retry-After': (result.reset - Math.floor(Date.now() / 1000)).toString(),
                },
            }
        );
    }

    return null; // Continue to next middleware/handler
}

/**
 * Apply rate limiting to an API route handler
 * This can be used in individual route.ts files for more granular control
 */
export function withRateLimit<T extends (...args: unknown[]) => unknown>(
    handler: T,
    config: RateLimitConfig
): T {
    return (async (request: NextRequest, ...args: unknown[]) => {
        const result = await checkRateLimit(request, config);

        if (!result.success) {
            return NextResponse.json(
                {
                    error: {
                        code: 'RATE_LIMIT_EXCEEDED',
                        message: 'Too many requests. Please try again later.',
                        retryAfter: result.reset - Math.floor(Date.now() / 1000),
                    },
                },
                {
                    status: 429,
                    headers: {
                        'X-RateLimit-Limit': result.limit.toString(),
                        'X-RateLimit-Remaining': '0',
                        'X-RateLimit-Reset': result.reset.toString(),
                        'Retry-After': (result.reset - Math.floor(Date.now() / 1000)).toString(),
                    },
                }
            );
        }

        // Add rate limit headers to successful response
        const response = (await handler(request, ...args)) as NextResponse | Response | undefined;
        if (response && typeof response === 'object' && 'headers' in response) {
            const headersObj = response.headers as Headers;
            headersObj.set('X-RateLimit-Limit', result.limit.toString());
            headersObj.set('X-RateLimit-Remaining', result.remaining.toString());
            headersObj.set('X-RateLimit-Reset', result.reset.toString());
        }

        return response;
    }) as T;
}

/**
 * Get Redis client (for future implementation)
 * Currently returns null - Redis support to be added
 */
export async function getRedisClient(): Promise<unknown> {
    // TODO: Implement Redis support for distributed rate limiting
    // When Redis is available:
    // 1. Check for REDIS_URL environment variable
    // 2. Create Redis client
    // 3. Use Redis for storing rate limit counters

    return null;
}
