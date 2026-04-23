'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { ManagedDeviceBanner } from '@/components/device/ManagedDeviceBanner';
import { useRole } from '@/hooks/useRole';
import { useManagedDeviceSession } from '@/hooks/useManagedDeviceSession';
import { StationBoard } from '@/features/kds/components/StationBoard';

type StationView = 'kitchen' | 'bar' | 'dessert' | 'coffee';

const STATION_CONFIG: Record<StationView, { title: string; accentClassName: string }> = {
    kitchen: { title: 'Kitchen Display', accentClassName: 'bg-emerald-100 text-emerald-700' },
    bar: { title: 'Bar Display', accentClassName: 'bg-blue-100 text-blue-700' },
    dessert: { title: 'Dessert Display', accentClassName: 'bg-fuchsia-100 text-fuchsia-700' },
    coffee: { title: 'Coffee Display', accentClassName: 'bg-amber-100 text-amber-800' },
};

function KdsPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const queryRestaurantId = searchParams.get('restaurantId');
    const queryStation = searchParams.get('station');
    const { role, loading } = useRole(queryRestaurantId);
    const managedDevice = useManagedDeviceSession({
        route: '/kds',
        expectedProfiles: ['kds'],
    });

    useEffect(() => {
        if (loading) return;
        if (role === 'bar' && !queryStation) {
            router.replace('/bar');
        }
    }, [loading, role, router, queryStation]);

    const station: StationView =
        queryStation === 'bar' || queryStation === 'dessert' || queryStation === 'coffee'
            ? queryStation
            : 'kitchen';

    const config = STATION_CONFIG[station];

    if (managedDevice.loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50 text-gray-500">
                Loading KDS...
            </div>
        );
    }

    if (managedDevice.hasProfileMismatch) {
        return (
            <div className="flex min-h-screen items-center justify-center p-6">
                <div className="max-w-md rounded-2xl border border-red-400/20 bg-red-500/10 p-8 text-center">
                    <AlertCircle className="mx-auto h-10 w-10 text-red-300" />
                    <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
                        Wrong device role
                    </h1>
                    <p className="mt-2 text-[15px] text-gray-600">
                        This device is paired for a different workspace. Re-provision it as a KDS
                        screen to access the kitchen display.
                    </p>
                </div>
            </div>
        );
    }

    if (managedDevice.isIdentityRevoked || !managedDevice.hasOutageAccess) {
        return (
            <div className="flex min-h-screen items-center justify-center p-6">
                <div className="max-w-md rounded-2xl border border-amber-400/20 bg-amber-500/10 p-8 text-center">
                    <AlertCircle className="mx-auto h-10 w-10 text-amber-400" />
                    <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
                        KDS access paused
                    </h1>
                    <p className="mt-2 text-[15px] text-gray-600">
                        {managedDevice.isIdentityRevoked
                            ? 'This kitchen screen identity was revoked. Re-pair it from device management.'
                            : (managedDevice.outageAccess.reason ??
                              'This kitchen screen needs fresh online authorization.')}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <StationBoard
            station={station}
            title={config.title}
            accentClassName={config.accentClassName}
            restaurantIdOverride={managedDevice.session?.restaurant_id ?? null}
            headerSlot={
                <ManagedDeviceBanner session={managedDevice.session} routeLabel={config.title} />
            }
        />
    );
}

export default function KdsPage() {
    return (
        <Suspense
            fallback={
                <div className="flex h-screen items-center justify-center bg-gray-50 text-gray-500">
                    Loading KDS...
                </div>
            }
        >
            <KdsPageContent />
        </Suspense>
    );
}
