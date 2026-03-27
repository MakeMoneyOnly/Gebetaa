import { expect, test } from '@playwright/test';
import { mockDashboardAuth } from './fixtures/dashboard-auth';

test.describe('P2 loyalty and gift-card redemption', () => {
    test.describe.configure({ timeout: 90_000 });

    test.beforeEach(async ({ page, isMobile }) => {
        test.skip(isMobile, 'P2 growth workflow assertions are desktop-scoped in this spec.');
        await mockDashboardAuth(page);
    });

    test('renders loyalty programs, issues a gift card, and redeems it', async ({ page }) => {
        let capturedGiftCardCreatePayload: Record<string, unknown> | null = null;
        let capturedGiftCardRedeemPayload: Record<string, unknown> | null = null;

        const loyaltyPrograms: Array<Record<string, unknown>> = [
            {
                id: '11111111-1111-4111-8111-111111111111',
                name: 'Weekend Perks',
                status: 'active',
                created_at: '2026-02-20T09:00:00.000Z',
            },
        ];

        const giftCards: Array<Record<string, unknown>> = [
            {
                id: '22222222-2222-4222-8222-222222222222',
                code: 'GC-0001',
                currency: 'ETB',
                current_balance: 250,
                initial_balance: 250,
                status: 'active',
                created_at: '2026-02-20T09:10:00.000Z',
            },
        ];

        // Set up all route handlers BEFORE navigating to the page
        await page.route('**/api/merchant/activity**', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    orders: [],
                    requests: [],
                    restaurant: { name: 'Test Restaurant', slug: 'test-restaurant' },
                    restaurantId: 'rest-1',
                }),
            });
        });

        await page.route('**/api/guests?**', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    data: {
                        guests: [],
                        total: 0,
                    },
                }),
            });
        });

        await page.route('**/api/loyalty/programs', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    data: {
                        programs: loyaltyPrograms,
                    },
                }),
            });
        });

        await page.route('**/api/gift-cards', async route => {
            if (route.request().method() === 'GET') {
                // GET /api/gift-cards (no query params) — used by fetchGrowthData
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        data: {
                            gift_cards: giftCards,
                        },
                    }),
                });
                return;
            }

            if (route.request().method() === 'POST') {
                capturedGiftCardCreatePayload = route.request().postDataJSON() as Record<
                    string,
                    unknown
                >;
                const initialBalance = Number(capturedGiftCardCreatePayload.initial_balance ?? 0);
                giftCards.unshift({
                    id: '22222222-2222-4222-8222-222222222223',
                    code: 'GC-0002',
                    currency: String(capturedGiftCardCreatePayload.currency ?? 'ETB'),
                    current_balance: initialBalance,
                    initial_balance: initialBalance,
                    status: 'active',
                    created_at: '2026-02-21T10:05:00.000Z',
                });
                await route.fulfill({
                    status: 201,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        data: {
                            gift_card: giftCards[0],
                        },
                    }),
                });
                return;
            }

            await route.fulfill({ status: 405, body: 'Method Not Allowed' });
        });

        await page.route('**/api/gift-cards/*/redeem', async route => {
            capturedGiftCardRedeemPayload = route.request().postDataJSON() as Record<
                string,
                unknown
            >;
            const giftCardId = route
                .request()
                .url()
                .split('/api/gift-cards/')[1]
                .split('/redeem')[0];
            const amount = Number(capturedGiftCardRedeemPayload.amount ?? 0);
            const card = giftCards.find(entry => entry.id === giftCardId);
            if (card) {
                const updatedBalance = Math.max(0, Number(card.current_balance ?? 0) - amount);
                card.current_balance = updatedBalance;
                card.status = updatedBalance === 0 ? 'redeemed' : 'active';
            }
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    data: {
                        redeemed: true,
                    },
                }),
            });
        });

        await page.route('**/api/campaigns?**', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    data: {
                        campaigns: [],
                        segments: [],
                    },
                }),
            });
        });

        await page.goto('/merchant/guests', { waitUntil: 'domcontentloaded' });

        // Wait for the main Guests heading to confirm page loaded
        await expect(page.getByRole('heading', { name: 'Guests', exact: true })).toBeVisible({
            timeout: 15000,
        });

        // Click on the Loyalty program tab to show the LoyaltyProgramBuilder
        await page.getByRole('button', { name: /Loyalty program/i }).click();

        // Verify loyalty program section is visible (uses "Create program" heading)
        await expect(page.getByRole('heading', { name: 'Create program' })).toBeVisible({
            timeout: 15000,
        });

        // Verify the mock loyalty program "Weekend Perks" is visible while on Loyalty tab
        await expect(page.getByText('Weekend Perks')).toBeVisible({ timeout: 15000 });

        // Click on the Gift cards tab to show the GiftCardManager
        await page.getByRole('button', { name: /Gift cards/i }).click();

        // Verify gift card section is visible (uses "Issue gift card" heading)
        await expect(page.getByRole('heading', { name: 'Issue gift card' })).toBeVisible({
            timeout: 15000,
        });

        // Gift card section - use the "Issue gift card" heading context
        const giftCardSection = page.locator('div').filter({ hasText: 'Issue gift card' }).first();
        await giftCardSection.getByPlaceholder('Balance (ETB)').fill('600');
        await giftCardSection
            .getByRole('button', { name: 'Issue gift card' })
            .click({ force: true });

        await expect.poll(() => capturedGiftCardCreatePayload).not.toBeNull();
        expect(capturedGiftCardCreatePayload).toMatchObject({
            initial_balance: 600,
            currency: 'ETB',
        });
        await expect(page.getByText('GC-0002')).toBeVisible();

        await page.evaluate(async () => {
            await fetch('/api/gift-cards/22222222-2222-4222-8222-222222222223/redeem', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: 600 }),
            });
        });

        await expect.poll(() => capturedGiftCardRedeemPayload).not.toBeNull();
        expect(capturedGiftCardRedeemPayload).toMatchObject({
            amount: 600,
        });
        await page.reload({ waitUntil: 'domcontentloaded' });
        await expect(giftCardSection.getByText('GC-0002')).toBeVisible();
        await expect(giftCardSection.getByText(/redeemed/i)).toBeVisible();
    });
});
