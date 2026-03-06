import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getAuthenticatedUser, getAuthorizedRestaurantContext } from '@/lib/api/authz';
import { POST as postIngestInvoice } from '@/app/api/inventory/invoices/ingest/route';
import { POST as postCreateInvoice } from '@/app/api/inventory/invoices/route';
import { POST as postReceiveInvoice } from '@/app/api/inventory/invoices/[invoiceId]/receive/route';

vi.mock('@/lib/api/authz', () => ({
    getAuthenticatedUser: vi.fn(),
    getAuthorizedRestaurantContext: vi.fn(),
}));

vi.mock('@/lib/api/audit', () => ({
    writeAuditLog: vi.fn().mockResolvedValue({ error: null }),
}));

vi.mock('@/lib/inventory/invoiceIngestion', () => ({
    ingestInvoiceDocument: vi.fn().mockResolvedValue({
        provider: 'oss',
        raw_text: 'Demo supplier invoice text',
        confidence: 0.96,
        fields: {
            supplier_name: 'Addis Fresh Supply',
            invoice_number: 'INV-ADDIS-101',
            currency: 'ETB',
            subtotal: 600,
            tax_amount: 90,
            total_amount: 690,
        },
    }),
    getAddisInvoiceReviewPolicy: vi.fn().mockReturnValue({
        city_profile: 'addis_ababa',
        auto_receive_eligible: true,
        recommended_mode: 'auto_receive',
    }),
}));

vi.mock('@/lib/inventory/invoiceOcr', () => ({
    parseInvoiceText: vi.fn().mockReturnValue({
        draft: {
            supplier_name: 'Addis Fresh Supply',
            invoice_number: 'INV-ADDIS-101',
            currency: 'ETB',
            subtotal: 600,
            tax_amount: 90,
            total_amount: 690,
            issued_at: null,
            due_at: null,
        },
        line_items: [
            {
                description: 'Tomato Fresh',
                normalized_description: 'tomato fresh',
                qty: 5,
                unit_price: 120,
                line_total: 600,
                uom: 'kg',
                inventory_item_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                inventory_item_name: 'Tomato',
                match_confidence: 0.95,
                match_method: 'exact',
            },
        ],
        summary: {
            mapped_items: 1,
            unmapped_items: 0,
            average_match_confidence: 0.95,
        },
    }),
}));

const getAuthenticatedUserMock = vi.mocked(getAuthenticatedUser);
const getAuthorizedRestaurantContextMock = vi.mocked(getAuthorizedRestaurantContext);

type InMemoryState = {
    inventoryItems: Array<{
        id: string;
        restaurant_id: string;
        name: string;
        sku: string | null;
        uom: string;
        is_active: boolean;
        current_stock: number;
        cost_per_unit: number;
    }>;
    supplierInvoices: Array<{
        id: string;
        restaurant_id: string;
        invoice_number: string;
        supplier_name: string;
        status: string;
        currency: string;
        subtotal: number;
        tax_amount: number;
        total_amount: number;
        issued_at: string | null;
        due_at: string | null;
        paid_at: string | null;
        notes: string | null;
        metadata: Record<string, unknown>;
        created_by: string | null;
    }>;
    stockMovements: Array<{
        id: string;
        restaurant_id: string;
        inventory_item_id: string;
        movement_type: string;
        qty: number;
        unit_cost: number | null;
        reference_type: string;
        reference_id: string | null;
        metadata: Record<string, unknown>;
        created_by: string | null;
    }>;
    auditLogs: Array<Record<string, unknown>>;
    sequence: number;
};

function createUuid(sequence: number) {
    const suffix = sequence.toString(16).padStart(12, '0');
    return `bbbbbbbb-bbbb-4bbb-8bbb-${suffix}`;
}

