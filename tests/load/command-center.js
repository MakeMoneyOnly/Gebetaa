import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, getHeaders, SLO_THRESHOLDS, STANDARD_STAGES } from './common.js';

export const options = {
    stages: STANDARD_STAGES,
    thresholds: SLO_THRESHOLDS.commandCenter,
    tags: { service: 'command-center' },
};

export default function () {
    const headers = getHeaders();
    const restaurantId = 'test-restaurant-1';

    const todayRes = http.get(
        `${BASE_URL}/api/merchant/command-center?restaurant_id=${restaurantId}&range=today`,
        { headers }
    );
    check(todayRes, {
        'command center today status 200': r => r.status === 200,
        'command center has metrics': r => {
            try {
                const body = JSON.parse(r.body);
                return body.data !== undefined || body.metrics !== undefined;
            } catch (_) {
                return false;
            }
        },
    });

    sleep(1);

    const weekRes = http.get(
        `${BASE_URL}/api/merchant/command-center?restaurant_id=${restaurantId}&range=week`,
        { headers }
    );
    check(weekRes, {
        'command center week status 200': r => r.status === 200,
    });

    sleep(1);

    const liveRes = http.get(
        `${BASE_URL}/api/merchant/command-center?restaurant_id=${restaurantId}&range=live`,
        { headers }
    );
    check(liveRes, {
        'command center live status 200': r => r.status === 200,
    });

    sleep(1);
}
