'use client';

import { Drawer } from 'vaul';
import { useState, useEffect } from 'react';
import { useHaptic } from '@/hooks/useHaptic';
import { formatCurrencyCompact } from '@/lib/utils/monetary';
import { isRemoteOrDataImageSrc } from '@/lib/utils';
import { createClient } from '@/lib/supabase';
import { DishDetailDrawerProps } from './DishDetailDrawer.types';
import { DishHeroSection } from './DishHeroSection';
import { DishStatsRow } from './DishStatsRow';
import { DishNutritionSection } from './DishNutritionSection';
import { DishRecommendations } from './DishRecommendations';
import { DishCartFooter } from './DishCartFooter';

// Re-export types for backward compatibility
export type { DishItem, DishDetailDrawerProps } from './DishDetailDrawer.types';

// Default ingredients fallback
const DEFAULT_INGREDIENTS = [
    'Organic Tomatoes',
    'Fresh Basil',
    'Mozzarella',
    'Extra Virgin Olive Oil',
    'Garlic',
    'Sea Salt',
];

// Format likes count (e.g., 1200 -> 1.2k)
function formatLikes(count: number): string {
    if (count >= 1000) {
        return (count / 1000).toFixed(1) + 'k';
    }
    return count.toString();
}

export function DishDetailDrawer({
    open,
    onOpenChange,
    item,
    onAddToCart,
    onAddRecommended,
    recommendations,
}: DishDetailDrawerProps) {
    const { trigger } = useHaptic();
    const [quantity, setQuantity] = useState(1);
    const [isLiked, setIsLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(0);

    const isRemoteOrDataImage = item ? isRemoteOrDataImageSrc(item.imageUrl) : false;

    // Reset state when item changes
    useEffect(() => {
        if (item) {
            setLikesCount(item.likesCount || item.popularity || 0);
            setQuantity(1);
            setIsLiked(false);
        }
    }, [item]);

    const increment = () => {
        trigger('soft');
        setQuantity(q => q + 1);
    };

    const decrement = () => {
        trigger('soft');
        if (quantity > 1) setQuantity(q => q - 1);
    };

    const handleAddToCart = () => {
        trigger('success');
        onAddToCart?.(quantity);
        onOpenChange(false);
    };

    const toggleLike = async (e?: React.MouseEvent) => {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }

        trigger('medium');

        const newIsLiked = !isLiked;
        const delta = newIsLiked ? 1 : -1;

        // Optimistic UI update
        setIsLiked(newIsLiked);
        setLikesCount(prev => Math.max(0, prev + delta));

        // Background sync with Supabase
        try {
            const supabase = createClient();
            const { error } = await supabase.rpc('increment_likes', {
                item_id: item?.id,
                delta,
            });
            if (error) throw error;
        } catch (err) {
            console.error('Like sync error:', err);
        }
    };

    if (!item) return null;

    const ingredients =
        item.ingredients && item.ingredients.length > 0 ? item.ingredients : DEFAULT_INGREDIENTS;

    return (
        <Drawer.Root open={open} onOpenChange={onOpenChange}>
            <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm" />
                <Drawer.Content className="bg-background fixed right-0 bottom-0 left-0 z-[9999] mt-24 flex h-[92dvh] flex-col overflow-hidden rounded-t-[32px] shadow-[0_-8px_40px_-12px_rgba(0,0,0,0.3)] transition-colors duration-300 outline-none">
                    <div className="no-scrollbar relative w-full flex-1 overflow-y-auto">
                        {/* Drag Handle */}
                        <div className="absolute top-3 left-1/2 z-20 h-1.5 w-12 -translate-x-1/2 rounded-full bg-black/20 backdrop-blur-md dark:bg-white/20" />
                        <Drawer.Title className="sr-only">{item.title}</Drawer.Title>

                        {/* Hero Section with Image and Like Button */}
                        <DishHeroSection
                            item={item}
                            isRemoteOrDataImage={isRemoteOrDataImage}
                            isLiked={isLiked}
                            onBack={() => onOpenChange(false)}
                            onToggleLike={toggleLike}
                        />

                        {/* Content Container */}
                        <div className="relative z-10 -mt-6 px-6">
                            {/* Title & Price */}
                            <div className="mb-4 flex items-start justify-between">
                                <h2 className="font-inter text-3xl leading-tight font-black tracking-tighter text-balance text-black dark:text-white">
                                    {item.title}
                                </h2>
                                <div className="flex flex-col items-end">
                                    <span className="text-brand-crimson text-2xl font-black">
                                        {formatCurrencyCompact(item.price * quantity)}
                                    </span>
                                    <span className="text-xs font-bold text-black/40 dark:text-white/40">
                                        ETB
                                    </span>
                                </div>
                            </div>

                            {/* Stats Row */}
                            <DishStatsRow
                                item={item}
                                likesCount={likesCount}
                                formatLikes={formatLikes}
                            />

                            {/* Description */}
                            <div className="mb-8">
                                <h3 className="font-manrope mb-3 text-lg font-black tracking-tighter text-black dark:text-white">
                                    Description
                                </h3>
                                <p className="leading-relaxed font-medium whitespace-pre-wrap text-gray-500">
                                    {item.description ||
                                        `A delicious combination of fresh ingredients and signature spices, specifically prepared to give you the authentic taste of ${item.shopName}.`}
                                </p>
                            </div>

                            {/* Ingredients */}
                            <div className="mb-8">
                                <h3 className="font-manrope mb-3 text-lg font-black tracking-tighter text-black dark:text-white">
                                    Ingredients
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {ingredients.map((ing, i) => (
                                        <div
                                            key={i}
                                            className="bg-brand-crimson/5 flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold text-black/70 shadow-sm dark:bg-white/5 dark:text-white/70"
                                        >
                                            <div className="bg-brand-yellow h-1.5 w-1.5 rounded-full"></div>
                                            {ing}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Nutritional Value */}
                            <DishNutritionSection nutrition={item.nutrition} />

                            {/* Recommendations */}
                            <DishRecommendations
                                recommendations={recommendations}
                                onOpenChange={onOpenChange}
                                onAddRecommended={onAddRecommended}
                                trigger={trigger}
                            />

                            {/* Modifiers (Mock) */}
                            {['Glazed Pop', 'Neon Tacos'].includes(item.title) && (
                                <div className="space-y-4">
                                    <h3 className="text-lg font-bold text-black dark:text-white">
                                        Add Extras
                                    </h3>
                                    {['Extra Cheese', 'Spicy Sauce', 'Double Meat'].map(extra => (
                                        <div
                                            key={extra}
                                            className="flex items-center justify-between rounded-xl bg-black/5 p-3 transition-colors active:bg-black/10 dark:bg-white/5 dark:active:bg-white/10"
                                            onClick={() => trigger('soft')}
                                        >
                                            <span className="font-medium text-black dark:text-white">
                                                {extra}
                                            </span>
                                            <div className="h-6 w-6 rounded-full bg-black/10 shadow-inner dark:bg-white/10"></div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer / Sticky Cart Action */}
                    <DishCartFooter
                        quantity={quantity}
                        price={item.price}
                        onIncrement={increment}
                        onDecrement={decrement}
                        onAddToCart={handleAddToCart}
                    />
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    );
}
