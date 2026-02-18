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

test.describe('Mobile merchant tab regression', () => {
    test.beforeEach(async ({ page, isMobile }) => {
        test.skip(!isMobile, 'This regression suite is mobile-only.');
        await mockDashboardAuth(page);
    });

    test('renders mobile nav and supports tab traversal without layout overflow', async ({ page }) => {
        await page.goto('/merchant');
        await expect(page.getByTestId('mobile-bottom-nav')).toBeVisible();

        const tabExpectations: Array<{ href: string; heading: RegExp }> = [
            { href: '/merchant', heading: /Hello, Saba Grill/i },
            { href: '/merchant/orders', heading: /^Orders$/i },
            { href: '/merchant/menu', heading: /^Menu$/i },
            { href: '/merchant/tables', heading: /^Tables & QR$/i },
            { href: '/merchant/staff', heading: /^Staff Management$/i },
            { href: '/merchant/analytics', heading: /^Analytics$/i },
            { href: '/merchant/settings', heading: /^Settings$/i },
            { href: '/merchant/help', heading: /^Help & Support$/i },
        ];

        for (const tab of tabExpectations) {
            await page.goto(tab.href);
            await expect(page).toHaveURL(new RegExp(`${tab.href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`));
            await expect(page.getByRole('heading', { name: tab.heading })).toBeVisible();

            const hasHorizontalOverflow = await page.evaluate(() => {
                const doc = document.documentElement;
                return doc.scrollWidth - doc.clientWidth > 1;
            });
            expect(hasHorizontalOverflow).toBe(false);
        }
    });
});
