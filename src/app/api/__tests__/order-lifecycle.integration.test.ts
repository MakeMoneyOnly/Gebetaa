import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(),
}));

vi.mock('@/lib/security/guestContext', () => ({
    resolveGuestContext: vi.fn(),
}));

vi.mock('@/lib/services/orderService', () => ({
    checkRateLimit: vi.fn(),
    createOrder: vi.fn(),
    generateGuestFingerprint: vi.fn(),
    generateIdempotencyKey: vi.fn(),
}));

import { createClient } from '@/lib/supabase/server';
import { resolveGuestContext } from '@/lib/security/guestContext';
import {
    checkRateLimit,
    createOrder,
    generateGuestFingerprint,
    generateIdempotencyKey,
} from '@/lib/services/orderService';

import { POST as postOrder, GET as getOrders } from '@/app/api/orders/route';
import { PATCH as patchOrderStatus } from '@/app/api/orders/[orderId]/status/route';
import { POST as postOrderAssign } from '@/app/api/orders/[orderId]/assign/route';
import { POST as postBulkStatus } from '@/app/api/orders/bulk-status/route';
import { GET as getOrderDetail } from '@/app/api/orders/[orderId]/route';

type Row = Record<string, any>;
type TableStore = Record<string, Row[]>;

class QueryBuilder {
    private filters: Array<(row: Row) => boolean> = [];
    private op: 'select' | 'insert' | 'update' | 'delete' = 'select';
    private payload: Row | Row[] | null = null;
    private sortBy: { key: string; asc: boolean } | null = null;
    private limitBy: number | null = null;
    private searchTerm: string | null = null;

    constructor(private readonly table: string, private readonly store: TableStore) {}

    select() {
        return this;
    }

    insert(payload: Row | Row[]) {
        this.op = 'insert';
        this.payload = payload;
        return this;
    }

    update(payload: Row) {
        this.op = 'update';
        this.payload = payload;
        return this;
    }

    delete() {
        this.op = 'delete';
        return this;
    }

    eq(field: string, value: unknown) {
        this.filters.push(row => row[field] === value);
        return this;
    }

    in(field: string, values: unknown[]) {
        this.filters.push(row => values.includes(row[field]));
        return this;
    }

    gt(field: string, value: unknown) {
        this.filters.push(row => row[field] > (value as any));
        return this;
    }

    gte(field: string, value: unknown) {
        this.filters.push(row => row[field] >= (value as any));
        return this;
    }

    or(expression: string) {
        const firstTerm = expression.match(/ilike\.%([^%]+)%/)?.[1]?.toLowerCase() ?? null;
        this.searchTerm = firstTerm;
        return this;
    }

    order(key: string, options?: { ascending?: boolean }) {
        this.sortBy = { key, asc: options?.ascending !== false };
        return this;
    }

    limit(value: number) {
        this.limitBy = value;
        return this;
    }

    maybeSingle() {
        return Promise.resolve(this.executeSingle(false));
    }

    single() {
        return Promise.resolve(this.executeSingle(true));
    }

    then<TResult1 = any, TResult2 = never>(
        onfulfilled?: ((value: { data: any; error: any }) => TResult1 | PromiseLike<TResult1>) | null,
        onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
    ): Promise<TResult1 | TResult2> {
        return Promise.resolve(this.execute()).then(onfulfilled as any, onrejected as any);
    }

    private executeSingle(required: boolean) {
        const res = this.execute();
        const first = Array.isArray(res.data) ? (res.data[0] ?? null) : res.data;
        if (required && !first) {
            return { data: null, error: { message: 'Row not found' } };
        }
        return { data: first, error: null };
    }

