import { expect, test } from '@playwright/test';

test.describe('Signed QR to guest order flow', () => {
    test('validates signed QR context and submits guest order', async ({ page }) => {
        const slug = 'saba-grill';
        const table = 'T1';
        const sig = 'abcdef1234567890';
        const exp = String(Date.now() + 60 * 60 * 1000);

        let capturedOrderPayload: any = null;

        await page.route('**/api/guest/context**', async route => {
            const url = new URL(route.request().url());
            expect(url.searchParams.get('slug')).toBe(slug);
            expect(url.searchParams.get('table')).toBe(table);
            expect(url.searchParams.get('sig')).toBe(sig);
            expect(url.searchParams.get('exp')).toBe(exp);

            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    data: {
                        restaurant_id: 'rest-1',
                        table_id: 'table-1',
                        table_number: table,
                        slug,
                        sig,
                        exp: Number(exp),
                    },
                }),
            });
        });

        await page.route('**/rest/v1/categories**', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([{ id: 'cat-1', name: 'Burgers', section: 'food' }]),
            });
        });

        await page.route('**/rest/v1/menu_items**', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([
                    {
                        id: '11111111-1111-4111-8111-111111111111',
                        name: 'Scan Burger',
                        price: 299,
                        image_url: null,
                        rating: 4.8,
                        preparation_time: 12,
                        description: 'Guest E2E burger',
                        description_am: null,
                        popularity: 90,
                        likes_count: 20,
                        category_id: 'cat-1',
                    },
                ]),
            });
        });

        await page.route('**/api/orders', async route => {
            capturedOrderPayload = route.request().postDataJSON();
            await route.fulfill({
                status: 201,
                contentType: 'application/json',
                body: JSON.stringify({
                    data: {
                        id: 'order-guest-1',
                        order_number: 'ORD-2001',
                        status: 'pending',
                        idempotency_key: '11111111-1111-4111-8111-111111111111',
                    },
                }),
            });
        });

        await page.goto(`/${slug}?table=${table}&sig=${sig}&exp=${exp}`);

        await expect(page.getByText('Main Menu')).toBeVisible();
        await expect(page.getByText('Scan Burger')).toBeVisible();

        await page.getByText('Scan Burger').first().click();
        await page.getByRole('button', { name: 'Add to Order' }).click();

        await expect(page.locator('button.fixed.right-6.bottom-6')).toBeVisible();
        await page.locator('button.fixed.right-6.bottom-6').click();

        await expect(page.getByRole('heading', { name: 'Your Order' })).toBeVisible();
        await page.getByRole('button', { name: 'Place Order' }).click();
        await expect(page.getByText('Order received. Kitchen has been notified.')).toBeVisible();

        expect(capturedOrderPayload).toBeTruthy();
        expect(capturedOrderPayload.guest_context).toEqual({
            slug,
            table,
            sig,
            exp: Number(exp),
        });
        expect(capturedOrderPayload.items).toHaveLength(1);
        expect(capturedOrderPayload.items[0]).toMatchObject({
            id: '11111111-1111-4111-8111-111111111111',
            name: 'Scan Burger',
            quantity: 1,
            price: 299,
        });
    });
});
