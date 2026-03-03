import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api/response';
import { getAuthenticatedUser, getAuthorizedRestaurantContext } from '@/lib/api/authz';
import { parseJsonBody, parseQuery } from '@/lib/api/validation';
import { writeAuditLog } from '@/lib/api/audit';

const ACTIVE_KDS_STATUSES = ['pending', 'confirmed', 'acknowledged', 'preparing', 'ready'] as const;
const HEARTBEAT_ACTION = 'kds_ws_heartbeat';

const KdsTelemetryQuerySchema = z.object({
    sla_minutes: z.coerce.number().int().min(5).max(180).default(30),
});

const KdsHeartbeatSchema = z.object({
    station: z.enum(['kitchen', 'bar', 'dessert', 'coffee', 'expeditor']).optional(),
    realtime_connected: z.boolean(),
    queue_size: z.number().int().min(0).max(500).optional(),
    breached_tickets: z.number().int().min(0).max(500).optional(),
});

function percentile(values: number[], p: number) {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    const safeIndex = Math.max(0, Math.min(sorted.length - 1, index));
    return sorted[safeIndex];
}

function asObject(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    return value as Record<string, unknown>;
}

export async function GET(request: Request) {
    const auth = await getAuthenticatedUser();
    if (!auth.ok) {
        return auth.response;
    }

    const context = await getAuthorizedRestaurantContext(auth.user.id, { phase: 'p1' });
    if (!context.ok) {
        return context.response;
    }

    const url = new URL(request.url);
    const parsed = parseQuery(
        {
            sla_minutes: url.searchParams.get('sla_minutes') ?? undefined,
        },
        KdsTelemetryQuerySchema
    );
    if (!parsed.success) {
        return parsed.response;
    }
    const { sla_minutes } = parsed.data;

    const now = Date.now();
    const heartbeatWindowStart = new Date(now - 10 * 60_000).toISOString();
    const healthyWindowStart = new Date(now - 90_000).toISOString();

    const [ordersRes, heartbeatRes] = await Promise.all([
        context.supabase
            .from('orders')
            .select('id, created_at, status')
            .eq('restaurant_id', context.restaurantId)
            .in('status', [...ACTIVE_KDS_STATUSES]),
        context.supabase
            .from('audit_logs')
            .select('created_at, metadata')
            .eq('restaurant_id', context.restaurantId)
            .eq('action', HEARTBEAT_ACTION)
            .gte('created_at', heartbeatWindowStart)
            .order('created_at', { ascending: false })
            .limit(300),
    ]);

    if (ordersRes.error) {
        return apiError(
            'Failed to fetch KDS queue telemetry',
            500,
            'KDS_TELEMETRY_ORDERS_FETCH_FAILED',
            ordersRes.error.message
        );
    }

    if (heartbeatRes.error) {
        return apiError(
            'Failed to fetch KDS websocket telemetry',
            500,
            'KDS_TELEMETRY_HEARTBEAT_FETCH_FAILED',
            heartbeatRes.error.message
        );
    }

    const queueAges = (ordersRes.data ?? [])
        .map(order => {
            if (!order.created_at) return 0;
            return Math.max(0, Math.floor((now - new Date(order.created_at).getTime()) / 60000));
        })
        .filter(value => Number.isFinite(value));

    const breachedCount = queueAges.filter(value => value >= sla_minutes).length;

    const heartbeatRows = (heartbeatRes.data ?? []) as Array<{
        created_at: string | null;
        metadata: unknown;
    }>;

    const connectedRecent = heartbeatRows.some(row => {
        if (!row.created_at) return false;
        if (row.created_at < healthyWindowStart) return false;
        const metadata = asObject(row.metadata);
        return metadata?.realtime_connected === true;
    });

    const latestHeartbeat = heartbeatRows.find(row => Boolean(row.created_at)) ?? null;
    const connectedStations = new Set<string>();
    for (const row of heartbeatRows) {
        const metadata = asObject(row.metadata);
        if (!metadata || metadata.realtime_connected !== true) continue;
        const station = metadata.station;
        if (typeof station === 'string' && station.length > 0) {
            connectedStations.add(station);
        }
    }

    return apiSuccess({
        generated_at: new Date(now).toISOString(),
        queue_lag: {
            active_tickets: queueAges.length,
            avg_minutes:
                queueAges.length > 0
                    ? Number((queueAges.reduce((sum, n) => sum + n, 0) / queueAges.length).toFixed(1))
                    : 0,
            p50_minutes: percentile(queueAges, 50),
            p95_minutes: percentile(queueAges, 95),
            max_minutes: queueAges.length > 0 ? Math.max(...queueAges) : 0,
        },
        sla: {
            threshold_minutes: sla_minutes,
            breached_tickets: breachedCount,
            breached_ratio_percent:
                queueAges.length > 0 ? Number(((breachedCount / queueAges.length) * 100).toFixed(2)) : 0,
        },
        websocket: {
            status: connectedRecent ? 'healthy' : 'degraded',
            healthy: connectedRecent,
            last_heartbeat_at: latestHeartbeat?.created_at ?? null,
            connected_stations: Array.from(connectedStations),
            samples_in_window: heartbeatRows.length,
        },
    });
}

export async function POST(request: Request) {
    const auth = await getAuthenticatedUser();
    if (!auth.ok) {
        return auth.response;
    }

    const context = await getAuthorizedRestaurantContext(auth.user.id, { phase: 'p1' });
    if (!context.ok) {
        return context.response;
    }

    const parsed = await parseJsonBody(request, KdsHeartbeatSchema);
    if (!parsed.success) {
        return parsed.response;
    }

    await writeAuditLog(context.supabase, {
        restaurant_id: context.restaurantId,
        user_id: auth.user.id,
        action: HEARTBEAT_ACTION,
        entity_type: 'kds_realtime',
        entity_id: parsed.data.station ?? 'unknown_station',
        metadata: {
            source: 'kds_web',
            ...parsed.data,
        },
    });

    return apiSuccess({
        received: true,
    });
}
