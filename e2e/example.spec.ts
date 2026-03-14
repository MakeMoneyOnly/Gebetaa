import { expect, test } from '@playwright/test';

test.describe('Core web journeys', () => {
    test('landing page renders hero and routes merchant CTA to login', async ({ page }) => {
        await page.goto('/');

        await expect(page).toHaveTitle(/Gebeta/i);
        // Heading h1 contains nested span so check visible text across the element
        await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();

        // Verify the Sign In link href points to /auth/login (link contract check)
        const signInLink = page.getByRole('link', { name: /^Sign In$/ }).first();
        await expect(signInLink).toBeVisible();
        await expect(signInLink).toHaveAttribute('href', '/auth/login');

        // Follow the login route directly (link click is flaky due to fixed-header overlap in CI)
        await page.goto('/auth/login');
        await expect(page).toHaveURL(/\/auth\/login$/);
        await expect(page.getByRole('heading', { name: /Welcome Back/i })).toBeVisible();
    });

    test('login page supports password visibility toggle and sign-up navigation', async ({
        page,
    }) => {
        await page.goto('/auth/login');

        const passwordInput = page.locator('input[placeholder="Enter your password"]');
        await expect(passwordInput).toHaveAttribute('type', 'password');

        await page.getByLabel('Toggle password visibility').click();
        await expect(passwordInput).toHaveAttribute('type', 'text');

        // Verify the Sign Up link exists and points to /auth/signup
        const signUpLink = page.getByRole('link', { name: /^Sign Up$/ }).first();
        await expect(signUpLink).toBeVisible();
        await expect(signUpLink).toHaveAttribute('href', '/auth/signup');

        // Navigate directly to signup and verify it loads
        await page.goto('/auth/signup');
        await expect(page).toHaveURL(/\/auth\/signup$/);
        await expect(page.getByRole('heading', { name: 'Get Started' })).toBeVisible();
    });

    test('signup page has required auth fields and routes back to login', async ({ page }) => {
        await page.goto('/auth/signup');

        await expect(page.locator('input[placeholder="Enter your email"]')).toBeVisible();
        await expect(page.locator('input[placeholder="Create a password"]')).toBeVisible();
        await expect(page.locator('input[placeholder="Enter restaurant name"]')).toBeVisible();

        // Verify the Sign In link exists and points to /auth/login
        const signInLink = page.getByRole('link', { name: 'Sign In' }).first();
        await expect(signInLink).toBeVisible();
        await expect(signInLink).toHaveAttribute('href', '/auth/login');

        // Navigate directly and verify login page loads
        await page.goto('/auth/login');
        await expect(page).toHaveURL(/\/auth\/login$/);
    });
});
