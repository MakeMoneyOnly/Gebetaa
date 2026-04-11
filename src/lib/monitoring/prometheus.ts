/**
 * Prometheus Metrics Module
 *
 * Provides Prometheus-compatible metrics for Grafana integration.
 * Uses prom-client registry with standard naming conventions.
 *
 * Exposed Metrics:
 * - http_request_duration_seconds_bucket (histogram)
 * - http_requests_total (counter)
 * - gebeta_orders_total (counter)
 * - gebeta_payments_total (counter)
 * - gebeta_active_sessions (gauge)
 * - gebeta_active_restaurants (gauge)
 *
 * @see docs/05-infrastructure/monitoring/grafana-dashboard.json
 * @see docs/implementation/observability-setup.md
 */

import client from 'prom-client';

// Clear registry on hot reload in development
if (process.env.NODE_ENV !== 'production') {
    client.register.clear();
}

// ============================================================================
// HTTP Metrics
// ============================================================================

/**
 * HTTP request duration histogram
 * Buckets: 50ms, 100ms, 250ms, 500ms, 1s, 2.5s, 5s, 10s
 */
const httpRequestDurationSeconds = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'path', 'status'],
    buckets: [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});

/**
 * HTTP requests total counter
 */
const httpRequestsTotal = new client.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'path', 'status'],
});

// ============================================================================
// Business Metrics
// ============================================================================

/**
 * Orders total counter
 */
const gebetaOrdersTotal = new client.Counter({
    name: 'gebeta_orders_total',
    help: 'Total orders processed',
    labelNames: ['restaurant_id', 'status'],
});

/**
 * Payments total counter
 */
const gebetaPaymentsTotal = new client.Counter({
    name: 'gebeta_payments_total',
    help: 'Total payments processed',
    labelNames: ['provider', 'status'],
});

/**
 * Payment failure rate gauge
 * Calculated as: failed_payments / total_payments * 100
 */
const gebetaPaymentFailureRate = new client.Gauge({
    name: 'gebeta_payment_failure_rate',
    help: 'Payment failure rate percentage',
    labelNames: ['provider'],
});

/**
 * Active sessions gauge
 */
const gebetaActiveSessions = new client.Gauge({
    name: 'gebeta_active_sessions',
    help: 'Currently active table sessions',
});

/**
 * Active restaurants gauge
 */
const gebetaActiveRestaurants = new client.Gauge({
    name: 'gebeta_active_restaurants',
    help: 'Number of restaurants with activity in the last hour',
});

// ============================================================================
// Exported Metrics Interface
// ============================================================================

export const metrics = {
    // HTTP metrics
    httpRequestDurationSeconds,
    httpRequestsTotal,

    // Business metrics
    gebetaOrdersTotal,
    gebetaPaymentsTotal,
    gebetaPaymentFailureRate,
    gebetaActiveSessions,
    gebetaActiveRestaurants,
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Record HTTP request duration
 */
export function recordHttpRequest(
    method: string,
    path: string,
    statusCode: number,
    durationMs: number
): void {
    const durationSeconds = durationMs / 1000;
    const status = String(statusCode);

    httpRequestDurationSeconds.labels(method, path, status).observe(durationSeconds);
    httpRequestsTotal.labels(method, path, status).inc();
}

/**
 * Record order event
 */
export function recordOrderEvent(restaurantId: string, status: string): void {
    gebetaOrdersTotal.labels(restaurantId, status).inc();
}

/**
 * Record payment event
 */
export function recordPaymentEvent(provider: string, status: string): void {
    gebetaPaymentsTotal.labels(provider, status).inc();
}

/**
 * Set active sessions count
 */
export function setActiveSessions(count: number): void {
    gebetaActiveSessions.set(count);
}

/**
 * Set active restaurants count
 */
export function setActiveRestaurants(count: number): void {
    gebetaActiveRestaurants.set(count);
}

/**
 * Get Prometheus metrics in text format
 */
export async function getPrometheusMetrics(): Promise<string> {
    return client.register.metrics();
}

/**
 * Get content type for Prometheus response
 */
export function getPrometheusContentType(): string {
    return 'text/plain; version=0.0.4; charset=utf-8';
}

/**
 * Get metrics as JSON (for debugging)
 */
export async function getMetricsJson(): Promise<unknown> {
    return client.register.getMetricsAsJSON();
}

export default metrics;