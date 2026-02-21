'use client';

import { DishNutrition } from './DishDetailDrawer.types';

interface DishNutritionSectionProps {
    nutrition?: DishNutrition;
}

export function DishNutritionSection({ nutrition }: DishNutritionSectionProps) {
    const stats = [
        { label: 'Calories', value: nutrition?.calories || '540', unit: 'kcal' },
        { label: 'Protein', value: nutrition?.protein || '32', unit: 'g' },
        { label: 'Carbs', value: nutrition?.carbs || '45', unit: 'g' },
        { label: 'Fat', value: nutrition?.fat || '22', unit: 'g' },
    ];

    return (
        <div className="mb-8">
            <h3 className="font-manrope mb-3 text-lg font-black tracking-tighter text-black dark:text-white">
                Nutritional Value
            </h3>
            <div className="grid grid-cols-4 gap-2">
                {stats.map((stat, i) => (
                    <div
                        key={i}
                        className="flex flex-col items-center justify-center rounded-2xl border border-black/5 bg-black/5 p-3 py-4 dark:border-white/5 dark:bg-white/5"
                    >
                        <div className="flex items-baseline gap-0.5">
                            <span className="font-manrope text-lg font-black text-black dark:text-white">
                                {stat.value}
                            </span>
                            <span className="text-[10px] font-bold text-black/40 dark:text-white/30">
                                {stat.unit}
                            </span>
                        </div>
                        <span className="mt-1 text-[10px] font-bold tracking-tight text-black/50 uppercase dark:text-white/40">
                            {stat.label}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
