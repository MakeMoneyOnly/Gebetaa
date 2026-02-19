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

test.describe('P1 localization and accessibility regression', () => {
    test.beforeEach(async ({ page, isMobile }) => {
        test.skip(isMobile, 'Localization/a11y regression assertions are desktop-scoped in this spec.');
        await mockDashboardAuth(page);
    });

    test('guests screen keeps locale formatting and labeled controls', async ({ page }) => {
        await page.route('**/api/guests?**', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    data: {
                        guests: [
                            {
                                id: '11111111-1111-4111-8111-111111111111',
                                name: 'Selam Guest',
                                language: 'en',
                                tags: ['vip'],
                                is_vip: true,
                                first_seen_at: '2025-12-20T09:00:00.000Z',
                                last_seen_at: '2026-02-17T10:20:00.000Z',
                                visit_count: 5,
                                lifetime_value: 2800.25,
                                created_at: '2025-12-20T09:00:00.000Z',
                                updated_at: '2026-02-17T10:20:00.000Z',
                            },
                        ],
                    },
                }),
            });
        });

        await page.route('**/api/guests/11111111-1111-4111-8111-111111111111', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    data: {
                        id: '11111111-1111-4111-8111-111111111111',
                        name: 'Selam Guest',
                        language: 'en',
                        tags: ['vip'],
                        is_vip: true,
                        notes: null,
                        visit_count: 5,
                        lifetime_value: 2800.25,
                        first_seen_at: '2025-12-20T09:00:00.000Z',
                        last_seen_at: '2026-02-17T10:20:00.000Z',
                    },
                }),
            });
        });

        await page.route('**/api/guests/11111111-1111-4111-8111-111111111111/visits**', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    data: {
                        visits: [],
                    },
                }),
            });
        });

        await page.goto('/merchant/guests');

        await expect(page.getByRole('heading', { name: 'Guests' })).toBeVisible();
        await expect(page.getByLabel('Search guests by name')).toBeVisible();
        await expect(page.getByText('English')).toBeVisible();
        await expect(page.getByText(/ETB/).first()).toBeVisible();

        await page.getByRole('button', { name: /Open guest profile for Selam Guest/i }).click();
        await expect(page.getByRole('dialog', { name: 'Guest Profile' })).toBeVisible();
        await expect(page.getByLabel('Name', { exact: true })).toBeVisible();
        await expect(page.getByLabel('Language')).toBeVisible();
        await expect(page.getByLabel('Segmentation Tags')).toBeVisible();
        await expect(page.getByLabel('Notes')).toBeVisible();
    });

    test('channels screen keeps labeled controls and table semantics', async ({ page }) => {
        await page.route('**/api/channels/summary', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    data: {
                        totals: {
                            delivery_partners: 1,
                            connected_partners: 1,
                            degraded_partners: 0,
                            external_orders_24h: 2,
                            external_orders_total: 2,
                            unacked_orders: 0,
                        },
                        statuses: { acknowledged: 2 },
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
                                normalized_status: 'acknowledged',
                                total_amount: 520,
                                currency: 'ETB',
                                payload_json: {},
                                acked_at: '2026-02-18T09:00:00.000Z',
                                created_at: '2026-02-18T08:55:00.000Z',
                                updated_at: '2026-02-18T08:56:00.000Z',
                            },
                        ],
                    },
                }),
            });
        });

        await page.goto('/merchant/channels');

        await expect(page.getByRole('heading', { name: 'Channels' })).toBeVisible();
        await expect(page.getByLabel('Connect Provider')).toBeVisible();
        await expect(page.getByLabel('Provider display name')).toBeVisible();
        await expect(page.getByLabel('External Orders')).toBeVisible();
        await expect(page.getByRole('columnheader', { name: 'Provider' })).toBeVisible();
        await expect(page.getByRole('columnheader', { name: 'Order Ref' })).toBeVisible();
        await expect(page.getByText(/ETB/i).first()).toBeVisible();
    });
});
