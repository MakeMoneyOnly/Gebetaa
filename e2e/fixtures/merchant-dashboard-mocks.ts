import type { Page, Route } from '@playwright/test';

type JsonObject = Record<string, unknown>;

type OrderRecord = {
    id: string;
    order_number: string;
    table_number: string;
    status: string;
    created_at: string;
    total_price: number;
    notes: string | null;
};

type ServiceRequestRecord = {
    id: string;
    table_number: string;
    status: 'pending' | 'in_progress' | 'completed';
    request_type: string;
    notes: string | null;
    created_at: string;
};

type MenuItemRecord = {
    id: string;
    category_id: string;
    name: string;
    name_am: string | null;
    price: number;
    description: string | null;
    image_url: string | null;
    is_available: boolean;
};

type CategoryRecord = {
    id: string;
    restaurant_id: string;
    name: string;
    order_index: number;
};

const nowIso = new Date().toISOString();

function withEqPrefix(value: string | null): string | null {
    if (!value) return null;
    return value.startsWith('eq.') ? value.slice(3) : value;
}

function parseInFilter(value: string | null): string[] {
    if (!value) return [];
    const match = value.match(/in\.\((.*)\)/);
    if (!match || !match[1]) return [];
    return match[1]
        .split(',')
        .map(entry => entry.trim())
        .filter(Boolean);
}

async function respondJson(route: Route, body: JsonObject | unknown[], status = 200) {
    await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(body),
    });
}

export async function mockMerchantDashboardAuth(page: Page) {
    await page.setExtraHTTPHeaders({
        'x-e2e-bypass-auth': '1',
    });

    await page.addInitScript(() => {
        window.localStorage.setItem('__e2e_bypass_auth', 'true');
        window.localStorage.setItem(
            'sb-axuegixbqsvztdraenkz-auth-token',
            JSON.stringify({
                access_token:
                    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJzdGFmZi11c2VyLTEiLCJlbWFpbCI6ImUyZUBleGFtcGxlLmNvbSIsInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoyMDk5OTk5OTk5fQ.signature',
                token_type: 'bearer',
                expires_in: 3600,
                expires_at: 2099999999,
                refresh_token: 'e2e-refresh-token-value',
                user: {
                    id: 'staff-user-1',
                    aud: 'authenticated',
                    role: 'authenticated',
                    email: 'e2e@example.com',
                },
            })
        );
        window.sessionStorage.setItem('gebeta_restaurant_name', 'Saba Grill');
        window.sessionStorage.setItem('gebeta_restaurant_handle', '@saba-grill_admin');
    });
}

