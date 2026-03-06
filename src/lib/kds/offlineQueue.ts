type KdsItemAction = 'start' | 'hold' | 'ready' | 'recall';
type ConflictResolutionMode = 'server-wins' | 'client-wins' | 'merge';

export interface QueuedKdsAction {
    id: string;
    orderId: string;
    itemId: string;
    kdsItemId: string;
    action: KdsItemAction;
    reason?: string;
    enqueuedAt: string;
    attempts: number;
    idempotencyKey: string;
}

export interface OfflineKdsQueueState {
    pendingActions: QueuedKdsAction[];
    lastSync: string | null;
    conflictResolution: ConflictResolutionMode;
}

const STORAGE_KEY = 'gebeta_kds_offline_queue_v1';

function defaultState(): OfflineKdsQueueState {
    return {
        pendingActions: [],
        lastSync: null,
        conflictResolution: 'server-wins',
    };
}

function safeParse(raw: string | null): OfflineKdsQueueState {
    if (!raw) return defaultState();
    try {
        const parsed = JSON.parse(raw) as Partial<OfflineKdsQueueState>;
        const pendingActions = Array.isArray(parsed.pendingActions)
            ? parsed.pendingActions.filter(
                  action =>
                      action &&
                      typeof action.id === 'string' &&
                      typeof action.kdsItemId === 'string' &&
                      typeof action.action === 'string'
              )
            : [];

        return {
            pendingActions: pendingActions as QueuedKdsAction[],
            lastSync: typeof parsed.lastSync === 'string' ? parsed.lastSync : null,
            conflictResolution:
                parsed.conflictResolution === 'client-wins' ||
                parsed.conflictResolution === 'merge' ||
                parsed.conflictResolution === 'server-wins'
                    ? parsed.conflictResolution
                    : 'server-wins',
        };
    } catch {
        return defaultState();
    }
}

function readState(): OfflineKdsQueueState {
    if (typeof window === 'undefined') return defaultState();
    return safeParse(window.localStorage.getItem(STORAGE_KEY));
}

function writeState(state: OfflineKdsQueueState) {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function getOfflineKdsQueue(): OfflineKdsQueueState {
    return readState();
}

export function enqueueKdsAction(
    action: Omit<QueuedKdsAction, 'id' | 'enqueuedAt' | 'attempts' | 'idempotencyKey'>
): QueuedKdsAction {
    const state = readState();
    const queued: QueuedKdsAction = {
        ...action,
        id: crypto.randomUUID(),
        enqueuedAt: new Date().toISOString(),
        attempts: 0,
        idempotencyKey: crypto.randomUUID(),
    };
    state.pendingActions.push(queued);
    writeState(state);
    return queued;
}

export function removeQueuedKdsAction(id: string) {
    const state = readState();
    state.pendingActions = state.pendingActions.filter(action => action.id !== id);
    writeState(state);
}

export function incrementKdsActionAttempts(id: string) {
    const state = readState();
    state.pendingActions = state.pendingActions.map(action =>
        action.id === id ? { ...action, attempts: action.attempts + 1 } : action
    );
    writeState(state);
}

export function markKdsQueueSynced() {
    const state = readState();
    state.lastSync = new Date().toISOString();
    writeState(state);
}

export function clearOfflineKdsQueue() {
    writeState(defaultState());
}
