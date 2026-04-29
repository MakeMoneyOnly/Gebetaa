import { describe, expect, it, vi } from 'vitest';
import {
    createLanMqttClient,
    publishJson,
    registerLanMessageHandler,
    subscribeTopic,
    closeLanMqttClient,
} from '../mqtt-client';
import mqtt from 'mqtt';

vi.mock('mqtt', () => {
    const mockClient = {
        on: vi.fn(),
        publish: vi.fn((topic, message, options, cb) => cb(null)),
        subscribe: vi.fn((topic, options, cb) => cb(null, [{ topic, qos: options.qos }])),
        end: vi.fn((force, options, cb) => cb(null)),
    };
    return {
        default: {
            connect: vi.fn(() => mockClient),
        },
    };
});

describe('mqtt-client', () => {
    it('creates client and sets up listeners', () => {
        const client = createLanMqttClient({
            brokerUrl: 'mqtt://localhost:1883',
            clientId: 'test-client',
        });

        expect(mqtt.connect).toHaveBeenCalledWith('mqtt://localhost:1883', expect.any(Object));
        expect(client.on).toHaveBeenCalledWith('connect', expect.any(Function));
        expect(client.on).toHaveBeenCalledWith('reconnect', expect.any(Function));
        expect(client.on).toHaveBeenCalledWith('error', expect.any(Function));
    });

    it('publishes json payload', async () => {
        const client = mqtt.connect('dummy');
        const payload = { test: 'data' };

        await publishJson(client, 'test/topic', payload);

        expect(client.publish).toHaveBeenCalledWith(
            'test/topic',
            JSON.stringify(payload),
            expect.objectContaining({ qos: 1, retain: false }),
            expect.any(Function)
        );
    });

    it('registers message handler', () => {
        const client = mqtt.connect('dummy');
        const handler = vi.fn();

        registerLanMessageHandler(client, handler);

        expect(client.on).toHaveBeenCalledWith('message', handler);
    });

    it('subscribes to topic', async () => {
        const client = mqtt.connect('dummy');

        const granted = await subscribeTopic(client, 'test/topic', 2);

        expect(client.subscribe).toHaveBeenCalledWith(
            'test/topic',
            { qos: 2 },
            expect.any(Function)
        );
        expect(granted).toEqual([{ topic: 'test/topic', qos: 2 }]);
    });

    it('closes client', async () => {
        const client = mqtt.connect('dummy');

        await closeLanMqttClient(client);

        expect(client.end).toHaveBeenCalledWith(false, {}, expect.any(Function));
    });
});
