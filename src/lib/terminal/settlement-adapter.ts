import {
    closeOfflineTableSession,
    getOpenOfflineTableSessionByTableId,
    getPowerSync,
    updateOfflineOrderStatus,
    type OfflineOrderStatus,
} from '@/lib/sync';

type SettlementProvider = 'cash' | 'chapa' | 'other';

export type SubmitTerminalSettlementMode = 'local' | 'api';

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
    if (hasLocalRuntime() && canLocallySettle(input.paymentProvider)) {
        const openSession = await getOpenOfflineTableSessionByTableId(input.tableId);
        if (openSession) {
            const completedOrderIds: string[] = [];

            for (const order of input.orders) {
                if (!FINALIZABLE_ORDER_STATUSES.has(order.status)) continue;

                const updated = await updateOfflineOrderStatus(
                    order.id,
                    'completed' as OfflineOrderStatus
                );
                if (updated) {
                    completedOrderIds.push(order.id);
                }
            }

            const closed = await closeOfflineTableSession({
                sessionId: openSession.id,
                restaurantId: input.restaurantId,
                tableId: input.tableId,
            });

            if (closed) {
                return {
                    ok: true,
                    mode: 'local',
                    completedOrderIds,
                };
            }
        }
    }

    return {
        ok: true,
        mode: 'api',
    };
}
