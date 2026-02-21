import { expect, type Page } from '@playwright/test';

export class MerchantShellPage {
    constructor(private readonly page: Page) {}

    private async safeGoto(path: string) {
        for (let attempt = 0; attempt < 3; attempt += 1) {
            await this.page.goto(path, { waitUntil: 'domcontentloaded' });
            await this.page.waitForTimeout(400);

            const hasClientError = await this.page
                .getByRole('heading', {
                    name: /Application error: a client-side exception has occurred/i,
                })
                .isVisible()
                .catch(() => false);

            const hasRecoverableOverlay = await this.page
                .getByRole('dialog', { name: /Recoverable Error/i })
                .isVisible()
                .catch(() => false);

            if (!hasClientError && !hasRecoverableOverlay) {
                return;
            }

            await this.page.reload({ waitUntil: 'domcontentloaded' });
        }
    }

    async gotoDashboard() {
        await this.safeGoto('/merchant');
        await expect(this.page.getByRole('heading', { name: /^Hello,/i })).toBeVisible({
            timeout: 15_000,
        });
    }

    async gotoSection(path: string, expectedPath: RegExp) {
        await this.safeGoto(path);
        await expect(this.page).toHaveURL(expectedPath);
    }
}

export class OverviewPage {
    constructor(private readonly page: Page) {}

    async assertCoreWidgets() {
        await expect(this.page.getByRole('heading', { name: 'Attention Queue' })).toBeVisible();
        await expect(this.page.getByText('IN SYNC')).toBeVisible();
        await expect(this.page.getByRole('button', { name: 'Refresh' })).toBeVisible();
    }

    async advanceFirstOrder() {
        await expect(this.page.getByText('ORD-1001', { exact: true }).first()).toBeVisible();
        await this.page.getByRole('button', { name: 'Advance Status' }).first().click();
        await expect(this.page.getByText('Status: acknowledged')).toBeVisible();
    }

    async openOrdersFromQueue() {
        await this.page.getByRole('button', { name: 'Open Orders' }).click();
        await expect(this.page).toHaveURL(/\/merchant\/orders$/);
    }
}

export class OrdersPage {
    constructor(private readonly page: Page) {}

    async assertLoaded() {
        await expect(this.page.getByRole('heading', { name: /^Orders$/i })).toBeVisible();
        await expect(this.page.getByPlaceholder('Search orders...')).toBeVisible();
    }

    async processOrderLifecycleStep() {
        const emptyState = this.page.getByRole('heading', { name: /No orders found/i });
        if (await emptyState.isVisible()) {
            await expect(this.page.getByText('Try changing the filter or search term.')).toBeVisible();
            return;
        }

        const firstRow = this.page.locator('tbody tr').first();
        await expect(firstRow).toContainText('pending');
        await firstRow.getByRole('button', { name: /Acknowledged/i }).click();
        await expect(firstRow).toContainText('acknowledged');
    }

    async switchToKanbanAndBack() {
        await this.page.getByRole('button', { name: 'Kanban' }).click();
        const emptyState = this.page.getByRole('heading', { name: /No orders found/i });
        if (await emptyState.isVisible()) {
            await expect(emptyState).toBeVisible();
        } else {
            await expect(this.page.getByRole('heading', { name: 'Pending' })).toBeVisible();
        }
        await this.page.getByRole('button', { name: 'Queue' }).click();
        if (await emptyState.isVisible()) {
            await expect(emptyState).toBeVisible();
        } else {
            await expect(this.page.locator('table')).toBeVisible();
        }
    }
}

export class MenuPage {
    constructor(private readonly page: Page) {}

    async assertLoaded() {
        await expect(this.page.getByRole('heading', { name: /^Menu$/i })).toBeVisible();
        await expect(this.page.getByRole('button', { name: 'Add Category' })).toBeVisible();
    }

