import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, getHeaders, SLO_THRESHOLDS, STANDARD_STAGES } from './common.js';

export const options = {
    stages: STANDARD_STAGES,
    thresholds: SLO_THRESHOLDS.orders,
    tags: { service: 'orders-api' },
};

export default function () {
    const headers = getHeaders();
    const restaurantId = 'test-restaurant-1';

    const listRes = http.get(`${BASE_URL}/api/orders?restaurant_id=${restaurantId}&limit=20`, {
        headers,
    });
    check(listRes, {
        'list orders status 200': r => r.status === 200,
        'list orders has data': r => {
            try {
                return JSON.parse(r.body).data !== undefined;
            } catch (_) {
                return false;
            }
        },
    });

    sleep(1);

    const activeRes = http.get(
        `${BASE_URL}/api/orders?restaurant_id=${restaurantId}&status=pending,confirmed,preparing,ready`,
        { headers }
    );
    check(activeRes, {
        'active orders status 200': r => r.status === 200,
    });

    sleep(1);
}
