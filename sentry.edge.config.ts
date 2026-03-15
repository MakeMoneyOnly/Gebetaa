import * as Sentry from '@sentry/nextjs';

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    tracesSampleRate: 0.1,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: process.env.NODE_ENV === 'development',

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
    ],

    // Edge runtime doesn't support all integrations
    integrations: [],

    // Edge-compatible beforeSend
    beforeSend(event, _hint) {
        // Add request context from headers if available
        if (event.request?.headers) {
            const headers = event.request.headers as Record<string, string>;

            // Device type from header
            const deviceType = headers['x-device-type'];
            if (deviceType) {
                event.tags = event.tags || {};
                event.tags.device_type = deviceType;
            }

            // Restaurant ID from header
            const restaurantId = headers['x-restaurant-id'];
            if (restaurantId) {
                event.tags = event.tags || {};
                event.tags.restaurant_id = restaurantId;
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
