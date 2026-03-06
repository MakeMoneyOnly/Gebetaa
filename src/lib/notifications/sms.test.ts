import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sendSms, sendOrderStatusSms, type OrderStatusSmsInput } from './sms';

// Mock environment variables
const originalEnv = process.env;

describe('SMS Notifications', () => {
    beforeEach(() => {
        vi.resetModules();
        process.env = { ...originalEnv };
    });

    afterEach(() => {
        process.env = originalEnv;
        vi.restoreAllMocks();
    });

    describe('sendSms', () => {
        it('should return error for empty phone number', async () => {
            const result = await sendSms('', 'Test message');
            expect(result.success).toBe(false);
            expect(result.skipped).toBe(true);
            expect(result.error).toContain('empty');
        });

        it('should return error for whitespace-only phone number', async () => {
            const result = await sendSms('   ', 'Test message');
            expect(result.success).toBe(false);
            expect(result.skipped).toBe(true);
        });

        it('should log SMS when provider is log (default)', async () => {
            const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

            process.env.SMS_PROVIDER = 'log';

            const result = await sendSms('+251912345678', 'Test message');

            expect(result.success).toBe(true);
            expect(result.provider).toBe('log');
            expect(logSpy).toHaveBeenCalled();

            logSpy.mockRestore();
        });

        it('should normalize phone number with spaces', async () => {
            const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

            process.env.SMS_PROVIDER = 'log';

            await sendSms('  +251 912 345 678  ', 'Test message');

            expect(logSpy).toHaveBeenCalledWith(
                '[SMS:log]',
                expect.objectContaining({
                    toPhone: '+251912345678',
                })
            );

            logSpy.mockRestore();
        });
    });

    describe('sendOrderStatusSms', () => {
        it('should send preparing status message', async () => {
            const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

            process.env.SMS_PROVIDER = 'log';

            const input: OrderStatusSmsInput = {
                toPhone: '+251912345678',
                orderNumber: 'ORD-123',
                status: 'preparing',
            };

            const result = await sendOrderStatusSms(input);

            expect(result.success).toBe(true);
            expect(logSpy).toHaveBeenCalledWith(
                '[SMS:log]',
                expect.objectContaining({
                    message: expect.stringContaining('being prepared'),
                })
            );

            logSpy.mockRestore();
        });

        it('should send ready status message', async () => {
            const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

            process.env.SMS_PROVIDER = 'log';

            const input: OrderStatusSmsInput = {
                toPhone: '+251912345678',
                orderNumber: 'ORD-456',
                status: 'ready',
            };

            const result = await sendOrderStatusSms(input);

            expect(result.success).toBe(true);
            expect(logSpy).toHaveBeenCalledWith(
                '[SMS:log]',
                expect.objectContaining({
                    message: expect.stringContaining('ready for pickup'),
                })
            );

            logSpy.mockRestore();
        });

        it('should send completed status message', async () => {
            const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

            process.env.SMS_PROVIDER = 'log';

            const input: OrderStatusSmsInput = {
                toPhone: '+251912345678',
                orderNumber: 'ORD-789',
                status: 'completed',
            };

            const result = await sendOrderStatusSms(input);

            expect(result.success).toBe(true);
            expect(logSpy).toHaveBeenCalledWith(
                '[SMS:log]',
                expect.objectContaining({
                    message: expect.stringContaining('completed'),
                })
            );

            logSpy.mockRestore();
        });

        it('should send served status message', async () => {
            const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

            process.env.SMS_PROVIDER = 'log';

            const input: OrderStatusSmsInput = {
                toPhone: '+251912345678',
                orderNumber: 'ORD-999',
                status: 'served',
            };

            const result = await sendOrderStatusSms(input);

            expect(result.success).toBe(true);
            expect(logSpy).toHaveBeenCalledWith(
                '[SMS:log]',
                expect.objectContaining({
                    message: expect.stringContaining('completed'),
                })
            );

            logSpy.mockRestore();
        });

        it('should send cancelled status message', async () => {
            const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

            process.env.SMS_PROVIDER = 'log';

            const input: OrderStatusSmsInput = {
                toPhone: '+251912345678',
                orderNumber: 'ORD-CANCEL',
                status: 'cancelled',
            };

            const result = await sendOrderStatusSms(input);

            expect(result.success).toBe(true);
            expect(logSpy).toHaveBeenCalledWith(
                '[SMS:log]',
                expect.objectContaining({
                    message: expect.stringContaining('cancelled'),
                })
            );

            logSpy.mockRestore();
        });

        it('should send generic status message for unknown status', async () => {
            const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

            process.env.SMS_PROVIDER = 'log';

            const input: OrderStatusSmsInput = {
                toPhone: '+251912345678',
                orderNumber: 'ORD-123',
                status: 'custom_status',
            };

            const result = await sendOrderStatusSms(input);

            expect(result.success).toBe(true);
            expect(logSpy).toHaveBeenCalledWith(
                '[SMS:log]',
                expect.objectContaining({
                    message: expect.stringContaining('custom_status'),
                })
            );

            logSpy.mockRestore();
        });
    });
});
