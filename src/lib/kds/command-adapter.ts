import { executeKdsAction, getPowerSync } from '@/lib/sync';
import { addKdsActionToQueue } from '@/lib/kds/syncAdapter';

type KdsItemAction = 'start' | 'hold' | 'ready';

export type SubmitKdsItemActionMode = 'local' | 'api' | 'queued_legacy';

export interface SubmitKdsItemActionInput {
    orderId: string;
    itemId: string;
    kdsItemId?: string;
    action: KdsItemAction;
    isOnline: boolean;
    reason?: string;
}

export interface SubmitKdsItemActionResult {
    ok: boolean;
    mode?: SubmitKdsItemActionMode;
    error?: string;
}

function hasLocalKdsRuntime(): boolean {
    return getPowerSync() !== null;
}

async function queueLegacyKdsAction(
    input: Required<
        Pick<SubmitKdsItemActionInput, 'orderId' | 'itemId' | 'kdsItemId' | 'action'>
    > & {
        reason?: string;
    }
): Promise<SubmitKdsItemActionResult> {
    await addKdsActionToQueue({
        orderId: input.orderId,
        itemId: input.itemId,
        kdsItemId: input.kdsItemId,
        action: input.action,
        reason: input.reason,
    });

    return {
        ok: true,
        mode: 'queued_legacy',
    };
}

export function usesLegacyKdsActionReplay(): boolean {
    return !hasLocalKdsRuntime();
}

export async function submitKdsItemAction(
    input: SubmitKdsItemActionInput
): Promise<SubmitKdsItemActionResult> {
    if (!input.kdsItemId) {
        return {
            ok: false,
            error: 'Item sync pending. Refresh in a moment and retry.',
        };
    }

    if (hasLocalKdsRuntime()) {
        const success = await executeKdsAction(input.kdsItemId, input.action);
        if (success) {
            return {
                ok: true,
                mode: 'local',
            };
        }

        if (!input.isOnline) {
            return {
                ok: false,
                error: 'Local KDS command failed while offline.',
            };
        }
    }

    if (!input.isOnline) {
        return queueLegacyKdsAction({
            orderId: input.orderId,
            itemId: input.itemId,
            kdsItemId: input.kdsItemId,
            action: input.action,
        });
    }

    try {
        const response = await fetch(`/api/kds/items/${input.kdsItemId}/action`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-idempotency-key': crypto.randomUUID(),
            },
            body: JSON.stringify({
                action: input.action,
                reason: input.reason,
            }),
        });

        if (response.ok) {
            return {
                ok: true,
                mode: 'api',
            };
        }

        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        if (response.status >= 500) {
            return queueLegacyKdsAction({
                orderId: input.orderId,
                itemId: input.itemId,
                kdsItemId: input.kdsItemId,
                action: input.action,
                reason: input.reason ?? 'queued_after_server_error',
            });
        }

        return {
            ok: false,
            error: payload.error ?? 'Failed to update item',
        };
    } catch {
        return queueLegacyKdsAction({
            orderId: input.orderId,
            itemId: input.itemId,
            kdsItemId: input.kdsItemId,
            action: input.action,
            reason: input.reason ?? 'queued_after_network_error',
        });
    }
}
