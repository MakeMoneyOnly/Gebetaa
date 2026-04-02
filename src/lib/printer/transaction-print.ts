import { queueFiscalJob } from '@/lib/fiscal/offline-queue';
import { submitFiscalTransaction, type FiscalSubmissionRequest } from '@/lib/fiscal/mor-client';
import { silentPrintReceipt } from '@/lib/printer/silent-print';
import type { EscPosReceiptPayload } from '@/lib/printer/escpos';

function toNumber(value: unknown): number {
    const numeric = Number(value ?? 0);
    return Number.isFinite(numeric) ? numeric : 0;
}

export async function handleApprovedTransactionReceipt(args: {
    autoPrint: boolean;
    orderId?: string | null;
    transactionNumber: string;
    receipt: EscPosReceiptPayload;
    fiscalRequest?: FiscalSubmissionRequest | null;
}): Promise<{ printed: boolean; queuedFiscal: boolean; warning?: string | null }> {
    let warning: string | null = null;
    let queuedFiscal = false;

    if (args.fiscalRequest) {
        try {
            const fiscalResult = await submitFiscalTransaction(args.fiscalRequest);
            args.receipt.fiscal_qr_payload = fiscalResult.qr_payload ?? null;
            if (fiscalResult.warning) {
                warning = fiscalResult.warning;
                args.receipt.fiscal_warning = fiscalResult.warning;
            }
        } catch (_error) {
            warning = 'Pending fiscalization';
            args.receipt.fiscal_warning = warning;
            if (args.orderId) {
                await queueFiscalJob({
                    orderId: args.orderId,
                    payload: { ...args.fiscalRequest },
                    warningText: warning,
                });
                queuedFiscal = true;
            }
        }
    }

    if (!args.autoPrint) {
        return {
            printed: false,
            queuedFiscal,
            warning,
        };
    }

    const result = await silentPrintReceipt(args.receipt);
    return {
        printed: result.ok,
        queuedFiscal,
        warning: warning ?? result.reason ?? null,
    };
}

export function buildReceiptFromPaymentPayload(input: {
    restaurantName: string;
    restaurantTin?: string | null;
    transactionNumber: string;
    orderNumber?: string | null;
    paymentLabel?: string | null;
    subtotal?: number | null;
    total?: number | null;
    taxSummary?: Array<{ label: string; amount: number }> | null;
    items?: Array<{
        name: string;
        quantity?: number | null;
        unit_price?: number | null;
        total_price?: number | null;
        notes?: string | null;
    }> | null;
}): EscPosReceiptPayload {
    const subtotal = toNumber(input.subtotal ?? input.total);
    const total = toNumber(input.total ?? subtotal);
    return {
        restaurant_name: input.restaurantName,
        restaurant_tin: input.restaurantTin ?? null,
        transaction_number: input.transactionNumber,
        printed_at: new Date().toISOString(),
        order_label: input.orderNumber ? `Order ${input.orderNumber}` : null,
        payment_label: input.paymentLabel ?? null,
        items:
            input.items?.map(item => ({
                name: item.name,
                quantity: Math.max(1, toNumber(item.quantity ?? 1)),
                unit_price: toNumber(item.unit_price ?? item.total_price),
                total_price: toNumber(item.total_price ?? item.unit_price),
                notes: item.notes ?? null,
            })) ?? [],
        taxes: input.taxSummary ?? [],
        subtotal,
        total,
        footer_lines: ['Gebeta Restaurant OS'],
    };
}