    private execute() {
        const tableRows = this.store[this.table] ?? [];

        if (this.op === 'insert') {
            const rows = (Array.isArray(this.payload) ? this.payload : [this.payload]).map(row => ({
                ...(row ?? {}),
                id: row?.id ?? crypto.randomUUID(),
                created_at: row?.created_at ?? new Date().toISOString(),
                updated_at: new Date().toISOString(),
            }));
            tableRows.push(...rows);
            this.store[this.table] = tableRows;
            return { data: rows, error: null };
        }

        const matched = tableRows.filter(row => this.filters.every(fn => fn(row)));

        if (this.op === 'update') {
            const updated = matched.map(row => Object.assign(row, this.payload ?? {}, { updated_at: new Date().toISOString() }));
            return { data: updated, error: null };
        }

        if (this.op === 'delete') {
            this.store[this.table] = tableRows.filter(row => !matched.includes(row));
            return { data: null, error: null };
        }

        let selected = matched.slice();

        if (this.searchTerm) {
            const term = this.searchTerm;
            selected = selected.filter(row =>
                String(row.table_number ?? '').toLowerCase().includes(term) ||
                String(row.order_number ?? '').toLowerCase().includes(term) ||
                String(row.customer_name ?? '').toLowerCase().includes(term)
            );
        }

        if (this.sortBy) {
            const { key, asc } = this.sortBy;
            selected.sort((a, b) => {
                const av = a[key];
                const bv = b[key];
                if (av === bv) return 0;
                return av > bv ? (asc ? 1 : -1) : (asc ? -1 : 1);
            });
        }

        if (typeof this.limitBy === 'number') {
            selected = selected.slice(0, this.limitBy);
        }

        return { data: selected, error: null };
    }
}

function createHarness() {
    const store: TableStore = {
        orders: [],
        order_events: [],
        campaigns: [],
        campaign_deliveries: [],
        restaurant_staff: [
            { id: '11111111-1111-4111-8111-111111111111', user_id: 'staff-user-1', restaurant_id: 'rest-1', is_active: true, role: 'manager' },
            { id: '22222222-2222-4222-8222-222222222222', user_id: 'staff-user-2', restaurant_id: 'rest-1', is_active: true, role: 'waiter' },
        ],
        agency_users: [],
        audit_logs: [],
    };

    const supabase = {
        auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'staff-user-1' } }, error: null }),
        },
        from: (table: string) => new QueryBuilder(table, store),
    } as any;

    return { supabase, store };
}

