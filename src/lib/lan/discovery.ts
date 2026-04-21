import type { StoreGatewayConfig } from '@/lib/gateway/config';

export interface GatewayDiscoveryRecord {
    gatewayId: string;
    restaurantId: string;
    locationId: string;
    brokerUrl: string;
    healthPort: number;
    transport: 'mqtt';
    capabilities: Array<'orders' | 'kds' | 'tables' | 'printers' | 'fiscal'>;
    advertisedAt: string;
}

export function buildGatewayDiscoveryRecord(config: StoreGatewayConfig): GatewayDiscoveryRecord {
    return {
        gatewayId: config.gatewayId,
        restaurantId: config.restaurantId,
        locationId: config.locationId,
        brokerUrl: config.mqttBrokerUrl,
        healthPort: config.healthPort,
        transport: 'mqtt',
        capabilities: ['orders', 'kds', 'tables', 'printers', 'fiscal'],
        advertisedAt: new Date().toISOString(),
    };
}

export function serializeGatewayDiscoveryRecord(record: GatewayDiscoveryRecord): string {
    return JSON.stringify(record);
}

export function parseGatewayDiscoveryRecord(raw: string): GatewayDiscoveryRecord | null {
    try {
        const parsed = JSON.parse(raw) as GatewayDiscoveryRecord;
        if (
            typeof parsed.gatewayId !== 'string' ||
            typeof parsed.restaurantId !== 'string' ||
            typeof parsed.locationId !== 'string' ||
            typeof parsed.brokerUrl !== 'string' ||
            typeof parsed.healthPort !== 'number'
        ) {
            return null;
        }

        return parsed;
    } catch {
        return null;
    }
}
