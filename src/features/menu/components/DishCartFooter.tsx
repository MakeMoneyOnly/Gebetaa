'use client';

import { Minus, Plus } from 'lucide-react';

interface DishCartFooterProps {
    quantity: number;
    price: number;
    onIncrement: () => void;
    onDecrement: () => void;
    onAddToCart: () => void;
}

export function DishCartFooter({
    quantity,
    onIncrement,
    onDecrement,
    onAddToCart,
}: DishCartFooterProps) {
    return (
        <div className="bg-background z-20 border-t border-black/5 p-4 pb-[calc(env(safe-area-inset-bottom)+20px)] shadow-[0_-5px_30px_rgba(0,0,0,0.05)] dark:border-white/10 dark:shadow-[0_-5px_30px_rgba(0,0,0,0.5)]">
            <div className="flex items-center gap-4">
                {/* Quantity Controls */}
                <div className="flex h-14 items-center gap-4 rounded-full border border-black/10 bg-black/5 p-2 px-4 text-black dark:border-white/10 dark:bg-white/5 dark:text-white">
                    <button
                        onClick={onDecrement}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-black/10 text-black transition-transform hover:opacity-80 active:scale-90 dark:bg-white/10 dark:text-white"
                    >
                        <Minus size={16} />
                    </button>
                    <span className="w-6 text-center text-xl font-black">{quantity}</span>
                    <button
                        onClick={onIncrement}
                        className="bg-brand-crimson flex h-8 w-8 items-center justify-center rounded-full text-white shadow-sm transition-transform active:scale-90"
                    >
                        <Plus size={16} />
                    </button>
                </div>

                {/* Add to Cart Button */}
                <button
                    onClick={onAddToCart}
                    className="bg-brand-crimson hover:bg-brand-crimson/90 flex h-14 flex-1 items-center justify-center gap-2 rounded-full text-lg font-bold text-white shadow-lg transition-transform active:scale-95"
                >
                    Add to Order
                </button>
            </div>
        </div>
    );
}
