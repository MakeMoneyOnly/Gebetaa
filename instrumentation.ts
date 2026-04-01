/**
 * Next.js Instrumentation Hook
 *
 * This file runs when the Next.js server starts (in production or development).
 * Use it to validate configuration, initialize services, etc.
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
    // Only run on the server side
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        // Validate E2E test configuration for security
        const { validateE2EConfig } = await import('./src/lib/security/e2e-validation');
        validateE2EConfig();

        // Initialize Sentry for server-side error tracking
        await import('./sentry.server.config');
    }

    if (process.env.NEXT_RUNTIME === 'edge') {
        // Edge runtime Sentry configuration
        await import('./sentry.edge.config');
    }
}
