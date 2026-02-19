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
    price,
    onIncrement,
    onDecrement,
    onAddToCart,
}: DishCartFooterProps) {
    return (
        <div className="z-20 border-t border-white/10 bg-[#0a0a0a] p-4 pb-[calc(env(safe-area-inset-bottom)+20px)] shadow-[0_-5px_30px_rgba(0,0,0,0.5)]">
            <div className="flex items-center gap-4">
                {/* Quantity Controls */}
                <div className="flex h-14 items-center gap-4 rounded-full bg-white/5 border border-white/10 p-2 px-4 text-white">
                    <button
                        onClick={onDecrement}
                        className="text-white flex h-8 w-8 items-center justify-center rounded-full bg-white/10 transition-transform active:scale-90"
                    >
                        <Minus size={16} />
                    </button>
                    <span className="w-6 text-center text-xl font-black">
                        {quantity}
                    </span>
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
                    className="bg-white hover:bg-white/90 text-black flex h-14 flex-1 items-center justify-center gap-2 rounded-full text-lg font-bold shadow-lg transition-transform active:scale-95"
                >
                    Add to Order
                </button>
            </div>
        </div>
    );
}