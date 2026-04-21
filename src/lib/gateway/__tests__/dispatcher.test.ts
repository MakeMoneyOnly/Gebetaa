import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    dispatchGatewayDomainCommand,
    isDispatchableDomainCommand,
} from '@/lib/gateway/dispatcher';

const mockPublishCommand = vi.fn().mockResolvedValue(undefined);

vi.mock('@/lib/gateway/service', () => ({
    getStoreGatewayService: vi.fn(() => ({
        publishCommand: mockPublishCommand,
    })),
}));

describe('gateway dispatcher', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('detects dispatchable command shape', () => {
        expect(
            isDispatchableDomainCommand({
                type: 'order.create',
                aggregate: 'order',
                aggregateId: 'order-1',
                payload: {},
                restaurantId: 'rest-1',
                locationId: 'loc-1',
            })
        ).toBe(true);
    });

    it('dispatches command through gateway service', async () => {
        await dispatchGatewayDomainCommand({
            type: 'order.create',
            aggregate: 'order',
            aggregateId: 'order-1',
            payload: {},
            restaurantId: 'rest-1',
            locationId: 'loc-1',
        });

        expect(mockPublishCommand).toHaveBeenCalledOnce();
    });
});
