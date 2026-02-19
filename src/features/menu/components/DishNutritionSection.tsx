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
            <h3 className="mb-3 font-manrope text-lg font-black tracking-tighter text-white">Nutritional Value</h3>
            <div className="grid grid-cols-4 gap-2">
                {stats.map((stat, i) => (
                    <div key={i} className="flex flex-col items-center justify-center rounded-2xl bg-white/5 border border-white/5 p-3 py-4">
                        <div className="flex items-baseline gap-0.5">
                            <span className="font-manrope text-lg font-black text-white">{stat.value}</span>
                            <span className="text-[10px] font-bold text-white/30">{stat.unit}</span>
                        </div>
                        <span className="mt-1 text-[10px] font-bold text-white/40 uppercase tracking-tight">{stat.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}