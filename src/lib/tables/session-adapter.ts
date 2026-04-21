import {
    closeOfflineTableSession,
    getOpenOfflineTableSessionByTableId,
    getPowerSync,
    openOfflineTableSession,
} from '@/lib/sync';

type TableUiStatus = 'available' | 'occupied' | 'reserved' | 'cleaning' | 'bill_requested';

export type SubmitTableStatusMode = 'local_session' | 'api';

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

export async function submitTableStatusUpdate(
    input: SubmitTableStatusInput
): Promise<SubmitTableStatusResult> {
    if (hasLocalRuntime()) {
        if (input.status === 'occupied') {
            const session = await openOfflineTableSession({
                restaurantId: input.restaurantId,
                tableId: input.tableId,
            });

            if (session) {
                return { ok: true, mode: 'local_session' };
            }
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
        }
    }

    try {
        const response = await fetch(`/api/tables/${input.tableId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: input.status }),
        });

        if (!response.ok) {
            const payload = (await response.json().catch(() => ({}))) as { error?: string };
            return {
                ok: false,
                error: payload.error ?? 'Failed to update table status',
            };
        }

        return { ok: true, mode: 'api' };
    } catch {
        return { ok: false, error: 'Failed to update table status' };
    }
}
