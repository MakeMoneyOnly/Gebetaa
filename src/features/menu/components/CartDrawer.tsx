'use client';

import { Drawer } from 'vaul';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useHaptic } from '@/hooks/useHaptic';
import Image from 'next/image';
import { isRemoteOrDataImageSrc } from '@/lib/utils';
import { useState } from 'react';
import { isAbortError } from '@/hooks/useSafeFetch';

interface CartDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    guestContext: {
        slug: string;
        table: string;
        sig: string;
        exp: number;
        campaign_attribution?: {
            campaign_delivery_id: string;
            campaign_id?: string;
        };
    } | null;
    tableNumber: string | null;
}

export function CartDrawer({ open, onOpenChange, guestContext, tableNumber }: CartDrawerProps) {
    const { items, total, updateQuantity, updateInstructions, clearCart } = useCart();
    const { trigger } = useHaptic();
    const [submitting, setSubmitting] = useState(false);
    const [orderMessage, setOrderMessage] = useState<string | null>(null);
    const [orderError, setOrderError] = useState<string | null>(null);

    const handlePlaceOrder = async () => {
        if (!guestContext || !tableNumber) {
            setOrderError('Unable to place order: invalid or expired table QR context.');
            return;
        }

        if (items.length === 0 || submitting) {
            return;
        }

        setSubmitting(true);
        setOrderError(null);
        setOrderMessage(null);

        try {
            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    guest_context: guestContext,
                    items: items.map(item => ({
                        id: item.menuItemId,
                        name: item.title,
                        quantity: item.quantity,
                        price: item.price,
                        notes: item.instructions,
                    })),
                    total_price: total,
                    notes: undefined,
                    ...(guestContext.campaign_attribution
                        ? { campaign_attribution: guestContext.campaign_attribution }
                        : {}),
                }),
            });

            const payload = await response.json();
            if (!response.ok) {
                setOrderError(payload?.error ?? 'Failed to place order.');
                return;
            }

            trigger('success');
            clearCart();
            setOrderMessage('Order received. Kitchen has been notified.');
        } catch (error) {
            // Silently ignore abort errors
            if (isAbortError(error)) {
                return;
            }
            console.error('Order submission failed:', error);
            setOrderError('Network error while placing order. Please retry.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Drawer.Root open={open} onOpenChange={onOpenChange}>
            <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm" />
                <Drawer.Content className="bg-background fixed right-0 bottom-0 left-0 z-[9999] flex h-[86vh] flex-col rounded-t-[32px] border-t border-black/5 transition-colors duration-300 outline-none dark:border-white/10">
                    <div className="no-scrollbar flex-1 overflow-y-auto p-6 text-black dark:text-white">
                        {/* Drag Handle */}
                        <div className="mx-auto mb-8 h-1.5 w-12 flex-shrink-0 rounded-full bg-black/20 dark:bg-white/20" />

                        <div className="mb-8 flex items-end justify-between">
                            <Drawer.Title className="font-manrope text-3xl font-black tracking-tighter text-black dark:text-white">
                                Your Order
                            </Drawer.Title>
                            <span className="text-sm font-bold tracking-wide text-black/40 uppercase dark:text-white/40">
                                Table {tableNumber ?? '--'}
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
                                        className="flex flex-col gap-4 border-b border-white/5 pb-6 last:border-0 last:pb-0"
                                    >
                                        <div className="flex gap-4">
                                            {/* Image */}
                                            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/5">
                                                {item.image && (
                                                    <Image
                                                        src={item.image}
                                                        alt={item.title}
                                                        fill
                                                        className="object-cover"
                                                        // Avoid optimizer timeout on remote/data image URLs.
                                                        unoptimized={
                                                            item.image
                                                                ? isRemoteOrDataImageSrc(item.image)
                                                                : false
                                                        }
                                                    />
                                                )}
                                            </div>

                                            {/* Details */}
                                            <div className="flex flex-1 flex-col justify-between py-1">
                                                <div className="flex items-start justify-between">
                                                    <h3 className="w-[70%] text-lg leading-tight font-bold text-black dark:text-white">
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
                                                    <div className="flex items-center gap-3 rounded-full border border-black/10 bg-black/5 p-1 px-2 shadow-sm dark:border-white/10 dark:bg-white/5">
                                                        <button
                                                            onClick={() =>
                                                                item.quantity > 1 &&
                                                                updateQuantity(item.uniqueId, -1)
                                                            }
                                                            disabled={item.quantity <= 1}
                                                            className="flex h-8 w-8 items-center justify-center rounded-full bg-black/10 text-black transition-transform hover:opacity-80 active:scale-90 disabled:opacity-50 disabled:active:scale-100 dark:bg-white/10 dark:text-white"
                                                        >
                                                            <Minus size={14} />
                                                        </button>
                                                        <span className="w-4 text-center text-base font-bold text-black dark:text-white">
                                                            {item.quantity}
                                                        </span>
                                                        <button
                                                            onClick={() =>
                                                                updateQuantity(item.uniqueId, 1)
                                                            }
                                                            className="bg-brand-crimson flex h-8 w-8 items-center justify-center rounded-full text-white shadow-sm transition-transform active:scale-90"
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
                                                        className="text-brand-crimson bg-brand-crimson/10 flex h-8 w-8 items-center justify-center rounded-full shadow-sm transition-transform active:scale-90"
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
                                                className="focus:ring-brand-crimson/40 w-full rounded-xl border border-black/10 bg-black/5 px-4 py-3 text-sm text-black transition-all placeholder:text-black/30 focus:ring-2 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/30"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer / Checkout */}
                    <div className="bg-background z-20 border-t border-black/5 p-6 pb-[calc(env(safe-area-inset-bottom)+20px)] shadow-[0_-5px_30px_rgba(0,0,0,0.05)] dark:border-white/10 dark:shadow-[0_-5px_30px_rgba(0,0,0,0.5)]">
                        <div className="mb-6 flex items-center justify-between">
                            <span className="font-medium text-black/40 dark:text-white/40">
                                Total
                            </span>
                            <div className="flex items-end gap-1">
                                <span className="text-3xl font-black text-black dark:text-white">
                                    {total.toLocaleString()}
                                </span>
                                <span className="mb-1.5 text-sm font-bold text-black/40 dark:text-white/40">
                                    ETB
                                </span>
                            </div>
                        </div>

                        <button
                            disabled={items.length === 0 || submitting}
                            onClick={handlePlaceOrder}
                            className="bg-brand-crimson hover:bg-brand-crimson/90 flex h-14 w-full items-center justify-center gap-2 rounded-full text-lg font-bold text-white shadow-lg transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {submitting ? 'Placing Order...' : 'Place Order'}
                        </button>

                        {orderMessage && (
                            <p className="mt-3 text-center text-sm font-semibold text-green-400">
                                {orderMessage}
                            </p>
                        )}
                        {orderError && (
                            <p className="mt-3 text-center text-sm font-semibold text-red-400">
                                {orderError}
                            </p>
                        )}
                    </div>
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    );
}
