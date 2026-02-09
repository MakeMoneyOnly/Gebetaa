'use client';

import React from 'react';
import { Heart, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

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
export function MenuCard({ item, onClick, onAdd }: { item: MenuItemProps; onClick?: () => void; onAdd?: () => void }) {
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
            className="group relative mb-6 active:scale-[0.98] transition-transform duration-300 touch-manipulation tap-highlight-transparent"
            onClick={() => {
                trigger('soft');
                onClick?.();
            }}
        >
            {/* Image Container */}
            <div className="relative rounded-[32px] overflow-hidden bg-gray-200 shadow-md">

                {/* Flash Photo Effect Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none"></div>

                <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-[220px] object-cover"
                    loading="lazy"
                />

                {/* Top Floating Elements */}
                <button
                    onClick={handleLike}
                    className="absolute top-3 left-3 w-9 h-9 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center text-white z-20 hover:bg-white hover:text-brand-crimson transition-colors border border-white/20 active:scale-90 touch-manipulation"
                >
                    <Heart size={16} fill="currentColor" />
                </button>

                <div className="absolute -top-2 -right-2 z-20 w-[90px] h-[90px]">
                    <img src="/Price.svg" alt="" className="w-full h-full" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white leading-tight">
                        <span className="text-base font-black">{Math.round(item.price)}</span>
                        <span className="text-xs font-bold">ETB</span>
                    </div>
                </div>

                {/* Add Button (Bottom Right of Image) */}
                <button
                    onClick={handleAdd}
                    className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-brand-crimson text-white flex items-center justify-center z-20 shadow-lg group-hover:scale-110 active:scale-90 transition-transform touch-manipulation"
                >
                    <Plus size={20} />
                </button>
            </div>

            {/* Info Below */}
            <div className="mt-3 px-1">
                <h3 className="font-bold text-lg leading-tight text-black">{item.title}</h3>
                <div className="flex justify-between items-center mt-1">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{item.shopName}</p>
                    <div className="flex items-center gap-1">
                        <span className="text-xs font-bold">★</span>
                        <span className="text-xs">{item.rating}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
