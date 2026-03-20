/**
 * GraphQL Configuration
 *
 * Controls introspection and debug settings for GraphQL servers.
 * Introspection should be disabled in production for security.
 */

const ENABLE_INTROSPECTION =
    process.env.GRAPHQL_ENABLE_INTROSPECTION === 'true' || process.env.NODE_ENV !== 'production';

// Warn if introspection is enabled in production
if (ENABLE_INTROSPECTION && process.env.NODE_ENV === 'production') {
    console.warn(
        '⚠️ GraphQL introspection is ENABLED in production. This should be disabled for security.'
    );
}

export const graphqlConfig = {
    introspection: ENABLE_INTROSPECTION,
    debug: process.env.NODE_ENV !== 'production',
} as const;

// Log configuration on startup
if (process.env.NODE_ENV !== 'test') {
    console.log(
        `GraphQL Configuration: introspection=${ENABLE_INTROSPECTION}, debug=${graphqlConfig.debug}`
    );
}
