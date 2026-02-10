'use client';
import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { FilterShape } from '@/components/ui/FilterShape';
import { useHaptic } from '@/hooks/useHaptic';
import {
    Flame,
    UtensilsCrossed,
    Pizza,
    ChefHat,
    Leaf,
    Cookie,
    Coffee,
    CupSoda,
    Beer,
    Wine,
} from 'lucide-react';

const FOOD_CATEGORIES = [
    { id: 'all', name: 'All', icon: <Flame size={20} /> },
    { id: 'burger', name: 'Burger', icon: <UtensilsCrossed size={20} /> },
    { id: 'pizza', name: 'Pizza', icon: <Pizza size={20} /> },
    { id: 'traditional', name: 'Traditional', icon: <ChefHat size={20} /> },
    { id: 'vegan', name: 'Vegan', icon: <Leaf size={20} /> },
    { id: 'desert', name: 'Desert', icon: <Cookie size={20} /> },
];

const DRINK_CATEGORIES = [
    { id: 'all', name: 'All', icon: <Flame size={20} /> },
    { id: 'hot-drinks', name: 'Hot Drinks', icon: <Coffee size={20} /> },
    { id: 'soft-drinks', name: 'Soft Drinks', icon: <CupSoda size={20} /> },
    { id: 'beer', name: 'Beer', icon: <Beer size={20} /> },
    { id: 'juice', name: 'Juice', icon: <CupSoda size={20} /> },
    { id: 'wine', name: 'Wine', icon: <Wine size={20} /> },
];

interface CategoryRailProps {
    activeTab: 'food' | 'drinks';
    activeCategoryId: string;
    onCategoryChange: (id: string) => void;
}

export function CategoryRail({ activeTab, activeCategoryId, onCategoryChange }: CategoryRailProps) {
    const { trigger } = useHaptic();

    const handleCategoryClick = (id: string) => {
        trigger('soft');
        onCategoryChange(id);
    };

    const categories = activeTab === 'food' ? FOOD_CATEGORIES : DRINK_CATEGORIES;

    // Reset activeCategoryId to 'all' when tab changes
    useEffect(() => {
        onCategoryChange('all');
    }, [activeTab, onCategoryChange]);

    return (
        <div className="no-scrollbar mt-8 mb-0 w-full snap-x snap-mandatory overflow-x-auto py-4 pl-6">
            <div className="flex gap-4 pr-6">
                {categories.map(cat => {
                    const isActive = activeCategoryId === cat.id;
                    return (
                        <button
                            key={cat.id}
                            onClick={() => handleCategoryClick(cat.id)}
                            className="group flex min-w-[70px] touch-manipulation snap-center flex-col items-center gap-2 transition-all duration-300 focus:outline-none active:scale-95"
                        >
                            {/* Badge Container */}
                            <div
                                className={cn(
                                    'relative flex h-[70px] w-[70px] items-center justify-center transition-all duration-300',
                                    isActive ? 'scale-110' : 'scale-100'
                                )}
                            >
                                {/* The Custom Filter Shape */}
                                <div className="absolute inset-0 h-full w-full">
                                    <FilterShape
                                        active={isActive}
                                        color={isActive ? '#A81818' : '#F8F8F8'}
                                    />
                                </div>

                                {/* Icon */}
                                <div
                                    className={cn(
                                        'relative z-10 transition-colors duration-300',
                                        isActive ? 'text-white' : 'text-black'
                                    )}
                                >
                                    {cat.icon}
                                </div>
                            </div>

                            {/* Label */}
                            <span
                                className={cn(
                                    'text-xs font-bold tracking-wide transition-colors duration-300',
                                    isActive ? 'text-black' : 'text-gray-400'
                                )}
                            >
                                {cat.name}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
