import {
    closeOfflineTableSession,
    getOpenOfflineTableSessionByTableId,
    getPowerSync,
    updateOfflineOrderStatus,
    type OfflineOrderStatus,
} from '@/lib/sync';

type SettlementProvider = 'cash' | 'chapa' | 'other';

export type SubmitTerminalSettlementMode = 'local';

export interface LocalSettlementOrder {
    id: string;
    status: string;
}

export interface SubmitTerminalSettlementInput {
    restaurantId: string;
    tableId: string;
    paymentProvider: SettlementProvider;
    orders: LocalSettlementOrder[];
}

export interface SubmitTerminalSettlementResult {
    ok: boolean;
    mode?: SubmitTerminalSettlementMode;
    completedOrderIds?: string[];
    error?: string;
}

const FINALIZABLE_ORDER_STATUSES = new Set(['ready', 'served']);

function hasLocalRuntime(): boolean {
    return getPowerSync() !== null;
}

function canLocallySettle(provider: SettlementProvider): boolean {
    return provider === 'cash' || provider === 'other';
}

export async function submitTerminalSettlement(
    input: SubmitTerminalSettlementInput
): Promise<SubmitTerminalSettlementResult> {
    if (!hasLocalRuntime()) {
        return {
            ok: false,
            error: 'Local terminal settlement runtime unavailable. Pair to store gateway and retry.',
        };
    }

    if (!canLocallySettle(input.paymentProvider)) {
        return {
            ok: false,
            error: `Local settlement for ${input.paymentProvider} is not available yet.`,
        };
    }

    const openSession = await getOpenOfflineTableSessionByTableId(input.tableId);
    if (!openSession) {
        return {
            ok: false,
            error: 'No open local table session found for terminal settlement.',
        };
    }

    const completedOrderIds: string[] = [];

    for (const order of input.orders) {
        if (!FINALIZABLE_ORDER_STATUSES.has(order.status)) continue;

        const updated = await updateOfflineOrderStatus(order.id, 'completed' as OfflineOrderStatus);
        if (updated) {
            completedOrderIds.push(order.id);
        }
    }

    const closed = await closeOfflineTableSession({
        sessionId: openSession.id,
        restaurantId: input.restaurantId,
        tableId: input.tableId,
    });

    if (!closed) {
        return {
            ok: false,
            error: 'Failed to close local table session from terminal.',
        };
    }

    return {
        ok: true,
        mode: 'local',
        completedOrderIds,
    };
}
