/**
 * Tests for SMS notification service
 *
 * Focuses on branch coverage for:
 * - resolveSmsProvider (africas_talking, africas-talking, log)
 * - normalizePhone (spaces, trim)
 * - buildOrderStatusMessage (preparing, ready, served, completed, cancelled, default)
 * - sendSms (empty phone, africas_talking provider, log provider)
 * - sendOrderStatusSms (delegates to sendSms)
 * - sendWithAfricasTalking (missing credentials, phone normalization, sender ID, response handling)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockFetch = vi.fn();
global.fetch = mockFetch;

const ORIGINAL_ENV = { ...process.env };

describe('SMS notifications', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.resetModules();
        delete process.env.SMS_PROVIDER;
        delete process.env.AFRICAS_TALKING_API_KEY;
        delete process.env.AFRICAS_TALKING_USERNAME;
        delete process.env.AFRICAS_TALKING_SENDER_ID;
    });

    afterEach(() => {
        process.env = { ...ORIGINAL_ENV };
    });

    describe('sendSms with log provider', () => {
        it('should return success with log provider by default', async () => {
            const { sendSms } = await import('../sms');
            const result = await sendSms('+251911123456', 'Test message');
            expect(result.success).toBe(true);
            expect(result.provider).toBe('log');
        });

        it('should return skipped for empty phone number (whitespace only)', async () => {
            const { sendSms } = await import('../sms');
            const result = await sendSms('   ', 'Test message');
            expect(result.success).toBe(false);
            expect(result.skipped).toBe(true);
            expect(result.error).toContain('empty');
        });

        it('should return skipped for empty string phone', async () => {
            const { sendSms } = await import('../sms');
            const result = await sendSms('', 'Test message');
            expect(result.success).toBe(false);
            expect(result.skipped).toBe(true);
        });
    });

    describe('sendOrderStatusSms', () => {
        it('should build preparing message and send', async () => {
            const { sendOrderStatusSms } = await import('../sms');
            const result = await sendOrderStatusSms({
                toPhone: '+251911123456',
                orderNumber: 'ORD-001',
                status: 'preparing',
            });
            expect(result).toBeDefined();
            expect(result.success).toBe(true);
        });

        it('should build ready message and send', async () => {
            const { sendOrderStatusSms } = await import('../sms');
            const result = await sendOrderStatusSms({
                toPhone: '+251911123456',
                orderNumber: 'ORD-001',
                status: 'ready',
            });
            expect(result).toBeDefined();
            expect(result.success).toBe(true);
        });

        it('should build served message and send', async () => {
            const { sendOrderStatusSms } = await import('../sms');
            const result = await sendOrderStatusSms({
                toPhone: '+251911123456',
                orderNumber: 'ORD-001',
                status: 'served',
            });
            expect(result).toBeDefined();
            expect(result.success).toBe(true);
        });

        it('should build completed message and send', async () => {
            const { sendOrderStatusSms } = await import('../sms');
            const result = await sendOrderStatusSms({
                toPhone: '+251911123456',
                orderNumber: 'ORD-001',
                status: 'completed',
            });
            expect(result).toBeDefined();
            expect(result.success).toBe(true);
        });

        it('should build cancelled message and send', async () => {
            const { sendOrderStatusSms } = await import('../sms');
            const result = await sendOrderStatusSms({
                toPhone: '+251911123456',
                orderNumber: 'ORD-001',
                status: 'cancelled',
            });
            expect(result).toBeDefined();
            expect(result.success).toBe(true);
        });

        it('should build default message for unknown status', async () => {
            const { sendOrderStatusSms } = await import('../sms');
            const result = await sendOrderStatusSms({
                toPhone: '+251911123456',
                orderNumber: 'ORD-001',
                status: 'pending',
            });
            expect(result).toBeDefined();
            expect(result.success).toBe(true);
        });
    });

    describe('sendSms with africas_talking provider', () => {
        beforeEach(() => {
            process.env.SMS_PROVIDER = 'africas_talking';
            process.env.AFRICAS_TALKING_API_KEY = 'test-api-key';
            process.env.AFRICAS_TALKING_USERNAME = 'test-username';
        });

        it('should return skipped when credentials are missing', async () => {
            delete process.env.AFRICAS_TALKING_API_KEY;
            delete process.env.AFRICAS_TALKING_USERNAME;

            const { sendSms } = await import('../sms');
            const result = await sendSms('+251911123456', 'Test message');
            expect(result.success).toBe(false);
            expect(result.provider).toBe('africas_talking');
            expect(result.skipped).toBe(true);
            expect(result.error).toContain('credentials');
        });

        it('should return skipped when only API key is missing', async () => {
            delete process.env.AFRICAS_TALKING_API_KEY;

            const { sendSms } = await import('../sms');
            const result = await sendSms('+251911123456', 'Test message');
            expect(result.success).toBe(false);
            expect(result.skipped).toBe(true);
        });

        it('should normalize phone with 0 prefix to +251', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    SMSMessageData: {
                        Recipients: [{ status: 'Success', statusCode: 101 }],
                    },
                }),
            });

            const { sendSms } = await import('../sms');
            const result = await sendSms('0911123456', 'Test message');

            const callBody = mockFetch.mock.calls[0][1];
            const params = new URLSearchParams(callBody.body);
            expect(params.get('to')).toBe('+251911123456');
            expect(result.success).toBe(true);
            expect(result.provider).toBe('africas_talking');
        });

        it('should normalize 9-digit phone starting with 9 to +251', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    SMSMessageData: {
                        Recipients: [{ status: 'Success', statusCode: 101 }],
                    },
                }),
            });

            const { sendSms } = await import('../sms');
            const result = await sendSms('911123456', 'Test message');

            const callBody = mockFetch.mock.calls[0][1];
            const params = new URLSearchParams(callBody.body);
            expect(params.get('to')).toBe('+251911123456');
            expect(result.success).toBe(true);
        });

        it('should add + prefix to phone without country code or 0/9 prefix', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    SMSMessageData: {
                        Recipients: [{ status: 'Success', statusCode: 101 }],
                    },
                }),
            });

            const { sendSms } = await import('../sms');
            const result = await sendSms('251911123456', 'Test message');

            const callBody = mockFetch.mock.calls[0][1];
            const params = new URLSearchParams(callBody.body);
            expect(params.get('to')).toBe('+251911123456');
            expect(result.success).toBe(true);
        });

        it('should keep phone with + prefix as-is', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    SMSMessageData: {
                        Recipients: [{ status: 'Success', statusCode: 101 }],
                    },
                }),
            });

            const { sendSms } = await import('../sms');
            await sendSms('+251911123456', 'Test message');

            const callBody = mockFetch.mock.calls[0][1];
            const params = new URLSearchParams(callBody.body);
            expect(params.get('to')).toBe('+251911123456');
        });

        it('should include sender ID when configured', async () => {
            process.env.AFRICAS_TALKING_SENDER_ID = 'GEBETA';

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    SMSMessageData: {
                        Recipients: [{ status: 'Success', statusCode: 101 }],
                    },
                }),
            });

            const { sendSms } = await import('../sms');
            await sendSms('+251911123456', 'Test message');

            const callBody = mockFetch.mock.calls[0][1];
            const params = new URLSearchParams(callBody.body);
            expect(params.get('from')).toBe('GEBETA');
        });

        it('should not include from when sender ID is not configured', async () => {
            delete process.env.AFRICAS_TALKING_SENDER_ID;

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    SMSMessageData: {
                        Recipients: [{ status: 'Success', statusCode: 101 }],
                    },
                }),
            });

            const { sendSms } = await import('../sms');
            await sendSms('+251911123456', 'Test message');

            const callBody = mockFetch.mock.calls[0][1];
            const params = new URLSearchParams(callBody.body);
            expect(params.get('from')).toBeNull();
        });

        it('should return error when API responds not ok', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 401,
                text: async () => 'Unauthorized',
            });

            const { sendSms } = await import('../sms');
            const result = await sendSms('+251911123456', 'Test message');
            expect(result.success).toBe(false);
            expect(result.provider).toBe('africas_talking');
            expect(result.error).toContain('Unauthorized');
        });

        it('should handle text() rejection in error response', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                text: async () => {
                    throw new Error('text parse error');
                },
            });

            const { sendSms } = await import('../sms');
            const result = await sendSms('+251911123456', 'Test message');
            expect(result.success).toBe(false);
            expect(result.error).toContain('SMS provider error');
        });

        it('should return error when delivery status is not success', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    SMSMessageData: {
                        Recipients: [{ status: 'Failed', statusCode: 401 }],
                    },
                }),
            });

            const { sendSms } = await import('../sms');
            const result = await sendSms('+251911123456', 'Test message');
            expect(result.success).toBe(false);
            expect(result.error).toContain('Delivery failed');
        });

        it('should return success when delivery status is success (statusCode 101)', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    SMSMessageData: {
                        Recipients: [{ status: 'Success', statusCode: 101 }],
                    },
                }),
            });

            const { sendSms } = await import('../sms');
            const result = await sendSms('+251911123456', 'Test message');
            expect(result.success).toBe(true);
            expect(result.provider).toBe('africas_talking');
        });

        it('should handle json parse failure in response', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => {
                    throw new Error('JSON parse error');
                },
            });

            const { sendSms } = await import('../sms');
            const result = await sendSms('+251911123456', 'Test message');
            // Should handle gracefully - empty object fallback means no recipients
            expect(result.success).toBe(true);
            expect(result.provider).toBe('africas_talking');
        });

        it('should handle empty recipients array', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    SMSMessageData: {
                        Recipients: [],
                    },
                }),
            });

            const { sendSms } = await import('../sms');
            const result = await sendSms('+251911123456', 'Test message');
            // No firstRecipient means no delivery failure check
            expect(result.success).toBe(true);
            expect(result.provider).toBe('africas_talking');
        });

        it('should handle missing SMSMessageData', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({}),
            });

            const { sendSms } = await import('../sms');
            const result = await sendSms('+251911123456', 'Test message');
            expect(result.success).toBe(true);
            expect(result.provider).toBe('africas_talking');
        });
    });

    describe('resolveSmsProvider', () => {
        it('should use africas_talking when env is africas_talking', async () => {
            process.env.SMS_PROVIDER = 'africas_talking';
            process.env.AFRICAS_TALKING_API_KEY = 'key';
            process.env.AFRICAS_TALKING_USERNAME = 'user';

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    SMSMessageData: {
                        Recipients: [{ status: 'Success', statusCode: 101 }],
                    },
                }),
            });

            const { sendSms } = await import('../sms');
            const result = await sendSms('+251911123456', 'Test');
            expect(result.provider).toBe('africas_talking');
        });

        it('should use africas_talking when env is africas-talking (hyphen)', async () => {
            process.env.SMS_PROVIDER = 'africas-talking';
            process.env.AFRICAS_TALKING_API_KEY = 'key';
            process.env.AFRICAS_TALKING_USERNAME = 'user';

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    SMSMessageData: {
                        Recipients: [{ status: 'Success', statusCode: 101 }],
                    },
                }),
            });

            const { sendSms } = await import('../sms');
            const result = await sendSms('+251911123456', 'Test');
            expect(result.provider).toBe('africas_talking');
        });

        it('should default to log provider for unknown provider name', async () => {
            process.env.SMS_PROVIDER = 'twilio';

            const { sendSms } = await import('../sms');
            const result = await sendSms('+251911123456', 'Test');
            expect(result.provider).toBe('log');
        });
    });
});
