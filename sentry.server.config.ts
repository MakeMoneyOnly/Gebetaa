import * as Sentry from '@sentry/nextjs';

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 0.1,

    // Set sample rate for profiling to 0.1 (10%)
    // This is relative to tracesSampleRate
    profilesSampleRate: 0.1,

    debug: false,

    // Set environment
    environment: process.env.NODE_ENV || 'development',

    // Ignore specific errors
    ignoreErrors: [
        // Browser extensions
        'Non-Error promise rejection captured',
        // Network errors that are user-caused
        'NetworkError',
        'Network request failed',
        // Abort errors (common in React)
        'AbortError',
        // Cancelled requests
        'cancelled',
        // Chunk loading errors
        'ChunkLoadError',
    ],

    // Configure replays
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    integrations: [
        // Extra integrations for better error context
        Sentry.extraErrorDataIntegration(),
        Sentry.captureConsoleIntegration({
            levels: ['error', 'warn'],
        }),
        // Database query context
        Sentry.contextLinesIntegration(),
    ],

    // Server-side beforeSend - add restaurant context from async local storage
    async beforeSend(event, _hint) {
        // Import server context dynamically to avoid circular deps
        const { getServerRestaurantId } = await import('./src/lib/monitoring/sentry-context');

        // Tag with restaurant_id if available from server context
        const restaurantId = getServerRestaurantId();
        if (restaurantId) {
            event.tags = event.tags || {};
            event.tags.restaurant_id = restaurantId;
        }

        // Add request headers context
        if (event.request?.headers) {
            const headers = event.request.headers as Record<string, string>;

            // Device type from header (set by POS/KDS devices)
            const deviceType = headers['x-device-type'];
            if (deviceType) {
                event.tags = event.tags || {};
                event.tags.device_type = deviceType;
            }

            // Restaurant ID from header (for device auth)
            const headerRestaurantId = headers['x-restaurant-id'];
            if (headerRestaurantId) {
                event.tags = event.tags || {};
                event.tags.restaurant_id = headerRestaurantId;
            }
        }

        return event;
    },

    // beforeSendTransaction for performance events
    beforeSendTransaction(event) {
        // Don't send health check transactions
        if (event.transaction?.includes('/api/health')) {
            return null;
        }
        return event;
    },
});
