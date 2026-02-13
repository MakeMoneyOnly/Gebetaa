'use client';

import { Drawer } from 'vaul';
import { Minus, Plus, Star, Heart, Clock, ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useHaptic } from '@/hooks/useHaptic';
import { isRemoteOrDataImageSrc } from '@/lib/utils';
import { createClient } from '@/lib/supabase';
import { MenuCard } from './MenuCard';

interface DishItem {
    id: string;
    name: string;
    title: string;
    price: number;
    imageUrl: string;
    rating?: number;
    shopName?: string;
    popularity?: number; // kept for fallback or legacy
    likesCount?: number;
    reviewsCount?: number;
    ingredients?: string[];
    nutrition?: {
        calories?: number;
        protein?: number;
        carbs?: number;
        fat?: number;
    };
    categories: {
        name: string;
        section: string;
    };
    preparationTime?: number;
    description?: string;
    description_am?: string;
}

interface DishDetailDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item: DishItem | null;
    onAddToCart?: (quantity: number) => void;
    onAddRecommended?: (item: DishItem) => void;
    recommendations?: DishItem[];
}

export function DishDetailDrawer({ open, onOpenChange, item, onAddToCart, onAddRecommended, recommendations }: DishDetailDrawerProps) {
    const { trigger } = useHaptic();
    const [quantity, setQuantity] = useState(1);
    const [isLiked, setIsLiked] = useState(false);
    const isRemoteOrDataImage = item ? isRemoteOrDataImageSrc(item.imageUrl) : false;
    // Initialize likes with a base value if popularity creates a weird number, ensuring it feels real
    const [likesCount, setLikesCount] = useState(0);

    useEffect(() => {
        if (item) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
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

    if (!item) return null;

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
                item_id: item.id,
                delta
            });
            if (error) throw error;
        } catch (err) {
            console.error('Like sync error:', err);
            // Revert on error? Or just leave it for better UX
        }
    };

    if (!item) return null;

    // Format likes helper
    const formatLikes = (count: number) => {
        if (count >= 1000) {
            return (count / 1000).toFixed(1) + 'k';
        }
        return count.toString();
    };

    return (
        <Drawer.Root open={open} onOpenChange={onOpenChange}>
            <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 z-[9999] bg-black/40" />
                <Drawer.Content className="fixed right-0 bottom-0 left-0 z-[9999] mt-24 flex h-[92dvh] flex-col overflow-hidden rounded-t-[32px] bg-white outline-none">
                    <div className="no-scrollbar relative w-full flex-1 overflow-y-auto">
                        {/* Drag Handle (Floating on Image) */}
                        <div className="absolute top-3 left-1/2 z-20 h-1.5 w-12 -translate-x-1/2 rounded-full bg-white/50 backdrop-blur-md" />
                        <Drawer.Title className="sr-only">{item.title}</Drawer.Title>

                        {/* Full Width Hero Image Container */}
                        <div className="relative h-[40vh] w-full shrink-0 overflow-hidden rounded-t-[32px]">
                            <Image
                                src={item.imageUrl}
                                alt={item.title}
                                fill
                                className="object-cover"
                                priority
                                // Avoid server-side optimizer timeout for remote images.
                                unoptimized={isRemoteOrDataImage}
                            />
                            {/* Gradient Fade to White at Bottom - Lowered to hide line */}
                            <div className="pointer-events-none absolute right-0 -bottom-1 left-0 h-24 bg-gradient-to-t from-white via-white/90 to-transparent" />

                            {/* Back Button */}
                            <button
                                onClick={() => onOpenChange(false)}
                                className="absolute top-4 left-4 z-20 flex h-11 w-11 touch-manipulation items-center justify-center rounded-full bg-white/50 backdrop-blur-md border border-white/20 text-brand-crimson shadow-sm transition-all hover:bg-white active:scale-90"
                            >
                                <ArrowLeft size={24} strokeWidth={2.5} />
                            </button>

                            {/* Top Right Heart Button */}
                            <button
                                onClick={(e) => toggleLike(e)}
                                className={`absolute top-4 right-4 z-20 flex h-10 w-10 touch-manipulation items-center justify-center rounded-full border border-white/30 transition-all shadow-sm active:scale-90 ${isLiked
                                    ? 'text-brand-crimson scale-110 shadow-md'
                                    : 'bg-white/30 backdrop-blur-xl hover:bg-white/50 text-white'
                                    }`}
                            >
                                <Heart
                                    size={20}
                                    stroke={isLiked ? 'currentColor' : '#a81818'}
                                    fill={isLiked ? 'currentColor' : 'transparent'}
                                    strokeWidth={isLiked ? 0 : 2.5}
                                    className="transition-transform duration-300"
                                />
                            </button>
                        </div>

                        {/* Content Container */}
                        <div className="relative z-10 -mt-6 px-6">
                            {/* Title & Price */}
                            <div className="mb-4 flex items-start justify-between">
                                <h2 className="font-inter text-3xl leading-tight font-black tracking-tighter text-balance">
                                    {item.title}
                                </h2>
                                <div className="flex flex-col items-end">
                                    <span className="text-brand-crimson text-2xl font-black">
                                        {(item.price * quantity).toLocaleString()}
                                    </span>
                                    <span className="text-xs font-bold text-gray-400">ETB</span>
                                </div>
                            </div>

                            {/* Rating, Like Count, Time Row - Icons on Left */}
                            <div className="mb-8 flex items-center justify-between px-6">
                                {/* Rating Group */}
                                <div className="flex flex-col items-center">
                                    <div className="flex items-center gap-1.5">
                                        <Star
                                            size={18}
                                            className="fill-brand-yellow text-brand-yellow"
                                            strokeWidth={0}
                                        />
                                        <span className="font-manrope text-xl font-black text-gray-900">{item.rating?.toFixed(1) || '4.5'}</span>
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="h-8 w-px bg-gray-200" />

                                {/* Likes Group */}
                                <div className="flex flex-col items-center">
                                    <div className="flex items-center gap-1.5">
                                        <Heart
                                            size={18}
                                            className="text-brand-crimson fill-brand-crimson"
                                            strokeWidth={0}
                                        />
                                        <span className="font-manrope text-xl font-black text-gray-900">{formatLikes(likesCount)}</span>
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="h-8 w-px bg-gray-200" />

                                {/* Prep Time Group */}
                                <div className="flex flex-col items-center">
                                    <div className="flex items-center gap-1.5">
                                        <Clock
                                            size={18}
                                            className="text-gray-400"
                                            strokeWidth={2.5}
                                        />
                                        <div className="flex items-baseline gap-0.5">
                                            <span className="font-manrope text-xl font-black text-gray-900">{item.preparationTime || 15}</span>
                                            <span className="font-manrope text-xs font-bold text-gray-400">min</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="mb-8">
                                <h3 className="mb-3 font-manrope text-lg font-black tracking-tighter text-black">Description</h3>
                                <p className="leading-relaxed text-gray-500 font-medium whitespace-pre-wrap">
                                    {item.description || `A delicious combination of fresh ingredients and signature spices, specifically prepared to give you the authentic taste of ${item.shopName}.`}
                                </p>
                            </div>

                            {/* Ingredients (Real Data with Mock fallback) */}
                            <div className="mb-8">
                                <h3 className="mb-3 font-manrope text-lg font-black tracking-tighter text-black">Ingredients</h3>
                                <div className="flex flex-wrap gap-2">
                                    {(item.ingredients && item.ingredients.length > 0
                                        ? item.ingredients
                                        : ['Organic Tomatoes', 'Fresh Basil', 'Mozzarella', 'Extra Virgin Olive Oil', 'Garlic', 'Sea Salt']
                                    ).map((ing, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center gap-1.5 rounded-xl bg-gray-50 px-3 py-2 text-sm font-bold text-gray-600"
                                        >
                                            <div className="h-1.5 w-1.5 rounded-full bg-brand-yellow"></div>
                                            {ing}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Nutritional Value (Real Data with Mock fallback) */}
                            <div className="mb-8">
                                <h3 className="mb-3 font-manrope text-lg font-black tracking-tighter text-black">Nutritional Value</h3>
                                <div className="grid grid-cols-4 gap-2">
                                    {[
                                        { label: 'Calories', value: item.nutrition?.calories || '540', unit: 'kcal' },
                                        { label: 'Protein', value: item.nutrition?.protein || '32', unit: 'g' },
                                        { label: 'Carbs', value: item.nutrition?.carbs || '45', unit: 'g' },
                                        { label: 'Fat', value: item.nutrition?.fat || '22', unit: 'g' },
                                    ].map((stat, i) => (
                                        <div key={i} className="flex flex-col items-center justify-center rounded-2xl bg-gray-50 p-3 py-4">
                                            <div className="flex items-baseline gap-0.5">
                                                <span className="font-manrope text-lg font-black text-gray-900">{stat.value}</span>
                                                <span className="text-[10px] font-bold text-gray-400">{stat.unit}</span>
                                            </div>
                                            <span className="mt-1 text-[10px] font-bold text-gray-500 uppercase tracking-tight">{stat.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Upsell Section / Recommendations - FORCED VISIBILITY */}
                            <div className="mb-12 border-t border-gray-100 pt-8 mt-4 bg-gray-50/50 -mx-6 px-6">
                                <h3 className="mb-5 font-manrope text-xl font-black tracking-tighter text-black">You might also like</h3>

                                {(() => {
                                    // Use provided recommendations or fallback to a set of high-quality mock items to ensure visibility
                                    const displayRecs = (recommendations && recommendations.length > 0)
                                        ? recommendations
                                        : [
                                            {
                                                id: 'fallback-1',
                                                title: 'Signature Pasta',
                                                price: 180,
                                                imageUrl: 'https://axuegixbqsvztdraenkz.supabase.co/storage/v1/object/public/food-images/Creamy%20Pesto%20Pasta.webp',
                                                categories: { name: 'Pizza', section: 'food' },
                                                rating: 4.8,
                                                shopName: 'Pizza'
                                            },
                                            {
                                                id: 'fallback-2',
                                                title: 'Garden Fresh Salad',
                                                price: 150,
                                                imageUrl: 'https://axuegixbqsvztdraenkz.supabase.co/storage/v1/object/public/food-images/Truffle%20Burger.webp',
                                                categories: { name: 'Vegan', section: 'food' },
                                                rating: 4.6,
                                                shopName: 'Vegan'
                                            },
                                            {
                                                id: 'fallback-3',
                                                title: 'Crispy Wings',
                                                price: 220,
                                                imageUrl: 'https://axuegixbqsvztdraenkz.supabase.co/storage/v1/object/public/food-images/Spicy%20Tonkotsu.webp',
                                                categories: { name: 'Burger', section: 'food' },
                                                rating: 4.9,
                                                shopName: 'Burger'
                                            },
                                            {
                                                id: 'fallback-4',
                                                title: 'Berry Smoothie',
                                                price: 110,
                                                imageUrl: 'https://axuegixbqsvztdraenkz.supabase.co/storage/v1/object/public/food-images/Rainbow%20Sushi%20Platter.webp',
                                                categories: { name: 'Juice', section: 'drinks' },
                                                rating: 4.7,
                                                shopName: 'Juice'
                                            },
                                            {
                                                id: 'fallback-5',
                                                title: 'Traditional Kitfo',
                                                price: 190,
                                                imageUrl: 'https://axuegixbqsvztdraenkz.supabase.co/storage/v1/object/public/food-images/Honey-Glazed%20Salmon.webp',
                                                categories: { name: 'Traditional', section: 'food' },
                                                rating: 5.0,
                                                shopName: 'Traditional'
                                            }
                                        ];

                                    return (
                                        <div className="no-scrollbar -mx-6 flex gap-4 overflow-x-auto px-6 pb-6">
                                            {displayRecs.map((rec: any) => (
                                                <div key={rec.id} className="w-[180px] shrink-0">
                                                    <MenuCard
                                                        item={{
                                                            ...rec,
                                                            shopName: rec.categories?.name || rec.shopName
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
                                    );
                                })()}
                            </div>

                            {/* Modifiers (Mock) - Only show if item actually has extras (mock logic for now) */}
                            {/* In a real app, check item.modifiers?.length > 0 */}
                            {['Glazed Pop', 'Neon Tacos'].includes(item.title) && (
                                <div className="space-y-4">
                                    <h3 className="text-lg font-bold">Add Extras</h3>
                                    {['Extra Cheese', 'Spicy Sauce', 'Double Meat'].map(extra => (
                                        <div
                                            key={extra}
                                            className="flex items-center justify-between rounded-xl bg-gray-50 p-3 transition-colors active:bg-gray-100"
                                            onClick={() => trigger('soft')}
                                        >
                                            <span className="font-medium">{extra}</span>
                                            <div className="h-6 w-6 rounded-full border-2 border-gray-300"></div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer / Sticky Cart Action */}
                    <div className="z-20 border-t border-gray-100 bg-white p-4 pb-[calc(env(safe-area-inset-bottom)+20px)] shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
                        <div className="flex items-center gap-4">
                            {/* Quantity Controls */}
                            <div className="flex h-14 items-center gap-4 rounded-full bg-gray-100 p-2 px-4">
                                <button
                                    onClick={decrement}
                                    className="text-brand-crimson flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm transition-transform active:scale-90"
                                >
                                    <Minus size={16} />
                                </button>
                                <span className="w-6 text-center text-xl font-black">
                                    {quantity}
                                </span>
                                <button
                                    onClick={increment}
                                    className="bg-brand-crimson flex h-8 w-8 items-center justify-center rounded-full text-white shadow-sm transition-transform active:scale-90"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>

                            {/* Add to Cart Button */}
                            <button
                                onClick={handleAddToCart}
                                className="bg-brand-crimson flex h-14 flex-1 items-center justify-center gap-2 rounded-full text-lg font-bold text-white shadow-lg transition-transform active:scale-95"
                            >
                                Add to Order
                            </button>
                        </div>
                    </div>
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    );
}