describe('Order lifecycle integration', () => {
    const createClientMock = vi.mocked(createClient);
    const resolveGuestContextMock = vi.mocked(resolveGuestContext);
    const checkRateLimitMock = vi.mocked(checkRateLimit);
    const createOrderMock = vi.mocked(createOrder);
    const generateGuestFingerprintMock = vi.mocked(generateGuestFingerprint);
    const generateIdempotencyKeyMock = vi.mocked(generateIdempotencyKey);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('executes guest create -> assign -> status progression -> detail timeline', async () => {
        const harness = createHarness();
        createClientMock.mockResolvedValue(harness.supabase);

        resolveGuestContextMock.mockResolvedValue({
            valid: true,
            data: {
                restaurantId: 'rest-1',
                tableId: 'table-1',
                tableNumber: 'T1',
                slug: 'demo',
                signature: 'abc',
                expiresAt: 9999999999,
            },
        } as any);
        checkRateLimitMock.mockResolvedValue({ allowed: true, remainingOrders: 4 });
        generateGuestFingerprintMock.mockReturnValue('fp-1');
        generateIdempotencyKeyMock.mockReturnValue('11111111-1111-4111-8111-111111111111');
        createOrderMock.mockImplementation(async (_supabase, payload: any) => {
            const row = {
                id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                restaurant_id: payload.restaurant_id,
                table_number: payload.table_number,
                status: 'pending',
                kitchen_status: null,
                total_price: payload.total_price,
                order_number: 'ORD-100001',
                items: payload.items,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };
            harness.store.orders.push(row);
            return { success: true, order: row } as any;
        });

        harness.store.campaigns.push({
            id: 'f1b8b787-11a5-4e78-8f50-91dcae7e96dd',
            restaurant_id: 'rest-1',
            status: 'running',
        });
        harness.store.campaign_deliveries.push({
            id: '0f7f4423-f383-4f0f-9238-2c80112de20d',
            campaign_id: 'f1b8b787-11a5-4e78-8f50-91dcae7e96dd',
            guest_id: 'guest-1',
            status: 'sent',
            conversion_order_id: null,
        });

        const createResponse = await postOrder(new NextRequest('http://localhost/api/orders', {
            method: 'POST',
            body: JSON.stringify({
                guest_context: { slug: 'demo', table: 'T1', sig: 'abc', exp: 9999999999 },
                campaign_attribution: {
                    campaign_delivery_id: '0f7f4423-f383-4f0f-9238-2c80112de20d',
                    campaign_id: 'f1b8b787-11a5-4e78-8f50-91dcae7e96dd',
                },
                items: [{ id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', name: 'Burger', quantity: 1, price: 100 }],
                total_price: 100,
            }),
            headers: {
                'content-type': 'application/json',
                'x-forwarded-for': '127.0.0.1',
                'user-agent': 'vitest',
            },
        }));
        expect(createResponse.status).toBe(201);
        const created = await createResponse.json();
        expect(created.data.id).toBe('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
        expect(created.data.campaign_attribution_applied).toBe(true);
        expect(harness.store.campaign_deliveries[0].status).toBe('converted');
        expect(harness.store.campaign_deliveries[0].conversion_order_id).toBe('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');

        const queueResponse = await getOrders(new NextRequest('http://localhost/api/orders?limit=20'));
        expect(queueResponse.status).toBe(200);
        const queueBody = await queueResponse.json();
        expect(queueBody.data.total).toBe(1);
        expect(queueBody.data.orders[0].status).toBe('pending');

        const assignResponse = await postOrderAssign(
            new Request('http://localhost/api/orders/order-1/assign', {
                method: 'POST',
                body: JSON.stringify({ staff_id: '22222222-2222-4222-8222-222222222222' }),
                headers: { 'content-type': 'application/json' },
            }),
            { params: Promise.resolve({ orderId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' }) }
        );
        expect(assignResponse.status).toBe(200);

        for (const status of ['acknowledged', 'preparing', 'ready', 'served', 'completed']) {
            const statusResponse = await patchOrderStatus(
                new NextRequest('http://localhost/api/orders/order-1/status', {
                    method: 'PATCH',
                    body: JSON.stringify({ status }),
                    headers: { 'content-type': 'application/json' },
                }),
                { params: Promise.resolve({ orderId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' }) }
            );
            expect(statusResponse.status).toBe(200);
        }

        const detailResponse = await getOrderDetail(
            new Request('http://localhost/api/orders/order-1'),
            { params: Promise.resolve({ orderId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' }) }
        );
        expect(detailResponse.status).toBe(200);
        const detailBody = await detailResponse.json();
        expect(detailBody.data.order.status).toBe('completed');
        expect(detailBody.data.events.length).toBeGreaterThanOrEqual(6);
    });

    it('rejects invalid transition within lifecycle flow', async () => {
        const harness = createHarness();
        harness.store.orders.push({
            id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
            restaurant_id: 'rest-1',
            table_number: 'T2',
            status: 'pending',
            order_number: 'ORD-2',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        });
        createClientMock.mockResolvedValue(harness.supabase);

        const response = await patchOrderStatus(
            new NextRequest('http://localhost/api/orders/order-2/status', {
                method: 'PATCH',
                body: JSON.stringify({ status: 'completed' }),
                headers: { 'content-type': 'application/json' },
            }),
            { params: Promise.resolve({ orderId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc' }) }
        );
        const body = await response.json();

        expect(response.status).toBe(409);
        expect(body.code).toBe('INVALID_TRANSITION');
    });

    it('applies bulk status updates for acknowledged orders and records events', async () => {
        const harness = createHarness();
        harness.store.orders.push(
            {
                id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
                restaurant_id: 'rest-1',
                table_number: 'T3',
                status: 'acknowledged',
                order_number: 'ORD-3',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            },
            {
                id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
                restaurant_id: 'rest-1',
                table_number: 'T4',
                status: 'acknowledged',
                order_number: 'ORD-4',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            }
        );
        createClientMock.mockResolvedValue(harness.supabase);

        const response = await postBulkStatus(
            new Request('http://localhost/api/orders/bulk-status', {
                method: 'POST',
                body: JSON.stringify({
                    order_ids: ['dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'],
                    status: 'preparing',
                }),
                headers: { 'content-type': 'application/json' },
            })
        );
        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.data.updated_count).toBe(2);

        const queueResponse = await getOrders(new NextRequest('http://localhost/api/orders?status=preparing&limit=20'));
        const queueBody = await queueResponse.json();
        expect(queueBody.data.total).toBe(2);
        expect(harness.store.order_events.filter(e => e.event_type === 'bulk_status_changed').length).toBe(2);
    });
});
