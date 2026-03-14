'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Radio, Timer } from 'lucide-react';

type KdsTelemetryPayload = {
    generated_at: string;
    queue_lag: {
        active_tickets: number;
        avg_minutes: number;
        p50_minutes: number;
        p95_minutes: number;
        max_minutes: number;
    };
    sla: {
        threshold_minutes: number;
        breached_tickets: number;
        breached_ratio_percent: number;
    };
    websocket: {
        status: 'healthy' | 'degraded';
        healthy: boolean;
        last_heartbeat_at: string | null;
        connected_stations: string[];
        samples_in_window: number;
    };
};

export function KdsReliabilityPanel() {
    const [data, setData] = useState<KdsTelemetryPayload | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchTelemetry = useCallback(async () => {
        try {
            const response = await fetch('/api/kds/telemetry?sla_minutes=30', {
                cache: 'no-store',
            });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok) {
                setError(payload?.error ?? 'Failed to load KDS telemetry');
                return;
            }
            setData(payload.data as KdsTelemetryPayload);
            setError(null);
        } catch {
            setError('Failed to load KDS telemetry');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchTelemetry();
        const interval = setInterval(() => {
            void fetchTelemetry();
        }, 30_000);
        return () => clearInterval(interval);
    }, [fetchTelemetry]);

    return (
        <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">KDS Reliability</h2>
                <button
                    onClick={() => void fetchTelemetry()}
                    className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-100"
                >
                    Refresh
                </button>
            </div>

            {loading ? (
                <p className="text-sm text-gray-500">Loading KDS telemetry...</p>
            ) : error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                </div>
            ) : data ? (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <article className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                        <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-xs font-semibold text-gray-600">
                            <Timer className="h-3.5 w-3.5" />
                            Queue Lag
                        </div>
                        <p className="text-2xl font-black text-gray-900">
                            {data.queue_lag.p95_minutes}m
                        </p>
                        <p className="text-xs text-gray-500">
                            P95, avg {data.queue_lag.avg_minutes}m, {data.queue_lag.active_tickets}{' '}
                            active
                        </p>
                    </article>

                    <article className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                        <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-xs font-semibold text-gray-600">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            SLA Breaches
                        </div>
                        <p className="text-2xl font-black text-gray-900">
                            {data.sla.breached_tickets}
                        </p>
                        <p className="text-xs text-gray-500">
                            Threshold {data.sla.threshold_minutes}m,{' '}
                            {data.sla.breached_ratio_percent}% breached
                        </p>
                    </article>

                    <article className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                        <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-xs font-semibold text-gray-600">
                            <Radio className="h-3.5 w-3.5" />
                            Websocket
                        </div>
                        <p
                            className={`text-2xl font-black ${
                                data.websocket.healthy ? 'text-emerald-700' : 'text-amber-700'
                            }`}
                        >
                            {data.websocket.healthy ? 'Healthy' : 'Degraded'}
                        </p>
                        <p className="text-xs text-gray-500">
                            Stations: {data.websocket.connected_stations.join(', ') || 'none'} |
                            Samples: {data.websocket.samples_in_window}
                        </p>
                    </article>
                </div>
            ) : null}
        </section>
    );
}

export default KdsReliabilityPanel;
