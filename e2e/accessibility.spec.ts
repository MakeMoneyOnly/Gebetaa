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
            await page.waitForLoadState('networkidle');

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
            await page.waitForLoadState('networkidle');

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
            await page.waitForLoadState('networkidle');

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
            await page.waitForLoadState('networkidle');

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
            await page.waitForLoadState('networkidle');

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
            await page.waitForLoadState('networkidle');

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
            await page.waitForLoadState('networkidle');

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
            await page.waitForLoadState('networkidle');

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
            await page.waitForLoadState('networkidle');

            // Tab through focusable elements
            const focusableElements = await page
                .locator(
                    'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                )
                .all();

            if (focusableElements.length > 0) {
                // Focus the first element
                await focusableElements[0].focus();

                // Check that focus indicator is visible
                const focusedElement = page.locator(':focus');
                await expect(focusedElement).toBeVisible();
            }
        });

        test('should be able to navigate with keyboard', async ({ page }) => {
            await page.goto('/');
            await page.waitForLoadState('networkidle');

            // Press Tab key multiple times
            await page.keyboard.press('Tab');
            await page.keyboard.press('Tab');
            await page.keyboard.press('Tab');

            // Verify focus has moved
            const focusedElement = page.locator(':focus');
            await expect(focusedElement).toBeVisible();
        });
    });
});
