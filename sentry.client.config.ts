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
    
    // Configure replays
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    
    integrations: [
        Sentry.replayIntegration({
            // Additional Replay configuration goes in here
            maskAllText: true,
            blockAllMedia: true,
        }),
    ],
});