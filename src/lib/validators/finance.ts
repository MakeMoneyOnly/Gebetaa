/**
 * Financial Validators - Santim-Based Monetary Validation
 *
 * CRIT-02: All monetary values are now INTEGER in SANTIM (100 santim = 1 ETB)
 *
 * This module provides Zod validators for:
 * - Payments
 * - Refunds
 * - Payouts
 * - Reconciliation entries
 */

import { z } from 'zod';

/**
 * Payment Method Schema
 */
export const PaymentMethodSchema = z.enum([
    'cash',
    'card',
    'chapa',
    'gift_card',
    'bank_transfer',
    'other',
]);

/**
 * Payment Status Schema
 */
export const PaymentStatusSchema = z.enum([
    'pending',
    'authorized',
    'captured',
    'failed',
    'voided',
    'partially_refunded',
    'refunded',
]);

/**
 * Create Payment Schema
 * Validates payment creation requests
 *
 * CRIT-02: All monetary values are now INTEGER in SANTIM
 */
export const CreatePaymentSchema = z.object({
    order_id: z.string().uuid().optional(),
    split_id: z.string().uuid().optional(),
    method: PaymentMethodSchema,
    provider: z.string().trim().min(2).max(80).optional().default('internal'),
    provider_reference: z.string().trim().min(2).max(120).optional(),
    // amount is now in SANTIM (integer)
    amount: z
        .number()
        .int()
        .min(1, 'Amount must be at least 1 santim')
        .max(1000000000, 'Amount too large'),
    // tip_amount is now in SANTIM (integer)
    tip_amount: z.number().int().min(0).max(1000000000).optional().default(0),
    currency: z.string().trim().length(3).optional().default('ETB'),
    status: PaymentStatusSchema.optional().default('captured'),
    authorized_at: z.string().datetime().optional(),
    captured_at: z.string().datetime().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Refund Status Schema
 */
export const RefundStatusSchema = z.enum(['pending', 'processed', 'failed', 'cancelled']);

/**
 * Create Refund Schema
 * Validates refund creation requests
 *
 * CRIT-02: All monetary values are now INTEGER in SANTIM
 */
export const CreateRefundSchema = z.object({
    payment_id: z.string().uuid('Invalid payment ID'),
    order_id: z.string().uuid().optional(),
    // amount is now in SANTIM (integer)
    amount: z.number().int().min(1, 'Refund amount must be at least 1 santim'),
    reason: z.string().min(1, 'Reason is required').max(500, 'Reason too long'),
    status: RefundStatusSchema.optional().default('pending'),
    provider_reference: z.string().optional(),
});

/**
 * Payout Status Schema
 */
export const PayoutStatusSchema = z.enum(['pending', 'in_transit', 'paid', 'failed', 'cancelled']);

/**
 * Payout Channel Schema
 */
export const PayoutChannelSchema = z.enum(['in_store', 'online', 'delivery', 'omni']);

/**
 * Create Payout Schema
 * Validates payout creation requests
 *
 * CRIT-02: All monetary values are now INTEGER in SANTIM
 */
export const CreatePayoutSchema = z.object({
    provider: z.string().trim().min(1, 'Provider is required').max(80, 'Provider too long'),
    channel: PayoutChannelSchema.optional().default('omni'),
    period_start: z.string().datetime(),
    period_end: z.string().datetime(),
    // gross, fees, adjustments, net are now in SANTIM (integer)
    gross: z.number().int().min(0, 'Gross must be non-negative'),
    fees: z.number().int().min(0, 'Fees must be non-negative'),
    adjustments: z.number().int().optional().default(0),
    net: z.number().int().min(0, 'Net must be non-negative'),
    currency: z.string().trim().length(3).optional().default('ETB'),
    status: PayoutStatusSchema.optional().default('pending'),
    paid_at: z.string().datetime().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Reconciliation Entry Source Type Schema
 */
export const ReconciliationSourceTypeSchema = z.enum(['payment', 'refund', 'payout', 'adjustment']);

/**
 * Reconciliation Ledger Type Schema
 */
export const ReconciliationLedgerTypeSchema = z.enum(['gateway', 'bank', 'book']);

/**
 * Reconciliation Status Schema
 */
export const ReconciliationStatusSchema = z.enum([
    'matched',
    'exception',
    'investigating',
    'resolved',
]);

/**
 * Create Reconciliation Entry Schema
 * Validates reconciliation entry creation requests
 *
 * CRIT-02: All monetary values are now INTEGER in SANTIM
 */
export const CreateReconciliationEntrySchema = z.object({
    payout_id: z.string().uuid().optional(),
    payment_id: z.string().uuid().optional(),
    refund_id: z.string().uuid().optional(),
    source_type: ReconciliationSourceTypeSchema,
    source_id: z.string().uuid(),
    ledger_type: ReconciliationLedgerTypeSchema,
    ledger_id: z.string().min(1, 'Ledger ID is required'),
    // expected_amount, settled_amount, delta_amount are now in SANTIM (integer)
    expected_amount: z.number().int().min(0),
    settled_amount: z.number().int().min(0),
    delta_amount: z.number().int().optional().default(0),
    status: ReconciliationStatusSchema.optional().default('matched'),
    notes: z.string().max(1000).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Type exports for TypeScript
 */
export type CreatePaymentInput = z.infer<typeof CreatePaymentSchema>;
export type CreateRefundInput = z.infer<typeof CreateRefundSchema>;
export type CreatePayoutInput = z.infer<typeof CreatePayoutSchema>;
export type CreateReconciliationEntryInput = z.infer<typeof CreateReconciliationEntrySchema>;
