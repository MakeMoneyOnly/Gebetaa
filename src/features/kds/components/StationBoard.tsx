'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ChefHat,
    RefreshCw,
    Maximize2,
    AlertCircle,
    LayoutList,
    Grid3X3,
    List,
} from 'lucide-react';
import { format } from 'date-fns';
import { useRole } from '@/features/auth/hooks/useRole';
import type { UnifiedKDSOrder } from '@/app/api/kds/queue/route';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useKDSRealtime } from '@/features/kds/hooks/useKDSRealtime';
import { readKdsQueue, readKdsSettings } from '@/features/kds/lib/read-adapter';
import {
    getOfflineKdsQueueCount,
    getPendingKdsActions,
    clearSyncedKdsActions,
} from '@/features/kds/lib/syncAdapter';
import { submitKdsItemAction, usesLegacyKdsActionReplay } from '@/features/kds/lib/command-adapter';
import { submitOrderCourseFireUpdate } from '@/lib/orders/command-adapter';

type StationType = 'kitchen' | 'bar' | 'dessert' | 'coffee' | 'grill' | 'cold';
type ViewMode = 'grid' | 'list';
type KdsItemAction = 'start' | 'hold' | 'ready';
type CourseType = 'appetizer' | 'main' | 'dessert' | 'beverage' | 'side';
type AlertPolicy = {
    new_ticket_sound: boolean;
    sla_breach_visual: boolean;
    recall_visual: boolean;
    quiet_hours_enabled: boolean;
    quiet_hours_start: string;
    quiet_hours_end: string;
};
type PrintMode = 'off' | 'fallback' | 'always';
type PrintPolicy = {
    mode: PrintMode;
    provider: 'log' | 'webhook';
    webhook_url: string | null;
    copies: number;
    timeout_ms: number;
    max_attempts: number;
    base_backoff_ms: number;
};

type StationBoardProps = {
    station: StationType;
    title: string;
    accentClassName: string;
    restaurantIdOverride?: string | null;
    headerSlot?: React.ReactNode;
};

const COURSE_SEQUENCE: CourseType[] = ['appetizer', 'main', 'dessert', 'beverage', 'side'];

function courseLabel(course: CourseType | null | undefined): string {
    if (!course) return 'Appetizer';
    if (course === 'main') return 'Main';
    return course.charAt(0).toUpperCase() + course.slice(1);
}

function nextCourse(course: CourseType | null | undefined): CourseType | null {
    const current: CourseType = course ?? 'appetizer';
    const index = COURSE_SEQUENCE.indexOf(current);
    if (index < 0 || index >= COURSE_SEQUENCE.length - 1) return null;
    return COURSE_SEQUENCE[index + 1];
}

function allowedActions(status: string): KdsItemAction[] {
    switch (status) {
        case 'queued':
            return ['start', 'hold'];
        case 'in_progress':
            return ['ready', 'hold'];
        case 'on_hold':
            return ['start'];
        case 'ready':
            return [];
        case 'recalled':
            return ['start'];
        default:
            return [];
    }
}

function statusLabel(status: string) {
    if (status === 'in_progress') return 'In Progress';
    if (status === 'on_hold') return 'On Hold';
    if (status === 'recalled') return 'On Hold';
    return status.replace('_', ' ').replace(/\b\w/g, ch => ch.toUpperCase());
}

function actionLabel(action: KdsItemAction) {
    if (action === 'start') return 'Start';
    if (action === 'hold') return 'Hold';
    return 'Ready';
}

function getModifierStyle(modifier: string): string {
    const lower = modifier.toLowerCase();
    const exclusionPattern = /\b(no|without|hold|minus|remove|skip)\b/;
    const additionPattern = /\b(extra|add|with|plus|double)\b/;

    if (exclusionPattern.test(lower)) {
        return 'bg-red-50 text-red-700 ring-red-200';
    }
    if (additionPattern.test(lower)) {
        return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
    }
    return 'bg-sky-50 text-sky-700 ring-sky-200';
}

function urgencyStyles(
    elapsedMinutes: number,
    slaMinutes = 30
): {
    card: string;
    header: string;
    timer: string;
} {
    const pct = elapsedMinutes / slaMinutes;
    if (pct >= 1) {
        // SLA breached — danger
        return {
            card: 'border-state-danger-bg bg-state-danger-bg/20 animate-[slaPulse_2s_ease-in-out_infinite] ring-2 ring-state-danger/10',
            header: 'border-state-danger/10 bg-state-danger-bg/40',
            timer: 'font-black text-state-danger',
        };
    }
    if (pct >= 0.75) {
        // At risk — warning
        return {
            card: 'border-state-warning-bg bg-state-warning-bg/20 ring-1 ring-state-warning/10',
            header: 'border-state-warning/10 bg-state-warning-bg/40',
            timer: 'font-bold text-state-warning',
        };
    }
    // On track — clean
    return {
        card: 'border-brand-neutral-soft/10 bg-white shadow-soft',
        header: 'border-brand-neutral-soft/5 bg-brand-canvas-alt/50',
        timer: 'font-bold text-brand-neutral',
    };
}

