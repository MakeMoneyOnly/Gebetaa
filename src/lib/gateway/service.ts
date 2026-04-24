import { logger } from '@/lib/logger';
import {
    closeLanMqttClient,
    createLanMqttClient,
    publishJson,
    registerLanMessageHandler,
    subscribeTopic,
    type MqttTransportConfig,
} from '@/lib/lan/mqtt-client';
import {
    buildGatewayDiscoveryTopic,
    buildGatewayModeTopic,
    buildRestaurantTopic,
    type MqttScope,
} from '@/lib/lan/mqtt-topics';
import { toGatewayLanEvent } from '@/lib/gateway/local-events';
import { buildGatewayDiscoveryRecord } from '@/lib/lan/discovery';
import {
    buildGatewayHealthSnapshot,
    getStoreGatewayConfig,
    type GatewayHealthSnapshot,
    type StoreGatewayConfig,
    type StoreOperatingMode,
} from '@/lib/gateway/config';
import type { MqttClient } from 'mqtt';

export interface GatewayCommandMessage {
    type: string;
    aggregate: string;
    aggregateId: string;
    payload: Record<string, unknown>;
    restaurantId: string;
    locationId: string;
}

type GatewayHandler = (message: GatewayCommandMessage) => Promise<void> | void;

function buildTransportConfig(config: StoreGatewayConfig): MqttTransportConfig {
    return {
        brokerUrl: config.mqttBrokerUrl,
        clientId: config.gatewayId,
        clean: false,
    };
}

function resolveScopeForCommand(type: string): MqttScope {
    if (type.startsWith('order.')) return 'orders';
    if (type.startsWith('kds.')) return 'kds';
    if (type.startsWith('table.')) return 'tables';
    if (type.startsWith('printer.')) return 'printers';
    if (type.startsWith('fiscal.')) return 'fiscal';
    return 'system';
}

export class StoreGatewayService {
    private readonly config: StoreGatewayConfig;
    private client: MqttClient | null = null;
    private readonly handlers = new Map<string, GatewayHandler>();
    private currentMode: StoreOperatingMode;
    private readonly sequenceByAggregate = new Map<string, number>();

    constructor(config?: StoreGatewayConfig | null) {
        const resolvedConfig = config ?? getStoreGatewayConfig();
        if (!resolvedConfig) {
            throw new Error('Store gateway config missing');
        }

        this.config = resolvedConfig;
        this.currentMode = resolvedConfig.defaultOperatingMode;
    }

    async start(): Promise<void> {
        if (this.client) {
            return;
        }

        this.client = createLanMqttClient(buildTransportConfig(this.config));
        const topics = [
            buildRestaurantTopic({
                restaurantId: this.config.restaurantId,
                locationId: this.config.locationId,
                scope: 'orders',
                channel: 'commands',
            }),
            buildRestaurantTopic({
                restaurantId: this.config.restaurantId,
                locationId: this.config.locationId,
                scope: 'kds',
                channel: 'commands',
            }),
            buildRestaurantTopic({
                restaurantId: this.config.restaurantId,
                locationId: this.config.locationId,
                scope: 'tables',
                channel: 'commands',
            }),
            buildRestaurantTopic({
                restaurantId: this.config.restaurantId,
                locationId: this.config.locationId,
                scope: 'printers',
                channel: 'jobs',
            }),
            buildRestaurantTopic({
                restaurantId: this.config.restaurantId,
                locationId: this.config.locationId,
                scope: 'fiscal',
                channel: 'jobs',
            }),
        ];

        for (const topic of topics) {
            await subscribeTopic(this.client, topic, 1);
        }

        registerLanMessageHandler(this.client, (_topic, raw) => {
            try {
                const parsed = JSON.parse(String(raw)) as
                    | GatewayCommandMessage
                    | { type: string; payload: Record<string, unknown> };
                const commandLike =
                    'schema' in (parsed as Record<string, unknown>)
                        ? (parsed as { type: string; payload: Record<string, unknown> })
                        : (parsed as GatewayCommandMessage);
                const handler = this.handlers.get(commandLike.type);
                if (handler) {
                    void handler(commandLike as GatewayCommandMessage);
                }
            } catch (error) {
                logger.error('[Gateway] Failed to process command message', error);
            }
        });

        await this.publishMode(this.currentMode);
        await this.publishDiscovery();
    }

    registerHandler(type: string, handler: GatewayHandler): void {
        this.handlers.set(type, handler);
    }

    async publishCommand(message: GatewayCommandMessage): Promise<void> {
        if (!this.client) {
            await this.start();
        }

        if (!this.client) {
            throw new Error('Gateway MQTT client unavailable');
        }

        const aggregateKey = `${message.aggregate}:${message.aggregateId}`;
        const nextSequence = (this.sequenceByAggregate.get(aggregateKey) ?? 0) + 1;
        this.sequenceByAggregate.set(aggregateKey, nextSequence);

        const topic = buildRestaurantTopic({
            restaurantId: message.restaurantId,
            locationId: message.locationId,
            scope: resolveScopeForCommand(message.type),
            channel:
                message.type.startsWith('printer.') || message.type.startsWith('fiscal.')
                    ? 'jobs'
                    : 'commands',
        });

        await publishJson(this.client, topic, toGatewayLanEvent(message, nextSequence), { qos: 1 });
    }

    async publishMode(mode: StoreOperatingMode): Promise<void> {
        this.currentMode = mode;

        if (!this.client) {
            return;
        }

        await publishJson(
            this.client,
            buildGatewayModeTopic(this.config.restaurantId, this.config.locationId),
            buildGatewayHealthSnapshot(this.config, mode),
            { qos: 0, retain: true }
        );
    }

    async publishDiscovery(): Promise<void> {
        if (!this.client) {
            return;
        }

        await publishJson(
            this.client,
            buildGatewayDiscoveryTopic(this.config.restaurantId, this.config.locationId),
            buildGatewayDiscoveryRecord(this.config),
            { qos: 0, retain: true }
        );
    }

    getHealth(): GatewayHealthSnapshot {
        return buildGatewayHealthSnapshot(this.config, this.currentMode);
    }

    async stop(): Promise<void> {
        if (!this.client) {
            return;
        }

        await closeLanMqttClient(this.client);
        this.client = null;
    }
}

let gatewayService: StoreGatewayService | null = null;

export function getStoreGatewayService(): StoreGatewayService | null {
    if (gatewayService) {
        return gatewayService;
    }

    const config = getStoreGatewayConfig();
    if (!config) {
        return null;
    }

    gatewayService = new StoreGatewayService(config);
    return gatewayService;
}
