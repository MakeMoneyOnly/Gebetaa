'use client';

import { useState, useEffect } from 'react';

import { useCart } from '@/context/CartContext';
import { useLanguage } from '@/context/LanguageContext';
import type { RestaurantWithMenu } from '@/types/database';
import { X, Plus, Minus, Trash2, MessageSquare, CheckCircle, Loader2, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
    restaurant: RestaurantWithMenu;
}

/**
 * CartDrawer - Bottom sheet cart with order submission
 * 
 * Design principles:
 * - Clean, scannable item list
 * - High-contrast prices
 * - Touch-friendly quantity controls
 * - Clear order summary and CTA
 */
export function CartDrawer({ restaurant }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const {
        items,
        removeItem,
        updateQuantity,
        updateNotes,
        clearCart,
        totalPrice,
        tableNumber,
        restaurantId,
        addToHistory
    } = useCart();
    const { language, t } = useLanguage();

    // Listen for cart drawer open events
    useEffect(() => {
        const handleOpen = () => setIsOpen(true);
        window.addEventListener('openCartDrawer', handleOpen);
        return () => window.removeEventListener('openCartDrawer', handleOpen);
    }, []);

    const handleSubmitOrder = async () => {
        if (items.length === 0 || !restaurantId) return;

        setIsSubmitting(true);

        try {
            const orderData = {
                restaurant_id: restaurantId,
                table_number: tableNumber ? parseInt(tableNumber) : 0,
                items: items.map(item => ({
                    name: item.name,
                    quantity: item.quantity,
                    notes: item.notes || ''
                })),
                orderTotal: totalPrice,
            };

            const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;
            if (webhookUrl) {
                await fetch(webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(orderData),
                });
            }

            setShowSuccess(true);
            addToHistory(items);
            clearCart();

            setTimeout(() => {
                setShowSuccess(false);
                setIsOpen(false);
            }, 3000);

        } catch (error) {
            console.error('Failed to submit order:', error);
            alert('Failed to submit order. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const currencySymbol = restaurant.currency_symbol || 'Br';

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 z-[130]"
                        style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 200 }}
                        className="fixed bottom-0 left-0 right-0 z-[130] max-h-[85vh] overflow-hidden flex flex-col rounded-t-[var(--radius-2xl)]"
                        style={{
                            background: 'var(--surface-1)',
                            borderTop: '1px solid var(--border-1)'
                        }}
                    >
                        {/* Drag Handle */}
                        <div className="w-full flex justify-center pt-3 pb-2">
                            <div
                                className="w-10 h-1 rounded-full"
                                style={{ background: 'var(--surface-4)' }}
                            />
                        </div>

                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3">
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center"
                                    style={{ background: 'rgba(255,107,53,0.1)' }}
                                >
                                    <ShoppingBag className="w-5 h-5" style={{ color: 'var(--brand-color)' }} />
                                </div>
                                <div>
                                    <h2
                                        className="font-bold"
                                        style={{
                                            fontSize: 'var(--text-title)',
                                            color: 'var(--text-1)'
                                        }}
                                    >
                                        {language === 'am' ? 'ቅርጫት' : 'Cart'}
                                    </h2>
                                    {tableNumber && (
                                        <p
                                            className="text-caption"
                                            style={{ color: 'var(--text-3)' }}
                                        >
                                            {language === 'am' ? 'ጠረጴዛ' : 'Table'} {tableNumber}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="btn-icon"
                                aria-label="Close cart"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto px-4 py-2 hide-scrollbar">
                            {showSuccess ? (
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="flex flex-col items-center justify-center py-16"
                                >
                                    <div
                                        className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                                        style={{
                                            background: 'rgba(34, 197, 94, 0.1)',
                                            border: '1px solid rgba(34, 197, 94, 0.2)'
                                        }}
                                    >
                                        <CheckCircle className="w-8 h-8" style={{ color: 'var(--color-success)' }} />
                                    </div>
                                    <h3
                                        className="font-bold mb-2"
                                        style={{
                                            fontSize: 'var(--text-title)',
                                            color: 'var(--text-1)'
                                        }}
                                    >
                                        {language === 'am' ? 'ትዕዛዝ ተልኳል!' : 'Order Sent!'}
                                    </h3>
                                    <p
                                        className="text-center"
                                        style={{
                                            fontSize: 'var(--text-body)',
                                            color: 'var(--text-3)',
                                            maxWidth: '220px'
                                        }}
                                    >
                                        {language === 'am'
                                            ? 'ትዕዛዝዎ ወደ ወጥ ቤት ተልኳል'
                                            : 'Your order has been sent to the kitchen'}
                                    </p>
                                </motion.div>
                            ) : items.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16">
                                    <div
                                        className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                                        style={{ background: 'var(--surface-3)' }}
                                    >
                                        <ShoppingBag className="w-6 h-6" style={{ color: 'var(--text-4)' }} />
                                    </div>
                                    <p
                                        className="font-medium"
                                        style={{
                                            fontSize: 'var(--text-body)',
                                            color: 'var(--text-3)'
                                        }}
                                    >
                                        {language === 'am' ? 'ቅርጫትዎ ባዶ ነው' : 'Your cart is empty'}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {items.map(item => (
                                        <motion.div
                                            key={item.id}
                                            layout
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="card p-3"
                                        >
                                            <div className="flex gap-3">
                                                {/* Image */}
                                                <div
                                                    className="relative w-16 h-16 rounded-[var(--radius-md)] overflow-hidden flex-shrink-0"
                                                    style={{
                                                        background: 'var(--surface-3)',
                                                        border: '1px solid var(--border-1)'
                                                    }}
                                                >
                                                    {item.image_url ? (
                                                        <img
                                                            src={item.image_url}
                                                            alt={item.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <span style={{ color: 'var(--text-4)', fontSize: '10px' }}>
                                                                SABA
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0 flex flex-col justify-between">
                                                    <div className="flex justify-between items-start">
                                                        <h4
                                                            className="font-bold truncate pr-2"
                                                            style={{
                                                                fontSize: 'var(--text-body)',
                                                                color: 'var(--text-1)'
                                                            }}
                                                        >
                                                            {language === 'am' && item.name_am ? item.name_am : item.name}
                                                        </h4>
                                                        <button
                                                            onClick={() => removeItem(item.id)}
                                                            className="p-1"
                                                            style={{ color: 'var(--text-4)' }}
                                                            aria-label={`Remove ${item.name}`}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>

                                                    <p
                                                        className="font-bold"
                                                        style={{
                                                            fontSize: 'var(--text-body)',
                                                            color: 'var(--brand-color)'
                                                        }}
                                                    >
                                                        <span style={{ fontSize: '11px', opacity: 0.7 }}>{currencySymbol}</span>
                                                        {' '}{(item.price * item.quantity).toLocaleString()}
                                                    </p>

                                                    {/* Quantity Controls */}
                                                    <div
                                                        className="flex items-center gap-2 w-fit rounded-full px-1 py-1 mt-1"
                                                        style={{
                                                            background: 'var(--surface-3)',
                                                            border: '1px solid var(--border-1)'
                                                        }}
                                                    >
                                                        <button
                                                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                            className="w-7 h-7 flex items-center justify-center rounded-full"
                                                            style={{ color: 'var(--text-2)' }}
                                                            aria-label="Decrease quantity"
                                                        >
                                                            <Minus className="w-3 h-3" />
                                                        </button>
                                                        <span
                                                            className="w-6 text-center font-bold"
                                                            style={{
                                                                fontSize: 'var(--text-body)',
                                                                color: 'var(--text-1)'
                                                            }}
                                                        >
                                                            {item.quantity}
                                                        </span>
                                                        <button
                                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                            className="w-7 h-7 flex items-center justify-center rounded-full"
                                                            style={{ color: 'var(--brand-color)' }}
                                                            aria-label="Increase quantity"
                                                        >
                                                            <Plus className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Notes Input */}
                                            <div className="mt-3 relative">
                                                <MessageSquare
                                                    className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4"
                                                    style={{ color: 'var(--text-4)' }}
                                                />
                                                <input
                                                    type="text"
                                                    placeholder={language === 'am' ? 'ልዩ መመሪያዎች...' : 'Special instructions...'}
                                                    value={item.notes || ''}
                                                    onChange={(e) => updateNotes(item.id, e.target.value)}
                                                    className="input pl-12"
                                                    style={{
                                                        fontSize: 'var(--text-caption)',
                                                        minHeight: '40px',
                                                        paddingLeft: '44px'
                                                    }}
                                                />
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {items.length > 0 && !showSuccess && (
                            <div
                                className="px-4 pt-4 pb-6 space-y-4"
                                style={{
                                    background: 'var(--surface-1)',
                                    borderTop: '1px solid var(--border-1)'
                                }}
                            >
                                {/* Summary */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span
                                            className="text-caption"
                                            style={{ color: 'var(--text-3)' }}
                                        >
                                            {items.reduce((acc, item) => acc + item.quantity, 0)} {language === 'am' ? 'ዕቃዎች' : 'items'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span
                                            className="font-medium"
                                            style={{
                                                fontSize: 'var(--text-body)',
                                                color: 'var(--text-2)'
                                            }}
                                        >
                                            {language === 'am' ? 'ጠቅላላ' : 'Total'}
                                        </span>
                                        <span
                                            className="font-bold"
                                            style={{
                                                fontSize: 'var(--text-title)',
                                                color: 'var(--text-1)'
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontSize: 'var(--text-caption)',
                                                    color: 'var(--brand-color)',
                                                    marginRight: '4px'
                                                }}
                                            >
                                                {currencySymbol}
                                            </span>
                                            {totalPrice.toLocaleString()}
                                        </span>
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <button
                                    onClick={handleSubmitOrder}
                                    disabled={isSubmitting}
                                    className="btn-primary w-full"
                                    style={{
                                        height: '56px',
                                        fontSize: 'var(--text-body)',
                                        opacity: isSubmitting ? 0.7 : 1
                                    }}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span>{language === 'am' ? 'በመላክ ላይ...' : 'Processing...'}</span>
                                        </>
                                    ) : (
                                        <span>{language === 'am' ? 'ትዕዛዝ አረጋግጥ' : 'Confirm Order'}</span>
                                    )}
                                </button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
