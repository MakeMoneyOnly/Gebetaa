'use client';

import dynamic from 'next/dynamic';
import type { RestaurantWithMenu } from '@/types/database';
import { ReactNode } from 'react';

// Dynamically import RestaurantLayout with SSR disabled
const RestaurantLayoutDynamic = dynamic(
    () => import('./RestaurantLayout').then(mod => mod.RestaurantLayout),
    {
        ssr: false,
        loading: () => (
            <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-[var(--brand-color)] border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }
);

interface Props {
    restaurant: RestaurantWithMenu;
    children: ReactNode;
}

export function RestaurantLayoutClient({ restaurant, children }: Props) {
    return (
        <RestaurantLayoutDynamic restaurant={restaurant}>
            {children}
        </RestaurantLayoutDynamic>
    );
}
