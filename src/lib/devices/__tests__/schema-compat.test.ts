import { describe, expect, it } from 'vitest';
import {
    isEnterpriseDeviceSchemaError,
    readEnterpriseShellMetadata,
    mergeEnterpriseShellMetadata,
    hydrateEnterpriseDeviceRecord,
} from '@/lib/devices/schema-compat';

describe('schema-compat', () => {
    describe('isEnterpriseDeviceSchemaError', () => {
        it('should detect device_profile error', () => {
            expect(isEnterpriseDeviceSchemaError('column device_profile does not exist')).toBe(
                true
            );
        });

        it('should detect pairing_state error', () => {
            expect(isEnterpriseDeviceSchemaError('pairing_state column missing')).toBe(true);
        });

        it('should detect management_provider error', () => {
            expect(isEnterpriseDeviceSchemaError('management_provider not found')).toBe(true);
        });

        it('should detect schema cache error', () => {
            expect(isEnterpriseDeviceSchemaError('schema cache is stale')).toBe(true);
        });

        it('should return false for unrelated messages', () => {
            expect(isEnterpriseDeviceSchemaError('connection timeout')).toBe(false);
        });

        it('should return false for null', () => {
            expect(isEnterpriseDeviceSchemaError(null)).toBe(false);
        });

        it('should return false for undefined', () => {
            expect(isEnterpriseDeviceSchemaError(undefined)).toBe(false);
        });

        it('should return false for empty string', () => {
            expect(isEnterpriseDeviceSchemaError('')).toBe(false);
        });

        it('should detect ota_status error', () => {
            expect(isEnterpriseDeviceSchemaError('ota_status column missing')).toBe(true);
        });

        it('should detect fiscal_mode error', () => {
            expect(isEnterpriseDeviceSchemaError('fiscal_mode not found')).toBe(true);
        });
    });

    describe('readEnterpriseShellMetadata', () => {
        it('should return defaults for null metadata', () => {
            const result = readEnterpriseShellMetadata(null);
            expect(result.device_profile).toBe('waiter'); // resolveDeviceProfile('pos') → 'waiter'
            expect(result.pairing_state).toBe('ready');
            expect(result.management_provider).toBe('none');
            expect(result.management_status).toBe('unmanaged');
            expect(result.location_id).toBeNull();
        });

        it('should return defaults for undefined metadata', () => {
            const result = readEnterpriseShellMetadata(undefined);
            expect(result.device_profile).toBe('waiter');
        });

        it('should read valid enterprise_shell data', () => {
            const result = readEnterpriseShellMetadata({
                enterprise_shell: {
                    device_profile: 'kds',
                    pairing_state: 'paired',
                    location_id: 'loc-1',
                    pairing_code_expires_at: '2025-01-01T00:00:00Z',
                    pairing_completed_at: '2024-12-01T00:00:00Z',
                    management_provider: 'esper',
                    management_status: 'managed',
                    management_device_id: 'dev-1',
                    hardware_fingerprint: 'fp-123',
                },
            });

            expect(result.device_profile).toBe('kds');
            expect(result.pairing_state).toBe('paired');
            expect(result.location_id).toBe('loc-1');
            expect(result.management_provider).toBe('esper');
            expect(result.management_status).toBe('managed');
            expect(result.management_device_id).toBe('dev-1');
            expect(result.hardware_fingerprint).toBe('fp-123');
        });

        it('should default pairing_state for invalid values', () => {
            const result = readEnterpriseShellMetadata({
                enterprise_shell: {
                    pairing_state: 'invalid_state',
                },
            });
            expect(result.pairing_state).toBe('ready');
        });

        it('should accept all valid pairing_state values', () => {
            for (const state of ['ready', 'paired', 'revoked', 'expired'] as const) {
                const result = readEnterpriseShellMetadata({
                    enterprise_shell: { pairing_state: state },
                });
                expect(result.pairing_state).toBe(state);
            }
        });

        it('should default management_provider for invalid values', () => {
            const result = readEnterpriseShellMetadata({
                enterprise_shell: {
                    management_provider: 'invalid',
                },
            });
            expect(result.management_provider).toBe('none');
        });

        it('should accept valid management_provider values', () => {
            const result = readEnterpriseShellMetadata({
                enterprise_shell: { management_provider: 'none' },
            });
            expect(result.management_provider).toBe('none');
        });

        it('should default management_status for invalid values', () => {
            const result = readEnterpriseShellMetadata({
                enterprise_shell: {
                    management_status: 'invalid',
                },
            });
            expect(result.management_status).toBe('unmanaged');
        });

        it('should accept all valid management_status values', () => {
            for (const status of ['managed', 'pending', 'error', 'unmanaged'] as const) {
                const result = readEnterpriseShellMetadata({
                    enterprise_shell: { management_status: status },
                });
                expect(result.management_status).toBe(status);
            }
        });

        it('should handle non-string location_id', () => {
            const result = readEnterpriseShellMetadata({
                enterprise_shell: { location_id: 123 },
            });
            expect(result.location_id).toBeNull();
        });

        it('should handle empty string location_id', () => {
            const result = readEnterpriseShellMetadata({
                enterprise_shell: { location_id: '  ' },
            });
            expect(result.location_id).toBeNull();
        });

        it('should handle non-string pairing_code_expires_at', () => {
            const result = readEnterpriseShellMetadata({
                enterprise_shell: { pairing_code_expires_at: 12345 },
            });
            expect(result.pairing_code_expires_at).toBeNull();
        });

        it('should handle non-string pairing_completed_at', () => {
            const result = readEnterpriseShellMetadata({
                enterprise_shell: { pairing_completed_at: true },
            });
            expect(result.pairing_completed_at).toBeNull();
        });

        it('should handle non-string management_device_id', () => {
            const result = readEnterpriseShellMetadata({
                enterprise_shell: { management_device_id: 999 },
            });
            expect(result.management_device_id).toBeNull();
        });

        it('should handle non-string hardware_fingerprint', () => {
            const result = readEnterpriseShellMetadata({
                enterprise_shell: { hardware_fingerprint: null },
            });
            expect(result.hardware_fingerprint).toBeNull();
        });

        it('should use deviceType to resolve profile when invalid', () => {
            const result = readEnterpriseShellMetadata(
                { enterprise_shell: { device_profile: 'invalid' } },
                'kds'
            );
            expect(result.device_profile).toBe('kds');
        });

        it('should use default deviceType when not provided', () => {
            const result = readEnterpriseShellMetadata({
                enterprise_shell: { device_profile: 'invalid' },
            });
            expect(result.device_profile).toBe('waiter'); // resolveDeviceProfile('pos') → 'waiter'
        });
    });

    describe('mergeEnterpriseShellMetadata', () => {
        it('should merge shell data into existing metadata', () => {
            const result = mergeEnterpriseShellMetadata(
                { existing_key: 'value' },
                { pairing_state: 'paired', device_profile: 'kds' }
            );

            expect(result.existing_key).toBe('value');
            const shell = result.enterprise_shell as Record<string, unknown>;
            expect(shell.pairing_state).toBe('paired');
            expect(shell.device_profile).toBe('kds');
        });

        it('should create enterprise_shell when metadata is undefined', () => {
            const result = mergeEnterpriseShellMetadata(undefined, {
                pairing_state: 'ready',
            });

            const shell = result.enterprise_shell as Record<string, unknown>;
            expect(shell.pairing_state).toBe('ready');
        });

        it('should preserve existing enterprise_shell fields', () => {
            const result = mergeEnterpriseShellMetadata(
                { enterprise_shell: { pairing_state: 'ready' } },
                { device_profile: 'kds' }
            );

            const shell = result.enterprise_shell as Record<string, unknown>;
            expect(shell.pairing_state).toBe('ready');
            expect(shell.device_profile).toBe('kds');
        });

        it('should filter out undefined values from shell', () => {
            const result = mergeEnterpriseShellMetadata(
                {},
                {
                    pairing_state: 'paired',
                    location_id: undefined,
                }
            );

            const shell = result.enterprise_shell as Record<string, unknown>;
            expect(shell.pairing_state).toBe('paired');
            expect(shell).not.toHaveProperty('location_id');
        });
    });

    describe('hydrateEnterpriseDeviceRecord', () => {
        it('should hydrate with defaults for empty record', () => {
            const result = hydrateEnterpriseDeviceRecord({});
            expect(result.device_profile).toBe('waiter'); // resolveDeviceProfile('pos')
            expect(result.pairing_state).toBe('ready');
            expect(result.management_provider).toBe('none');
            expect(result.location_id).toBeNull();
            expect(result.pairing_code_expires_at).toBeNull();
            expect(result.pairing_completed_at).toBeNull();
            expect(result.management_device_id).toBeNull();
        });

        it('should use valid device_type terminal', () => {
            const result = hydrateEnterpriseDeviceRecord({ device_type: 'terminal' });
            expect(result.device_profile).toBe('cashier'); // resolveDeviceProfile('terminal')
        });

        it('should use valid device_type kds', () => {
            const result = hydrateEnterpriseDeviceRecord({ device_type: 'kds' });
            expect(result.device_profile).toBe('kds');
        });

        it('should use valid device_type kiosk', () => {
            const result = hydrateEnterpriseDeviceRecord({ device_type: 'kiosk' });
            expect(result.device_profile).toBe('kiosk');
        });

        it('should use valid device_type digital_menu', () => {
            const result = hydrateEnterpriseDeviceRecord({ device_type: 'digital_menu' });
            expect(result.device_profile).toBe('waiter'); // resolveDeviceProfile('digital_menu') → default → 'waiter'
        });

        it('should default device_type to pos for unknown type', () => {
            const result = hydrateEnterpriseDeviceRecord({ device_type: 'unknown' });
            expect(result.device_profile).toBe('waiter'); // resolveDeviceProfile('pos')
        });

        it('should use valid device_profile from record', () => {
            const result = hydrateEnterpriseDeviceRecord({ device_profile: 'cashier' });
            expect(result.device_profile).toBe('cashier');
        });

        it('should use valid pairing_state from record', () => {
            const result = hydrateEnterpriseDeviceRecord({ pairing_state: 'paired' });
            expect(result.pairing_state).toBe('paired');
        });

        it('should use valid pairing_state expired from record', () => {
            const result = hydrateEnterpriseDeviceRecord({ pairing_state: 'expired' });
            expect(result.pairing_state).toBe('expired');
        });

        it('should use valid pairing_state revoked from record', () => {
            const result = hydrateEnterpriseDeviceRecord({ pairing_state: 'revoked' });
            expect(result.pairing_state).toBe('revoked');
        });

        it('should fall back to metadata pairing_state for invalid record value', () => {
            const result = hydrateEnterpriseDeviceRecord({
                pairing_state: 'invalid',
                metadata: { enterprise_shell: { pairing_state: 'ready' } },
            });
            expect(result.pairing_state).toBe('ready');
        });

        it('should use valid management_provider from record', () => {
            const result = hydrateEnterpriseDeviceRecord({ management_provider: 'esper' });
            expect(result.management_provider).toBe('esper');
        });

        it('should use valid management_provider none from record', () => {
            const result = hydrateEnterpriseDeviceRecord({ management_provider: 'none' });
            expect(result.management_provider).toBe('none');
        });

        it('should fall back to metadata management_provider for invalid record value', () => {
            const result = hydrateEnterpriseDeviceRecord({
                management_provider: 'invalid',
                metadata: { enterprise_shell: { management_provider: 'none' } },
            });
            expect(result.management_provider).toBe('none');
        });

        it('should use record location_id when present', () => {
            const result = hydrateEnterpriseDeviceRecord({ location_id: 'loc-1' });
            expect(result.location_id).toBe('loc-1');
        });

        it('should use record pairing_code_expires_at when present', () => {
            const result = hydrateEnterpriseDeviceRecord({
                pairing_code_expires_at: '2025-01-01T00:00:00Z',
            });
            expect(result.pairing_code_expires_at).toBe('2025-01-01T00:00:00Z');
        });

        it('should use record pairing_completed_at when present', () => {
            const result = hydrateEnterpriseDeviceRecord({
                pairing_completed_at: '2024-12-01T00:00:00Z',
            });
            expect(result.pairing_completed_at).toBe('2024-12-01T00:00:00Z');
        });

        it('should use record management_device_id when present', () => {
            const result = hydrateEnterpriseDeviceRecord({ management_device_id: 'dev-1' });
            expect(result.management_device_id).toBe('dev-1');
        });

        it('should preserve other record properties', () => {
            const result = hydrateEnterpriseDeviceRecord({
                id: '123',
                name: 'Test Device',
            } as Record<string, unknown>);
            expect((result as Record<string, unknown>).id).toBe('123');
            expect((result as Record<string, unknown>).name).toBe('Test Device');
        });
    });
});
