import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
    mockMqttClient,
    mockCreateLanMqttClient,
    mockSubscribeTopic,
    mockCloseLanMqttClient,
    mockRegisterLanMessageHandler,
    mockGetStoredDeviceSession,
} = vi.hoisted(() => {
    const mqttClient = {
        on: vi.fn(),
    };

    return {
        mockMqttClient: mqttClient,
        mockCreateLanMqttClient: vi.fn(() => mqttClient),
        mockSubscribeTopic: vi.fn().mockResolvedValue([{ qos: 1 }]),
        mockCloseLanMqttClient: vi.fn().mockResolvedValue(undefined),
        mockRegisterLanMessageHandler: vi.fn((client, handler) => {
            client.on('message', handler);
        }),
        mockGetStoredDeviceSession: vi.fn(),
    };
});

vi.mock('@/lib/lan/mqtt-client', () => ({
    createLanMqttClient: mockCreateLanMqttClient,
    subscribeTopic: mockSubscribeTopic,
    closeLanMqttClient: mockCloseLanMqttClient,
    registerLanMessageHandler: mockRegisterLanMessageHandler,
}));

vi.mock('@/lib/mobile/device-storage', () => ({
    getStoredDeviceSession: mockGetStoredDeviceSession,
}));

import { useTableSessionRealtime } from '../useTableSessionRealtime';

describe('useTableSessionRealtime', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGetStoredDeviceSession.mockResolvedValue({
            restaurant_id: 'rest-1',
            location_id: 'loc-1',
            device_token: 'device-1',
            gateway_bootstrap_status: 'ready',
            gateway: {
                brokerUrl: 'ws://127.0.0.1:1884/mqtt',
            },
        });
    });

    it('subscribes to local tables topic and emits deduped events', async () => {
        const onEvent = vi.fn();

        renderHook(() =>
            useTableSessionRealtime({
                restaurantId: 'rest-1',
                enabled: true,
                onEvent,
            })
        );

        await waitFor(() => {
            expect(mockCreateLanMqttClient).toHaveBeenCalledOnce();
        });

        expect(mockSubscribeTopic).toHaveBeenCalledWith(
            mockMqttClient,
            expect.stringContaining('/tables/commands'),
            1
        );

        const handler = mockMqttClient.on.mock.calls.find(call => call[0] === 'message')?.[1] as
            | ((topic: string, payload: Uint8Array) => void)
            | undefined;

        expect(handler).toBeDefined();

        act(() => {
            handler?.(
                'lole/v1/restaurants/rest-1/locations/loc-1/tables/commands',
                Buffer.from(
                    JSON.stringify({
                        schema: 'lole.gateway.lan-event',
                        schemaVersion: 1,
                        messageId: 'msg-1',
                        sequence: 4,
                        aggregate: 'table',
                        aggregateId: 'table-1',
                        type: 'table.update',
                        payload: {
                            table_id: 'table-1',
                            guest_count: 4,
                            notes: 'VIP',
                        },
                    })
                )
            );
        });

        act(() => {
            handler?.(
                'lole/v1/restaurants/rest-1/locations/loc-1/tables/commands',
                Buffer.from(
                    JSON.stringify({
                        schema: 'lole.gateway.lan-event',
                        schemaVersion: 1,
                        messageId: 'msg-1',
                        sequence: 4,
                        aggregate: 'table',
                        aggregateId: 'table-1',
                        type: 'table.update',
                        payload: {
                            table_id: 'table-1',
                            guest_count: 4,
                            notes: 'VIP',
                        },
                    })
                )
            );
        });

        expect(onEvent).toHaveBeenCalledTimes(1);
        expect(onEvent).toHaveBeenCalledWith({
            type: 'table.update',
            tableId: 'table-1',
            guestCount: 4,
            assignedStaffId: null,
            notes: 'VIP',
        });
    });
});
