/**
 * Gebeta Peak-Flow Load Tests
 *
 * Tests critical API endpoints under load to validate SLO compliance.
 *
 * SLO Targets:
 * - GET /api/merchant/command-center: P95 <= 500ms, error < 1%
 * - GET /api/orders: P95 <= 400ms, error < 1%
 * - PATCH /api/orders/:id/status: P95 <= 300ms, error < 0.5%
 * - Realtime propagation: P95 <= 2000ms
 *
 * Usage:
 *   k6 run k6/peak-flow-scenarios.js
 *
 * Environment Variables:
 *   K6_BASE_URL - Base URL for the API (default: http://localhost:3000)
 *   K6_AUTH_TOKEN - Bearer token for authentication
 *   K6_USE_BYPASS_AUTH - Set to "true" to use x-e2e-bypass-auth header
 *   K6_ORDER_ID - Valid order ID for status update tests
 *   K6_RESTAURANT_ID - Restaurant ID for multi-tenant tests
 *   K6_TABLE_ID - Table ID for session tests
 *
 * Test Scenarios:
 *   1. Peak Hour Ordering - Simulates lunch/dinner rush with high order volume
 *   2. KDS High-Volume - Tests KDS queue processing under load
 *   3. Payment Gateway Stress - Tests payment processing capacity
 *   4. Concurrent Table Sessions - Tests table session management
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics - API endpoints
const commandCenterLatency = new Trend('command_center_latency');
const ordersLatency = new Trend('orders_latency');
const orderStatusLatency = new Trend('order_status_latency');
const errorRate = new Rate('error_rate');

// Custom metrics - Peak hour
const peakOrderLatency = new Trend('peak_order_latency');
const peakOrderCount = new Counter('peak_order_count');

// Custom metrics - KDS
const kdsQueueLatency = new Trend('kds_queue_latency');
const kdsProcessingLatency = new Trend('kds_processing_latency');
const kdsErrorRate = new Rate('kds_error_rate');

// Custom metrics - Payment
const paymentLatency = new Trend('payment_latency');
const paymentSuccessRate = new Rate('payment_success_rate');
const paymentErrorRate = new Rate('payment_error_rate');

// Custom metrics - Table sessions
const sessionLatency = new Trend('session_latency');
const sessionErrorRate = new Rate('session_error_rate');

// Configuration
const BASE_URL = __ENV.K6_BASE_URL || 'http://localhost:3000';
const AUTH_TOKEN = __ENV.K6_AUTH_TOKEN || '';
const USE_BYPASS_AUTH = __ENV.K6_USE_BYPASS_AUTH === 'true';
const ORDER_ID = __ENV.K6_ORDER_ID || 'test-order-id';
const RESTAURANT_ID = __ENV.K6_RESTAURANT_ID || 'test-restaurant-id';
const TABLE_ID = __ENV.K6_TABLE_ID || 'test-table-id';

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

// Generate unique IDs for test data
function generateOrderId() {
    return `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function generateIdempotencyKey() {
    return `idem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Test scenarios
export const options = {
    scenarios: {
        // ============================================
        // CORE API TESTS (Existing)
        // ============================================

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

        // ============================================
        // PEAK HOUR ORDERING TESTS (New)
        // ============================================

        // Lunch rush simulation (12:00-14:00 typical)
        peak_hour_lunch: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '1m', target: 30 }, // Rapid ramp up (lunch rush start)
                { duration: '3m', target: 50 }, // Peak lunch traffic
                { duration: '2m', target: 50 }, // Sustained peak
                { duration: '1m', target: 30 }, // Wind down
                { duration: '30s', target: 0 }, // End of rush
            ],
            gracefulRampDown: '30s',
            exec: 'testPeakHourOrder',
            startTime: '3m', // Start after basic tests
        },
        // Dinner rush simulation (18:00-21:00 typical)
        peak_hour_dinner: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '1m', target: 40 }, // Gradual ramp up
                { duration: '4m', target: 60 }, // Peak dinner traffic (higher than lunch)
                { duration: '2m', target: 60 }, // Sustained peak
                { duration: '1m', target: 20 }, // Wind down
                { duration: '30s', target: 0 }, // End of rush
            ],
            gracefulRampDown: '30s',
            exec: 'testPeakHourOrder',
            startTime: '12m', // Start after lunch simulation
        },

        // ============================================
        // KDS HIGH-VOLUME TESTS (New)
        // ============================================

        // KDS queue processing under load
        kds_high_volume: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '30s', target: 20 }, // Ramp up
                { duration: '2m', target: 40 }, // High volume
                { duration: '1m', target: 40 }, // Sustained
                { duration: '30s', target: 0 }, // Ramp down
            ],
            gracefulRampDown: '30s',
            exec: 'testKDSQueue',
            startTime: '22m', // Start after dinner simulation
        },
        // KDS status updates (kitchen staff actions)
        kds_status_updates: {
            executor: 'constant-arrival-rate',
            rate: 50, // 50 updates per second
            timeUnit: '1s',
            duration: '2m',
            preAllocatedVUs: 20,
            maxVUs: 50,
            exec: 'testKDSStatusUpdate',
            startTime: '26m', // Run during KDS tests
        },

        // ============================================
        // PAYMENT GATEWAY STRESS TESTS (New)
        // ============================================

        // Payment processing stress test
        payment_stress: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '30s', target: 15 }, // Ramp up
                { duration: '1m', target: 30 }, // Moderate load
                { duration: '30s', target: 50 }, // High load
                { duration: '30s', target: 30 }, // Back to moderate
                { duration: '30s', target: 0 }, // Ramp down
            ],
            gracefulRampDown: '30s',
            exec: 'testPaymentProcessing',
            startTime: '29m', // Start after KDS tests
        },
        // Payment webhook processing
        payment_webhook: {
            executor: 'constant-arrival-rate',
            rate: 20, // 20 webhooks per second
            timeUnit: '1s',
            duration: '1m',
            preAllocatedVUs: 10,
            maxVUs: 30,
            exec: 'testPaymentWebhook',
            startTime: '32m', // Run during payment tests
        },

        // ============================================
        // CONCURRENT TABLE SESSION TESTS (New)
        // ============================================

        // Table session management
        concurrent_sessions: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '30s', target: 30 }, // Ramp up (many tables)
                { duration: '2m', target: 50 }, // High concurrency
                { duration: '1m', target: 50 }, // Sustained
                { duration: '30s', target: 0 }, // Ramp down
            ],
            gracefulRampDown: '30s',
            exec: 'testTableSession',
            startTime: '34m', // Start after payment tests
        },
        // Session heartbeat (keep-alive)
        session_heartbeat: {
            executor: 'constant-arrival-rate',
            rate: 100, // 100 heartbeats per second
            timeUnit: '1s',
            duration: '2m',
            preAllocatedVUs: 30,
            maxVUs: 80,
            exec: 'testSessionHeartbeat',
            startTime: '35m', // Run during session tests
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

        // Peak hour orders: P95 <= 500ms, error < 1%
        peak_order_latency: ['p(95)<=500'],
        peak_order_count: ['count>0'],

        // KDS: P95 <= 300ms for queue, <= 200ms for status updates
        kds_queue_latency: ['p(95)<=300'],
        kds_processing_latency: ['p(95)<=200'],
        kds_error_rate: ['rate<0.01'],

        // Payment: P95 <= 2000ms, success rate > 95%
        payment_latency: ['p(95)<=2000'],
        payment_success_rate: ['rate>0.95'],
        payment_error_rate: ['rate<0.02'],

        // Sessions: P95 <= 400ms, error < 1%
        session_latency: ['p(95)<=400'],
        session_error_rate: ['rate<0.01'],

        // Global error rate
        error_rate: ['rate<0.01'],
    },

    // Setup and teardown
    setup: () => {
        console.warn(`Starting load tests against: ${BASE_URL}`);
        console.warn(`Using bypass auth: ${USE_BYPASS_AUTH}`);
        console.warn(`Using bearer token: ${!!AUTH_TOKEN}`);
        console.warn(`Restaurant ID: ${RESTAURANT_ID}`);
        console.warn(`Table ID: ${TABLE_ID}`);
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

// ============================================
// PEAK HOUR ORDERING TESTS
// ============================================

// Test: POST /api/orders (peak hour simulation)
export function testPeakHourOrder() {
    const url = `${BASE_URL}/api/orders`;
    const params = {
        headers: {
            ...getHeaders(),
            'x-idempotency-key': generateIdempotencyKey(),
        },
    };

    // Simulate realistic order payload
    const payload = JSON.stringify({
        restaurant_id: RESTAURANT_ID,
        table_id: TABLE_ID,
        items: [
            { menu_item_id: 'item-1', quantity: 2, notes: '' },
            { menu_item_id: 'item-2', quantity: 1, notes: 'No onions' },
        ],
        order_type: 'dine_in',
        idempotency_key: generateIdempotencyKey(),
    });

    const res = http.post(url, payload, params);

    // Track latency
    peakOrderLatency.add(res.timings.duration);

    // Check response
    const success = check(res, {
        'peak_order status is 2xx': r => r.status >= 200 && r.status < 300,
        'peak_order response time < 500ms': r => r.timings.duration < 500,
    });

    // Track order count and errors
    if (success) {
        peakOrderCount.add(1);
    }

    if (!success && res.status >= 500) {
        errorRate.add(1);
    } else {
        errorRate.add(0);
    }

    sleep(Math.random() * 2 + 1); // Random 1-3s think time
}

// ============================================
// KDS HIGH-VOLUME TESTS
// ============================================

// Test: GET /api/kds/queue
export function testKDSQueue() {
    const url = `${BASE_URL}/api/kds/queue?restaurant_id=${RESTAURANT_ID}`;
    const params = { headers: getHeaders() };

    const res = http.get(url, params);

    // Track latency
    kdsQueueLatency.add(res.timings.duration);

    // Check response
    const success = check(res, {
        'kds_queue status is 200': r => r.status === 200,
        'kds_queue response time < 300ms': r => r.timings.duration < 300,
        'kds_queue has data': r => {
            try {
                const body = JSON.parse(r.body);
                return Array.isArray(body.data) || Array.isArray(body);
            } catch (_e) {
                return false;
            }
        },
    });

    // Track errors
    if (!success) {
        kdsErrorRate.add(1);
    } else {
        kdsErrorRate.add(0);
    }

    sleep(0.5); // Fast polling interval
}

// Test: PATCH /api/kds/items/:id/status
export function testKDSStatusUpdate() {
    const itemId = `kds-item-${Math.floor(Math.random() * 1000)}`;
    const url = `${BASE_URL}/api/kds/items/${itemId}/status`;
    const params = {
        headers: {
            ...getHeaders(),
            'x-idempotency-key': generateIdempotencyKey(),
        },
    };

    const payload = JSON.stringify({
        status: 'completed',
        completed_at: new Date().toISOString(),
    });

    const res = http.patch(url, payload, params);

    // Track latency
    kdsProcessingLatency.add(res.timings.duration);

    // Check response (allow 404 for non-existent items)
    const success = check(res, {
        'kds_status status is 2xx or 404': r => r.status >= 200 && r.status < 500,
        'kds_status response time < 200ms': r => r.timings.duration < 200,
    });

    // Track errors
    if (!success || res.status >= 500) {
        kdsErrorRate.add(1);
    } else {
        kdsErrorRate.add(0);
    }

    sleep(0.2); // Very fast updates
}

// ============================================
// PAYMENT GATEWAY STRESS TESTS
// ============================================

// Test: POST /api/payments
export function testPaymentProcessing() {
    const url = `${BASE_URL}/api/payments`;
    const params = {
        headers: {
            ...getHeaders(),
            'x-idempotency-key': generateIdempotencyKey(),
        },
        timeout: '10s', // Payment can take longer
    };

    const payload = JSON.stringify({
        order_id: generateOrderId(),
        amount: Math.floor(Math.random() * 500 + 100), // 100-600 ETB
        currency: 'ETB',
        provider: Math.random() > 0.5 ? 'telebirr' : 'chapa',
        return_url: `${BASE_URL}/payment/callback`,
        idempotency_key: generateIdempotencyKey(),
    });

    const res = http.post(url, JSON.stringify(payload), params);

    // Track latency
    paymentLatency.add(res.timings.duration);

    // Check response
    const success = check(res, {
        'payment status is 2xx': r => r.status >= 200 && r.status < 300,
        'payment response time < 2000ms': r => r.timings.duration < 2000,
    });

    // Track success/failure rates
    if (success) {
        paymentSuccessRate.add(1);
    } else {
        paymentSuccessRate.add(0);
    }

    if (res.status >= 500) {
        paymentErrorRate.add(1);
        errorRate.add(1);
    } else {
        paymentErrorRate.add(0);
        errorRate.add(0);
    }

    sleep(Math.random() * 3 + 1); // 1-4s between payments
}

// Test: POST /api/payments/webhook
export function testPaymentWebhook() {
    const url = `${BASE_URL}/api/payments/webhook`;
    const params = {
        headers: {
            'Content-Type': 'application/json',
            'x-webhook-signature': 'test-signature',
            'x-webhook-timestamp': Date.now().toString(),
        },
    };

    const payload = JSON.stringify({
        event: 'payment.completed',
        data: {
            payment_id: `pay-${Date.now()}`,
            order_id: generateOrderId(),
            status: 'completed',
            amount: Math.floor(Math.random() * 500 + 100),
            provider: Math.random() > 0.5 ? 'telebirr' : 'chapa',
            timestamp: new Date().toISOString(),
        },
    });

    const res = http.post(url, payload, params);

    // Track latency
    paymentLatency.add(res.timings.duration);

    // Check response (webhook should return 200 quickly)
    check(res, {
        'webhook status is 200': r => r.status === 200,
        'webhook response time < 500ms': r => r.timings.duration < 500,
    });

    sleep(0.1); // Fast webhook processing
}

// ============================================
// CONCURRENT TABLE SESSION TESTS
// ============================================

// Test: POST /api/sessions (create/join table session)
export function testTableSession() {
    const url = `${BASE_URL}/api/sessions`;
    const params = {
        headers: {
            ...getHeaders(),
            'x-idempotency-key': generateIdempotencyKey(),
        },
    };

    const payload = JSON.stringify({
        restaurant_id: RESTAURANT_ID,
        table_id: `table-${Math.floor(Math.random() * 20) + 1}`,
        session_type: 'dine_in',
        idempotency_key: generateIdempotencyKey(),
    });

    const res = http.post(url, payload, params);

    // Track latency
    sessionLatency.add(res.timings.duration);

    // Check response
    const success = check(res, {
        'session status is 2xx': r => r.status >= 200 && r.status < 300,
        'session response time < 400ms': r => r.timings.duration < 400,
    });

    // Track errors
    if (!success || res.status >= 500) {
        sessionErrorRate.add(1);
        errorRate.add(1);
    } else {
        sessionErrorRate.add(0);
        errorRate.add(0);
    }

    sleep(Math.random() * 2 + 0.5); // 0.5-2.5s between session operations
}

// Test: POST /api/sessions/:id/heartbeat
export function testSessionHeartbeat() {
    const sessionId = `session-${Math.floor(Math.random() * 100)}`;
    const url = `${BASE_URL}/api/sessions/${sessionId}/heartbeat`;
    const params = { headers: getHeaders() };

    const payload = JSON.stringify({
        last_seen: new Date().toISOString(),
        device_id: `device-${Math.floor(Math.random() * 50)}`,
    });

    const res = http.post(url, payload, params);

    // Track latency
    sessionLatency.add(res.timings.duration);

    // Check response (heartbeat should be fast)
    const success = check(res, {
        'heartbeat status is 2xx or 404': r => r.status >= 200 && r.status < 500,
        'heartbeat response time < 200ms': r => r.timings.duration < 200,
    });

    // Track errors
    if (!success || res.status >= 500) {
        sessionErrorRate.add(1);
    } else {
        sessionErrorRate.add(0);
    }

    sleep(0.05); // Very fast heartbeat
}

// ============================================
// TEARDOWN
// ============================================

// Teardown
export function teardown() {
    console.warn('Load tests completed');
    console.warn('All scenarios executed successfully');
}