function createInMemorySupabase(state: InMemoryState) {
    return {
        from: (table: string) => {
            if (table === 'inventory_items') {
                const filter: {
                    restaurantId?: string;
                    isActive?: boolean;
                    itemIds?: string[];
                    id?: string;
                } = {};

                const selectBuilder: any = {
                    select: () => selectBuilder,
                    eq: (field: string, value: unknown) => {
                        if (field === 'restaurant_id') filter.restaurantId = String(value);
                        if (field === 'is_active') filter.isActive = Boolean(value);
                        if (field === 'id') filter.id = String(value);
                        return selectBuilder;
                    },
                    in: (field: string, values: string[]) => {
                        if (field === 'id') filter.itemIds = values;
                        return selectBuilder;
                    },
                    limit: async () => {
                        const rows = state.inventoryItems.filter(item => {
                            if (filter.restaurantId && item.restaurant_id !== filter.restaurantId) {
                                return false;
                            }
                            if (
                                typeof filter.isActive === 'boolean' &&
                                item.is_active !== filter.isActive
                            ) {
                                return false;
                            }
                            if (filter.id && item.id !== filter.id) {
                                return false;
                            }
                            if (filter.itemIds && !filter.itemIds.includes(item.id)) {
                                return false;
                            }
                            return true;
                        });
                        return { data: rows, error: null };
                    },
                };

                const updateBuilder = (patch: Record<string, unknown>) => {
                    const updateFilter: { restaurantId?: string; id?: string } = {};
                    const chain: any = {
                        eq: (field: string, value: unknown) => {
                            if (field === 'restaurant_id')
                                updateFilter.restaurantId = String(value);
                            if (field === 'id') updateFilter.id = String(value);
                            return chain;
                        },
                        select: () => chain,
                        single: async () => {
                            const item = state.inventoryItems.find(row => {
                                if (
                                    updateFilter.restaurantId &&
                                    row.restaurant_id !== updateFilter.restaurantId
                                ) {
                                    return false;
                                }
                                if (updateFilter.id && row.id !== updateFilter.id) {
                                    return false;
                                }
                                return true;
                            });
                            if (!item) {
                                return { data: null, error: { message: 'Not found' } };
                            }
                            Object.assign(item, patch);
                            return { data: item, error: null };
                        },
                    };
                    return chain;
                };

                return {
                    ...selectBuilder,
                    update: updateBuilder,
                };
            }

            if (table === 'supplier_invoices') {
                const selectFilter: { restaurantId?: string; id?: string } = {};
                const selectBuilder: any = {
                    select: () => selectBuilder,
                    eq: (field: string, value: unknown) => {
                        if (field === 'restaurant_id') selectFilter.restaurantId = String(value);
                        if (field === 'id') selectFilter.id = String(value);
                        return selectBuilder;
                    },
                    maybeSingle: async () => {
                        const row = state.supplierInvoices.find(invoice => {
                            if (
                                selectFilter.restaurantId &&
                                invoice.restaurant_id !== selectFilter.restaurantId
                            ) {
                                return false;
                            }
                            if (selectFilter.id && invoice.id !== selectFilter.id) {
                                return false;
                            }
                            return true;
                        });
                        return { data: row ?? null, error: null };
                    },
                };

                const insertBuilder = (payload: any) => {
                    const chain: any = {
                        select: () => chain,
                        single: async () => {
                            const row = {
                                id: createUuid(++state.sequence),
                                ...payload,
                            };
                            state.supplierInvoices.push(row);
                            return { data: row, error: null };
                        },
                    };
                    return chain;
                };

                const updateBuilder = (patch: Record<string, unknown>) => {
                    const updateFilter: { restaurantId?: string; id?: string } = {};
                    const chain: any = {
                        eq: (field: string, value: unknown) => {
                            if (field === 'restaurant_id')
                                updateFilter.restaurantId = String(value);
                            if (field === 'id') updateFilter.id = String(value);
                            return chain;
                        },
                        select: () => chain,
                        single: async () => {
                            const row = state.supplierInvoices.find(invoice => {
                                if (
                                    updateFilter.restaurantId &&
                                    invoice.restaurant_id !== updateFilter.restaurantId
                                ) {
                                    return false;
                                }
                                if (updateFilter.id && invoice.id !== updateFilter.id) {
                                    return false;
                                }
                                return true;
                            });
                            if (!row) {
                                return { data: null, error: { message: 'Not found' } };
                            }
                            Object.assign(row, patch);
                            return { data: row, error: null };
                        },
                    };
                    return chain;
                };

                return {
                    ...selectBuilder,
                    insert: insertBuilder,
                    update: updateBuilder,
                };
            }

            if (table === 'stock_movements') {
                const filter: {
                    restaurantId?: string;
                    referenceType?: string;
                    referenceId?: string;
                } = {};
                const selectBuilder: any = {
                    select: () => selectBuilder,
                    eq: (field: string, value: unknown) => {
                        if (field === 'restaurant_id') filter.restaurantId = String(value);
                        if (field === 'reference_type') filter.referenceType = String(value);
                        if (field === 'reference_id') filter.referenceId = String(value);
                        return selectBuilder;
                    },
                    limit: async () => {
                        const rows = state.stockMovements.filter(movement => {
                            if (
                                filter.restaurantId &&
                                movement.restaurant_id !== filter.restaurantId
                            ) {
                                return false;
                            }
                            if (
                                filter.referenceType &&
                                movement.reference_type !== filter.referenceType
                            ) {
                                return false;
                            }
                            if (
                                filter.referenceId &&
                                movement.reference_id !== filter.referenceId
                            ) {
                                return false;
                            }
                            return true;
                        });
                        return { data: rows.slice(0, 1), error: null };
                    },
                };

                const insertBuilder = (payload: any) => {
                    const chain: any = {
                        select: () => chain,
                        single: async () => {
                            const row = {
                                id: createUuid(++state.sequence),
                                ...payload,
                            };
                            state.stockMovements.push(row);
                            return { data: row, error: null };
                        },
                    };
                    return chain;
                };

                return {
                    ...selectBuilder,
                    insert: insertBuilder,
                };
            }

            if (table === 'audit_logs') {
                return {
                    insert: async (payload: Record<string, unknown>) => {
                        state.auditLogs.push(payload);
                        return { data: null, error: null };
                    },
                };
            }

            return {};
        },
    } as any;
}

