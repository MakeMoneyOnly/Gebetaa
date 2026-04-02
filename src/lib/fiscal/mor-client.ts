export interface FiscalLineItem {
    item_code?: string | null;
    name: string;
    quantity: number;
    unit_price: number;
    tax_rate: number;
    total: number;
}

export interface FiscalSubmissionRequest {
    restaurant_tin: string;
    transaction_number: string;
    occurred_at: string;
    items: FiscalLineItem[];
    subtotal: number;
    tax_total: number;
    grand_total: number;
    order_id?: string | null;
}

export interface FiscalSubmissionResult {
    ok: boolean;
    mode: 'live' | 'stub';
    transaction_number: string;
    qr_payload?: string | null;
    digital_signature?: string | null;
    warning?: string | null;
    raw?: Record<string, unknown> | null;
}

export function isMorLiveConfigured(): boolean {
    return Boolean(process.env.MOR_FISCAL_API_URL && process.env.MOR_FISCAL_API_KEY);
}

export async function submitFiscalTransaction(
    request: FiscalSubmissionRequest
): Promise<FiscalSubmissionResult> {
    const endpoint = process.env.MOR_FISCAL_API_URL;
    const apiKey = process.env.MOR_FISCAL_API_KEY;

    if (!endpoint || !apiKey) {
        return {
            ok: true,
            mode: 'stub',
            transaction_number: request.transaction_number,
            qr_payload: `stub:${request.restaurant_tin}:${request.transaction_number}:${request.grand_total.toFixed(2)}`,
            digital_signature: `stub-signature-${request.transaction_number}`,
            warning:
                'MoR live API is not configured. Receipt remains in pending fiscalization mode.',
        };
    }

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(request),
    });

    const payload = (await response.json().catch(() => null)) as Record<string, unknown> | null;

    if (!response.ok) {
        throw new Error(
            String(payload?.error ?? payload?.message ?? 'MoR fiscal submission failed')
        );
    }

    return {
        ok: true,
        mode: 'live',
        transaction_number: String(
            payload?.transaction_number ?? payload?.invoice_number ?? request.transaction_number
        ),
        qr_payload: payload?.qr_payload !== undefined ? String(payload.qr_payload) : null,
        digital_signature:
            payload?.digital_signature !== undefined ? String(payload.digital_signature) : null,
        raw: payload,
    };
}