    async createNewProduct() {
        const addNewItemButton = this.page.getByRole('button', { name: 'Add New Item' }).first();

        if (await addNewItemButton.isVisible()) {
            await addNewItemButton.click();
            await expect(this.page.getByRole('heading', { name: /Add Item to/i })).toBeVisible();

            await this.page.getByPlaceholder('e.g. Burger').fill('QA Espresso');
            await this.page.getByPlaceholder('0.00').fill('95');
            await this.page.getByPlaceholder('Describe the dish...').fill('Automation-created drink');
            await this.page.getByRole('button', { name: 'Create Item' }).click();

            await expect(this.page.getByText('Menu item created.')).toBeVisible();
            await expect(this.page.getByText('QA Espresso')).toBeVisible();
            return;
        }

        await expect(this.page.getByRole('heading', { name: /No categories yet/i })).toBeVisible();
        await this.page.getByRole('button', { name: /Create Category/i }).click();
        await this.page.getByLabel('Category name').fill('QA Specials');
        await this.page.getByRole('button', { name: /^Create$/ }).click();
        await expect(this.page.getByText(/sign in to manage categories/i)).toBeVisible();
    }
}

export class InventoryPage {
    constructor(private readonly page: Page) {}

    async assertLoaded() {
        await expect(this.page.getByRole('heading', { name: /Inventory & Cost/i })).toBeVisible();
        await expect(this.page.getByRole('heading', { name: 'Inventory Table' })).toBeVisible();
    }

    async createInventoryItem() {
        await expect(this.page.getByText('Loading inventory...')).toHaveCount(0, {
            timeout: 15_000,
        });
        await this.page.getByPlaceholder('Item name').fill('QA Flour');
        await this.page.getByPlaceholder('SKU').fill('qa-flour-01');
        await this.page.getByPlaceholder('UOM').fill('kg');
        await this.page.getByPlaceholder('Opening stock').fill('25');
        await this.page.getByPlaceholder('Reorder level').fill('5');
        await this.page.getByPlaceholder('Cost/UOM').fill('60');
        await this.page.getByRole('button', { name: /^Add$/ }).click();

        await expect(this.page.getByText('Inventory item created.')).toBeVisible();
        await expect(this.page.getByRole('rowheader', { name: /QA Flour/i })).toBeVisible();
    }
}

export class AnalyticsPage {
    constructor(private readonly page: Page) {}

    async assertLoaded() {
        await expect(this.page.getByRole('heading', { name: /^Analytics$/i })).toBeVisible();
        await expect(this.page.getByRole('heading', { name: 'Revenue Trends' })).toBeVisible();
    }

    async changeRangeAndValidate() {
        await this.page.getByRole('button', { name: /This Week/i }).click();
        await this.page.getByRole('button', { name: 'Today' }).click();
        await expect(this.page.getByText(/ETB/i).first()).toBeVisible();
        await expect(this.page.getByText('Total Revenue')).toBeVisible();
        await expect(this.page.getByRole('heading', { name: 'Order Performance' })).toBeVisible();
    }
}

export class FinancePage {
    constructor(private readonly page: Page) {}

    async assertLoaded() {
        await expect(
            this.page.getByRole('heading', { name: /Finance & Reconciliation/i })
        ).toBeVisible();
        await expect(
            this.page.getByRole('heading', { name: 'Payout Reconciliation' })
        ).toBeVisible();
    }

    async submitRefund() {
        await this.page.getByPlaceholder('Payment ID').fill('pay-2');
        await this.page.getByPlaceholder('Amount').fill('40');
        await this.page.getByPlaceholder('Reason').fill('Customer courtesy');
        await this.page.getByRole('button', { name: 'Submit Refund' }).click();

        await expect(this.page.getByText('Refund request submitted.')).toBeVisible();
        await expect(this.page.getByText('Customer courtesy')).toBeVisible();
    }
}

export class SettingsPage {
    constructor(private readonly page: Page) {}

    async assertLoaded() {
        await expect(this.page.getByRole('heading', { name: /^Settings$/i })).toBeVisible();
        await expect(this.page.getByRole('button', { name: 'Security', exact: true })).toBeVisible();
    }

    async saveSecuritySettings() {
        await this.page.getByLabel('Require MFA').check();
        await this.page.getByLabel('Session Timeout (minutes)').fill('90');
        await this.page.getByRole('button', { name: 'Save Security' }).click();
        await expect(this.page.getByText('Security settings saved.')).toBeVisible();
    }

    async saveNotificationSettings() {
        await this.page.getByRole('button', { name: 'Notifications' }).click();
        await this.page.getByLabel('SMS Notifications').check();
        await this.page.getByRole('button', { name: 'Save Routing' }).click();
        await expect(this.page.getByText('Notification settings saved.')).toBeVisible();
    }
}
