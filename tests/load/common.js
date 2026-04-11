import { check, sleep } from 'k6';

export const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
export const API_KEY = __ENV.API_KEY || '';

/**
 * Default thresholds aligned with performance SLOs
 */
export const DEFAULT_THRESHOLDS = {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
};

/**
 * SLO-specific thresholds
 */
export const SLO_THRESHOLDS = {
    commandCenter: {
        http_req_duration: ['p(95)<500'],
        http_req_failed: ['rate<0.01'],
    },
    orders: {
        http_req_duration: ['p(95)<400'],
        http_req_failed: ['rate<0.01'],
    },
    orderStatus: {
        http_req_duration: ['p(95)<300'],
        http_req_failed: ['rate<0.005'],
    },
    kdsQueue: {
        http_req_duration: ['p(95)<300'],
        http_req_failed: ['rate<0.01'],
    },
    kdsStatusUpdate: {
        http_req_duration: ['p(95)<200'],
        http_req_failed: ['rate<0.01'],
    },
    payments: {
        http_req_duration: ['p(95)<2000'],
        http_req_failed: ['rate<0.02'],
    },
    paymentWebhook: {
        http_req_duration: ['p(95)<500'],
        http_req_failed: ['rate<0.01'],
    },
};

/**
 * Common headers for API requests
 */
export function getHeaders(authToken = null) {
    const headers = {
        'Content-Type': 'application/json',
    };
    if (API_KEY) {
        headers['Authorization'] = `Bearer ${API_KEY}`;
    }
    if (authToken) {
        headers['Cookie'] = `auth-token=${authToken}`;
    }
    return headers;
}

/**
 * Standard load test stages: ramp up -> sustain -> ramp down
 */
export const STANDARD_STAGES = [
    { duration: '30s', target: 20 },
    { duration: '2m', target: 20 },
    { duration: '30s', target: 50 },
    { duration: '5m', target: 50 },
    { duration: '30s', target: 0 },
];

/**
 * Peak load test stages for rush hour simulation
 */
export const PEAK_STAGES = [
    { duration: '1m', target: 50 },
    { duration: '5m', target: 100 },
    { duration: '10m', target: 100 },
    { duration: '2m', target: 50 },
    { duration: '1m', target: 0 },
];

/**
 * Smoke test stages - minimal load to verify endpoints work
 */
export const SMOKE_STAGES = [
    { duration: '10s', target: 2 },
    { duration: '30s', target: 2 },
    { duration: '10s', target: 0 },
];

/**
 * Stress test stages - push beyond expected capacity
 */
export const STRESS_STAGES = [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 100 },
    { duration: '2m', target: 200 },
    { duration: '5m', target: 200 },
    { duration: '2m', target: 0 },
];
