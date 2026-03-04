'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRole } from '@/hooks/useRole';
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

    return (
        <StationBoard
            station={station}
            title={config.title}
            accentClassName={config.accentClassName}
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
