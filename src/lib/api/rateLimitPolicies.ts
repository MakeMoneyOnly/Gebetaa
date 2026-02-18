export type RouteRateLimitPolicy = {
    windowMs: number;
    maxRequests: number;
};

export const API_RATE_LIMIT_POLICIES: Record<string, RouteRateLimitPolicy> = {
    '/api/orders': { windowMs: 60_000, maxRequests: 80 },
    '/api/orders/': { windowMs: 60_000, maxRequests: 100 }, // prefix match for nested order routes
    '/api/service-requests': { windowMs: 60_000, maxRequests: 60 },
    '/api/merchant/command-center': { windowMs: 60_000, maxRequests: 120 },
    '/api/support/tickets': { windowMs: 60_000, maxRequests: 30 },
    '/api/channels/summary': { windowMs: 60_000, maxRequests: 100 },
    '/api/channels/online-ordering/settings': { windowMs: 60_000, maxRequests: 60 },
    '/api/channels/delivery/connect': { windowMs: 60_000, maxRequests: 30 },
    '/api/channels/delivery/orders': { windowMs: 60_000, maxRequests: 80 },
    '/api/channels/delivery/orders/': { windowMs: 60_000, maxRequests: 60 }, // nested ack endpoint
};

export const DEFAULT_API_RATE_LIMIT_POLICY: RouteRateLimitPolicy = {
    windowMs: 60_000,
    maxRequests: 100,
};

export function resolveRateLimitPolicy(pathname: string): RouteRateLimitPolicy {
    const exact = API_RATE_LIMIT_POLICIES[pathname];
    if (exact) {
        return exact;
    }

    // Prefix fallback for dynamic nested routes.
    const prefix = Object.keys(API_RATE_LIMIT_POLICIES).find(
        key => key.endsWith('/') && pathname.startsWith(key)
    );
    if (prefix) {
        return API_RATE_LIMIT_POLICIES[prefix];
    }

    return DEFAULT_API_RATE_LIMIT_POLICY;
}