const DEFAULT_ALERT_POLICY: AlertPolicy = {
    new_ticket_sound: true,
    sla_breach_visual: true,
    recall_visual: true,
    quiet_hours_enabled: false,
    quiet_hours_start: '23:00',
    quiet_hours_end: '06:00',
};
const DEFAULT_PRINT_POLICY: PrintPolicy = {
    mode: 'off',
    provider: 'log',
    webhook_url: null,
    copies: 1,
    timeout_ms: 4000,
    max_attempts: 4,
    base_backoff_ms: 400,
};

function normalizeAlertPolicy(input: unknown): AlertPolicy {
    const raw = (input ?? {}) as Record<string, unknown>;
    return {
        new_ticket_sound:
            typeof raw.new_ticket_sound === 'boolean'
                ? raw.new_ticket_sound
                : DEFAULT_ALERT_POLICY.new_ticket_sound,
        sla_breach_visual:
            typeof raw.sla_breach_visual === 'boolean'
                ? raw.sla_breach_visual
                : DEFAULT_ALERT_POLICY.sla_breach_visual,
        recall_visual:
            typeof raw.recall_visual === 'boolean'
                ? raw.recall_visual
                : DEFAULT_ALERT_POLICY.recall_visual,
        quiet_hours_enabled:
            typeof raw.quiet_hours_enabled === 'boolean'
                ? raw.quiet_hours_enabled
                : DEFAULT_ALERT_POLICY.quiet_hours_enabled,
        quiet_hours_start:
            typeof raw.quiet_hours_start === 'string'
                ? raw.quiet_hours_start
                : DEFAULT_ALERT_POLICY.quiet_hours_start,
        quiet_hours_end:
            typeof raw.quiet_hours_end === 'string'
                ? raw.quiet_hours_end
                : DEFAULT_ALERT_POLICY.quiet_hours_end,
    };
}

function normalizePrintPolicy(input: unknown): PrintPolicy {
    const raw = (input ?? {}) as Record<string, unknown>;
    return {
        mode:
            raw.mode === 'fallback' || raw.mode === 'always' || raw.mode === 'off'
                ? raw.mode
                : DEFAULT_PRINT_POLICY.mode,
        provider:
            raw.provider === 'webhook' || raw.provider === 'log'
                ? raw.provider
                : DEFAULT_PRINT_POLICY.provider,
        webhook_url:
            typeof raw.webhook_url === 'string' && raw.webhook_url.trim().length > 0
                ? raw.webhook_url.trim()
                : null,
        copies:
            typeof raw.copies === 'number' && Number.isFinite(raw.copies)
                ? Math.max(1, Math.min(5, Math.floor(raw.copies)))
                : DEFAULT_PRINT_POLICY.copies,
        timeout_ms:
            typeof raw.timeout_ms === 'number' && Number.isFinite(raw.timeout_ms)
                ? Math.max(1000, Math.min(20000, Math.floor(raw.timeout_ms)))
                : DEFAULT_PRINT_POLICY.timeout_ms,
        max_attempts:
            typeof raw.max_attempts === 'number' && Number.isFinite(raw.max_attempts)
                ? Math.max(1, Math.min(8, Math.floor(raw.max_attempts)))
                : DEFAULT_PRINT_POLICY.max_attempts,
        base_backoff_ms:
            typeof raw.base_backoff_ms === 'number' && Number.isFinite(raw.base_backoff_ms)
                ? Math.max(100, Math.min(5000, Math.floor(raw.base_backoff_ms)))
                : DEFAULT_PRINT_POLICY.base_backoff_ms,
    };
}

function parseTimeToMinutes(value: string): number | null {
    const match = /^(\d{2}):(\d{2})$/.exec(value);
    if (!match) return null;
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
    return hours * 60 + minutes;
}

function isQuietHours(policy: AlertPolicy, now = new Date()): boolean {
    if (!policy.quiet_hours_enabled) return false;
    const start = parseTimeToMinutes(policy.quiet_hours_start);
    const end = parseTimeToMinutes(policy.quiet_hours_end);
    if (start === null || end === null) return false;

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    if (start === end) return true;
    if (start < end) {
        return currentMinutes >= start && currentMinutes < end;
    }
    return currentMinutes >= start || currentMinutes < end;
}

function playAlertTone() {
    if (typeof window === 'undefined') return;
    const Context =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Context) return;

    const audio = new Context();
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();

    oscillator.type = 'triangle';
    oscillator.frequency.value = 880;
    gain.gain.value = 0.05;

    oscillator.connect(gain);
    gain.connect(audio.destination);

    const now = audio.currentTime;
    oscillator.start(now);
    oscillator.stop(now + 0.12);
    oscillator.onended = () => {
        void audio.close().catch(() => undefined);
    };
}

