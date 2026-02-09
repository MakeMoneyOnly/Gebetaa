'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Flame, Fish, UtensilsCrossed, Pizza, Leaf, Coffee } from 'lucide-react';
import { FilterShape } from '@/components/ui/FilterShape';
import { useHaptic } from '@/hooks/useHaptic';

const CATEGORIES = [
    { id: 'all', name: 'All', icon: <Flame size={20} /> },
    { id: 'sushi', name: 'Sushi', icon: <Fish size={20} /> },
    { id: 'burger', name: 'Burger', icon: <UtensilsCrossed size={20} /> },
    { id: 'pizza', name: 'Pizza', icon: <Pizza size={20} /> },
    { id: 'vegan', name: 'Vegan', icon: <Leaf size={20} /> },
    { id: 'sweet', name: 'Sweet', icon: <Coffee size={20} /> },
];

export function CategoryRail() {
    const { trigger } = useHaptic();
    const [activeId, setActiveId] = useState('all');

    const handleCategoryClick = (id: string) => {
        trigger('soft');
        setActiveId(id);
    };

    return (
        <div className="w-full overflow-x-auto no-scrollbar pl-6 py-4 mt-8 mb-0 snap-x snap-mandatory">
            <div className="flex gap-4 pr-6">
                {CATEGORIES.map((cat) => {
                    const isActive = activeId === cat.id;
                    return (
                        <button
                            key={cat.id}
                            onClick={() => handleCategoryClick(cat.id)}
                            className="group flex flex-col items-center gap-2 min-w-[70px] transition-all duration-300 focus:outline-none active:scale-95 snap-center touch-manipulation"
                        >
                            {/* Badge Container */}
                            <div
                                className={cn(
                                    "relative w-[70px] h-[70px] flex items-center justify-center transition-all duration-300",
                                    isActive ? 'scale-110' : 'scale-100'
                                )}
                            >
                                {/* The Custom Filter Shape */}
                                <div className="absolute inset-0 w-full h-full">
                                    <FilterShape
                                        active={isActive}
                                        color={isActive ? "#A81818" : "#F8F8F8"}
                                    />
                                </div>

                                {/* Icon */}
                                <div className={cn(
                                    "relative z-10 transition-colors duration-300",
                                    isActive ? 'text-white' : 'text-black'
                                )}>
                                    {cat.icon}
                                </div>
                            </div>

                            {/* Label */}
                            <span className={cn(
                                "text-xs font-bold tracking-wide transition-colors duration-300",
                                isActive ? 'text-black' : 'text-gray-400'
                            )}>
                                {cat.name}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
