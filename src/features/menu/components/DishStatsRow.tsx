'use client';

import { Star, Heart, Clock } from 'lucide-react';
import { DishItem } from './DishDetailDrawer.types';

interface DishStatsRowProps {
    item: DishItem;
    likesCount: number;
    formatLikes: (count: number) => string;
}

export function DishStatsRow({ item, likesCount, formatLikes }: DishStatsRowProps) {
    return (
        <div className="mb-8 flex items-center justify-between rounded-3xl border border-black/10 bg-black/5 px-6 py-4 dark:border-white/10 dark:bg-white/5">
            {/* Rating Group */}
            <div className="flex flex-col items-center">
                <div className="flex items-center gap-1.5">
                    <Star
                        size={18}
                        className="fill-brand-yellow text-brand-yellow"
                        strokeWidth={0}
                    />
                    <span className="font-manrope text-xl font-black text-black dark:text-white">
                        {item.rating?.toFixed(1) || '4.5'}
                    </span>
                </div>
            </div>

            {/* Divider */}
            <div className="h-8 w-px bg-black/10 dark:bg-white/10" />

            {/* Likes Group */}
            <div className="flex flex-col items-center">
                <div className="flex items-center gap-1.5">
                    <Heart
                        size={18}
                        className="text-brand-crimson fill-brand-crimson"
                        strokeWidth={0}
                    />
                    <span className="font-manrope text-xl font-black text-black dark:text-white">
                        {formatLikes(likesCount)}
                    </span>
                </div>
            </div>

            {/* Divider */}
            <div className="h-8 w-px bg-black/10 dark:bg-white/10" />

            {/* Prep Time Group */}
            <div className="flex flex-col items-center">
                <div className="flex items-center gap-1.5">
                    <Clock
                        size={18}
                        className="text-black/40 dark:text-white/40"
                        strokeWidth={2.5}
                    />
                    <div className="flex items-baseline gap-0.5">
                        <span className="font-manrope text-xl font-black text-black dark:text-white">
                            {item.preparationTime || 15}
                        </span>
                        <span className="font-manrope text-xs font-bold text-black/40 dark:text-white/40">
                            min
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
