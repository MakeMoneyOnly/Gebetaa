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
            setLikesCount(currentLikes => prev ? currentLikes - 1 : currentLikes + 1);
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
                <Drawer.Overlay className="fixed inset-0 bg-black/40 z-[9999]" />
                <Drawer.Content className="bg-white flex flex-col rounded-t-[32px] mt-24 fixed bottom-0 left-0 right-0 z-[9999] h-[92dvh] outline-none overflow-hidden">
                    <div className="flex-1 overflow-y-auto no-scrollbar relative w-full pb-32">
                        {/* Drag Handle (Floating on Image) */}
                        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 rounded-full bg-white/50 backdrop-blur-md z-20" />
                        <Drawer.Title className="sr-only">{item.title}</Drawer.Title>

                        {/* Full Width Hero Image Container */}
                        <div className="relative w-full h-[40vh] shrink-0 rounded-t-[32px] overflow-hidden">
                            <Image
                                src={item.imageUrl}
                                alt={item.title}
                                fill
                                className="object-cover"
                                priority
                            />
                            {/* Gradient Fade to White at Bottom - Lowered to hide line */}
                            <div className="absolute -bottom-1 left-0 right-0 h-24 bg-gradient-to-t from-white via-white/90 to-transparent pointer-events-none" />

                            {/* Top Right Heart Button */}
                            <button
                                onClick={toggleLike}
                                className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center bg-white shadow-lg active:scale-90 transition-transform touch-manipulation z-20"
                            >
                                <Heart
                                    size={20}
                                    className={`transition-colors duration-300 ${isLiked ? 'fill-brand-crimson text-brand-crimson' : 'text-brand-crimson'}`}
                                    strokeWidth={isLiked ? 0 : 2.5}
                                />
                            </button>
                        </div>

                        {/* Content Container */}
                        <div className="px-6 relative -mt-6 z-10">
                            {/* Title & Price */}
                            <div className="flex justify-between items-start mb-4">
                                <h2 className="text-3xl font-black font-inter leading-tight text-balance tracking-tighter">{item.title}</h2>
                                <div className="flex flex-col items-end">
                                    <span className="text-2xl font-black text-brand-crimson">{(item.price * quantity).toLocaleString()}</span>
                                    <span className="text-xs font-bold text-gray-400">ETB</span>
                                </div>
                            </div>

                            {/* Rating, Like Count, Prep Time Row - Standardized sizing */}
                            <div className="flex items-center justify-between mb-8 px-1">
                                {/* Rating Group */}
                                <div className="flex items-center gap-1.5 min-w-[80px]">
                                    <Star size={22} className="fill-brand-yellow text-brand-yellow" strokeWidth={0} />
                                    <span className="font-bold text-gray-500 text-base">{item.rating || 4.5}</span>
                                    <span className="text-gray-400 text-base font-bold">({item.reviews || '120+'})</span>
                                </div>

                                {/* Likes Count (Middle) */}
                                <div className="flex items-center justify-center gap-1.5 min-w-[80px]">
                                    <Heart
                                        size={22}
                                        className={`transition-colors duration-300 ${isLiked ? 'fill-brand-crimson text-brand-crimson' : 'text-gray-300'}`}
                                        strokeWidth={isLiked ? 0 : 2}
                                    />
                                    <span className="font-bold text-gray-500 text-base">{formatLikes(likesCount)}</span>
                                </div>

                                {/* Prep Time Group */}
                                {item.categories?.section === 'food' ? (
                                    <div className="flex items-center justify-end gap-1.5 text-gray-500 font-bold text-base min-w-[80px]">
                                        <Clock size={22} className="text-gray-400" />
                                        <span>{item.preparationTime || 15} mins</span>
                                    </div>
                                ) : (
                                    <div className="min-w-[80px]"></div>
                                )}
                            </div>

                            {/* Description */}
                            <p className="text-gray-600 leading-relaxed mb-8">
                                A delicious combination of fresh ingredients and signature spices.
                                Specifically prepared to give you the authentic taste of {item.shopName}.
                            </p>

                            {/* Modifiers (Mock) - Only show if item actually has extras (mock logic for now) */}
                            {/* In a real app, check item.modifiers?.length > 0 */}
                            {['Glazed Pop', 'Neon Tacos'].includes(item.title) && (
                                <div className="space-y-4">
                                    <h3 className="font-bold text-lg">Add Extras</h3>
                                    {['Extra Cheese', 'Spicy Sauce', 'Double Meat'].map((extra) => (
                                        <div key={extra} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 active:bg-gray-100 transition-colors" onClick={() => trigger('soft')}>
                                            <span className="font-medium">{extra}</span>
                                            <div className="w-6 h-6 rounded-full border-2 border-gray-300"></div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer / Sticky Cart Action */}
                    <div className="p-4 bg-white border-t border-gray-100 pb-[calc(env(safe-area-inset-bottom)+20px)] z-20 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
                        <div className="flex items-center gap-4">
                            {/* Quantity Controls */}
                            <div className="flex items-center gap-4 bg-gray-100 rounded-full p-2 px-4 h-14">
                                <button onClick={decrement} className="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-sm active:scale-90 transition-transform text-brand-crimson">
                                    <Minus size={16} />
                                </button>
                                <span className="font-black text-xl w-6 text-center">{quantity}</span>
                                <button onClick={increment} className="w-8 h-8 flex items-center justify-center bg-brand-crimson text-white rounded-full shadow-sm active:scale-90 transition-transform">
                                    <Plus size={16} />
                                </button>
                            </div>

                            {/* Add to Cart Button */}
                            <button
                                onClick={handleAddToCart}
                                className="flex-1 h-14 bg-brand-crimson text-white rounded-full font-bold text-lg shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2 mb-1"
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
