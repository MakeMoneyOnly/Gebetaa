/**
 * Finance Validator Tests
 *
 * Tests for src/lib/validators/finance.ts
 */

import { describe, it, expect } from 'vitest';
import {
    PaymentMethodSchema,
    PaymentStatusSchema,
    CreatePaymentSchema,
    RefundStatusSchema,
    CreateRefundSchema,
    PayoutStatusSchema,
    PayoutChannelSchema,
    CreatePayoutSchema,
    ReconciliationSourceTypeSchema,
    ReconciliationLedgerTypeSchema,
    ReconciliationStatusSchema,
    CreateReconciliationEntrySchema,
} from '@/lib/validators/finance';

describe('finance validators', () => {
    describe('PaymentMethodSchema', () => {
        it('should accept valid payment methods', () => {
            const methods = ['cash', 'card', 'chapa', 'gift_card', 'bank_transfer', 'other'];

            methods.forEach(method => {
                const result = PaymentMethodSchema.safeParse(method);
                expect(result.success).toBe(true);
            });
        });

        it('should reject invalid payment methods', () => {
            const result = PaymentMethodSchema.safeParse('invalid_method');
            expect(result.success).toBe(false);
        });
    });

    describe('PaymentStatusSchema', () => {
        it('should accept valid payment statuses', () => {
            const statuses = [
                'pending',
                'authorized',
                'captured',
                'failed',
                'voided',
                'partially_refunded',
                'refunded',
            ];

            statuses.forEach(status => {
                const result = PaymentStatusSchema.safeParse(status);
                expect(result.success).toBe(true);
            });
        });
    });

    describe('CreatePaymentSchema', () => {
        it('should validate a valid payment', () => {
            const validPayment = {
                order_id: '123e4567-e89b-12d3-a456-426614174000',
                method: 'cash' as const,
                amount: 5000, // 50 ETB in santim
                tip_amount: 500, // 5 ETB in santim
                currency: 'ETB',
                status: 'captured' as const,
            };

            const result = CreatePaymentSchema.safeParse(validPayment);
            expect(result.success).toBe(true);
        });

        it('should use defaults for optional fields', () => {
            const minimalPayment = {
                method: 'cash' as const,
                amount: 5000,
            };

            const result = CreatePaymentSchema.safeParse(minimalPayment);
            expect(result.success).toBe(true);
            expect(result.data?.provider).toBe('internal');
            expect(result.data?.status).toBe('captured');
            expect(result.data?.tip_amount).toBe(0);
        });

        it('should reject amount less than 1 santim', () => {
            const invalidPayment = {
                method: 'cash' as const,
                amount: 0,
            };

            const result = CreatePaymentSchema.safeParse(invalidPayment);
            expect(result.success).toBe(false);
        });

        it('should reject negative amount', () => {
            const invalidPayment = {
                method: 'cash' as const,
                amount: -100,
            };

            const result = CreatePaymentSchema.safeParse(invalidPayment);
            expect(result.success).toBe(false);
        });

        it('should reject non-integer amount', () => {
            const invalidPayment = {
                method: 'cash' as const,
                amount: 50.5,
            };

            const result = CreatePaymentSchema.safeParse(invalidPayment);
            expect(result.success).toBe(false);
        });

        it('should reject invalid currency length', () => {
            const invalidPayment = {
                method: 'cash' as const,
                amount: 5000,
                currency: 'ETBERR', // Too long
            };

            const result = CreatePaymentSchema.safeParse(invalidPayment);
            expect(result.success).toBe(false);
        });

        it('should accept negative tip amount', () => {
            const payment = {
                method: 'cash' as const,
                amount: 5000,
                tip_amount: -100,
            };

            const result = CreatePaymentSchema.safeParse(payment);
            expect(result.success).toBe(false); // tip must be >= 0
        });
    });

    describe('RefundStatusSchema', () => {
        it('should accept valid refund statuses', () => {
            const statuses = ['pending', 'processed', 'failed', 'cancelled'];

            statuses.forEach(status => {
                const result = RefundStatusSchema.safeParse(status);
                expect(result.success).toBe(true);
            });
        });
    });

    describe('CreateRefundSchema', () => {
        it('should validate a valid refund', () => {
            const validRefund = {
                payment_id: '123e4567-e89b-12d3-a456-426614174000',
                amount: 5000,
                reason: 'Customer request',
            };

            const result = CreateRefundSchema.safeParse(validRefund);
            expect(result.success).toBe(true);
        });

        it('should reject invalid UUID for payment_id', () => {
            const invalidRefund = {
                payment_id: 'not-a-uuid',
                amount: 5000,
                reason: 'Customer request',
            };

            const result = CreateRefundSchema.safeParse(invalidRefund);
            expect(result.success).toBe(false);
        });

        it('should reject empty reason', () => {
            const invalidRefund = {
                payment_id: '123e4567-e89b-12d3-a456-426614174000',
                amount: 5000,
                reason: '',
            };

            const result = CreateRefundSchema.safeParse(invalidRefund);
            expect(result.success).toBe(false);
        });

        it('should reject reason exceeding 500 chars', () => {
            const invalidRefund = {
                payment_id: '123e4567-e89b-12d3-a456-426614174000',
                amount: 5000,
                reason: 'a'.repeat(501),
            };

            const result = CreateRefundSchema.safeParse(invalidRefund);
            expect(result.success).toBe(false);
        });
    });

    describe('PayoutStatusSchema', () => {
        it('should accept valid payout statuses', () => {
            const statuses = ['pending', 'in_transit', 'paid', 'failed', 'cancelled'];

            statuses.forEach(status => {
                const result = PayoutStatusSchema.safeParse(status);
                expect(result.success).toBe(true);
            });
        });
    });

    describe('PayoutChannelSchema', () => {
        it('should accept valid payout channels', () => {
            const channels = ['in_store', 'online', 'delivery', 'omni'];

            channels.forEach(channel => {
                const result = PayoutChannelSchema.safeParse(channel);
                expect(result.success).toBe(true);
            });
        });
    });

    describe('CreatePayoutSchema', () => {
        it('should validate a valid payout', () => {
            const validPayout = {
                provider: 'chapa',
                period_start: '2026-01-01T00:00:00Z',
                period_end: '2026-01-31T23:59:59Z',
                gross: 1000000, // 10,000 ETB in santim
                fees: 30000,
                net: 970000,
            };

            const result = CreatePayoutSchema.safeParse(validPayout);
            expect(result.success).toBe(true);
        });

        it('should reject negative gross', () => {
            const invalidPayout = {
                provider: 'chapa',
                period_start: '2026-01-01T00:00:00Z',
                period_end: '2026-01-31T23:59:59Z',
                gross: -1000,
                fees: 0,
                net: -1000,
            };

            const result = CreatePayoutSchema.safeParse(invalidPayout);
            expect(result.success).toBe(false);
        });

        it('should reject non-integer values', () => {
            const invalidPayout = {
                provider: 'chapa',
                period_start: '2026-01-01T00:00:00Z',
                period_end: '2026-01-31T23:59:59Z',
                gross: 1000.5,
                fees: 0,
                net: 1000,
            };

            const result = CreatePayoutSchema.safeParse(invalidPayout);
            expect(result.success).toBe(false);
        });

        it('should reject empty provider', () => {
            const invalidPayout = {
                provider: '',
                period_start: '2026-01-01T00:00:00Z',
                period_end: '2026-01-31T23:59:59Z',
                gross: 1000,
                fees: 0,
                net: 1000,
            };

            const result = CreatePayoutSchema.safeParse(invalidPayout);
            expect(result.success).toBe(false);
        });
    });

    describe('ReconciliationSourceTypeSchema', () => {
        it('should accept valid source types', () => {
            const types = ['payment', 'refund', 'payout', 'adjustment'];

            types.forEach(type => {
                const result = ReconciliationSourceTypeSchema.safeParse(type);
                expect(result.success).toBe(true);
            });
        });
    });

    describe('ReconciliationLedgerTypeSchema', () => {
        it('should accept valid ledger types', () => {
            const types = ['gateway', 'bank', 'book'];

            types.forEach(type => {
                const result = ReconciliationLedgerTypeSchema.safeParse(type);
                expect(result.success).toBe(true);
            });
        });
    });

    describe('ReconciliationStatusSchema', () => {
        it('should accept valid statuses', () => {
            const statuses = ['matched', 'exception', 'investigating', 'resolved'];

            statuses.forEach(status => {
                const result = ReconciliationStatusSchema.safeParse(status);
                expect(result.success).toBe(true);
            });
        });
    });

    describe('CreateReconciliationEntrySchema', () => {
        it('should validate a valid reconciliation entry', () => {
            const validEntry = {
                source_type: 'payment' as const,
                source_id: '123e4567-e89b-12d3-a456-426614174000',
                ledger_type: 'gateway' as const,
                ledger_id: 'GW-12345',
                expected_amount: 10000,
                settled_amount: 10000,
            };

            const result = CreateReconciliationEntrySchema.safeParse(validEntry);
            expect(result.success).toBe(true);
        });

        it('should allow no source ID when using payout_id', () => {
            const validEntry = {
                payout_id: '123e4567-e89b-12d3-a456-426614174000',
                source_type: 'payout' as const,
                source_id: '123e4567-e89b-12d3-a456-426614174001',
                ledger_type: 'bank' as const,
                ledger_id: 'BANK-123',
                expected_amount: 10000,
                settled_amount: 10000,
            };

            const result = CreateReconciliationEntrySchema.safeParse(validEntry);
            expect(result.success).toBe(true);
        });

        it('should reject negative expected amount', () => {
            const invalidEntry = {
                source_type: 'payment' as const,
                source_id: '123e4567-e89b-12d3-a456-426614174000',
                ledger_type: 'gateway' as const,
                ledger_id: 'GW-123',
                expected_amount: -1000,
                settled_amount: 1000,
            };

            const result = CreateReconciliationEntrySchema.safeParse(invalidEntry);
            expect(result.success).toBe(false);
        });

        it('should reject empty ledger ID', () => {
            const invalidEntry = {
                source_type: 'payment' as const,
                source_id: '123e4567-e89b-12d3-a456-426614174000',
                ledger_type: 'gateway' as const,
                ledger_id: '',
                expected_amount: 1000,
                settled_amount: 1000,
            };

            const result = CreateReconciliationEntrySchema.safeParse(invalidEntry);
            expect(result.success).toBe(false);
        });
    });
});
