import { test, expect } from '@playwright/test';

/**
 * Visual Regression Tests
 *
 * These tests capture screenshots and compare them against baseline images
 * to detect unintended visual changes across the platform.
 *
 * Run: pnpm test:e2e -- --project=chromium --grep "visual"
 * Update baselines: pnpm test:e2e -- --project=chromium --grep "visual" --update-snapshots
 */

test.describe('Visual Regression Tests', () => {
    test.describe('Guest Pages', () => {
        test('landing page visual snapshot', async ({ page }) => {
            await page.goto('/');
            await page.waitForLoadState('networkidle');
            
            // Wait for any animations to settle
            await page.waitForTimeout(500);
            
            // Take full page screenshot
            await expect(page).toHaveScreenshot('landing-page.png', {
                fullPage: true,
                maxDiffPixels: 1000, // Allow small differences
                animations: 'disabled', // Disable animations for consistent screenshots
            });
        });

        test('guest menu page visual snapshot', async ({ page }) => {
            // Navigate to demo restaurant
            await page.goto('/m/demo');
            await page.waitForLoadState('networkidle');
            
            // Wait for menu items to load
            await page.waitForTimeout(1000);
            
            // Take screenshot of the menu area
            const menuContainer = page.locator('[data-testid="menu-container"]').first();
            if (await menuContainer.isVisible()) {
                await expect(menuContainer).toHaveScreenshot('guest-menu.png', {
                    maxDiffPixels: 1500,
                    animations: 'disabled',
                });
            } else {
                // Fallback to full page if no specific container
                await expect(page).toHaveScreenshot('guest-menu-full.png', {
                    fullPage: true,
                    maxDiffPixels: 2000,
                    animations: 'disabled',
                });
            }
        });

        test('cart drawer visual snapshot', async ({ page }) => {
            await page.goto('/m/demo');
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);
            
            // Try to find and click a menu item to add to cart
            const firstMenuItem = page.locator('[data-testid="menu-card"]').first();
            if (await firstMenuItem.isVisible()) {
                await firstMenuItem.click();
                await page.waitForTimeout(300);
                
                // Look for add to cart button
                const addButton = page.locator('button:has-text("Add")').first();
                if (await addButton.isVisible()) {
                    await addButton.click();
                    await page.waitForTimeout(300);
                }
            }
            
            // Take screenshot of the page state
            await expect(page).toHaveScreenshot('cart-interaction.png', {
                maxDiffPixels: 1500,
                animations: 'disabled',
            });
        });
    });

    test.describe('Merchant Dashboard Components', () => {
        test.skip('merchant dashboard visual snapshot', async ({ page }) => {
            // This test requires authentication
            // Skip in CI until we have test authentication setup
            await page.goto('/merchant');
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);
            
            await expect(page).toHaveScreenshot('merchant-dashboard.png', {
                fullPage: true,
                maxDiffPixels: 2000,
                animations: 'disabled',
            });
        });

        test.skip('orders kanban board visual snapshot', async ({ page }) => {
            // This test requires authentication
            await page.goto('/merchant/orders');
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);
            
            const kanbanBoard = page.locator('[data-testid="orders-kanban"]').first();
            if (await kanbanBoard.isVisible()) {
                await expect(kanbanBoard).toHaveScreenshot('orders-kanban.png', {
                    maxDiffPixels: 1500,
                    animations: 'disabled',
                });
            }
        });

        test.skip('table grid visual snapshot', async ({ page }) => {
            // This test requires authentication
            await page.goto('/merchant/tables');
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);
            
            const tableGrid = page.locator('[data-testid="table-grid"]').first();
            if (await tableGrid.isVisible()) {
                await expect(tableGrid).toHaveScreenshot('table-grid.png', {
                    maxDiffPixels: 1500,
                    animations: 'disabled',
                });
            }
        });
    });

    test.describe('KDS (Kitchen Display System)', () => {
        test.skip('KDS ticket visual snapshot', async ({ page }) => {
            // This test requires authentication
            await page.goto('/kds');
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);
            
            const kdsContainer = page.locator('[data-testid="kds-container"]').first();
            if (await kdsContainer.isVisible()) {
                await expect(kdsContainer).toHaveScreenshot('kds-tickets.png', {
                    maxDiffPixels: 1500,
                    animations: 'disabled',
                });
            }
        });
    });

    test.describe('UI Components', () => {
        test('button states visual snapshot', async ({ page }) => {
            // Create a simple test page to verify button states
            await page.goto('/');
            await page.waitForLoadState('networkidle');
            
            // Find buttons on the page
            const buttons = page.locator('button');
            const buttonCount = await buttons.count();
            
            if (buttonCount > 0) {
                // Take screenshot of the first visible button
                const firstButton = buttons.first();
                if (await firstButton.isVisible()) {
                    await expect(firstButton).toHaveScreenshot('button-primary.png', {
                        maxDiffPixels: 200,
                        animations: 'disabled',
                    });
                }
            }
        });

        test('card components visual snapshot', async ({ page }) => {
            await page.goto('/');
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);
            
            // Look for card components
            const cards = page.locator('[class*="rounded"]').first();
            if (await cards.isVisible()) {
                await expect(cards).toHaveScreenshot('card-component.png', {
                    maxDiffPixels: 500,
                    animations: 'disabled',
                });
            }
        });
    });

    test.describe('Responsive Design', () => {
        test('mobile landing page visual snapshot', async ({ page }) => {
            // Set mobile viewport
            await page.setViewportSize({ width: 375, height: 812 });
            await page.goto('/');
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);
            
            await expect(page).toHaveScreenshot('mobile-landing.png', {
                fullPage: true,
                maxDiffPixels: 1500,
                animations: 'disabled',
            });
        });

        test('tablet landing page visual snapshot', async ({ page }) => {
            // Set tablet viewport
            await page.setViewportSize({ width: 768, height: 1024 });
            await page.goto('/');
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);
            
            await expect(page).toHaveScreenshot('tablet-landing.png', {
                fullPage: true,
                maxDiffPixels: 1500,
                animations: 'disabled',
            });
        });

        test('desktop landing page visual snapshot', async ({ page }) => {
            // Set desktop viewport
            await page.setViewportSize({ width: 1440, height: 900 });
            await page.goto('/');
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);
            
            await expect(page).toHaveScreenshot('desktop-landing.png', {
                fullPage: true,
                maxDiffPixels: 1500,
                animations: 'disabled',
            });
        });
    });

    test.describe('Dark Mode', () => {
        test('dark mode landing page visual snapshot', async ({ page }) => {
            // Emulate dark mode color scheme
            await page.emulateMedia({ colorScheme: 'dark' });
            await page.goto('/');
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);
            
            await expect(page).toHaveScreenshot('dark-mode-landing.png', {
                fullPage: true,
                maxDiffPixels: 2000,
                animations: 'disabled',
            });
        });
    });
});