export async function installMerchantDashboardMocks(page: Page) {
    await mockMerchantDashboardAuth(page);

    let dashboardPreset: 'owner' | 'manager' | 'kitchen_lead' = 'owner';

    const orders: OrderRecord[] = [
        {
            id: 'order-1',
            order_number: 'ORD-1001',
            table_number: 'T1',
            status: 'pending',
            created_at: new Date(Date.now() - 10 * 60_000).toISOString(),
            total_price: 420,
            notes: 'No onions',
        },
        {
            id: 'order-2',
            order_number: 'ORD-1002',
            table_number: 'T3',
            status: 'preparing',
            created_at: new Date(Date.now() - 6 * 60_000).toISOString(),
            total_price: 315,
            notes: null,
        },
    ];

    const serviceRequests: ServiceRequestRecord[] = [
        {
            id: 'req-1',
            table_number: 'T2',
            status: 'pending',
            request_type: 'water',
            notes: 'Sparkling water',
            created_at: new Date(Date.now() - 4 * 60_000).toISOString(),
        },
    ];

    const inventoryItems = [
        {
            id: 'inv-1',
            name: 'Chicken Breast',
            sku: 'CHK-001',
            uom: 'kg',
            current_stock: 20,
            reorder_level: 5,
            cost_per_unit: 320,
            is_active: true,
        },
    ];

    const recipes = [
        {
            id: 'rec-1',
            name: 'Chicken Tibs',
            output_qty: 1,
            output_uom: 'plate',
            ingredients: [],
        },
    ];

    const purchaseOrders = [
        {
            id: 'po-1',
            supplier_name: 'Addis Foods PLC',
            status: 'submitted',
            currency: 'ETB',
            subtotal: 4000,
            tax_amount: 600,
            expected_at: nowIso,
            notes: null,
        },
    ];

    const invoices = [
        {
            id: 'inv-supplier-1',
            supplier_name: 'Addis Foods PLC',
            status: 'pending_review',
            currency: 'ETB',
            subtotal: 4600,
            tax_amount: 690,
            due_at: nowIso,
            notes: null,
        },
    ];

    const varianceRows = [
        {
            id: 'var-1',
            inventory_item_name: 'Chicken Breast',
            expected_qty: 12,
            actual_qty: 11,
            variance_qty: -1,
            variance_cost: -320,
        },
    ];

    const payments = [
        {
            id: 'pay-1',
            created_at: nowIso,
            method: 'telebirr',
            provider: 'telebirr',
            amount: 1200,
            tip_amount: 60,
            status: 'captured',
        },
        {
            id: 'pay-2',
            created_at: nowIso,
            method: 'cash',
            provider: 'cash',
            amount: 800,
            tip_amount: 0,
            status: 'captured',
        },
    ];

    const refunds = [
        {
            id: 'refund-1',
            payment_id: 'pay-1',
            amount: 120,
            reason: 'Item unavailable',
            status: 'pending',
            created_at: nowIso,
        },
    ];

    const payouts = [
        {
            id: 'payout-1',
            provider: 'chapa',
            period_start: new Date(Date.now() - 24 * 60 * 60_000).toISOString(),
            period_end: nowIso,
            gross: 8000,
            fees: 240,
            net: 7760,
            status: 'processing',
        },
    ];

    const reconciliationEntries = [
        {
            id: 'recon-1',
            source_type: 'chapa',
            expected_amount: 7760,
            settled_amount: 7600,
            delta_amount: -160,
            status: 'exception',
        },
    ];

    const securitySettings = {
        require_mfa: false,
        session_timeout_minutes: 120,
        allowed_ip_ranges: ['10.0.0.0/24'],
        alert_on_suspicious_login: true,
    };

    const notificationSettings = {
        email_enabled: true,
        sms_enabled: false,
        in_app_enabled: true,
        escalation_enabled: true,
        escalation_minutes: 15,
    };

    const categories: CategoryRecord[] = [
        {
            id: 'cat-1',
            restaurant_id: 'rest-1',
            name: 'Mains',
            order_index: 0,
        },
    ];

    const menuItems: MenuItemRecord[] = [
        {
            id: 'item-1',
            category_id: 'cat-1',
            name: 'Doro Wot',
            name_am: null,
            price: 450,
            description: 'Spicy chicken stew',
            image_url: null,
            is_available: true,
        },
    ];

    await page.route('**/auth/v1/user**', async route => {
        await respondJson(route, {
            id: 'staff-user-1',
            aud: 'authenticated',
            role: 'authenticated',
            email: 'e2e@example.com',
        });
    });

    await page.route('**/rest/v1/rpc/get_my_staff_role**', async route => {
        await respondJson(route, { role: 'owner', restaurant_id: 'rest-1' });
    });

    await page.route('**/rest/v1/restaurant_staff*', async route => {
        await respondJson(route, [
            {
                id: 'staff-member-1',
                user_id: 'staff-user-1',
                role: 'owner',
                restaurant_id: 'rest-1',
                is_active: true,
            },
        ]);
    });

    await page.route('**/rest/v1/categories*', async route => {
        const url = new URL(route.request().url());
        const method = route.request().method();

        if (method === 'GET') {
            const payload = categories
                .slice()
                .sort((a, b) => a.order_index - b.order_index)
                .map(category => ({
                    ...category,
                    items: menuItems.filter(item => item.category_id === category.id),
                }));
            await respondJson(route, payload);
            return;
        }

        if (method === 'POST') {
            const body = route.request().postDataJSON() as JsonObject[];
            const row = body[0] as JsonObject;
            const newCategory: CategoryRecord = {
                id: `cat-${categories.length + 1}`,
                restaurant_id: String(row.restaurant_id ?? 'rest-1'),
                name: String(row.name ?? 'Untitled'),
                order_index: Number(row.order_index ?? categories.length),
            };
            categories.push(newCategory);
            await respondJson(route, [newCategory]);
            return;
        }

        if (method === 'PATCH') {
            const id = withEqPrefix(url.searchParams.get('id'));
            const patch = route.request().postDataJSON() as JsonObject;
            if (id) {
                const target = categories.find(category => category.id === id);
                if (target) {
                    if (typeof patch.name === 'string') target.name = patch.name;
                    if (typeof patch.order_index === 'number')
                        target.order_index = patch.order_index;
                }
            }
            await respondJson(route, []);
            return;
        }

        if (method === 'DELETE') {
            const id = withEqPrefix(url.searchParams.get('id'));
            if (id) {
                const index = categories.findIndex(category => category.id === id);
                if (index >= 0) categories.splice(index, 1);
                for (let i = menuItems.length - 1; i >= 0; i -= 1) {
                    if (menuItems[i].category_id === id) {
                        menuItems.splice(i, 1);
                    }
                }
            }
            await respondJson(route, []);
            return;
        }

        await respondJson(route, []);
    });

    await page.route('**/rest/v1/menu_items*', async route => {
        const url = new URL(route.request().url());
        const method = route.request().method();

        if (method === 'POST') {
            const body = route.request().postDataJSON() as JsonObject[];
            const row = body[0] as JsonObject;
            const newItem: MenuItemRecord = {
                id: `item-${menuItems.length + 1}`,
                category_id: String(row.category_id ?? categories[0]?.id ?? 'cat-1'),
                name: String(row.name ?? 'Unnamed item'),
                name_am: (row.name_am as string | null) ?? null,
                price: Number(row.price ?? 0),
                description: (row.description as string | null) ?? null,
                image_url: (row.image_url as string | null) ?? null,
                is_available: true,
            };
            menuItems.push(newItem);
            await respondJson(route, [newItem]);
            return;
        }

        if (method === 'PATCH') {
            const patch = route.request().postDataJSON() as JsonObject;
            const eqId = withEqPrefix(url.searchParams.get('id'));
            const inIds = parseInFilter(url.searchParams.get('id'));
            const targetIds = eqId ? [eqId] : inIds;

            for (const itemId of targetIds) {
                const target = menuItems.find(item => item.id === itemId);
                if (!target) continue;
                if (typeof patch.name === 'string') target.name = patch.name;
                if (typeof patch.price === 'number') target.price = patch.price;
                if (typeof patch.description === 'string' || patch.description === null) {
                    target.description = patch.description as string | null;
                }
                if (typeof patch.is_available === 'boolean')
                    target.is_available = patch.is_available;
            }

            await respondJson(route, []);
            return;
        }

        await respondJson(route, []);
    });

    await page.route('**/api/merchant/activity', async route => {
        await respondJson(route, {
            restaurant: { name: 'Saba Grill', slug: 'saba-grill' },
            orders,
            requests: serviceRequests,
        });
    });

    await page.route('**/api/merchant/dashboard-presets', async route => {
        if (route.request().method() === 'PATCH') {
            const payload = route.request().postDataJSON() as { preset?: typeof dashboardPreset };
            if (payload.preset) dashboardPreset = payload.preset;
            await respondJson(route, { data: { current_preset: dashboardPreset } });
            return;
        }
        await respondJson(route, {
            data: { current_preset: dashboardPreset, recommended_preset: 'manager' },
        });
    });

    await page.route('**/api/merchant/command-center?**', async route => {
        await respondJson(route, {
            data: {
                restaurant_id: 'rest-1',
                metrics: {
                    orders_in_flight: orders.filter(
                        order => !['completed', 'cancelled'].includes(order.status)
                    ).length,
                    avg_ticket_time_minutes: 12,
                    active_tables: 5,
                    open_requests: serviceRequests.length,
                    payment_success_rate: 97,
                    gross_sales_today: 12000,
                    total_orders_today: orders.length,
                    avg_order_value_etb: 857,
                    unique_tables_today: 6,
                },
                attention_queue: [
                    ...orders.map(order => ({
                        id: order.id,
                        type: 'order',
                        label: order.order_number,
                        status: order.status,
                        created_at: order.created_at,
                        table_number: order.table_number,
                    })),
                    ...serviceRequests.map(request => ({
                        id: request.id,
                        type: 'service_request',
                        label: request.request_type,
                        status: request.status,
                        created_at: request.created_at,
                        table_number: request.table_number,
                    })),
                ],
                alert_summary: { open_alerts: 1 },
                filters: {
                    range: 'today',
                    since: new Date(Date.now() - 12 * 60 * 60_000).toISOString(),
                },
                sync_status: { generated_at: new Date().toISOString(), source: 'postgres' },
            },
        });
    });

    await page.route('**/api/orders/bulk-status', async route => {
        const payload = route.request().postDataJSON() as { order_ids?: string[]; status?: string };
        for (const orderId of payload.order_ids ?? []) {
            const order = orders.find(entry => entry.id === orderId);
            if (order && payload.status) order.status = payload.status;
        }
        await respondJson(route, { data: { success: true } });
    });

    await page.route('**/api/orders/*/assign', async route => {
        await respondJson(route, { data: { assigned: true } });
    });

    await page.route('**/api/orders/*/status', async route => {
        const status = (route.request().postDataJSON() as { status?: string }).status;
        const orderId = route.request().url().split('/api/orders/')[1].split('/status')[0];
        const order = orders.find(entry => entry.id === orderId);
        if (order && status) order.status = status;
        await respondJson(route, {
            data: { id: orderId, status: status ?? order?.status ?? 'pending' },
        });
    });

    await page.route('**/api/orders/*', async route => {
        const method = route.request().method();
        if (method !== 'GET') {
            await respondJson(route, { data: {} });
            return;
        }
        const url = route.request().url();
        if (url.includes('/status') || url.includes('/assign')) {
            await route.fallback();
            return;
        }
        const orderId = url.split('/api/orders/')[1];
        const order = orders.find(entry => entry.id === orderId);
        await respondJson(route, {
            data: {
                order,
                events: [
                    {
                        id: 'event-1',
                        event_type: 'status_changed',
                        from_status: 'pending',
                        to_status: order?.status ?? 'pending',
                        created_at: new Date().toISOString(),
                    },
                ],
            },
        });
    });

    await page.route('**/api/orders?**', async route => {
        const url = new URL(route.request().url());
        const status = url.searchParams.get('status');
        const search = (url.searchParams.get('search') ?? '').toLowerCase();

        const filtered = orders.filter(order => {
            const matchesStatus = !status || order.status === status;
            const matchesSearch =
                !search ||
                order.order_number.toLowerCase().includes(search) ||
                order.table_number.toLowerCase().includes(search);
            return matchesStatus && matchesSearch;
        });

        await respondJson(route, { data: { orders: filtered, total: filtered.length } });
    });

    await page.route('**/api/service-requests/*', async route => {
        const status = (
            route.request().postDataJSON() as { status?: ServiceRequestRecord['status'] }
        ).status;
        const requestId = route.request().url().split('/api/service-requests/')[1];
        const request = serviceRequests.find(entry => entry.id === requestId);
        if (request && status) request.status = status;
        await respondJson(route, { data: request ?? null });
    });

    await page.route('**/api/service-requests?**', async route => {
        await respondJson(route, { data: { requests: serviceRequests } });
    });

    await page.route('**/api/staff', async route => {
        await respondJson(route, {
            data: {
                staff: [
                    { id: 'staff-1', user_id: 'staff-user-1', role: 'manager', is_active: true },
                    { id: 'staff-2', user_id: 'staff-user-2', role: 'waiter', is_active: true },
                ],
            },
        });
    });

    await page.route('**/api/analytics/overview?**', async route => {
        const url = new URL(route.request().url());
        const range = url.searchParams.get('range') ?? 'week';
        const totalsByRange: Record<string, number> = {
            today: 9_400,
            week: 62_300,
            month: 248_500,
            year: 3_240_000,
        };

        await respondJson(route, {
            data: {
                metrics: {
                    total_revenue: totalsByRange[range] ?? totalsByRange.week,
                    total_orders: 84,
                    completed_orders: 76,
                    pending_orders: 8,
                    open_requests: 3,
                    active_tables: 7,
                    total_tables: 12,
                    conversion_rate: 18,
                    avg_order_value: 742,
                    avg_rating: 4.6,
                    total_reviews: 124,
                    reviews_this_week: 18,
                    previous_completed_orders: 70,
                    top_items: [
                        { name: 'Doro Wot', count: 24, revenue: 10800 },
                        { name: 'Shiro', count: 17, revenue: 5270 },
                    ],
                    trends: [
                        { label: 'Mon', revenue: 8100, orders: 11 },
                        { label: 'Tue', revenue: 9200, orders: 13 },
                    ],
                },
            },
        });
    });

    await page.route('**/api/analytics/mood', async route => {
        await respondJson(route, { data: { recorded: true } });
    });

    await page.route('**/api/settings/security', async route => {
        if (route.request().method() === 'PATCH') {
            const patch = route.request().postDataJSON() as JsonObject;
            Object.assign(securitySettings, patch);
            await respondJson(route, { data: securitySettings });
            return;
        }
        await respondJson(route, { data: securitySettings });
    });

    await page.route('**/api/settings/notifications', async route => {
        if (route.request().method() === 'PATCH') {
            const patch = route.request().postDataJSON() as JsonObject;
            Object.assign(notificationSettings, patch);
            await respondJson(route, { data: notificationSettings });
            return;
        }
        await respondJson(route, { data: notificationSettings });
    });

    await page.route('**/api/inventory/items?**', async route => {
        await respondJson(route, { data: { items: inventoryItems } });
    });

    await page.route('**/api/inventory/items', async route => {
        if (route.request().method() === 'POST') {
            const payload = route.request().postDataJSON() as JsonObject;
            inventoryItems.push({
                id: `inv-${inventoryItems.length + 1}`,
                name: String(payload.name ?? 'Unnamed'),
                sku: (payload.sku as string | null) ?? null,
                uom: String(payload.uom ?? 'unit'),
                current_stock: Number(payload.current_stock ?? 0),
                reorder_level: Number(payload.reorder_level ?? 0),
                cost_per_unit: Number(payload.cost_per_unit ?? 0),
                is_active: true,
            });
            await respondJson(route, { data: { created: true } });
            return;
        }
        await respondJson(route, { data: { items: inventoryItems } });
    });

    await page.route('**/api/inventory/movements', async route => {
        const payload = route.request().postDataJSON() as {
            inventory_item_id?: string;
            movement_type?: 'in' | 'out' | 'waste';
            qty?: number;
        };
        const item = inventoryItems.find(entry => entry.id === payload.inventory_item_id);
        if (item && payload.movement_type && payload.qty) {
            if (payload.movement_type === 'in') item.current_stock += payload.qty;
            if (payload.movement_type !== 'in') item.current_stock -= payload.qty;
        }
        await respondJson(route, { data: { created: true } });
    });

    await page.route('**/api/inventory/recipes', async route => {
        if (route.request().method() === 'POST') {
            const payload = route.request().postDataJSON() as JsonObject;
            recipes.push({
                id: `rec-${recipes.length + 1}`,
                name: String(payload.name ?? 'Recipe'),
                output_qty: Number(payload.output_qty ?? 1),
                output_uom: String(payload.output_uom ?? 'unit'),
                ingredients: (payload.ingredients as unknown[]) ?? [],
            });
            await respondJson(route, { data: { created: true } });
            return;
        }
        await respondJson(route, { data: { recipes, inventory_items: inventoryItems } });
    });

    await page.route('**/api/inventory/purchase-orders?**', async route => {
        await respondJson(route, { data: { purchase_orders: purchaseOrders } });
    });

    await page.route('**/api/inventory/purchase-orders', async route => {
        if (route.request().method() === 'POST') {
            const payload = route.request().postDataJSON() as JsonObject;
            purchaseOrders.push({
                id: `po-${purchaseOrders.length + 1}`,
                supplier_name: String(payload.supplier_name ?? 'Supplier'),
                status: String(payload.status ?? 'draft'),
                currency: String(payload.currency ?? 'ETB'),
                subtotal: Number(payload.subtotal ?? 0),
                tax_amount: Number(payload.tax_amount ?? 0),
                expected_at: String(payload.expected_at ?? nowIso),
                notes: (payload.notes as string | null) ?? null,
            });
            await respondJson(route, { data: { created: true } });
            return;
        }
        await respondJson(route, { data: { purchase_orders: purchaseOrders } });
    });

    await page.route('**/api/inventory/invoices?**', async route => {
        await respondJson(route, { data: { invoices } });
    });

    await page.route('**/api/inventory/invoices', async route => {
        if (route.request().method() === 'POST') {
            const payload = route.request().postDataJSON() as JsonObject;
            invoices.push({
                id: `invoice-${invoices.length + 1}`,
                supplier_name: String(payload.supplier_name ?? 'Supplier'),
                status: String(payload.status ?? 'pending_review'),
                currency: String(payload.currency ?? 'ETB'),
                subtotal: Number(payload.subtotal ?? 0),
                tax_amount: Number(payload.tax_amount ?? 0),
                due_at: String(payload.due_at ?? nowIso),
                notes: (payload.notes as string | null) ?? null,
            });
            await respondJson(route, { data: { created: true } });
            return;
        }
        await respondJson(route, { data: { invoices } });
    });

    await page.route('**/api/inventory/variance?**', async route => {
        await respondJson(route, {
            data: {
                rows: varianceRows,
                totals: {
                    variance_cost_total: varianceRows.reduce(
                        (sum, row) => sum + Number(row.variance_cost ?? 0),
                        0
                    ),
                },
            },
        });
    });

    await page.route('**/api/finance/payments?**', async route => {
        await respondJson(route, {
            data: {
                payments,
                totals: { gross: payments.reduce((sum, entry) => sum + entry.amount, 0) },
            },
        });
    });

    await page.route('**/api/finance/refunds?**', async route => {
        await respondJson(route, {
            data: {
                refunds,
                totals: { total_amount: refunds.reduce((sum, entry) => sum + entry.amount, 0) },
            },
        });
    });

    await page.route('**/api/finance/refunds', async route => {
        if (route.request().method() === 'POST') {
            const payload = route.request().postDataJSON() as JsonObject;
            refunds.push({
                id: `refund-${refunds.length + 1}`,
                payment_id: String(payload.payment_id ?? ''),
                amount: Number(payload.amount ?? 0),
                reason: String(payload.reason ?? ''),
                status: 'pending',
                created_at: new Date().toISOString(),
            });
            await respondJson(route, { data: { created: true } });
            return;
        }
        await respondJson(route, { data: { refunds } });
    });

    await page.route('**/api/finance/payouts?**', async route => {
        await respondJson(route, {
            data: { payouts, totals: { net: payouts.reduce((sum, entry) => sum + entry.net, 0) } },
        });
    });

    await page.route('**/api/finance/reconciliation?**', async route => {
        await respondJson(route, { data: { entries: reconciliationEntries } });
    });

    await page.route('**/api/finance/exceptions?**', async route => {
        await respondJson(route, {
            data: {
                summary: {
                    total_delta: reconciliationEntries.reduce(
                        (sum, entry) => sum + Number(entry.delta_amount ?? 0),
                        0
                    ),
                },
            },
        });
    });

    await page.route('**/api/finance/export?**', async route => {
        await route.fulfill({
            status: 200,
            contentType: 'text/csv',
            body: 'id,amount\nsample,100\n',
        });
    });
}
