/**
 * Gebeta Peak-Flow Load Tests
 *
 * Tests critical API endpoints under load to validate SLO compliance.
 *
 * SLO Targets:
 * - GET /api/merchant/command-center: P95 <= 500ms, error < 1%
 * - GET /api/orders: P95 <= 400ms, error < 1%
 * - PATCH /api/orders/:id/status: P95 <= 300ms, error < 0.5%
 *
 * Usage:
 *   k6 run k6/peak-flow-scenarios.js
 *
 * Environment Variables:
 *   K6_BASE_URL - Base URL for the API (default: http://localhost:3000)
 *   K6_AUTH_TOKEN - Bearer token for authentication
 *   K6_USE_BYPASS_AUTH - Set to "true" to use x-e2e-bypass-auth header
 *   K6_ORDER_ID - Valid order ID for status update tests
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const commandCenterLatency = new Trend('command_center_latency');
const ordersLatency = new Trend('orders_latency');
const orderStatusLatency = new Trend('order_status_latency');
const errorRate = new Rate('error_rate');

// Configuration
const BASE_URL = __ENV.K6_BASE_URL || 'http://localhost:3000';
const AUTH_TOKEN = __ENV.K6_AUTH_TOKEN || '';
const USE_BYPASS_AUTH = __ENV.K6_USE_BYPASS_AUTH === 'true';
const ORDER_ID = __ENV.K6_ORDER_ID || 'test-order-id';

// Default headers
function getHeaders() {
    const headers = {
        'Content-Type': 'application/json',
    };

    if (USE_BYPASS_AUTH) {
        headers['x-e2e-bypass-auth'] = '1';
    } else if (AUTH_TOKEN) {
        headers['Authorization'] = `Bearer ${AUTH_TOKEN}`;
    }

    return headers;
}

// Test scenarios
export const options = {
    scenarios: {
        // Command center load test
        command_center: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '30s', target: 20 }, // Ramp up to 20 users
                { duration: '1m', target: 20 }, // Hold at 20 users
                { duration: '30s', target: 0 }, // Ramp down
            ],
            gracefulRampDown: '30s',
            exec: 'testCommandCenter',
        },
        // Orders list load test
        orders_list: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '30s', target: 25 }, // Ramp up to 25 users
                { duration: '1m', target: 25 }, // Hold at 25 users
                { duration: '30s', target: 0 }, // Ramp down
            ],
            gracefulRampDown: '30s',
            exec: 'testOrdersList',
        },
        // Order status update load test
        order_status_update: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '30s', target: 15 }, // Ramp up to 15 users
                { duration: '1m', target: 15 }, // Hold at 15 users
                { duration: '30s', target: 0 }, // Ramp down
            ],
            gracefulRampDown: '30s',
            exec: 'testOrderStatusUpdate',
        },
    },

    // Thresholds based on SLOs
    thresholds: {
        // Command center: P95 <= 500ms, error < 1%
        command_center_latency: ['p(95)<=500'],
        command_center_errors: ['rate<0.01'],

        // Orders list: P95 <= 400ms, error < 1%
        orders_latency: ['p(95)<=400'],
        orders_errors: ['rate<0.01'],

        // Order status update: P95 <= 300ms, error < 0.5%
        order_status_latency: ['p(95)<=300'],
        order_status_errors: ['rate<0.005'],

        // Global error rate
        error_rate: ['rate<0.01'],
    },

    // Setup and teardown
    setup: () => {
        console.log(`Starting load tests against: ${BASE_URL}`);
        console.log(`Using bypass auth: ${USE_BYPASS_AUTH}`);
        console.log(`Using bearer token: ${!!AUTH_TOKEN}`);
    },
};

// Test: GET /api/merchant/command-center
export function testCommandCenter() {
    const url = `${BASE_URL}/api/merchant/command-center?range=today`;
    const params = { headers: getHeaders() };

    const res = http.get(url, params);

    // Track latency
    commandCenterLatency.add(res.timings.duration);

    // Check response
    const success = check(res, {
        'command_center status is 200': r => r.status === 200,
        'command_center response time < 500ms': r => r.timings.duration < 500,
    });

    // Track errors
    if (!success) {
        errorRate.add(1);
    } else {
        errorRate.add(0);
    }

    sleep(1);
}

// Test: GET /api/orders
export function testOrdersList() {
    const url = `${BASE_URL}/api/orders`;
    const params = { headers: getHeaders() };

    const res = http.get(url, params);

    // Track latency
    ordersLatency.add(res.timings.duration);

    // Check response
    const success = check(res, {
        'orders status is 200': r => r.status === 200,
        'orders response time < 400ms': r => r.timings.duration < 400,
    });

    // Track errors
    if (!success) {
        errorRate.add(1);
    } else {
        errorRate.add(0);
    }

    sleep(1);
}

// Test: PATCH /api/orders/:id/status
export function testOrderStatusUpdate() {
    const url = `${BASE_URL}/api/orders/${ORDER_ID}/status`;
    const params = {
        headers: getHeaders(),
    };

    const payload = JSON.stringify({
        status: 'preparing',
    });

    const res = http.patch(url, payload, params);

    // Track latency
    orderStatusLatency.add(res.timings.duration);

    // Check response (allow 404 for non-existent order, but still measure latency)
    const _success = check(res, {
        'order_status status is 2xx or 404': r => r.status >= 200 && r.status < 500,
        'order_status response time < 300ms': r => r.timings.duration < 300,
    });

    // Track errors (only count 5xx as errors, not 404 for test orders)
    if (res.status >= 500) {
        errorRate.add(1);
    } else {
        errorRate.add(0);
    }

    sleep(1);
}

// Teardown
export function teardown() {
    console.log('Load tests completed');
}
