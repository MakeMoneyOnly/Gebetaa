'use client';

import { DishItem } from './DishDetailDrawer.types';
import { MenuCard } from './MenuCard';

interface DishRecommendationsProps {
    recommendations?: DishItem[];
    onOpenChange: (open: boolean) => void;
    onAddRecommended?: (item: DishItem) => void;
    trigger: (type: 'soft' | 'success' | 'medium') => void;
}

// Fallback recommendations for display
const FALLBACK_RECOMMENDATIONS: DishItem[] = [
    {
        id: 'fallback-1',
        title: 'Signature Pasta',
        price: 180,
        imageUrl: 'https://axuegixbqsvztdraenkz.supabase.co/storage/v1/object/public/food-images/Creamy%20Pesto%20Pasta.webp',
        categories: { name: 'Pizza', section: 'food' },
        rating: 4.8,
        shopName: 'Pizza',
        name: 'Signature Pasta',
    },
    {
        id: 'fallback-2',
        title: 'Garden Fresh Salad',
        price: 150,
        imageUrl: 'https://axuegixbqsvztdraenkz.supabase.co/storage/v1/object/public/food-images/Truffle%20Burger.webp',
        categories: { name: 'Vegan', section: 'food' },
        rating: 4.6,
        shopName: 'Vegan',
        name: 'Garden Fresh Salad',
    },
    {
        id: 'fallback-3',
        title: 'Crispy Wings',
        price: 220,
        imageUrl: 'https://axuegixbqsvztdraenkz.supabase.co/storage/v1/object/public/food-images/Spicy%20Tonkotsu.webp',
        categories: { name: 'Burger', section: 'food' },
        rating: 4.9,
        shopName: 'Burger',
        name: 'Crispy Wings',
    },
    {
        id: 'fallback-4',
        title: 'Berry Smoothie',
        price: 110,
        imageUrl: 'https://axuegixbqsvztdraenkz.supabase.co/storage/v1/object/public/food-images/Rainbow%20Sushi%20Platter.webp',
        categories: { name: 'Juice', section: 'drinks' },
        rating: 4.7,
        shopName: 'Juice',
        name: 'Berry Smoothie',
    },
    {
        id: 'fallback-5',
        title: 'Traditional Kitfo',
        price: 190,
        imageUrl: 'https://axuegixbqsvztdraenkz.supabase.co/storage/v1/object/public/food-images/Honey-Glazed%20Salmon.webp',
        categories: { name: 'Traditional', section: 'food' },
        rating: 5.0,
        shopName: 'Traditional',
        name: 'Traditional Kitfo',
    },
];

export function DishRecommendations({
    recommendations,
    onOpenChange,
    onAddRecommended,
    trigger,
}: DishRecommendationsProps) {
    // Use provided recommendations or fallback
    const displayRecs = (recommendations && recommendations.length > 0)
        ? recommendations
        : FALLBACK_RECOMMENDATIONS;

    return (
        <div className="mb-12 border-t border-gray-100 pt-8 mt-4 bg-gray-50/50 -mx-6 px-6">
            <h3 className="mb-5 font-manrope text-xl font-black tracking-tighter text-black">You might also like</h3>

            <div className="no-scrollbar -mx-6 flex gap-4 overflow-x-auto px-6 pb-6">
                {displayRecs.map((rec) => (
                    <div key={rec.id} className="w-[180px] shrink-0">
                        <MenuCard
                            item={{
                                ...rec,
                                shopName: rec.categories?.name || rec.shopName,
                            }}
                            className="mb-0"
                            onClick={() => {
                                trigger('soft');
                                onOpenChange(false);
                                setTimeout(() => {
                                    const event = new CustomEvent('selectDish', { detail: rec });
                                    window.dispatchEvent(event);
                                }, 300);
                            }}
                            onAdd={() => {
                                trigger('success');
                                onAddRecommended?.(rec);
                            }}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}