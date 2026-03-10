import { z } from 'zod';

export const SupportedPaymentMethodSchema = z.enum(['cash', 'chapa', 'card', 'other']);

export type SupportedPaymentMethod = z.infer<typeof SupportedPaymentMethodSchema>;

export const HardwareDeviceTypeSchema = z.enum(['pos', 'kds', 'kiosk', 'digital_menu', 'terminal']);

export type HardwareDeviceType = z.infer<typeof HardwareDeviceTypeSchema>;

export const TerminalSettlementModeSchema = z.enum(['cashier', 'counter', 'hybrid']);
export type TerminalSettlementMode = z.infer<typeof TerminalSettlementModeSchema>;

export const TerminalReceiptModeSchema = z.enum(['auto', 'prompt', 'disabled']);
export type TerminalReceiptMode = z.infer<typeof TerminalReceiptModeSchema>;

export const HardwareDeviceMetadataSchema = z
    .object({
        station_name: z.string().trim().min(2).max(80).optional(),
        settlement_mode: TerminalSettlementModeSchema.optional(),
        allowed_payment_methods: z.array(SupportedPaymentMethodSchema).max(5).optional(),
        receipt_mode: TerminalReceiptModeSchema.optional(),
        managed_mode: z.enum(['browser', 'pwa', 'dedicated']).optional(),
        kiosk_required: z.boolean().optional(),
    })
    .strict();

export type HardwareDeviceMetadata = z.infer<typeof HardwareDeviceMetadataSchema>;

export type PaymentSurface = 'guest_qr' | 'online_order' | 'waiter_pos' | 'terminal';

export interface PaymentMethodOption {
    method: SupportedPaymentMethod;
    label: string;
    enabled: boolean;
    preferred?: boolean;
    description: string;
}

const PAYMENT_SURFACE_OPTIONS: Record<PaymentSurface, PaymentMethodOption[]> = {
    guest_qr: [
        {
            method: 'chapa',
            label: 'Chapa',
            enabled: true,
            preferred: true,
            description: 'Hosted fallback for broader Ethiopian payment acceptance.',
        },
        {
            method: 'cash',
            label: 'Pay Later',
            enabled: true,
            description: 'Guest orders now and settles with staff before leaving.',
        },
    ],
    online_order: [
        {
            method: 'chapa',
            label: 'Chapa',
            enabled: true,
            preferred: true,
            description: 'Primary prepaid checkout for pickup and delivery orders.',
        },
    ],
    waiter_pos: [
        {
            method: 'cash',
            label: 'Cash',
            enabled: true,
            preferred: true,
            description: 'Fast staff-assisted settlement for dine-in service.',
        },
        {
            method: 'chapa',
            label: 'Chapa',
            enabled: true,
            description: 'Hosted digital payment collection for staff-assisted service.',
        },
        {
            method: 'other',
            label: 'Other',
            enabled: true,
            description: 'Use for manual or restaurant-specific tender handling.',
        },
    ],
    terminal: [
        {
            method: 'cash',
            label: 'Cash',
            enabled: true,
            preferred: true,
            description: 'Primary cashier settlement path for in-person checkout.',
        },
        {
            method: 'chapa',
            label: 'Chapa',
            enabled: true,
            description: 'Hosted digital payment flow for terminal checkout.',
        },
        {
            method: 'other',
            label: 'Other',
            enabled: true,
            description: 'Use for exceptions and restaurant-specific settlement flows.',
        },
    ],
};

export function getDeviceTypeLabel(deviceType?: string | null): string {
    switch (deviceType) {
        case 'kds':
            return 'Kitchen Display System';
        case 'pos':
            return 'Waiter POS';
        case 'kiosk':
            return 'Customer Kiosk';
        case 'digital_menu':
            return 'Digital Menu';
        case 'terminal':
            return 'Cashier Terminal';
        default:
            return 'Service Terminal';
    }
}

export function getPaymentOptionsForSurface(surface: PaymentSurface): PaymentMethodOption[] {
    return PAYMENT_SURFACE_OPTIONS[surface];
}

export function normalizeDeviceMetadata(
    deviceType: HardwareDeviceType,
    metadata?: HardwareDeviceMetadata | null
): HardwareDeviceMetadata {
    const parsed = HardwareDeviceMetadataSchema.safeParse(metadata ?? {});
    const safeMetadata = parsed.success ? parsed.data : {};

    if (deviceType !== 'terminal') {
        return safeMetadata;
    }

    return {
        station_name: safeMetadata.station_name,
        settlement_mode: safeMetadata.settlement_mode ?? 'cashier',
        allowed_payment_methods: safeMetadata.allowed_payment_methods ?? ['cash', 'chapa'],
        receipt_mode: safeMetadata.receipt_mode ?? 'prompt',
        managed_mode: safeMetadata.managed_mode ?? 'dedicated',
        kiosk_required: safeMetadata.kiosk_required ?? true,
    };
}
