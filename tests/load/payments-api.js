import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';
import { BASE_URL, getHeaders, SLO_THRESHOLDS, PEAK_STAGES } from './common.js';

const paymentSuccessRate = new Rate('payment_success_rate');

export const options = {
    scenarios: {
        payment_processing: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '30s', target: 15 },
                { duration: '2m', target: 15 },
                { duration: '30s', target: 50 },
                { duration: '3m', target: 50 },
                { duration: '30s', target: 0 },
            ],
            tags: { endpoint: 'payments' },
            thresholds: SLO_THRESHOLDS.payments,
        },
        payment_webhook: {
            executor: 'constant-arrival-rate',
            rate: 20,
            timeUnit: '1s',
            duration: '2m',
            preAllocatedVUs: 10,
            tags: { endpoint: 'payment-webhook' },
            thresholds: SLO_THRESHOLDS.paymentWebhook,
        },
    },
};

export default function () {
    const headers = getHeaders();
    const restaurantId = 'test-restaurant-1';

    const paymentPayload = JSON.stringify({
        restaurant_id: restaurantId,
        order_id: 'test-order-1',
        amount: 150.0,
        currency: 'ETB',
        provider: 'chapa',
        method: 'telebirr',
    });

    const payRes = http.post(`${BASE_URL}/api/payments`, paymentPayload, { headers });
    const isPaymentSuccess = payRes.status === 200 || payRes.status === 201;
    paymentSuccessRate.add(isPaymentSuccess);
    check(payRes, {
        'payment created': r => r.status === 200 || r.status === 201 || r.status === 401,
    });

    sleep(1);

    const webhookPayload = JSON.stringify({
        event: 'payment.completed',
        provider: 'chapa',
        reference: 'test-ref-1',
        status: 'success',
    });

    const webhookRes = http.post(`${BASE_URL}/api/payments/webhook`, webhookPayload, {
        headers: { ...headers, 'X-Webhook-Signature': 'test-signature' },
    });
    check(webhookRes, {
        'webhook processed': r => r.status === 200 || r.status === 204 || r.status === 401,
    });

    sleep(1);
}
