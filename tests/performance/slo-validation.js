import http from 'k6/http';
import { check, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_KEY = __ENV.API_KEY || '';

const commandCenterDuration = new Trend('command_center_duration', true);
const ordersDuration = new Trend('orders_duration', true);
const orderStatusDuration = new Trend('order_status_duration', true);
const errorRate = new Rate('error_rate');

export const options = {
    scenarios: {
        slo_validation: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '2m', target: 20 },
                { duration: '5m', target: 20 },
                { duration: '1m', target: 0 },
            ],
        },
    },
    thresholds: {
        command_center_duration: ['p(95)<500'],
        orders_duration: ['p(95)<400'],
        order_status_duration: ['p(95)<300'],
        error_rate: ['rate<0.01'],
    },
};

function getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (API_KEY) headers['Authorization'] = `Bearer ${API_KEY}`;
    return headers;
}

export default function () {
    const headers = getHeaders();
    const restaurantId = 'test-restaurant-1';

    group('GET /api/merchant/command-center', () => {
        const res = http.get(
            `${BASE_URL}/api/merchant/command-center?restaurant_id=${restaurantId}`,
            { headers }
        );
        commandCenterDuration.add(res.timings.duration);
        errorRate.add(res.status >= 400);
        check(res, {
            'command center ok': r => r.status === 200 || r.status === 401,
        });
    });

    group('GET /api/orders', () => {
        const res = http.get(`${BASE_URL}/api/orders?restaurant_id=${restaurantId}`, { headers });
        ordersDuration.add(res.timings.duration);
        errorRate.add(res.status >= 400);
        check(res, {
            'orders ok': r => r.status === 200 || r.status === 401,
        });
    });

    group('PATCH /api/orders/:id/status', () => {
        const orderId = 'test-order-1';
        const res = http.patch(
            `${BASE_URL}/api/orders/${orderId}/status`,
            JSON.stringify({ status: 'preparing' }),
            { headers }
        );
        orderStatusDuration.add(res.timings.duration);
        errorRate.add(res.status >= 400);
        check(res, {
            'order status ok': r => r.status === 200 || r.status === 401 || r.status === 404,
        });
    });
}
