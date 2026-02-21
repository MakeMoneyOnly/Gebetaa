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

function buildCommandCenterPayload(orderStatus: string) {
    return {
        data: {
            restaurant_id: 'rest-1',
            metrics: {
                orders_in_flight: 3,
                avg_ticket_time_minutes: 12,
                active_tables: 5,
                open_requests: 2,
                payment_success_rate: 96,
                gross_sales_today: 12000,
                total_orders_today: 14,
                avg_order_value_etb: 857,
                unique_tables_today: 6,
            },
            attention_queue: [
                {
                    id: 'order-1',
                    type: 'order',
                    label: 'ORD-1001',
                    status: orderStatus,
                    created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
                    table_number: 'T1',
                },
                {
                    id: 'req-1',
                    type: 'service_request',
                    label: 'Water refill',
                    status: 'pending',
                    created_at: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
                    table_number: 'T2',
                },
                {
                    id: 'alert-1',
                    type: 'alert',
                    label: 'kitchen alert',
                    status: 'open',
                    severity: 'high',
                    created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
                    table_number: null,
                },
            ],
            alert_summary: { open_alerts: 1 },
            filters: {
                range: 'today',
                since: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
            },
            sync_status: { generated_at: new Date().toISOString(), source: 'postgres' },
        },
    };
}

test.describe('Dashboard attention queue workflow', () => {
    test.beforeEach(async ({ isMobile }) => {
        test.skip(isMobile, 'Attention queue workflow assertions are desktop-scoped in this spec.');
    });

    test('renders queue, advances order status, and navigates to orders', async ({ page }) => {
        let orderStatus = 'pending';
        await mockDashboardAuth(page);

        await page.route('**/api/merchant/command-center?**', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(buildCommandCenterPayload(orderStatus)),
            });
        });

        await page.route('**/api/orders/*/status', async route => {
            const payload = route.request().postDataJSON() as { status?: string };
            if (payload.status) {
                orderStatus = payload.status;
            }
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ data: { id: 'order-1', status: orderStatus } }),
            });
        });

        await page.goto('/merchant');

        await expect(page.getByRole('heading', { name: 'Attention Queue' })).toBeVisible();
        await expect(page.getByText('ORD-1001', { exact: false }).first()).toBeVisible();
        await expect(page.getByText('Status: pending').first()).toBeVisible();

        await page.getByRole('button', { name: 'Advance Status' }).first().click();
        await expect(page.getByText('Status: acknowledged').first()).toBeVisible();

        await page.getByRole('button', { name: 'Open Orders' }).click();
        await expect(page).toHaveURL(/\/merchant\/orders$/);
    });

    test('refresh updates attention queue payload', async ({ page }) => {
        await mockDashboardAuth(page);
        let callCount = 0;
        await page.route('**/api/merchant/command-center?**', async route => {
            callCount += 1;
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(
                    buildCommandCenterPayload(callCount === 1 ? 'pending' : 'ready')
                ),
            });
        });

        await page.goto('/merchant');

        await expect(page.getByText('Status: pending').first()).toBeVisible();
        await page.getByRole('button', { name: 'Refresh' }).click();
        await expect(page.getByText('Status: ready').first()).toBeVisible();
    });
});
