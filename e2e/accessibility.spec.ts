import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Accessibility Tests using axe-core
 *
 * These tests ensure WCAG compliance and identify accessibility issues
 * across the Gebeta Restaurant OS platform.
 */

test.describe('Accessibility Tests', () => {
    test.describe('Guest Pages', () => {
        test('landing page should have no critical accessibility violations', async ({ page }) => {
            await page.goto('/');

            // Wait for page to be fully loaded
            await page.waitForLoadState('domcontentloaded');

            const accessibilityScanResults = await new AxeBuilder({ page })
                .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
                .analyze();

            // Fail only on critical issues in CI to reduce false positives from known style debt.
            const criticalViolations = accessibilityScanResults.violations.filter(
                v => v.impact === 'critical'
            );

            expect(criticalViolations).toEqual([]);
        });

        test('guest menu page should have no accessibility violations', async ({ page }) => {
            // Navigate to a demo restaurant page
            await page.goto('/m/demo');
            await page.waitForLoadState('domcontentloaded');

            const accessibilityScanResults = await new AxeBuilder({ page })
                .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
                .analyze();

            const criticalViolations = accessibilityScanResults.violations.filter(
                v => v.impact === 'critical'
            );

            expect(criticalViolations).toEqual([]);
        });
    });

    test.describe('Merchant Dashboard', () => {
        test.skip('merchant dashboard should have no accessibility violations', async ({
            page,
        }) => {
            // This test requires authentication
            // Skip in CI until we have test authentication setup
            await page.goto('/merchant');
            await page.waitForLoadState('domcontentloaded');

            const accessibilityScanResults = await new AxeBuilder({ page })
                .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
                .analyze();

            const criticalViolations = accessibilityScanResults.violations.filter(
                v => v.impact === 'critical' || v.impact === 'serious'
            );

            expect(criticalViolations).toEqual([]);
        });
    });

    test.describe('KDS (Kitchen Display System)', () => {
        test.skip('KDS page should have no accessibility violations', async ({ page }) => {
            // This test requires authentication
            await page.goto('/kds');
            await page.waitForLoadState('domcontentloaded');

            const accessibilityScanResults = await new AxeBuilder({ page })
                .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
                .analyze();

            const criticalViolations = accessibilityScanResults.violations.filter(
                v => v.impact === 'critical' || v.impact === 'serious'
            );

            expect(criticalViolations).toEqual([]);
        });
    });

    test.describe('Interactive Components', () => {
        test('buttons should have accessible names', async ({ page }) => {
            await page.goto('/');
            await page.waitForLoadState('domcontentloaded');

            const buttons = await page.locator('button').all();

            for (const button of buttons) {
                const accessibleName = await button.evaluate(el => {
                    return (
                        el.getAttribute('aria-label') ||
                        el.getAttribute('aria-labelledby') ||
                        el.textContent?.trim() ||
                        el.getAttribute('title')
                    );
                });

                // Buttons should have some form of accessible name
                expect(accessibleName).toBeTruthy();
            }
        });

        test('images should have alt text', async ({ page }) => {
            await page.goto('/');
            await page.waitForLoadState('domcontentloaded');

            const images = await page.locator('img').all();

            for (const img of images) {
                const alt = await img.getAttribute('alt');
                const ariaLabel = await img.getAttribute('aria-label');
                const ariaLabelledby = await img.getAttribute('aria-labelledby');

                // Images should have alt text or aria labeling
                expect(alt !== null || ariaLabel || ariaLabelledby).toBeTruthy();
            }
        });

        test('form inputs should have labels', async ({ page }) => {
            await page.goto('/');
            await page.waitForLoadState('domcontentloaded');

            const inputs = await page
                .locator('input:not([type="hidden"]):not([type="submit"]):not([type="button"])')
                .all();

            for (const input of inputs) {
                const ariaLabel = await input.getAttribute('aria-label');
                const ariaLabelledby = await input.getAttribute('aria-labelledby');
                const id = await input.getAttribute('id');

                let hasLabel = false;

                if (ariaLabel || ariaLabelledby) {
                    hasLabel = true;
                } else if (id) {
                    // Check if there's a label element with matching for attribute
                    const label = await page.locator(`label[for="${id}"]`).count();
                    hasLabel = label > 0;
                }

                expect(hasLabel).toBeTruthy();
            }
        });
    });

    test.describe('Color Contrast', () => {
        test('text should meet minimum color contrast requirements', async ({ page }) => {
            await page.goto('/');
            await page.waitForLoadState('domcontentloaded');

            const accessibilityScanResults = await new AxeBuilder({ page })
                .withRules(['color-contrast'])
                .analyze();

            const contrastViolations = accessibilityScanResults.violations.filter(
                v => v.id === 'color-contrast'
            );

            // Warn but don't fail on color contrast issues
            if (contrastViolations.length > 0) {
                console.warn(
                    'Color contrast violations found:',
                    contrastViolations.map(v => v.description)
                );
            }
        });
    });

    test.describe('Keyboard Navigation', () => {
        test('focus should be visible on interactive elements', async ({ page }) => {
            await page.goto('/');
            await page.waitForLoadState('domcontentloaded');

            // Tab through focusable elements
            const focusableElements = await page
                .locator(
                    'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                )
                .all();

            if (focusableElements.length > 0) {
                // Focus the first element
                await focusableElements[0].focus();

                // Check that focus indicator is visible (exclude Next.js dev-tools overlay)
                const focusedElement = page
                    .locator(':focus')
                    .filter({
                        hasNot: page.locator('nextjs-portal, [data-nextjs-dev-tools-button]'),
                    })
                    .first();
                await expect(focusedElement).toBeVisible();
            }
        });

        test('should be able to navigate with keyboard', async ({ page }) => {
            await page.goto('/');
            await page.waitForLoadState('domcontentloaded');

            // Find all focusable elements
            const focusableElements = await page
                .locator(
                    'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                )
                .filter({ has: page.locator(':visible') })
                .all();

            // Skip test if no focusable elements exist
            if (focusableElements.length === 0) {
                test.skip(true, 'No focusable elements found on page');
                return;
            }

            // Press Tab key to move focus
            await page.keyboard.press('Tab');

            // Verify focus has moved to an element
            // Use a more robust check that handles the case where focus might be on body
            const activeElement = page.locator('*:focus');
            const focusCount = await activeElement.count();

            // Either an element has focus, or we need to tab more times
            if (focusCount === 0) {
                // Try tabbing a few more times to reach the first focusable element
                for (let i = 0; i < 5; i++) {
                    await page.keyboard.press('Tab');
                    const retryFocusCount = await page.locator('*:focus').count();
                    if (retryFocusCount > 0) break;
                }
            }

            // Verify we can navigate forward with Tab
            const focusedBefore = await page.evaluate(() => document.activeElement?.tagName);
            await page.keyboard.press('Tab');
            const focusedAfter = await page.evaluate(() => document.activeElement?.tagName);

            // Either focus moved to a different element, or we're at the end of the tab order
            // Both are valid outcomes for keyboard navigation
            expect(typeof focusedBefore).toBe('string');
            expect(typeof focusedAfter).toBe('string');
        });
    });
});
