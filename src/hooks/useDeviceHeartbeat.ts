'use client';

import { useEffect } from 'react';

interface UseDeviceHeartbeatOptions {
    deviceToken: string | null;
    route: string;
    enabled?: boolean;
    intervalMs?: number;
}

export function useDeviceHeartbeat({
    deviceToken,
    route,
    enabled = true,
    intervalMs = 45_000,
}: UseDeviceHeartbeatOptions) {
    useEffect(() => {
        if (!deviceToken || !enabled) {
            return;
        }

        let cancelled = false;

        const sendHeartbeat = async () => {
            if (cancelled) {
                return;
            }

            try {
                await fetch('/api/devices/heartbeat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-device-token': deviceToken,
                    },
                    body: JSON.stringify({
                        route,
                        app_mode: window.matchMedia('(display-mode: standalone)').matches
                            ? 'pwa'
                            : 'browser',
                        visibility: document.visibilityState === 'visible' ? 'visible' : 'hidden',
                    }),
                });
            } catch {
                // Heartbeat failure should never block device workflows.
            }
        };

        void sendHeartbeat();
        const interval = window.setInterval(() => {
            void sendHeartbeat();
        }, intervalMs);

        const onVisibilityChange = () => {
            void sendHeartbeat();
        };

        document.addEventListener('visibilitychange', onVisibilityChange);

        return () => {
            cancelled = true;
            window.clearInterval(interval);
            document.removeEventListener('visibilitychange', onVisibilityChange);
        };
    }, [deviceToken, enabled, intervalMs, route]);
}