export function StationBoard({
    station,
    title,
    accentClassName,
    restaurantIdOverride,
    headerSlot,
}: StationBoardProps) {
    const searchParams = useSearchParams();
    const queryRestaurantId = searchParams.get('restaurantId');
    const { restaurantId: roleRestaurantId, loading: roleLoading } = useRole(queryRestaurantId);
    const restaurantId = restaurantIdOverride || queryRestaurantId || roleRestaurantId;
    const previousOrderIdsRef = useRef<string[]>([]);
    // alertPolicyRef mirrors alertPolicy state so fetchQueue can read it
    // without needing alertPolicy as a useCallback dependency (which caused
    // fetchKdsSettings → setAlertPolicy → fetchQueue recreated → useEffect
    // re-fired with background=false → isLoading(true) → flicker).
    const alertPolicyRef = useRef<AlertPolicy>(DEFAULT_ALERT_POLICY);
    const [alertPolicy, setAlertPolicy] = useState<AlertPolicy>(DEFAULT_ALERT_POLICY);
    const [selectedItemKey, setSelectedItemKey] = useState<string | null>(null);
    const [showPrepSummary, setShowPrepSummary] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [slaMinutes] = useState(30);
    // Tracks whether we have ever successfully completed a fetch.
    // Loading screen is only shown before the first successful load.
    const hasEverLoadedRef = useRef(false);

    const [orders, setOrders] = useState<UnifiedKDSOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [actionKey, setActionKey] = useState<string | null>(null);
    const [advancingCourseOrderId, setAdvancingCourseOrderId] = useState<string | null>(null);
    const [isOnline, setIsOnline] = useState(true);
    const [queuedActionCount, setQueuedActionCount] = useState(0);
    const [syncingOfflineActions, setSyncingOfflineActions] = useState(false);
    const [printPolicy, setPrintPolicy] = useState<PrintPolicy>(DEFAULT_PRINT_POLICY);
    const [printingOrderId, setPrintingOrderId] = useState<string | null>(null);
    const [clock, setClock] = useState(new Date());
    const { isConnected: realtimeConnected } = useKDSRealtime({
        restaurantId: restaurantId ?? '',
        enabled: Boolean(restaurantId),
    });

    useEffect(() => {
        const timer = setInterval(() => setClock(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (typeof navigator !== 'undefined') {
            setIsOnline(navigator.onLine);
        }
        // Use new adapter for queue count
        getOfflineKdsQueueCount().then(count => setQueuedActionCount(count));

        const onOnline = () => setIsOnline(true);
        const onOffline = () => setIsOnline(false);
        window.addEventListener('online', onOnline);
        window.addEventListener('offline', onOffline);
        return () => {
            window.removeEventListener('online', onOnline);
            window.removeEventListener('offline', onOffline);
        };
    }, []);

    const fetchQueue = useCallback(
        async (background = false) => {
            if (!restaurantId) {
                setOrders([]);
                setIsLoading(false);
                return;
            }

            // Only show the full-screen loader on the very first fetch.
            // Subsequent calls (background polls, realtime re-syncs) never
            // set isLoading=true so the KDS board never disappears.
            if (!background && !hasEverLoadedRef.current) {
                setIsLoading(true);
            } else {
                setIsRefreshing(true);
            }

            try {
                const result = await readKdsQueue({
                    station,
                    limit: 100,
                    slaMinutes: 30,
                });

                if (!result.ok || !result.data) {
                    setError(result.error ?? 'Failed to fetch KDS queue');
                    return;
                }

                const nextOrders = (result.data.orders ?? []) as UnifiedKDSOrder[];
                // Read alertPolicy from ref — avoids adding it to deps which
                // would cause fetchQueue to recreate on every settings refresh.
                const policy = alertPolicyRef.current;
                if (background) {
                    const previousIds = new Set(previousOrderIdsRef.current);
                    const hasNewTicket = nextOrders.some(order => !previousIds.has(order.id));
                    if (hasNewTicket && policy.new_ticket_sound && !isQuietHours(policy)) {
                        playAlertTone();
                    }
                }
                previousOrderIdsRef.current = nextOrders.map(order => order.id);
                setOrders(nextOrders);
                setError(null);
                hasEverLoadedRef.current = true;
            } catch {
                setError('Failed to fetch KDS queue');
            } finally {
                setIsLoading(false);
                setIsRefreshing(false);
            }
        },
        // alertPolicy intentionally omitted — read via alertPolicyRef instead.

        [restaurantId, station]
    );

    const fetchKdsSettings = useCallback(async () => {
        if (!restaurantId) return;
        try {
            const result = await readKdsSettings();
            if (!result.ok || !result.data) {
                return;
            }
            const normalized = normalizeAlertPolicy(result.data.alert_policy);
            const normalizedPrint = normalizePrintPolicy(result.data.print_policy);
            // Keep ref in sync so fetchQueue always sees the latest policy.
            alertPolicyRef.current = normalized;
            setAlertPolicy(normalized);
            setPrintPolicy(normalizedPrint);
        } catch {
            // Keep defaults if settings fail to load.
        }
    }, [restaurantId]);

    useEffect(() => {
        if (!roleLoading) {
            void fetchQueue();
            void fetchKdsSettings();
        }
    }, [fetchKdsSettings, fetchQueue, roleLoading]);

    useEffect(() => {
        const interval = setInterval(() => {
            void fetchQueue(true);
        }, 15000);
        return () => clearInterval(interval);
    }, [fetchQueue]);

    useEffect(() => {
        const interval = setInterval(() => {
            void fetchKdsSettings();
        }, 60_000);
        return () => clearInterval(interval);
    }, [fetchKdsSettings]);

    const stationOrders = useMemo(() => {
        return orders.map(order => ({
            ...order,
            stationItems: (order.items ?? []).filter(
                item => (item.station ?? 'kitchen') === station
            ),
        }));
    }, [orders, station]);

    const actionableItems = useMemo(() => {
        return stationOrders.flatMap(order =>
            order.stationItems
                .map(item => ({
                    orderId: order.id,
                    itemId: item.id,
                    kdsItemId: item.kds_item_id,
                    status: item.status ?? 'queued',
                    name: item.name,
                }))
                .filter(item => allowedActions(item.status).length > 0)
        );
    }, [stationOrders]);

    const applyOptimisticItemStatus = useCallback(
        (orderId: string, itemId: string, action: KdsItemAction) => {
            const nextStatus =
                action === 'start' ? 'in_progress' : action === 'hold' ? 'on_hold' : 'ready';
            setOrders(current =>
                current.map(order => {
                    if (order.id !== orderId) return order;
                    return {
                        ...order,
                        items: (order.items ?? []).map(item =>
                            item.id === itemId ? { ...item, status: nextStatus } : item
                        ),
                    };
                })
            );
        },
        []
    );

    const handlePrintTicket = useCallback(
        async (orderId: string, reason: string) => {
            if (printPolicy.mode === 'off') return;
            setPrintingOrderId(orderId);
            try {
                const response = await fetch(`/api/kds/orders/${orderId}/print`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ reason }),
                });
                const payload = await response.json().catch(() => ({}));
                if (!response.ok) {
                    setError(payload?.error ?? 'Failed to dispatch printer fallback');
                    return;
                }
                setError(null);
            } finally {
                setPrintingOrderId(null);
            }
        },
        [printPolicy.mode]
    );

    const syncOfflineActions = useCallback(async () => {
        if (!isOnline || syncingOfflineActions) return;
        if (!usesLegacyKdsActionReplay()) {
            setQueuedActionCount(0);
            return;
        }

        const pendingActions = await getPendingKdsActions();
        if (pendingActions.length === 0) {
            setQueuedActionCount(0);
            return;
        }

        setSyncingOfflineActions(true);
        try {
            await clearSyncedKdsActions();
            setQueuedActionCount(await getOfflineKdsQueueCount());
            await fetchQueue(true);
        } finally {
            setSyncingOfflineActions(false);
        }
    }, [fetchQueue, isOnline, syncingOfflineActions]);

    useEffect(() => {
        if (!isOnline) return;
        if (queuedActionCount === 0) return;
        void syncOfflineActions();
    }, [isOnline, queuedActionCount, syncOfflineActions]);

    useEffect(() => {
        if (!isOnline) return;
        const timer = setInterval(() => {
            void syncOfflineActions();
        }, 20_000);
        return () => clearInterval(timer);
    }, [isOnline, syncOfflineActions]);

    const handleItemAction = useCallback(
        async (
            orderId: string,
            itemId: string,
            kdsItemId: string | undefined,
            action: KdsItemAction
        ) => {
            const key = `${orderId}:${itemId}:${action}`;
            setActionKey(key);

            try {
                if (!kdsItemId) {
                    setError('Item sync pending. Refresh in a moment and retry.');
                    return;
                }

                const result = await submitKdsItemAction({
                    orderId,
                    itemId,
                    kdsItemId,
                    action,
                    isOnline,
                });

                if (!result.ok) {
                    setError(result.error ?? 'Failed to update item');
                    return;
                }

                applyOptimisticItemStatus(orderId, itemId, action);
                const count = await getOfflineKdsQueueCount();
                setQueuedActionCount(count);
                setError(null);

                if (printPolicy.mode === 'always') {
                    await handlePrintTicket(orderId, 'kds_action_print_mode_always');
                }
            } finally {
                setActionKey(null);
            }
        },
        [applyOptimisticItemStatus, fetchQueue, handlePrintTicket, isOnline, printPolicy.mode]
    );

    const handleAdvanceCourse = useCallback(
        async (order: UnifiedKDSOrder) => {
            if (order.fireMode !== 'manual') return;
            const next = nextCourse(order.currentCourse as CourseType | null | undefined);
            if (!next) return;

            setAdvancingCourseOrderId(order.id);
            try {
                const result = await submitOrderCourseFireUpdate({
                    orderId: order.id,
                    fireMode: 'manual',
                    currentCourse: next,
                });
                if (!result.ok) {
                    setError(result.error ?? 'Failed to advance course');
                    return;
                }
                setError(null);
                setOrders(current =>
                    current.map(currentOrder =>
                        currentOrder.id === order.id
                            ? { ...currentOrder, currentCourse: next }
                            : currentOrder
                    )
                );
            } finally {
                setAdvancingCourseOrderId(null);
            }
        },
        [fetchQueue]
    );

    useEffect(() => {
        if (actionableItems.length === 0) {
            setSelectedItemKey(null);
            return;
        }
        if (
            selectedItemKey &&
            actionableItems.some(item => `${item.orderId}:${item.itemId}` === selectedItemKey)
        ) {
            return;
        }
        setSelectedItemKey(`${actionableItems[0].orderId}:${actionableItems[0].itemId}`);
    }, [actionableItems, selectedItemKey]);

    const selectedActionableItem = useMemo(() => {
        if (!selectedItemKey) return null;
        return (
            actionableItems.find(item => `${item.orderId}:${item.itemId}` === selectedItemKey) ??
            null
        );
    }, [actionableItems, selectedItemKey]);

    const runSelectedItemAction = useCallback(
        (preferredAction?: KdsItemAction) => {
            if (!selectedActionableItem) return;
            const actions = allowedActions(selectedActionableItem.status);
            const actionToRun =
                preferredAction && actions.includes(preferredAction) ? preferredAction : actions[0];
            if (!actionToRun) return;
            void handleItemAction(
                selectedActionableItem.orderId,
                selectedActionableItem.itemId,
                selectedActionableItem.kdsItemId,
                actionToRun
            );
        },
        [handleItemAction, selectedActionableItem]
    );

    useEffect(() => {
        const handler = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement | null;
            const tag = target?.tagName?.toLowerCase();
            if (
                tag === 'input' ||
                tag === 'textarea' ||
                tag === 'select' ||
                target?.isContentEditable
            ) {
                return;
            }

            if (event.key >= '1' && event.key <= '9') {
                const index = Number(event.key) - 1;
                const item = actionableItems[index];
                if (item) {
                    setSelectedItemKey(`${item.orderId}:${item.itemId}`);
                    event.preventDefault();
                }
                return;
            }

            if (event.key === 'ArrowDown' || event.key.toLowerCase() === 'j') {
                if (actionableItems.length === 0) return;
                const currentIndex = actionableItems.findIndex(
                    item => `${item.orderId}:${item.itemId}` === selectedItemKey
                );
                const nextIndex =
                    currentIndex < 0 ? 0 : Math.min(actionableItems.length - 1, currentIndex + 1);
                const next = actionableItems[nextIndex];
                if (next) {
                    setSelectedItemKey(`${next.orderId}:${next.itemId}`);
                    event.preventDefault();
                }
                return;
            }

            if (event.key === 'ArrowUp' || event.key.toLowerCase() === 'k') {
                if (actionableItems.length === 0) return;
                const currentIndex = actionableItems.findIndex(
                    item => `${item.orderId}:${item.itemId}` === selectedItemKey
                );
                const nextIndex = currentIndex < 0 ? 0 : Math.max(0, currentIndex - 1);
                const next = actionableItems[nextIndex];
                if (next) {
                    setSelectedItemKey(`${next.orderId}:${next.itemId}`);
                    event.preventDefault();
                }
                return;
            }

            if (event.key === 'Enter') {
                runSelectedItemAction();
                event.preventDefault();
                return;
            }

            const key = event.key.toLowerCase();
            if (key === 's') {
                runSelectedItemAction('start');
                event.preventDefault();
                return;
            }
            if (key === 'h') {
                runSelectedItemAction('hold');
                event.preventDefault();
                return;
            }
            if (key === 'r') {
                runSelectedItemAction('ready');
                event.preventDefault();
            }
        };

        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [actionableItems, runSelectedItemAction, selectedItemKey]);

    const breachedCount = useMemo(
        () => stationOrders.filter(order => order.slaStatus === 'breached').length,
        [stationOrders]
    );

    // ── Prep density summary: aggregate uncompleted item counts ──────────────
    const prepSummary = useMemo(() => {
        const counts = new Map<string, number>();
        for (const order of stationOrders) {
            for (const item of order.stationItems) {
                if (item.status === 'ready') continue; // skip completed
                const key = item.name;
                counts.set(key, (counts.get(key) ?? 0) + item.quantity);
            }
        }
        return Array.from(counts.entries())
            .map(([name, qty]) => ({ name, qty }))
            .sort((a, b) => b.qty - a.qty);
    }, [stationOrders]);

    useEffect(() => {
        if (!restaurantId) return;
        const sendHeartbeat = async () => {
            const payload = {
                station,
                realtime_connected: realtimeConnected,
                queue_size: stationOrders.length,
                breached_tickets: breachedCount,
            };
            try {
                await fetch(`/api/kds/telemetry?restaurant_id=${restaurantId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
            } catch {
                // Telemetry failure should not impact KDS workflow.
            }
        };

        void sendHeartbeat();
        const interval = setInterval(() => {
            void sendHeartbeat();
        }, 30_000);
        return () => clearInterval(interval);
    }, [breachedCount, realtimeConnected, restaurantId, station, stationOrders.length]);

    const toggleFullScreen = useCallback(() => {
        if (!document.fullscreenElement) {
            void document.documentElement.requestFullscreen();
            return;
        }
        void document.exitFullscreen();
    }, []);

    if (isLoading || roleLoading) {
        return (
            <div className="bg-brand-canvas flex h-screen items-center justify-center">
                <div className="text-brand-neutral text-center font-bold tracking-tight">
                    <h1 className="sr-only">Loading {title} queue</h1>
                    Loading {title} queue...
                </div>
            </div>
        );
    }

    return (
        <div className="font-manrope bg-brand-canvas text-brand-ink flex h-full min-h-0 flex-col">
            <div className="bg-brand-canvas/90 z-10 flex items-start justify-between px-8 py-8 backdrop-blur-sm">
                <div>
                    <h1 className="text-brand-ink-strong text-5xl font-bold tracking-tight">
                        {title}
                    </h1>
                    <div className="text-micro text-brand-neutral mt-3 flex items-center gap-3 font-bold tracking-wider uppercase">
                        <span className={`rounded-full px-3 py-1 ${accentClassName}`}>
                            {stationOrders.length} Tickets
                        </span>
                        <span>{format(clock, 'EEE, MMM d HH:mm')}</span>
                        <span
                            className={`rounded-full px-3 py-1 font-bold ${
                                realtimeConnected
                                    ? 'bg-state-success-bg/30 text-state-success'
                                    : 'bg-state-warning-bg/30 text-state-warning'
                            }`}
                        >
                            {realtimeConnected ? 'Realtime Connected' : 'Realtime Degraded'}
                        </span>
                        <span
                            className={`rounded-full px-3 py-1 font-bold ${
                                isOnline
                                    ? 'bg-state-success-bg/30 text-state-success'
                                    : 'bg-state-danger-bg/30 text-state-danger'
                            }`}
                        >
                            {isOnline ? 'Network Online' : 'Offline Mode'}
                        </span>
                        {queuedActionCount > 0 ? (
                            <span className="bg-state-info-bg/30 text-state-info rounded-full px-3 py-1 font-bold">
                                Queued Actions: {queuedActionCount}
                            </span>
                        ) : null}
                        <span className="bg-brand-canvas-alt text-brand-neutral rounded-full px-3 py-1 font-bold">
                            Print: {printPolicy.mode}
                        </span>
                        {breachedCount > 0 && (
                            <span className="bg-state-danger animate-pulse rounded-full px-3 py-1 font-bold text-white">
                                ⚠ {breachedCount} SLA BREACH{breachedCount > 1 ? 'ES' : ''}
                            </span>
                        )}
                    </div>
                    <p className="text-micro text-brand-neutral mt-2 font-bold tracking-wider uppercase">
                        Bump-bar keys: `1-9` select, `S` start, `H` hold, `R` ready, `Enter` run
                    </p>
                    <nav className="text-micro mt-4 flex flex-wrap gap-2 font-bold tracking-wider uppercase">
                        <Link
                            href="/kds"
                            className={`rounded-full px-3 py-1 transition-all ${station === 'kitchen' ? 'bg-brand-ink shadow-medium text-white' : 'text-brand-neutral hover:bg-brand-canvas-alt bg-white'}`}
                        >
                            Kitchen
                        </Link>
                        <Link
                            href="/bar"
                            className={`rounded-full px-3 py-1 transition-all ${station === 'bar' ? 'bg-brand-ink shadow-medium text-white' : 'text-brand-neutral hover:bg-brand-canvas-alt bg-white'}`}
                        >
                            Bar
                        </Link>
                        <Link
                            href="/dessert"
                            className={`rounded-full px-3 py-1 transition-all ${station === 'dessert' ? 'bg-brand-ink shadow-medium text-white' : 'text-brand-neutral hover:bg-brand-canvas-alt bg-white'}`}
                        >
                            Dessert
                        </Link>
                        <Link
                            href="/coffee"
                            className={`rounded-full px-3 py-1 transition-all ${station === 'coffee' ? 'bg-brand-ink shadow-medium text-white' : 'text-brand-neutral hover:bg-brand-canvas-alt bg-white'}`}
                        >
                            Coffee
                        </Link>
                        <Link
                            href="/expeditor"
                            className="text-brand-neutral hover:bg-brand-canvas-alt rounded-full bg-white px-3 py-1 transition-all"
                        >
                            Expeditor
                        </Link>
                    </nav>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowPrepSummary(v => !v)}
                        className={`flex h-11 items-center gap-2 rounded-xl border px-3 text-sm font-semibold transition ${
                            showPrepSummary
                                ? 'border-gray-900 bg-gray-900 text-white'
                                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-100'
                        }`}
                        title="Toggle prep summary"
                    >
                        <LayoutList className="h-4 w-4" />
                        Prep List
                    </button>
                    <button
                        onClick={() => setViewMode(v => (v === 'grid' ? 'list' : 'grid'))}
                        className={`flex h-11 items-center gap-2 rounded-xl border px-3 text-sm font-semibold transition ${
                            viewMode === 'list'
                                ? 'border-gray-900 bg-gray-900 text-white'
                                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-100'
                        }`}
                        title={viewMode === 'grid' ? 'Switch to list view' : 'Switch to grid view'}
                    >
                        {viewMode === 'grid' ? (
                            <>
                                <List className="h-4 w-4" /> List
                            </>
                        ) : (
                            <>
                                <Grid3X3 className="h-4 w-4" /> Grid
                            </>
                        )}
                    </button>
                    <button
                        onClick={() => void fetchQueue(true)}
                        className="flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-100"
                        title="Refresh queue"
                    >
                        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={() => void syncOfflineActions()}
                        disabled={!isOnline || queuedActionCount === 0 || syncingOfflineActions}
                        className="flex h-11 items-center justify-center rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                        title="Sync queued offline actions"
                    >
                        {syncingOfflineActions ? 'Syncing...' : `Sync ${queuedActionCount}`}
                    </button>
                    <button
                        onClick={toggleFullScreen}
                        className="bg-brand-accent flex h-11 w-11 items-center justify-center rounded-xl text-black hover:brightness-105"
                        title="Toggle full screen"
                    >
                        <Maximize2 className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {headerSlot ? <div className="mx-8 mb-4">{headerSlot}</div> : null}

            {/* ── Prep Summary Sidebar ──────────────────────────────────── */}
            {showPrepSummary && (
                <aside className="mx-8 mb-4 rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                        <h2 className="text-sm font-black tracking-widest text-gray-500 uppercase">
                            Prep Density — {title}
                        </h2>
                        <span className="text-xs text-gray-400">
                            {prepSummary.reduce((s, i) => s + i.qty, 0)} items across{' '}
                            {stationOrders.length} tickets
                        </span>
                    </div>
                    {prepSummary.length === 0 ? (
                        <p className="p-4 text-sm text-gray-400">
                            All items are complete or no active tickets.
                        </p>
                    ) : (
                        <ul className="divide-y divide-gray-50">
                            {prepSummary.map(({ name, qty }) => (
                                <li
                                    key={name}
                                    className="flex items-center justify-between px-4 py-2.5"
                                >
                                    <span className="text-sm font-semibold text-gray-800">
                                        {name}
                                    </span>
                                    <span className="flex h-7 min-w-[28px] items-center justify-center rounded-full bg-gray-900 px-2 text-xs font-black text-white">
                                        ×{qty}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </aside>
            )}

            {error ? (
                <div className="mx-8 mb-3 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                </div>
            ) : null}

            {alertPolicy.sla_breach_visual && breachedCount > 0 ? (
                <div className="mx-8 mb-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
                    {breachedCount} ticket{breachedCount === 1 ? '' : 's'} exceeded SLA.
                </div>
            ) : null}

            <main
                data-lenis-prevent
                data-lenis-prevent-wheel
                className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-8 pb-8"
            >
                <div
                    className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4' : 'grid-cols-1'}`}
                >
                    {stationOrders.map(order => {
                        const urgency = urgencyStyles(order.elapsedMinutes, slaMinutes);
                        // Combine source color with urgency styles
                        const sourceBorder = order.sourceColor ? `border-l-4` : '';
                        const sourceBorderColor = order.sourceColor
                            ? { borderLeftColor: order.sourceColor }
                            : {};
                        return (
                            <section
                                key={order.id}
                                className={`shadow-soft w-full min-w-0 overflow-hidden rounded-4xl border transition-all ${urgency.card} ${sourceBorder}`}
                                style={sourceBorderColor}
                            >
                                <header className={`border-b px-5 py-4 ${urgency.header}`}>
                                    <div className="flex items-center justify-between">
                                        <p className="text-brand-neutral text-micro font-bold tracking-wider uppercase">
                                            Order #{order.orderNumber}
                                        </p>
                                        {order.sourceLabel && (
                                            <span
                                                className="text-micro rounded-full px-2 py-0.5 font-bold tracking-wide text-white uppercase"
                                                style={{
                                                    backgroundColor: order.sourceColor || '#6B7280',
                                                }}
                                            >
                                                {order.sourceLabel}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-brand-ink mt-1 text-3xl font-black tracking-tight">
                                        {order.tableNumber
                                            ? `Table ${order.tableNumber}`
                                            : (order.customerName ?? 'Guest')}
                                    </p>
                                    <p className={`mt-1 text-xs ${urgency.timer}`}>
                                        {order.elapsedMinutes}m elapsed ·{' '}
                                        {statusLabel(order.status)}
                                        {order.slaStatus === 'breached' && (
                                            <span className="ml-2">🔴 SLA EXCEEDED</span>
                                        )}
                                        {order.slaStatus === 'at_risk' && (
                                            <span className="ml-2">🟡 AT RISK</span>
                                        )}
                                    </p>
                                    {order.fireMode === 'manual' ? (
                                        <div className="mt-2 flex flex-wrap items-center gap-2">
                                            <span className="bg-brand-info-bg/30 text-micro text-brand-info rounded-full px-2.5 py-1 font-bold tracking-wider uppercase">
                                                Active course:{' '}
                                                {courseLabel(
                                                    order.currentCourse as CourseType | null
                                                )}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => void handleAdvanceCourse(order)}
                                                disabled={
                                                    advancingCourseOrderId === order.id ||
                                                    nextCourse(
                                                        order.currentCourse as CourseType | null
                                                    ) === null
                                                }
                                                className="bg-brand-canvas-alt text-micro text-brand-neutral hover:bg-brand-neutral-soft/10 hover:text-brand-ink rounded-full px-3 py-1 font-bold tracking-wider uppercase transition-all disabled:opacity-50"
                                            >
                                                {advancingCourseOrderId === order.id
                                                    ? 'Advancing...'
                                                    : 'Advance Course'}
                                            </button>
                                        </div>
                                    ) : null}
                                    {printPolicy.mode !== 'off' ? (
                                        <div className="mt-2">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    void handlePrintTicket(
                                                        order.id,
                                                        'manual_kds_print'
                                                    )
                                                }
                                                disabled={printingOrderId === order.id}
                                                className="bg-brand-canvas-alt text-micro text-brand-neutral hover:bg-brand-neutral-soft/10 hover:text-brand-ink rounded-full px-3 py-1.5 font-bold tracking-wider uppercase transition-all disabled:opacity-50"
                                            >
                                                {printingOrderId === order.id
                                                    ? 'Printing...'
                                                    : 'Print Chit'}
                                            </button>
                                        </div>
                                    ) : null}
                                </header>
                                <div
                                    data-lenis-prevent
                                    className="bg-brand-canvas-alt/10 max-h-[68vh] space-y-3 overflow-y-auto p-4"
                                >
                                    {order.stationItems.map(item => {
                                        const itemKey = `${order.id}:${item.id}`;
                                        const isSelected = selectedItemKey === itemKey;
                                        const isRecalled =
                                            alertPolicy.recall_visual &&
                                            (item.status ?? 'queued') === 'recalled';
                                        return (
                                            <article
                                                key={itemKey}
                                                className={`shadow-soft rounded-2xl border bg-white p-4 transition-all ${
                                                    isSelected
                                                        ? 'border-brand-ink ring-brand-ink/10 ring-2'
                                                        : 'border-brand-neutral-soft/10'
                                                } ${isRecalled ? 'border-state-danger-bg bg-state-danger-bg/10 animate-pulse' : ''}`}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <p className="text-brand-ink text-2xl leading-tight font-black tracking-tight">
                                                            {item.quantity}x {item.name}
                                                        </p>
                                                        {item.notes ? (
                                                            <p className="text-body-sm text-brand-neutral mt-1 font-medium">
                                                                {item.notes}
                                                            </p>
                                                        ) : null}
                                                        {item.modifiers &&
                                                            item.modifiers.length > 0 && (
                                                                <div className="mt-2.5 flex flex-wrap gap-1.5">
                                                                    {item.modifiers.map(
                                                                        (mod, idx) => (
                                                                            <span
                                                                                key={idx}
                                                                                className={`text-micro inline-flex items-center rounded-sm px-2 py-0.5 font-bold tracking-wider uppercase ring-1 ring-inset ${getModifierStyle(mod)}`}
                                                                            >
                                                                                {mod}
                                                                            </span>
                                                                        )
                                                                    )}
                                                                </div>
                                                            )}
                                                        <p className="text-brand-neutral text-micro mt-2 font-bold tracking-wider uppercase">
                                                            Status:{' '}
                                                            {statusLabel(item.status ?? 'queued')}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {allowedActions(item.status ?? 'queued').map(
                                                        action => {
                                                            const key = `${order.id}:${item.id}:${action}`;
                                                            const disabled = actionKey === key;
                                                            return (
                                                                <button
                                                                    key={action}
                                                                    onClick={() =>
                                                                        void handleItemAction(
                                                                            order.id,
                                                                            item.id,
                                                                            item.kds_item_id,
                                                                            action
                                                                        )
                                                                    }
                                                                    onFocus={() =>
                                                                        setSelectedItemKey(itemKey)
                                                                    }
                                                                    onMouseEnter={() =>
                                                                        setSelectedItemKey(itemKey)
                                                                    }
                                                                    disabled={disabled}
                                                                    className="bg-brand-canvas-alt text-brand-ink hover:bg-brand-neutral-soft/10 min-h-12 min-w-[100px] rounded-xl px-4 py-2 text-base font-bold transition-all active:scale-95 disabled:opacity-50"
                                                                >
                                                                    {disabled
                                                                        ? 'Working...'
                                                                        : actionLabel(action)}
                                                                </button>
                                                            );
                                                        }
                                                    )}
                                                    {allowedActions(item.status ?? 'queued')
                                                        .length === 0 ? (
                                                        <span className="bg-state-success-bg/30 text-body-sm text-state-success rounded-xl px-4 py-2 font-bold">
                                                            Ready
                                                        </span>
                                                    ) : null}
                                                </div>
                                            </article>
                                        );
                                    })}
                                    {order.stationItems.length === 0 ? (
                                        <p className="border-brand-neutral-soft/20 bg-brand-canvas-alt/50 text-body-sm text-brand-neutral rounded-2xl border border-dashed p-6 text-center font-medium">
                                            No {station} items in this ticket.
                                        </p>
                                    ) : null}
                                </div>
                            </section>
                        );
                    })}

                    {stationOrders.length === 0 ? (
                        <div className="col-span-full flex min-h-[45vh] w-full flex-col items-center justify-center text-center text-gray-400">
                            <ChefHat className="mb-3 h-12 w-12" />
                            <h2 className="text-2xl font-bold">No active tickets</h2>
                            <p className="text-sm">Incoming {station} items will appear here.</p>
                        </div>
                    ) : null}
                </div>
            </main>

            {selectedActionableItem ? (
                <div className="border-brand-neutral-soft/10 shadow-strong sticky bottom-0 border-t bg-white/95 px-6 py-4 backdrop-blur-md">
                    <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3">
                        <span className="text-body text-brand-ink mr-4 font-bold">
                            Selected: {selectedActionableItem.name}
                        </span>
                        {allowedActions(selectedActionableItem.status).map(action => (
                            <button
                                key={`quick-${action}`}
                                onClick={() => runSelectedItemAction(action)}
                                className="bg-brand-accent text-brand-ink-strong shadow-soft min-h-12 min-w-[120px] rounded-xl px-5 py-2 text-base font-black tracking-tight transition-all hover:scale-105 active:scale-95"
                            >
                                {actionLabel(action)}
                            </button>
                        ))}
                    </div>
                </div>
            ) : null}
        </div>
    );
}

export default StationBoard;
