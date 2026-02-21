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
    '/api/staff/schedule': { windowMs: 60_000, maxRequests: 80 },
    '/api/staff/time-entries/clock': { windowMs: 60_000, maxRequests: 80 },
    '/api/alerts/rules': { windowMs: 60_000, maxRequests: 60 },
    '/api/alerts/rules/': { windowMs: 60_000, maxRequests: 60 }, // nested alert rule update endpoint
    '/api/merchant/dashboard-presets': { windowMs: 60_000, maxRequests: 60 },
    '/api/loyalty/programs': { windowMs: 60_000, maxRequests: 60 },
    '/api/loyalty/accounts/': { windowMs: 60_000, maxRequests: 60 }, // nested account adjustment endpoint
    '/api/gift-cards': { windowMs: 60_000, maxRequests: 60 },
    '/api/gift-cards/': { windowMs: 60_000, maxRequests: 60 }, // nested redeem endpoint
    '/api/campaigns': { windowMs: 60_000, maxRequests: 60 },
    '/api/campaigns/': { windowMs: 60_000, maxRequests: 60 }, // nested launch endpoint
    '/api/inventory/items': { windowMs: 60_000, maxRequests: 80 },
    '/api/inventory/movements': { windowMs: 60_000, maxRequests: 80 },
    '/api/inventory/variance': { windowMs: 60_000, maxRequests: 80 },
    '/api/inventory/purchase-orders': { windowMs: 60_000, maxRequests: 60 },
    '/api/inventory/invoices': { windowMs: 60_000, maxRequests: 60 },
    '/api/inventory/recipes': { windowMs: 60_000, maxRequests: 60 },
    '/api/finance/payments': { windowMs: 60_000, maxRequests: 80 },
    '/api/finance/refunds': { windowMs: 60_000, maxRequests: 60 },
    '/api/finance/exceptions': { windowMs: 60_000, maxRequests: 80 },
    '/api/finance/payouts': { windowMs: 60_000, maxRequests: 60 },
    '/api/finance/reconciliation': { windowMs: 60_000, maxRequests: 80 },
    '/api/finance/export': { windowMs: 60_000, maxRequests: 20 },
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
