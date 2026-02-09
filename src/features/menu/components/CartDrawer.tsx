'use client';

import { Drawer } from 'vaul';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useHaptic } from '@/hooks/useHaptic';

interface CartDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CartDrawer({ open, onOpenChange }: CartDrawerProps) {
    const { items, total, updateQuantity, updateInstructions } = useCart();
    const { trigger } = useHaptic();

    return (
        <Drawer.Root open={open} onOpenChange={onOpenChange}>
            <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 bg-black/40 z-[9999]" />
                <Drawer.Content className="bg-white flex flex-col rounded-t-[32px] mt-24 fixed bottom-0 left-0 right-0 z-[9999] h-[85dvh] outline-none">
                    <div className="flex-1 overflow-y-auto no-scrollbar p-6">
                        {/* Drag Handle */}
                        <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-300 mb-8" />

                        <div className="flex justify-between items-end mb-8">
                            <Drawer.Title className="text-3xl font-black font-manrope">Your Order</Drawer.Title>
                            <span className="text-sm font-bold text-gray-400 uppercase tracking-wide">Table 5</span>
                        </div>

                        {items.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-center text-gray-400">
                                <p className="text-lg font-medium">Your cart is empty</p>
                                <p className="text-sm">Add some delicious items to get started!</p>
                            </div>
                        ) : (
                            /* Cart Items List */
                            <div className="space-y-8">
                                {items.map((item) => (
                                    <div key={item.uniqueId} className="flex flex-col gap-4 border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                                        <div className="flex gap-4">
                                            {/* Image */}
                                            <div className="w-20 h-20 rounded-2xl bg-gray-100 overflow-hidden shrink-0 shadow-sm">
                                                {item.image && (
                                                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                                )}
                                            </div>

                                            {/* Details */}
                                            <div className="flex-1 flex flex-col justify-between py-1">
                                                <div className="flex justify-between items-start">
                                                    <h3 className="font-bold text-lg leading-tight w-[70%]">{item.title}</h3>
                                                    <div className="flex flex-col items-end">
                                                        <span className="font-black text-brand-crimson">{item.price * item.quantity}</span>
                                                        <span className="text-xs text-brand-crimson/60 font-bold">ETB</span>
                                                    </div>
                                                </div>

                                                <div className="flex justify-between items-center mt-2">
                                                    {/* Quantity Controls */}
                                                    <div className="flex items-center gap-3 bg-gray-50 rounded-full p-1 px-2 border border-gray-100 shadow-sm">
                                                        <button
                                                            onClick={() => item.quantity > 1 && updateQuantity(item.uniqueId, -1)}
                                                            disabled={item.quantity <= 1}
                                                            className="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-sm active:scale-90 transition-transform text-brand-crimson hover:text-black disabled:opacity-50 disabled:active:scale-100"
                                                        >
                                                            <Minus size={14} />
                                                        </button>
                                                        <span className="font-bold text-base w-4 text-center">{item.quantity}</span>
                                                        <button
                                                            onClick={() => updateQuantity(item.uniqueId, 1)}
                                                            className="w-8 h-8 flex items-center justify-center bg-brand-crimson text-white rounded-full shadow-sm active:scale-90 transition-transform hover:bg-red-700"
                                                        >
                                                            <Plus size={14} />
                                                        </button>
                                                    </div>

                                                    {/* Remove Button */}
                                                    <button
                                                        onClick={() => updateQuantity(item.uniqueId, -item.quantity)}
                                                        className="w-8 h-8 flex items-center justify-center bg-red-50 text-brand-crimson rounded-full shadow-sm active:scale-90 transition-transform"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Instructions Input */}
                                        <div className="relative w-full">
                                            <input
                                                type="text"
                                                placeholder="Add instructions (e.g., No onions)..."
                                                value={item.instructions || ''}
                                                onChange={(e) => updateInstructions(item.uniqueId, e.target.value)}
                                                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-crimson/20 transition-all placeholder:text-gray-400"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer / Checkout */}
                    <div className="p-6 bg-white border-t border-gray-100 pb-[calc(env(safe-area-inset-bottom)+20px)] shadow-[0_-5px_20px_rgba(0,0,0,0.05)] z-20">
                        <div className="flex justify-between items-center mb-6">
                            <span className="text-gray-500 font-medium">Total</span>
                            <div className="flex items-end gap-1">
                                <span className="text-3xl font-black text-black">{total}</span>
                                <span className="text-sm font-bold text-gray-400 mb-1.5">ETB</span>
                            </div>
                        </div>

                        <button
                            disabled={items.length === 0}
                            onClick={() => {
                                trigger('success');
                                alert('Order Placed! (Mock)');
                                // TODO: Connect to supabase orders table
                            }}
                            className="w-full h-14 bg-brand-crimson text-white rounded-full font-bold text-lg shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Place Order
                        </button>
                    </div>
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    );
}
