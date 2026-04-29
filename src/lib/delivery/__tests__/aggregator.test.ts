import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
    normalizeDeliveryPartnerName,
    buildAggregatorOrderLanEvent,
    AggregatorService,
    getActivePartners,
    registerPartner,
    receiveExternalOrder,
    injectAggregatorOrder,
    getPendingAggregatorOrders,
    updateAggregatorOrderStatus,
    syncMenuToPartners,
    getMenuSyncHistory,
} from '../aggregator';

describe('delivery/aggregator', () => {
    describe('normalizeDeliveryPartnerName', () => {
        it('normalizes partner names correctly', () => {
            expect(normalizeDeliveryPartnerName('beu')).toBe('beu');
            expect(normalizeDeliveryPartnerName('betengna')).toBe('beu');
            expect(normalizeDeliveryPartnerName('zmall')).toBe('zmall');
            expect(normalizeDeliveryPartnerName('telebirr')).toBe('telebirr_food');
            expect(normalizeDeliveryPartnerName('telebirr_food')).toBe('telebirr_food');
            expect(normalizeDeliveryPartnerName('deliver_addis')).toBe('deliver_addis');
            expect(normalizeDeliveryPartnerName('custom')).toBe('custom');
            expect(normalizeDeliveryPartnerName('something else')).toBe('other');
        });
    });

    describe('buildAggregatorOrderLanEvent', () => {
        it('builds a gateway LAN event', () => {
            const order: any = {
                id: 'order-1',
                restaurant_id: 'resto-1',
                delivery_partner_id: 'partner-1',
                external_order_id: 'ext-1',
                total: 150,
                status: 'pending',
            };
            const event = buildAggregatorOrderLanEvent(order, 'loc-1');

            expect(event.type).toBe('delivery.aggregator.order.received');
            expect(event.aggregate).toBe('aggregator_order');
            expect(event.aggregateId).toBe('order-1');
            expect(event.payload).toEqual(
                expect.objectContaining({
                    aggregator_order_id: 'order-1',
                    total: 150,
                })
            );
        });
    });

    describe('AggregatorService', () => {
        it('receives and broadcasts order', async () => {
            const mockReceive = vi.fn().mockResolvedValue({
                success: true,
                order: {
                    id: 'order-1',
                    restaurant_id: 'r1',
                    delivery_partner_id: 'p1',
                    total: 100,
                },
            });
            const mockLocal = vi.fn();
            const mockCloud = vi.fn();

            const service = new AggregatorService({
                receiveOrder: mockReceive,
                publishLocalEvent: mockLocal,
                publishCloudEvent: mockCloud,
            });

            const result = await service.receiveAndBroadcastOrder({} as any, 'r1', 'p1', {} as any);

            expect(result.success).toBe(true);
            expect(mockReceive).toHaveBeenCalled();
            expect(mockLocal).toHaveBeenCalled();
            expect(mockCloud).toHaveBeenCalledWith(
                'delivery.aggregator.received',
                expect.any(Object)
            );
        });
    });

    describe('Supabase Database Functions', () => {
        let mockSupabase: any;
        let mockChain: any;

        beforeEach(() => {
            mockChain = {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                insert: vi.fn().mockReturnThis(),
                update: vi.fn().mockReturnThis(),
                in: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                limit: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: {}, error: null }),
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            };
            // Make the chain thenable so awaiting it returns data/error
            mockChain.then = function (resolve: any) {
                resolve({ data: this._mockData || [], error: this._mockError || null });
            };

            mockSupabase = {
                from: vi.fn().mockReturnValue(mockChain),
                rpc: vi.fn().mockResolvedValue({ data: { success: true }, error: null }),
            };
        });

        it('getActivePartners', async () => {
            mockChain._mockData = [{ id: '1' }];
            const partners = await getActivePartners(mockSupabase, 'r1');
            expect(partners).toHaveLength(1);
        });

        it('registerPartner', async () => {
            mockChain.single.mockResolvedValueOnce({ data: { id: '1' }, error: null });
            const result = await registerPartner(mockSupabase, 'r1', {
                partner_name: 'beu',
                display_name: 'Beu',
            });
            expect(result.success).toBe(true);
        });

        it('receiveExternalOrder', async () => {
            mockChain.maybeSingle.mockResolvedValueOnce({ data: null, error: null }); // no existing
            mockChain.single.mockResolvedValueOnce({ data: { id: 'order-1' }, error: null }); // inserted
            mockChain.single.mockResolvedValueOnce({
                data: { auto_accept_orders: false },
                error: null,
            }); // partner

            const result = await receiveExternalOrder(mockSupabase, 'r1', 'p1', {
                external_order_id: 'ext-1',
                raw_order_data: {},
                items: [],
                subtotal: 100,
                total: 100,
            });

            expect(result.success).toBe(true);
        });

        it('injectAggregatorOrder', async () => {
            const result = await injectAggregatorOrder(mockSupabase, 'agg-order-1');
            expect(result.success).toBe(true);
            expect(mockSupabase.rpc).toHaveBeenCalledWith(
                'inject_aggregator_order',
                expect.any(Object)
            );
        });

        it('getPendingAggregatorOrders', async () => {
            mockChain._mockData = [{ id: 'o1' }];
            const orders = await getPendingAggregatorOrders(mockSupabase, 'r1');
            expect(orders).toHaveLength(1);
        });

        it('updateAggregatorOrderStatus', async () => {
            mockChain._mockError = null;
            const result = await updateAggregatorOrderStatus(mockSupabase, 'r1', 'o1', 'accepted');
            expect(result.success).toBe(true);
        });

        it('syncMenuToPartners', async () => {
            // Mock chain needs to return different values for different queries
            const mockChainPartners = {
                ...mockChain,
                _mockData: [{ id: 'p1', display_name: 'p1' }],
            };
            mockChainPartners.then = function (resolve: any) {
                resolve({ data: this._mockData, error: null });
            };

            const mockChainItems = { ...mockChain, _mockData: [{ id: 'm1' }] };
            mockChainItems.then = function (resolve: any) {
                resolve({ data: this._mockData, error: null });
            };

            const mockChainLogInsert = { ...mockChain };
            mockChainLogInsert.single = vi
                .fn()
                .mockResolvedValue({ data: { id: 'log1' }, error: null });

            const mockChainUpdate = { ...mockChain };
            mockChainUpdate.then = function (resolve: any) {
                resolve({ error: null });
            };

            mockSupabase.from.mockImplementation((table: string) => {
                if (table === 'delivery_partners') return mockChainPartners;
                if (table === 'menu_items') return mockChainItems;
                if (table === 'menu_sync_logs') return mockChainLogInsert;
                return mockChain;
            });

            const result = await syncMenuToPartners(mockSupabase, 'r1');
            expect(result.success).toBe(true);
        });

        it('getMenuSyncHistory', async () => {
            mockChain._mockData = [{ id: 'log1' }];
            const history = await getMenuSyncHistory(mockSupabase, 'r1');
            expect(history).toHaveLength(1);
        });
    });
});
