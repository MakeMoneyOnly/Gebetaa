import { expect, test } from '@playwright/test';

async function mockDashboardAuth(page: import('@playwright/test').Page) {
    await page.setExtraHTTPHeaders({
        'x-e2e-bypass-auth': '1',
    });

    await page.addInitScript(() => {
        window.localStorage.setItem('__e2e_bypass_auth', 'true');
        window.localStorage.setItem(
            'sb-axuegixbqsvztdraenkz-auth-token',
            JSON.stringify({
                access_token: 'e2e-access-token',
                token_type: 'bearer',
                expires_in: 3600,
                expires_at: 2099999999,
                refresh_token: 'e2e-refresh-token',
                user: {
                    id: 'staff-user-1',
                    aud: 'authenticated',
                    role: 'authenticated',
                    email: 'e2e@example.com',
                },
            })
        );
    });

    await page.route('**/auth/v1/user', async route => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                id: 'staff-user-1',
                aud: 'authenticated',
                role: 'authenticated',
                email: 'e2e@example.com',
            }),
        });
    });

    await page.route('**/rest/v1/rpc/get_my_staff_role', async route => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                role: 'manager',
                restaurant_id: 'rest-1',
            }),
        });
    });

    await page.route('**/rest/v1/restaurant_staff*', async route => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([
                {
                    role: 'manager',
                    restaurant_id: 'rest-1',
                    is_active: true,
                },
            ]),
        });
    });
}

test.describe('Channels health and delivery acknowledge flow', () => {
    test.beforeEach(async ({ page, isMobile }) => {
        test.skip(isMobile, 'Channels workflow assertions are desktop-scoped in this spec.');
        await mockDashboardAuth(page);
    });

    test('renders channel health and acknowledges an external order', async ({ page }) => {
        let isAcked = false;
        let capturedSettingsPayload: Record<string, unknown> | null = null;

        await page.route('**/api/channels/summary', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    data: {
                        totals: {
                            delivery_partners: 2,
                            connected_partners: 1,
                            degraded_partners: 1,
                            external_orders_24h: 14,
                            external_orders_total: 20,
                            unacked_orders: isAcked ? 0 : 1,
                        },
                        statuses: {
                            new: isAcked ? 0 : 1,
                            acknowledged: isAcked ? 1 : 0,
                        },
                        partners: [
                            {
                                id: 'partner-1',
                                provider: 'beu',
                                status: 'connected',
                                updated_at: '2026-02-18T08:00:00.000Z',
                                last_sync_at: '2026-02-18T08:00:00.000Z',
                            },
                        ],
                    },
                }),
            });
        });

        await page.route('**/api/channels/online-ordering/settings', async route => {
            if (route.request().method() === 'PATCH') {
                capturedSettingsPayload = route.request().postDataJSON() as Record<string, unknown>;
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        data: capturedSettingsPayload,
                    }),
                });
                return;
            }

            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    data: {
                        enabled: true,
                        accepts_scheduled_orders: true,
                        auto_accept_orders: false,
                        prep_time_minutes: 25,
                        max_daily_orders: 250,
                        service_hours: { start: '08:00', end: '22:00' },
                        order_throttling_enabled: false,
                        throttle_limit_per_15m: 40,
                    },
                }),
            });
        });

        await page.route('**/api/channels/delivery/orders?**', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    data: {
                        orders: [
                            {
                                id: '44444444-4444-4444-8444-444444444444',
                                provider: 'beu',
                                provider_order_id: 'BEU-1001',
                                source_channel: 'delivery',
                                normalized_status: isAcked ? 'acknowledged' : 'new',
                                total_amount: 520,
                                currency: 'ETB',
                                payload_json: {},
                                acked_at: isAcked ? '2026-02-18T09:00:00.000Z' : null,
                                created_at: '2026-02-18T08:55:00.000Z',
                                updated_at: '2026-02-18T08:56:00.000Z',
                            },
                        ],
                        total: 1,
                    },
                }),
            });
        });

        await page.route('**/api/channels/delivery/orders/*/ack', async route => {
            isAcked = true;
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    data: {
                        order: {
                            id: '44444444-4444-4444-8444-444444444444',
                            provider: 'beu',
                            normalized_status: 'acknowledged',
                            acked_at: '2026-02-18T09:00:00.000Z',
                        },
                    },
                }),
            });
        });

        await page.goto('/merchant/channels');

        await expect(page.getByRole('heading', { name: 'Channels', exact: true })).toBeVisible();
        await expect(page.getByText('Connected Channels')).toBeVisible();
        await expect(page.getByText('BEU-1001')).toBeVisible();
        await expect(
            page.getByRole('button', { name: /Acknowledge external order BEU-1001/i })
        ).toBeVisible();

        await page.getByRole('button', { name: /Acknowledge external order BEU-1001/i }).click();
        await expect(page.getByText('Acked')).toBeVisible();

        await page.getByLabel('Auto-accept incoming orders').check();
        await page.getByRole('button', { name: 'Save' }).click();

        expect(capturedSettingsPayload).toBeTruthy();
        expect(capturedSettingsPayload).toMatchObject({
            auto_accept_orders: true,
        });
    });
});
