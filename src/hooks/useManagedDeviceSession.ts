'use client';

import { useEffect, useMemo, useState } from 'react';
import {
    DeviceProfileSchema,
    getDeviceProfileLabel,
    getDeviceTypeLabel,
    resolveDeviceProfile,
    type DeviceProfile,
} from '@/lib/devices/config';
import { useDeviceHeartbeat } from '@/hooks/useDeviceHeartbeat';
import { getStoredDeviceSession, type StoredDeviceSession } from '@/lib/mobile/device-storage';

interface UseManagedDeviceSessionOptions {
    route: string;
    expectedProfiles?: DeviceProfile[];
    requirePaired?: boolean;
}

export function useManagedDeviceSession({
    route,
    expectedProfiles = [],
    requirePaired = false,
}: UseManagedDeviceSessionOptions) {
    const [session, setSession] = useState<StoredDeviceSession | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        void (async () => {
            try {
                const storedSession = await getStoredDeviceSession();
                if (!cancelled) {
                    setSession(storedSession);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    const resolvedProfile = useMemo(() => {
        if (DeviceProfileSchema.safeParse(session?.device_profile).success) {
            return session?.device_profile as DeviceProfile;
        }

        return resolveDeviceProfile(
            session?.device_type === 'terminal' ||
                session?.device_type === 'kds' ||
                session?.device_type === 'kiosk'
                ? session.device_type
                : 'pos'
        );
    }, [session?.device_profile, session?.device_type]);

    const deviceToken = session?.device_token ?? null;
    const isManaged = Boolean(deviceToken);
    const hasExpectedProfile =
        !session || expectedProfiles.length === 0 || expectedProfiles.includes(resolvedProfile);
    const requiresPairing = requirePaired && !loading && !deviceToken;
    const hasProfileMismatch = Boolean(session) && !hasExpectedProfile;

    useDeviceHeartbeat({
        deviceToken,
        route,
        enabled: Boolean(deviceToken),
    });

    return {
        loading,
        session,
        deviceToken,
        isManaged,
        resolvedProfile,
        hasExpectedProfile,
        requiresPairing,
        hasProfileMismatch,
        profileLabel: getDeviceProfileLabel(resolvedProfile),
        typeLabel: getDeviceTypeLabel(session?.device_type),
    };
}
