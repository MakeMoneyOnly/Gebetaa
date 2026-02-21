import { expect, test } from '@playwright/test';
import { mockDashboardAuth } from './fixtures/dashboard-auth';

test.describe('P2 finance reconciliation', () => {
    test.describe.configure({ timeout: 90_000 });

    test.beforeEach(async ({ page, isMobile }) => {
        test.skip(isMobile, 'P2 finance assertions are desktop-scoped in this spec.');
        await mockDashboardAuth(page);
    });

    test('renders payout reconciliation and exports reconciliation dataset', async ({ page }) => {
        let exportedDataset: string | null = null;

        await page.route('**/api/finance/payments?**', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    data: {
                        payments: [
                            {
                                id: 'payment-1',
                                created_at: '2026-02-21T09:00:00.000Z',
                                method: 'telebirr',
                                provider: 'telebirr',
                                amount: 1500,
                                tip_amount: 75,
                                status: 'captured',
                            },
                        ],
                        totals: { gross: 1500 },
                    },
                }),
            });
        });

        await page.route('**/api/finance/refunds?**', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    data: {
                        refunds: [],
                        totals: { total_amount: 0 },
                    },
                }),
            });
        });

        await page.route('**/api/finance/payouts?**', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    data: {
                        payouts: [
                            {
                                id: 'payout-1',
                                provider: 'chapa',
                                period_start: '2026-02-20T00:00:00.000Z',
                                period_end: '2026-02-20T23:59:59.000Z',
                                gross: 12000,
                                fees: 360,
                                net: 11640,
                                status: 'processing',
                            },
                        ],
                        totals: { net: 11640 },
                    },
                }),
            });
        });

        await page.route('**/api/finance/reconciliation?**', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    data: {
                        entries: [
                            {
                                id: 'reconciliation-1',
                                source_type: 'chapa',
                                expected_amount: 11640,
                                settled_amount: 11440,
                                delta_amount: -200,
                                status: 'exception',
                            },
                        ],
                    },
                }),
            });
        });

        await page.route('**/api/finance/exceptions?**', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    data: {
                        summary: {
                            total_delta: -200,
                        },
                    },
                }),
            });
        });

        await page.route('**/api/finance/export?**', async route => {
            const url = new URL(route.request().url());
            exportedDataset = url.searchParams.get('dataset');
            await route.fulfill({
                status: 200,
                contentType: 'text/csv',
                body: 'id,delta\nreconciliation-1,-200\n',
            });
        });

        await page.goto('/merchant/finance', { waitUntil: 'domcontentloaded' });

        await expect(page.getByRole('heading', { name: /Finance.*Reconciliation/i })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Payout Reconciliation' })).toBeVisible();
        await expect(page.getByText('chapa')).toBeVisible();
        await expect(page.getByText(/open exceptions/i)).toBeVisible();

        const reconciliationCard = page
            .locator('section')
            .filter({ hasText: 'Accounting Exports' })
            .first();
        await reconciliationCard.getByRole('button', { name: 'Export CSV' }).nth(3).click();

        await expect.poll(() => exportedDataset).toBe('reconciliation');
    });
});
