import { describe, expect, it } from 'vitest';
import {
    createNoopPeripheralAdapter,
    HardwareAbstractionRegistry,
} from '@/lib/devices/hardware-abstraction';

describe('hardware abstraction registry', () => {
    it('resolves scanner, cash drawer, and customer display handlers without domain coupling', async () => {
        const registry = new HardwareAbstractionRegistry();
        registry.register(
            createNoopPeripheralAdapter({ kind: 'scanner', driverKind: 'mock-scan' })
        );
        registry.register(
            createNoopPeripheralAdapter({ kind: 'cash_drawer', driverKind: 'mock-drawer' })
        );
        registry.register(
            createNoopPeripheralAdapter({ kind: 'customer_display', driverKind: 'mock-display' })
        );

        const scanner = registry.resolve({
            peripheralId: 'scan-1',
            kind: 'scanner',
            driverKind: 'mock-scan',
            label: 'Scanner',
        });
        const drawer = registry.resolve({
            peripheralId: 'drawer-1',
            kind: 'cash_drawer',
            driverKind: 'mock-drawer',
            label: 'Drawer',
        });
        const display = registry.resolve({
            peripheralId: 'display-1',
            kind: 'customer_display',
            driverKind: 'mock-display',
            label: 'Display',
        });

        expect((await scanner?.read())?.code).toBe('noop-scan');
        expect((await drawer?.open())?.ok).toBe(true);
        expect(
            (await display?.render({ title: 'Due', lines: ['Table 7'], totalAmount: 120 }))?.ok
        ).toBe(true);
    });
});
