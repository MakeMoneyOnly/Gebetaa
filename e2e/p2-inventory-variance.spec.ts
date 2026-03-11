import { expect, test } from '@playwright/test';
import { mockDashboardAuth } from './fixtures/dashboard-auth';

test.describe('P2 inventory variance', () => {
    test.describe.configure({ timeout: 90_000 });

    test.beforeEach(async ({ page, isMobile }) => {
        test.skip(isMobile, 'P2 inventory assertions are desktop-scoped in this spec.');
        await mockDashboardAuth(page);
    });

    test('renders variance dashboard with expected variance and waste rows', async ({ page }) => {
        await page.route('**/api/inventory/items?**', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    data: {
                        items: [],
                    },
                }),
            });
        });

        await page.route('**/api/inventory/recipes', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    data: {
                        recipes: [],
                        inventory_items: [],
                    },
                }),
            });
        });

        await page.route('**/api/inventory/purchase-orders?**', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    data: {
                        purchase_orders: [],
                    },
                }),
            });
        });

        await page.route('**/api/inventory/invoices?**', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    data: {
                        invoices: [],
                    },
                }),
            });
        });

        await page.route('**/api/inventory/variance?**', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    data: {
                        rows: [
                            {
                                item_id: 'inventory-item-1',
                                item_name: 'Berbere Spice',
                                uom: 'kg',
                                current_stock: 14,
                                theoretical_stock: 16,
                                variance_qty: -2,
                                variance_value: -960,
                                waste_qty: 0.5,
                                waste_value: 240,
                                reorder_level: 8,
                                low_stock: false,
                            },
                        ],
                        totals: {
                            items: 1,
                            low_stock_items: 0,
                            total_waste_value: 240,
                            total_variance_value: -960,
                        },
                    },
                }),
            });
        });

        await page.goto('/merchant/inventory', { waitUntil: 'domcontentloaded' });

        await expect(page.getByRole('heading', { name: /Inventory/i }).first()).toBeVisible({
            timeout: 15000,
        });
        await expect(page.getByRole('heading', { name: 'Variance Dashboard' })).toBeVisible({
            timeout: 15000,
        });
        await expect(page.getByText('Berbere Spice')).toBeVisible();
        await expect(page.getByText('Net Variance')).toBeVisible();
        await expect(page.getByText(/ETB/i).first()).toBeVisible();
    });
});
