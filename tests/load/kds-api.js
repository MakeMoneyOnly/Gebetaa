import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, getHeaders, SLO_THRESHOLDS, STANDARD_STAGES } from './common.js';

export const options = {
    scenarios: {
        kds_queue: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: STANDARD_STAGES,
            tags: { endpoint: 'kds-queue' },
            thresholds: SLO_THRESHOLDS.kdsQueue,
        },
        kds_status_updates: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '30s', target: 10 },
                { duration: '2m', target: 10 },
                { duration: '30s', target: 0 },
            ],
            tags: { endpoint: 'kds-status-update' },
            thresholds: SLO_THRESHOLDS.kdsStatusUpdate,
        },
    },
};

export default function () {
    const headers = getHeaders();
    const restaurantId = 'test-restaurant-1';

    const queueRes = http.get(`${BASE_URL}/api/kds/queue?restaurant_id=${restaurantId}`, {
        headers,
    });
    check(queueRes, {
        'kds queue status 200': r => r.status === 200,
        'kds queue has items': r => {
            try {
                const body = JSON.parse(r.body);
                return Array.isArray(body.data) || Array.isArray(body.items);
            } catch (_) {
                return false;
            }
        },
    });

    sleep(0.5);

    const itemId = 'test-kds-item-1';
    const statusRes = http.patch(
        `${BASE_URL}/api/kds/items/${itemId}/status`,
        JSON.stringify({ status: 'completed' }),
        { headers }
    );
    check(statusRes, {
        'kds status update 2xx or 404': r =>
            r.status === 200 || r.status === 204 || r.status === 404,
    });

    sleep(1);
}
