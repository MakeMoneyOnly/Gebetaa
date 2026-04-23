import {
    closeOfflineTableSession,
    getOpenOfflineTableSessionByTableId,
    getPowerSync,
    openOfflineTableSession,
} from '@/lib/sync';

type TableUiStatus = 'available' | 'occupied' | 'reserved' | 'cleaning' | 'bill_requested';

export type SubmitTableStatusMode = 'local_session';

export interface SubmitTableStatusInput {
    restaurantId: string;
    tableId: string;
    status: TableUiStatus;
}

export interface SubmitTableStatusResult {
    ok: boolean;
    mode?: SubmitTableStatusMode;
    error?: string;
}

function hasLocalRuntime(): boolean {
    return getPowerSync() !== null;
}

const LOCAL_TABLE_RUNTIME_UNAVAILABLE_ERROR =
    'Local table command runtime unavailable. Pair to store gateway and retry.';

export async function submitTableStatusUpdate(
    input: SubmitTableStatusInput
): Promise<SubmitTableStatusResult> {
    if (!hasLocalRuntime()) {
        return {
            ok: false,
            error: LOCAL_TABLE_RUNTIME_UNAVAILABLE_ERROR,
        };
    }

    if (input.status === 'occupied') {
        const session = await openOfflineTableSession({
            restaurantId: input.restaurantId,
            tableId: input.tableId,
        });

        if (session) {
            return { ok: true, mode: 'local_session' };
        }
        return { ok: false, error: 'Failed to open local table session.' };
    }

    if (input.status === 'available') {
        const openSession = await getOpenOfflineTableSessionByTableId(input.tableId);
        if (!openSession) {
            return { ok: true, mode: 'local_session' };
        }

        const closed = await closeOfflineTableSession({
            sessionId: openSession.id,
            restaurantId: input.restaurantId,
            tableId: input.tableId,
        });

        if (closed) {
            return { ok: true, mode: 'local_session' };
        }
        return { ok: false, error: 'Failed to close local table session.' };
    }

    return {
        ok: false,
        error: `Table status ${input.status} requires gateway-owned table authority.`,
    };
}
