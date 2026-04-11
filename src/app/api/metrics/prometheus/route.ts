/**
 * Prometheus Metrics Endpoint
 *
 * Exposes metrics in Prometheus text format for Grafana scraping.
 * This endpoint is designed to be scraped by Prometheus or compatible
 * monitoring systems.
 *
 * Endpoint: GET /api/metrics/prometheus
 *
 * @see docs/05-infrastructure/monitoring/grafana-dashboard.json
 */

import { NextResponse } from 'next/server';
import { getPrometheusMetrics, getPrometheusContentType } from '@/lib/monitoring/prometheus';

/**
 * GET /api/metrics/prometheus
 *
 * Returns Prometheus-compatible metrics in text format.
 * No authentication required for metrics scraping (public endpoint).
 *
 * Metrics exposed:
 * - http_request_duration_seconds_bucket
 * - http_requests_total
 * - gebeta_orders_total
 * - gebeta_payments_total
 * - gebeta_payment_failure_rate
 * - gebeta_active_sessions
 * - gebeta_active_restaurants
 */
export async function GET(): Promise<NextResponse> {
    try {
        const metrics = await getPrometheusMetrics();
        const contentType = getPrometheusContentType();

        return new NextResponse(metrics, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
            },
        });
    } catch (error) {
        // Log error but return empty metrics to avoid breaking scrapers
        console.error('[PrometheusMetrics] Error generating metrics:', error);

        return new NextResponse(
            '# Error generating metrics\n# Please check application logs\n',
            {
                status: 500,
                headers: {
                    'Content-Type': getPrometheusContentType(),
                },
            }
        );
    }
}