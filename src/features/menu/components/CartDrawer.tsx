'use client';

import { Drawer } from 'vaul';
import { Minus, Plus, Trash2, Truck, ShoppingBag, Utensils, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useHaptic } from '@/hooks/useHaptic';
import Image from 'next/image';
import { isRemoteOrDataImageSrc } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { isAbortError } from '@/hooks/useSafeFetch';

type OrderType = 'pickup' | 'delivery' | 'dine_in';

interface CartDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    guestContext: {
        slug: string;
        table: string;
        sig: string;
        exp: number;
        guest_session_id?: string;
        auth_state?: 'guest' | 'authenticated';
        login_url?: string;
        is_online_order?: boolean;
        campaign_attribution?: {
            campaign_delivery_id: string;
            campaign_id?: string;
        };
    } | null;
    tableNumber: string | null;
    /** When true, the drawer starts on the success screen (returning from Chapa) */
    paymentReturnSuccess?: boolean;
    paymentOrderId?: string;
}

// ── Order Type Selector pill button ──────────────────────────────────────────
function OrderTypeButton({
    type,
    label,
    icon,
    selected,
    onClick,
}: {
    type: OrderType;
    label: string;
    icon: React.ReactNode;
    selected: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex flex-1 flex-col items-center gap-1.5 rounded-2xl border-2 py-3 text-xs font-bold transition-all ${
                selected
                    ? 'border-brand-crimson bg-brand-crimson text-white shadow-md'
                    : 'border-black/10 bg-black/5 text-black/60 dark:border-white/10 dark:bg-white/5 dark:text-white/60'
            }`}
        >
            <span className={`${selected ? 'text-white' : 'text-black/40 dark:text-white/40'}`}>
                {icon}
            </span>
            {label}
        </button>
    );
}

export function CartDrawer({ open, onOpenChange, guestContext, tableNumber, paymentReturnSuccess, paymentOrderId }: CartDrawerProps) {
    const { items, total, updateQuantity, updateInstructions, clearCart } = useCart();
    const { trigger } = useHaptic();
    const [submitting, setSubmitting] = useState(false);
    const [orderMessage, setOrderMessage] = useState<string | null>(null);
    const [orderError, setOrderError] = useState<string | null>(null);

    // Online ordering state
    const isOnlineOrder = !!guestContext?.is_online_order;
    const [orderType, setOrderType] = useState<OrderType>('pickup');
    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    // If returning from Chapa with success, jump straight to success screen
    const [step, setStep] = useState<'cart' | 'details' | 'success'>(
        paymentReturnSuccess ? 'success' : 'cart'
    );

    // Clear cart on successful payment return
    useEffect(() => {
        if (paymentReturnSuccess) {
            clearCart();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paymentReturnSuccess]);

    const handlePlaceOrder = async () => {
        if (!guestContext) {
            setOrderError('Unable to place order: missing order context.');
            return;
        }

        if (!guestContext.is_online_order && !tableNumber) {
            setOrderError('Unable to place order: invalid or expired table QR context.');
            return;
        }

        if (items.length === 0 || submitting) return;

        // For online orders, require customer details
        if (isOnlineOrder) {
            if (!customerName.trim()) { setOrderError('Please enter your name.'); return; }
            if (!customerPhone.trim()) { setOrderError('Please enter your phone number (09xxxxxxxx).'); return; }
            if (orderType === 'delivery' && !deliveryAddress.trim()) {
                setOrderError('Please enter your delivery address.');
                return;
            }
        }

        setSubmitting(true);
        setOrderError(null);

        try {
            if (isOnlineOrder) {
                // ── Online orders: Chapa payment flow ──────────────────────
                const response = await fetch('/api/payments/chapa/initialize', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        guest_context: {
                            slug: guestContext.slug,
                            is_online_order: true,
                        },
                        items: items.map(item => ({
                            id: item.menuItemId,
                            name: item.title,
                            quantity: item.quantity,
                            price: item.price,
                            notes: item.instructions,
                        })),
                        total_price: total,
                        order_type: orderType,
                        customer_name: customerName,
                        customer_phone: customerPhone,
                        ...(orderType === 'delivery' ? { delivery_address: deliveryAddress } : {}),
                        ...(guestContext.campaign_attribution
                            ? { campaign_attribution: guestContext.campaign_attribution }
                            : {}),
                    }),
                });

                const payload = await response.json() as {
                    checkout_url?: string;
                    mode?: string;
                    order_id?: string;
                    order_number?: string;
                    error?: string;
                };

                if (!response.ok) {
                    setOrderError(payload?.error ?? 'Failed to initialize payment.');
                    return;
                }

                if (payload.checkout_url) {
                    // Store cart state — it will be cleared on success return
                    trigger('success');
                    // Redirect to Chapa (or mock) checkout
                    window.location.href = payload.checkout_url;
                    return;
                }

                setOrderError('Payment gateway error. Please try again.');
            } else {
                // ── Dine-in: direct order placement (no payment) ───────────
                const response = await fetch('/api/orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        guest_context: {
                            slug: guestContext.slug,
                            table: guestContext.table,
                            sig: guestContext.sig,
                            exp: guestContext.exp,
                        },
                        items: items.map(item => ({
                            id: item.menuItemId,
                            name: item.title,
                            quantity: item.quantity,
                            price: item.price,
                            notes: item.instructions,
                        })),
                        total_price: total,
                        order_type: 'dine_in',
                        ...(guestContext.campaign_attribution
                            ? { campaign_attribution: guestContext.campaign_attribution }
                            : {}),
                        ...(guestContext.guest_session_id
                            ? { guest_session_id: guestContext.guest_session_id }
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
                setOrderMessage('Order received! Kitchen has been notified. 🍳');
            }
        } catch (error) {
            if (isAbortError(error)) return;
            console.error('Order submission failed:', error);
            setOrderError('Network error. Please retry.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        // Reset state on close
        if (step === 'success') {
            setStep('cart');
            setCustomerName('');
            setCustomerPhone('');
            setDeliveryAddress('');
            setOrderType('pickup');
        }
        setOrderMessage(null);
        setOrderError(null);
        onOpenChange(false);
    };

    return (
        <Drawer.Root open={open} onOpenChange={handleClose}>
            <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm" />
                <Drawer.Content className="bg-background fixed right-0 bottom-0 left-0 z-[9999] flex h-[92vh] flex-col rounded-t-[32px] border-t border-black/5 outline-none transition-colors duration-300 dark:border-white/10">

                    {/* ── Success Screen ─────────────────────────────────── */}
                    {step === 'success' ? (
                        <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
                            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/20">
                                <CheckCircle2 size={48} className="text-emerald-500" />
                            </div>
                            <div>
                                <h2 className="font-manrope text-2xl font-black tracking-tight text-black dark:text-white">
                                    Order Placed!
                                </h2>
                                <p className="mt-2 text-sm font-medium text-black/50 dark:text-white/50">
                                    {orderType === 'delivery'
                                        ? 'Your order is being prepared and will be delivered to you.'
                                        : orderType === 'pickup'
                                        ? 'Your order is being prepared. Come pick it up when ready!'
                                        : 'Your order has been sent to the kitchen.'}
                                </p>
                            </div>
                            <div className="w-full rounded-2xl border border-black/5 bg-black/5 p-4 dark:border-white/5 dark:bg-white/5">
                                <p className="text-sm font-bold text-black/60 dark:text-white/60">
                                    {orderType === 'delivery' ? `📍 ${deliveryAddress}` : ''}
                                </p>
                                <p className="mt-1 text-sm font-bold text-black dark:text-white">
                                    👤 {customerName} · 📞 {customerPhone}
                                </p>
                            </div>
                            <button
                                onClick={handleClose}
                                className="bg-brand-crimson hover:bg-brand-crimson/90 flex h-14 w-full items-center justify-center gap-2 rounded-full text-base font-bold text-white shadow-lg transition-transform active:scale-95"
                            >
                                Done
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="no-scrollbar flex-1 overflow-y-auto p-6 text-black dark:text-white">
                                {/* Drag Handle */}
                                <div className="mx-auto mb-6 h-1.5 w-12 shrink-0 rounded-full bg-black/20 dark:bg-white/20" />

                                {/* Header */}
                                <div className="mb-6 flex items-end justify-between">
                                    <Drawer.Title className="font-manrope text-3xl font-black tracking-tighter text-black dark:text-white">
                                        {isOnlineOrder ? 'Your Order' : 'Your Order'}
                                    </Drawer.Title>
                                    <span className="text-sm font-bold tracking-wide text-black/40 uppercase dark:text-white/40">
                                        {isOnlineOrder ? 'Online' : `Table ${tableNumber ?? '--'}`}
                                    </span>
                                </div>

                                {/* ── Online Order Type Selector ───────────── */}
                                {isOnlineOrder && (
                                    <div className="mb-6">
                                        <p className="mb-3 text-xs font-black tracking-[0.12em] text-black/40 uppercase dark:text-white/40">
                                            How would you like your order?
                                        </p>
                                        <div className="flex gap-2">
                                            <OrderTypeButton
                                                type="pickup"
                                                label="Pickup"
                                                icon={<ShoppingBag size={18} />}
                                                selected={orderType === 'pickup'}
                                                onClick={() => setOrderType('pickup')}
                                            />
                                            <OrderTypeButton
                                                type="delivery"
                                                label="Delivery"
                                                icon={<Truck size={18} />}
                                                selected={orderType === 'delivery'}
                                                onClick={() => setOrderType('delivery')}
                                            />
                                            <OrderTypeButton
                                                type="dine_in"
                                                label="Dine In"
                                                icon={<Utensils size={18} />}
                                                selected={orderType === 'dine_in'}
                                                onClick={() => setOrderType('dine_in')}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* ── Cart Items ──────────────────────────── */}
                                {items.length === 0 ? (
                                    <div className="flex h-48 flex-col items-center justify-center text-center text-gray-400">
                                        <p className="text-lg font-medium">Your cart is empty</p>
                                        <p className="text-sm">Add some delicious items to get started!</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {items.map(item => (
                                            <div
                                                key={item.uniqueId}
                                                className="flex flex-col gap-4 border-b border-black/5 pb-6 last:border-0 last:pb-0 dark:border-white/5"
                                            >
                                                <div className="flex gap-4">
                                                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/5">
                                                        {item.image && (
                                                            <Image
                                                                src={item.image}
                                                                alt={item.title}
                                                                fill
                                                                className="object-cover"
                                                                unoptimized={isRemoteOrDataImageSrc(item.image)}
                                                            />
                                                        )}
                                                    </div>
                                                    <div className="flex flex-1 flex-col justify-between py-1">
                                                        <div className="flex items-start justify-between">
                                                            <h3 className="w-[65%] text-base leading-tight font-bold text-black dark:text-white">
                                                                {item.title}
                                                            </h3>
                                                            <div className="flex flex-col items-end">
                                                                <span className="text-brand-crimson font-black">
                                                                    {(item.price * item.quantity).toLocaleString()}
                                                                </span>
                                                                <span className="text-brand-crimson/60 text-xs font-bold">ETB</span>
                                                            </div>
                                                        </div>
                                                        <div className="mt-2 flex items-center justify-between">
                                                            <div className="flex items-center gap-2 rounded-full border border-black/10 bg-black/5 p-1 px-2 dark:border-white/10 dark:bg-white/5">
                                                                <button
                                                                    onClick={() => item.quantity > 1 && updateQuantity(item.uniqueId, -1)}
                                                                    disabled={item.quantity <= 1}
                                                                    className="bg-brand-crimson/10 flex h-7 w-7 items-center justify-center rounded-full transition-transform active:scale-90 disabled:opacity-50"
                                                                >
                                                                    <Minus size={12} />
                                                                </button>
                                                                <span className="w-4 text-center text-sm font-bold">{item.quantity}</span>
                                                                <button
                                                                    onClick={() => updateQuantity(item.uniqueId, 1)}
                                                                    className="bg-brand-crimson flex h-7 w-7 items-center justify-center rounded-full text-white transition-transform active:scale-90"
                                                                >
                                                                    <Plus size={12} />
                                                                </button>
                                                            </div>
                                                            <button
                                                                onClick={() => updateQuantity(item.uniqueId, -item.quantity)}
                                                                className="text-brand-crimson bg-brand-crimson/10 flex h-7 w-7 items-center justify-center rounded-full transition-transform active:scale-90"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder="Add instructions (e.g., No onions)..."
                                                    value={item.instructions || ''}
                                                    onChange={e => updateInstructions(item.uniqueId, e.target.value)}
                                                    className="focus:ring-brand-crimson/40 bg-brand-crimson/5 w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm text-black placeholder:text-black/30 focus:ring-2 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/30"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* ── Online Order: Customer Details Form ─── */}
                                {isOnlineOrder && items.length > 0 && (
                                    <div className="mt-6 space-y-3">
                                        <p className="text-xs font-black tracking-[0.12em] text-black/40 uppercase dark:text-white/40">
                                            Your Details
                                        </p>
                                        <input
                                            type="text"
                                            placeholder="Full name *"
                                            value={customerName}
                                            onChange={e => setCustomerName(e.target.value)}
                                            className="focus:ring-brand-crimson/30 w-full rounded-xl border border-black/10 bg-black/5 px-4 py-3 text-sm font-medium text-black placeholder:text-black/30 focus:ring-2 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/30"
                                        />
                                        <input
                                            type="tel"
                                            placeholder="Phone number *"
                                            value={customerPhone}
                                            onChange={e => setCustomerPhone(e.target.value)}
                                            className="focus:ring-brand-crimson/30 w-full rounded-xl border border-black/10 bg-black/5 px-4 py-3 text-sm font-medium text-black placeholder:text-black/30 focus:ring-2 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/30"
                                        />
                                        {orderType === 'delivery' && (
                                            <textarea
                                                placeholder="Delivery address (street, area, landmark) *"
                                                value={deliveryAddress}
                                                onChange={e => setDeliveryAddress(e.target.value)}
                                                rows={2}
                                                className="focus:ring-brand-crimson/30 w-full resize-none rounded-xl border border-black/10 bg-black/5 px-4 py-3 text-sm font-medium text-black placeholder:text-black/30 focus:ring-2 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/30"
                                            />
                                        )}
                                        {orderType === 'pickup' && (
                                            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-900/20">
                                                <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
                                                    🛍 We&apos;ll prepare your order — head to the counter when ready!
                                                </p>
                                            </div>
                                        )}
                                        {orderType === 'dine_in' && (
                                            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-800 dark:bg-blue-900/20">
                                                <p className="text-xs font-bold text-blue-700 dark:text-blue-400">
                                                    🍽 Choose a table when you arrive — your order will be waiting!
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* ── Footer / Checkout ──────────────────────── */}
                            <div className="bg-background border-t border-black/5 p-6 pb-[calc(env(safe-area-inset-bottom)+20px)] shadow-[0_-5px_30px_rgba(0,0,0,0.05)] dark:border-white/10 dark:shadow-[0_-5px_30px_rgba(0,0,0,0.5)]">
                                {/* Total */}
                                <div className="mb-4 flex items-center justify-between">
                                    <span className="font-medium text-black/40 dark:text-white/40">
                                        Total
                                    </span>
                                    <div className="flex items-end gap-1">
                                        <span className="text-3xl font-black text-black dark:text-white">
                                            {total.toLocaleString()}
                                        </span>
                                        <span className="mb-1 text-sm font-bold text-black/40 dark:text-white/40">ETB</span>
                                    </div>
                                </div>

                                {/* Place Order button */}
                                <button
                                    disabled={items.length === 0 || submitting}
                                    onClick={handlePlaceOrder}
                                    className="bg-brand-crimson hover:bg-brand-crimson/90 flex h-14 w-full items-center justify-center gap-2 rounded-full text-base font-bold text-white shadow-lg transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {submitting ? (
                                        'Placing Order...'
                                    ) : (
                                        <>
                                            {isOnlineOrder ? (
                                                <>
                                                    {orderType === 'delivery' && <Truck size={18} />}
                                                    {orderType === 'pickup' && <ShoppingBag size={18} />}
                                                    {orderType === 'dine_in' && <Utensils size={18} />}
                                                    Place {orderType === 'delivery' ? 'Delivery' : orderType === 'pickup' ? 'Pickup' : 'Dine-In'} Order
                                                </>
                                            ) : (
                                                <>Place Order <ChevronRight size={18} /></>
                                            )}
                                        </>
                                    )}
                                </button>

                                {orderMessage && (
                                    <p className="mt-3 text-center text-sm font-semibold text-green-500">
                                        ✓ {orderMessage}
                                    </p>
                                )}
                                {orderError && (
                                    <p className="mt-3 text-center text-sm font-semibold text-red-400">
                                        {orderError}
                                    </p>
                                )}
                                {guestContext?.auth_state !== 'authenticated' && guestContext?.login_url && !isOnlineOrder ? (
                                    <p className="mt-3 text-center text-xs font-semibold text-black/50 dark:text-white/50">
                                        <a href={guestContext.login_url} className="underline">Log in</a> to earn loyalty points.
                                    </p>
                                ) : null}
                            </div>
                        </>
                    )}
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    );
}
