import { getKdsItemsByOrder, getPowerSync, updateOfflineOrderStatus } from '@/lib/sync';

export type SubmitKdsHandoffMode = 'local' | 'api';

export interface SubmitKdsHandoffInput {
    orderId: string;
    reason?: string;
}

export interface SubmitKdsHandoffResult {
    ok: boolean;
    mode?: SubmitKdsHandoffMode;
    error?: string;
}

function hasLocalRuntime(): boolean {
    return getPowerSync() !== null;
}

export async function submitFinalKdsHandoff(
    input: SubmitKdsHandoffInput
): Promise<SubmitKdsHandoffResult> {
    if (hasLocalRuntime()) {
        const items = await getKdsItemsByOrder(input.orderId);
        if (items.some(item => item.status !== 'ready')) {
            return {
                ok: false,
                error: 'Ticket is not fully ready for final handoff',
            };
        }

        const updated = await updateOfflineOrderStatus(input.orderId, 'served');
        if (updated) {
            return { ok: true, mode: 'local' };
        }
    }

    try {
        const response = await fetch(`/api/kds/orders/${input.orderId}/handoff`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'bump',
                reason: input.reason,
            }),
        });

        if (!response.ok) {
            const payload = (await response.json().catch(() => ({}))) as { error?: string };
            return {
                ok: false,
                error: payload.error ?? 'Failed to mark order served',
            };
        }

        return { ok: true, mode: 'api' };
    } catch {
        return { ok: false, error: 'Failed to mark order served' };
    }
}
