'use client';

import { Drawer } from 'vaul';
import { Minus, Plus, Star, Heart, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useHaptic } from '@/hooks/useHaptic';

interface DishItem {
    id: string;
    title: string;
    price: number;
    imageUrl: string;
    rating?: number;
    shopName?: string;
    popularity?: number;
    reviews?: string;
    categories?: {
        section: string;
    };
    preparationTime?: number;
}

interface DishDetailDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item: DishItem | null;
    onAddToCart?: (quantity: number) => void;
}

export function DishDetailDrawer({ open, onOpenChange, item, onAddToCart }: DishDetailDrawerProps) {
    const { trigger } = useHaptic();
    const [quantity, setQuantity] = useState(1);
    const [isLiked, setIsLiked] = useState(false);
    // Initialize likes with a base value if popularity creates a weird number, ensuring it feels real
    const [likesCount, setLikesCount] = useState(0);

    useEffect(() => {
        if (item) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setLikesCount(item.popularity || 2100);
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

    const toggleLike = () => {
        trigger('medium');
        setIsLiked(prev => {
            setLikesCount(currentLikes => (prev ? currentLikes - 1 : currentLikes + 1));
            return !prev;
        });
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
                    <div className="no-scrollbar relative w-full flex-1 overflow-y-auto pb-32">
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
                            />
                            {/* Gradient Fade to White at Bottom - Lowered to hide line */}
                            <div className="pointer-events-none absolute right-0 -bottom-1 left-0 h-24 bg-gradient-to-t from-white via-white/90 to-transparent" />

                            {/* Top Right Heart Button */}
                            <button
                                onClick={toggleLike}
                                className="absolute top-4 right-4 z-20 flex h-10 w-10 touch-manipulation items-center justify-center rounded-full bg-white shadow-lg transition-transform active:scale-90"
                            >
                                <Heart
                                    size={20}
                                    className={`transition-colors duration-300 ${isLiked ? 'fill-brand-crimson text-brand-crimson' : 'text-brand-crimson'}`}
                                    strokeWidth={isLiked ? 0 : 2.5}
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

                            {/* Rating, Like Count, Prep Time Row - Standardized sizing */}
                            <div className="mb-8 flex items-center justify-between px-1">
                                {/* Rating Group */}
                                <div className="flex min-w-[80px] items-center gap-1.5">
                                    <Star
                                        size={22}
                                        className="fill-brand-yellow text-brand-yellow"
                                        strokeWidth={0}
                                    />
                                    <span className="text-base font-bold text-gray-500">
                                        {item.rating || 4.5}
                                    </span>
                                    <span className="text-base font-bold text-gray-400">
                                        ({item.reviews || '120+'})
                                    </span>
                                </div>

                                {/* Likes Count (Middle) */}
                                <div className="flex min-w-[80px] items-center justify-center gap-1.5">
                                    <Heart
                                        size={22}
                                        className={`transition-colors duration-300 ${isLiked ? 'fill-brand-crimson text-brand-crimson' : 'text-gray-300'}`}
                                        strokeWidth={isLiked ? 0 : 2}
                                    />
                                    <span className="text-base font-bold text-gray-500">
                                        {formatLikes(likesCount)}
                                    </span>
                                </div>

                                {/* Prep Time Group */}
                                {item.categories?.section === 'food' ? (
                                    <div className="flex min-w-[80px] items-center justify-end gap-1.5 text-base font-bold text-gray-500">
                                        <Clock size={22} className="text-gray-400" />
                                        <span>{item.preparationTime || 15} mins</span>
                                    </div>
                                ) : (
                                    <div className="min-w-[80px]"></div>
                                )}
                            </div>

                            {/* Description */}
                            <p className="mb-8 leading-relaxed text-gray-600">
                                A delicious combination of fresh ingredients and signature spices.
                                Specifically prepared to give you the authentic taste of{' '}
                                {item.shopName}.
                            </p>

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
                                className="bg-brand-crimson mb-1 flex h-14 flex-1 items-center justify-center gap-2 rounded-full text-lg font-bold text-white shadow-lg transition-transform active:scale-95"
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
