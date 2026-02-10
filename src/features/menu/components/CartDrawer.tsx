'use client';

import { Drawer } from 'vaul';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useHaptic } from '@/hooks/useHaptic';
import Image from 'next/image';

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
                <Drawer.Overlay className="fixed inset-0 z-[9999] bg-black/40" />
                <Drawer.Content className="fixed right-0 bottom-0 left-0 z-[9999] mt-24 flex h-[85dvh] flex-col rounded-t-[32px] bg-white outline-none">
                    <div className="no-scrollbar flex-1 overflow-y-auto p-6">
                        {/* Drag Handle */}
                        <div className="mx-auto mb-8 h-1.5 w-12 flex-shrink-0 rounded-full bg-gray-300" />

                        <div className="mb-8 flex items-end justify-between">
                            <Drawer.Title className="font-manrope text-3xl font-black tracking-tighter">
                                Your Order
                            </Drawer.Title>
                            <span className="text-sm font-bold tracking-wide text-gray-400 uppercase">
                                Table 5
                            </span>
                        </div>

                        {items.length === 0 ? (
                            <div className="flex h-64 flex-col items-center justify-center text-center text-gray-400">
                                <p className="text-lg font-medium">Your cart is empty</p>
                                <p className="text-sm">Add some delicious items to get started!</p>
                            </div>
                        ) : (
                            /* Cart Items List */
                            <div className="space-y-8">
                                {items.map(item => (
                                    <div
                                        key={item.uniqueId}
                                        className="flex flex-col gap-4 border-b border-gray-100 pb-6 last:border-0 last:pb-0"
                                    >
                                        <div className="flex gap-4">
                                            {/* Image */}
                                            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-gray-100 shadow-sm">
                                                {item.image && (
                                                    <Image
                                                        src={item.image}
                                                        alt={item.title}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                )}
                                            </div>

                                            {/* Details */}
                                            <div className="flex flex-1 flex-col justify-between py-1">
                                                <div className="flex items-start justify-between">
                                                    <h3 className="w-[70%] text-lg leading-tight font-bold">
                                                        {item.title}
                                                    </h3>
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-brand-crimson font-black">
                                                            {(
                                                                item.price * item.quantity
                                                            ).toLocaleString()}
                                                        </span>
                                                        <span className="text-brand-crimson/60 text-xs font-bold">
                                                            ETB
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="mt-2 flex items-center justify-between">
                                                    {/* Quantity Controls */}
                                                    <div className="flex items-center gap-3 rounded-full border border-gray-100 bg-gray-50 p-1 px-2 shadow-sm">
                                                        <button
                                                            onClick={() =>
                                                                item.quantity > 1 &&
                                                                updateQuantity(item.uniqueId, -1)
                                                            }
                                                            disabled={item.quantity <= 1}
                                                            className="text-brand-crimson flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm transition-transform hover:text-black active:scale-90 disabled:opacity-50 disabled:active:scale-100"
                                                        >
                                                            <Minus size={14} />
                                                        </button>
                                                        <span className="w-4 text-center text-base font-bold">
                                                            {item.quantity}
                                                        </span>
                                                        <button
                                                            onClick={() =>
                                                                updateQuantity(item.uniqueId, 1)
                                                            }
                                                            className="bg-brand-crimson flex h-8 w-8 items-center justify-center rounded-full text-white shadow-sm transition-transform hover:bg-red-700 active:scale-90"
                                                        >
                                                            <Plus size={14} />
                                                        </button>
                                                    </div>

                                                    {/* Remove Button */}
                                                    <button
                                                        onClick={() =>
                                                            updateQuantity(
                                                                item.uniqueId,
                                                                -item.quantity
                                                            )
                                                        }
                                                        className="text-brand-crimson flex h-8 w-8 items-center justify-center rounded-full bg-red-50 shadow-sm transition-transform active:scale-90"
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
                                                onChange={e =>
                                                    updateInstructions(
                                                        item.uniqueId,
                                                        e.target.value
                                                    )
                                                }
                                                className="focus:ring-brand-crimson/20 w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm transition-all placeholder:text-gray-400 focus:ring-2 focus:outline-none"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer / Checkout */}
                    <div className="z-20 border-t border-gray-100 bg-white p-6 pb-[calc(env(safe-area-inset-bottom)+20px)] shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
                        <div className="mb-6 flex items-center justify-between">
                            <span className="font-medium text-gray-500">Total</span>
                            <div className="flex items-end gap-1">
                                <span className="text-3xl font-black text-black">
                                    {total.toLocaleString()}
                                </span>
                                <span className="mb-1.5 text-sm font-bold text-gray-400">ETB</span>
                            </div>
                        </div>

                        <button
                            disabled={items.length === 0}
                            onClick={() => {
                                trigger('success');
                                alert('Order Placed! (Mock)');
                                // TODO: Connect to supabase orders table
                            }}
                            className="bg-brand-crimson flex h-14 w-full items-center justify-center gap-2 rounded-full text-lg font-bold text-white shadow-lg transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Place Order
                        </button>
                    </div>
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    );
}
