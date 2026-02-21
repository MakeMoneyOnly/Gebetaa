import { expect, test } from '@playwright/test';
import { installMerchantDashboardMocks } from './fixtures/merchant-dashboard-mocks';
import {
    AnalyticsPage,
    FinancePage,
    MenuPage,
    MerchantShellPage,
    OrdersPage,
    OverviewPage,
    SettingsPage,
} from './page-objects/merchant-dashboard.po';

test.describe('Merchant Dashboard full-session audit', () => {
    test.describe.configure({ mode: 'serial', retries: 2 });

    test.beforeEach(async ({ page, isMobile }) => {
        test.skip(isMobile, 'This audit suite is desktop-scoped for full merchant navigation.');
        await installMerchantDashboardMocks(page);
    });

    test('navigates all core merchant tabs and validates page intent', async ({ page }) => {
        const shell = new MerchantShellPage(page);
        await shell.gotoDashboard();

        await shell.gotoSection('/merchant/orders', /\/merchant\/orders$/);
        await shell.gotoSection('/merchant/menu', /\/merchant\/menu$/);
        await shell.gotoSection('/merchant/guests', /\/merchant\/guests$/);
        await shell.gotoSection('/merchant/channels', /\/merchant\/channels$/);
        await shell.gotoSection('/merchant/staff', /\/merchant\/staff$/);
        await shell.gotoSection('/merchant/analytics', /\/merchant\/analytics$/);
        await shell.gotoSection('/merchant/inventory', /\/merchant\/inventory$/);
        await shell.gotoSection('/merchant/finance', /\/merchant\/finance$/);
        await shell.gotoSection('/merchant/settings', /\/merchant\/settings$/);
    });

    test('overview queue workflow remains operational and logically consistent', async ({
        page,
    }) => {
        const shell = new MerchantShellPage(page);
        const overview = new OverviewPage(page);

        await shell.gotoDashboard();
        await overview.assertCoreWidgets();
        await overview.advanceFirstOrder();
        await overview.openOrdersFromQueue();
    });

    test('orders section supports active processing and board mode switching', async ({ page }) => {
        const shell = new MerchantShellPage(page);
        const orders = new OrdersPage(page);

        await shell.gotoSection('/merchant/orders', /\/merchant\/orders$/);
        await orders.assertLoaded();
        await orders.processOrderLifecycleStep();
        await orders.switchToKanbanAndBack();
    });

    test('menu section supports new product creation flow', async ({ page }) => {
        const shell = new MerchantShellPage(page);
        const menu = new MenuPage(page);

        await shell.gotoSection('/merchant/menu', /\/merchant\/menu$/);
        await menu.assertLoaded();
        await menu.createNewProduct();
    });

    test('analytics, finance, and settings workflows are functional', async ({ page }) => {
        const shell = new MerchantShellPage(page);
        const analytics = new AnalyticsPage(page);
        const finance = new FinancePage(page);
        const settings = new SettingsPage(page);

        await shell.gotoSection('/merchant/analytics', /\/merchant\/analytics$/);
        await analytics.assertLoaded();
        await analytics.changeRangeAndValidate();

        await shell.gotoSection('/merchant/finance', /\/merchant\/finance$/);
        await finance.assertLoaded();
        await finance.submitRefund();
        await expect(page.getByText('Payout Reconciliation')).toBeVisible();

        await shell.gotoSection('/merchant/settings', /\/merchant\/settings$/);
        await settings.assertLoaded();
        await settings.saveSecuritySettings();
        await settings.saveNotificationSettings();
    });
});
