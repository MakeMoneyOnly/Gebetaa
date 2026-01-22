'use client';

import dynamic from 'next/dynamic';
import type { RestaurantWithMenu } from '@/types/database';

// Loading fallback while MenuPage loads
function MenuPageLoader() {
    return (
        <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-[var(--brand-color)] border-t-transparent rounded-full animate-spin" />
                <span className="text-neutral-400 text-sm">Loading menu...</span>
            </div>
        </div>
    );
}

// Dynamically import MenuPage with SSR disabled to prevent hydration issues
const MenuPageDynamic = dynamic(
    () => import('./MenuPage').then(mod => mod.MenuPage),
    {
        ssr: false,
        loading: () => <MenuPageLoader />
    }
);

interface Props {
    restaurant: RestaurantWithMenu;
    tableNumber: string | null;
}

export function MenuPageClient({ restaurant, tableNumber }: Props) {
    return <MenuPageDynamic restaurant={restaurant} tableNumber={tableNumber} />;
}