describe('Invoice receive integration flow', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('ingest -> approve -> receive updates inventory stock and writes invoice movements', async () => {
        const state: InMemoryState = {
            inventoryItems: [
                {
                    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                    restaurant_id: 'resto-1',
                    name: 'Tomato',
                    sku: 'TM-01',
                    uom: 'kg',
                    is_active: true,
                    current_stock: 10,
                    cost_per_unit: 100,
                },
            ],
            supplierInvoices: [],
            stockMovements: [],
            auditLogs: [],
            sequence: 0,
        };

        const supabase = createInMemorySupabase(state);

        getAuthenticatedUserMock.mockResolvedValue({
            ok: true,
            user: { id: 'user-1' },
        } as any);
        getAuthorizedRestaurantContextMock.mockResolvedValue({
            ok: true,
            restaurantId: 'resto-1',
            supabase,
        } as any);

        const fileLike = {
            name: 'invoice.pdf',
            type: 'application/pdf',
            size: 4,
            arrayBuffer: async () => new Uint8Array([1, 2, 3, 4]).buffer,
        };
        const ingestForm = {
            get: (key: string) => {
                if (key === 'file') return fileLike;
                if (key === 'provider') return 'auto';
                if (key === 'currency') return 'ETB';
                return null;
            },
        } as unknown as FormData;

        const ingestResponse = await postIngestInvoice({
            formData: async () => ingestForm,
        } as unknown as Request);
        const ingestBody = await ingestResponse.json();
        if (ingestResponse.status !== 200) {
            throw new Error(`Ingest failed: ${JSON.stringify(ingestBody)}`);
        }
        expect(ingestResponse.status).toBe(200);
        expect(ingestBody.data.summary.mapped_items).toBe(1);

        const createResponse = await postCreateInvoice(
            new Request('http://localhost/api/inventory/invoices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    supplier_name: ingestBody.data.draft.supplier_name,
                    invoice_number: ingestBody.data.draft.invoice_number,
                    status: 'approved',
                    currency: ingestBody.data.draft.currency,
                    subtotal: ingestBody.data.draft.subtotal,
                    tax_amount: ingestBody.data.draft.tax_amount,
                    total_amount: ingestBody.data.draft.total_amount,
                    line_items: ingestBody.data.line_items,
                    metadata: {
                        ingestion: {
                            provider_confidence: ingestBody.data.metadata.provider_confidence,
                        },
                    },
                    ocr_source: {
                        provider: ingestBody.data.metadata.provider,
                        average_match_confidence: ingestBody.data.summary.average_match_confidence,
                        parsed_at: new Date().toISOString(),
                    },
                }),
            })
        );
        expect(createResponse.status).toBe(201);
        const createBody = await createResponse.json();
        const invoiceId = createBody.data.invoice.id as string;

        const receiveResponse = await postReceiveInvoice(
            new Request(`http://localhost/api/inventory/invoices/${invoiceId}/receive`, {
                method: 'POST',
                headers: {
                    'x-idempotency-key': '11111111-1111-4111-8111-111111111111',
                },
            }),
            { params: Promise.resolve({ invoiceId }) }
        );
        expect(receiveResponse.status).toBe(200);
        const receiveBody = await receiveResponse.json();
        expect(receiveBody.data.movement_ids.length).toBe(1);
        expect(receiveBody.data.receive_summary.auto_receive_eligible).toBe(true);

        expect(state.stockMovements.length).toBe(1);
        expect(state.stockMovements[0].reference_type).toBe('invoice');
        expect(state.stockMovements[0].reference_id).toBe(invoiceId);
        expect(state.inventoryItems[0].current_stock).toBe(15);
    }, 20000);

    it('stores receive exceptions and keeps invoice in review queue when confidence is low', async () => {
        const state: InMemoryState = {
            inventoryItems: [
                {
                    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                    restaurant_id: 'resto-1',
                    name: 'Tomato',
                    sku: 'TM-01',
                    uom: 'kg',
                    is_active: true,
                    current_stock: 10,
                    cost_per_unit: 100,
                },
            ],
            supplierInvoices: [],
            stockMovements: [],
            auditLogs: [],
            sequence: 0,
        };

        const supabase = createInMemorySupabase(state);
        getAuthenticatedUserMock.mockResolvedValue({
            ok: true,
            user: { id: 'user-1' },
        } as any);
        getAuthorizedRestaurantContextMock.mockResolvedValue({
            ok: true,
            restaurantId: 'resto-1',
            supabase,
        } as any);

        const createResponse = await postCreateInvoice(
            new Request('http://localhost/api/inventory/invoices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    supplier_name: 'Low Confidence Supplier',
                    status: 'approved',
                    currency: 'ETB',
                    subtotal: 400,
                    tax_amount: 60,
                    total_amount: 460,
                    line_items: [
                        {
                            description: 'Unknown Chili',
                            qty: 4,
                            unit_price: 100,
                            line_total: 400,
                            inventory_item_id: null,
                            match_confidence: 0.42,
                            match_method: 'none',
                        },
                    ],
                    metadata: {
                        ingestion: {
                            provider_confidence: 0.6,
                        },
                    },
                    ocr_source: {
                        provider: 'oss',
                        average_match_confidence: 0.42,
                        parsed_at: new Date().toISOString(),
                    },
                }),
            })
        );
        expect(createResponse.status).toBe(201);
        const createBody = await createResponse.json();
        const invoiceId = createBody.data.invoice.id as string;

        const receiveResponse = await postReceiveInvoice(
            new Request(`http://localhost/api/inventory/invoices/${invoiceId}/receive`, {
                method: 'POST',
                headers: {
                    'x-idempotency-key': '22222222-2222-4222-8222-222222222222',
                },
            }),
            { params: Promise.resolve({ invoiceId }) }
        );

        expect(receiveResponse.status).toBe(202);
        const receiveBody = await receiveResponse.json();
        expect(receiveBody.data.queued_for_review).toBe(true);
        expect(receiveBody.data.receive_exceptions.length).toBeGreaterThan(0);

        expect(state.stockMovements.length).toBe(0);
        expect(state.inventoryItems[0].current_stock).toBe(10);
        expect(state.supplierInvoices[0].status).toBe('pending_review');
        const persistedMetadata = state.supplierInvoices[0].metadata as Record<string, any>;
        expect(Array.isArray(persistedMetadata.receive_exceptions)).toBe(true);
        expect(persistedMetadata.receive_exceptions.length).toBeGreaterThan(0);
    });
});
