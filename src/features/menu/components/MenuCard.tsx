'use client';

import React from 'react';
import { Heart, Plus } from 'lucide-react';
import Image from 'next/image';

import { useHaptic } from '@/hooks/useHaptic';

interface MenuItemProps {
    id: string;
    title: string;
    description?: string;
    price: number;
    imageUrl: string;
    rating?: number;
    shopName?: string;
}

// Update MenuCard component
export function MenuCard({
    item,
    onClick,
    onAdd,
}: {
    item: MenuItemProps;
    onClick?: () => void;
    onAdd?: () => void;
}) {
    const { trigger } = useHaptic();

    const handleLike = (e: React.MouseEvent) => {
        e.stopPropagation();
        trigger('medium');
    };

    const handleAdd = (e: React.MouseEvent) => {
        e.stopPropagation();
        trigger('success');
        onAdd?.();
    };

    return (
        <div
            className="group tap-highlight-transparent relative mb-6 touch-manipulation transition-transform duration-300 active:scale-[0.98]"
            onClick={() => {
                trigger('soft');
                onClick?.();
            }}
        >
            {/* Image Container */}
            <div className="relative overflow-hidden rounded-[32px] bg-gray-200 shadow-md">
                {/* Flash Photo Effect Overlay */}
                <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100"></div>

                <Image
                    src={item.imageUrl}
                    alt={item.title}
                    width={500}
                    height={220}
                    className="h-[220px] w-full object-cover"
                />

                {/* Top Floating Elements */}
                <button
                    onClick={handleLike}
                    className="hover:text-brand-crimson absolute top-3 left-3 z-20 flex h-9 w-9 touch-manipulation items-center justify-center rounded-full border border-white/20 bg-white/30 text-white backdrop-blur-md transition-colors hover:bg-white active:scale-90"
                >
                    <Heart size={16} fill="currentColor" />
                </button>

                <div className="absolute -top-2 -right-2 z-20 h-[90px] w-[90px]">
                    <Image
                        src="/Price.svg"
                        alt=""
                        width={90}
                        height={90}
                        className="h-full w-full"
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center leading-tight text-white">
                        <span className="text-base font-black">
                            {Math.round(item.price).toLocaleString()}
                        </span>
                        <span className="text-xs font-bold">ETB</span>
                    </div>
                </div>

                {/* Add Button (Bottom Right of Image) */}
                <button
                    onClick={handleAdd}
                    className="bg-brand-crimson absolute right-3 bottom-3 z-20 flex h-10 w-10 touch-manipulation items-center justify-center rounded-full text-white shadow-lg transition-transform group-hover:scale-110 active:scale-90"
                >
                    <Plus size={20} />
                </button>
            </div>

            {/* Info Below */}
            <div className="mt-3 px-1">
                <h3 className="text-lg leading-tight font-bold text-black">{item.title}</h3>
                <div className="mt-1 flex items-center justify-between">
                    <p className="text-xs font-bold tracking-tight text-gray-300 uppercase">
                        {item.shopName}
                    </p>
                    <div className="mr-1 flex items-center gap-0.5">
                        <span className="text-brand-crimson text-xs font-bold">★</span>
                        <span className="text-xs font-bold text-black">{item.rating || 4.5}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
