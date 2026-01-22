'use client';

import { useCart } from '@/context/CartContext';
import { useLanguage } from '@/context/LanguageContext';
import { ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * FloatingCartButton - Fixed bottom cart summary button
 * 
 * Design principles:
 * - High visibility brand color
 * - Clear item count and total
 * - Touch-friendly size (56px height)
 * - Smooth entrance/exit animation
 */
export function FloatingCartButton() {
    const { totalItems, totalPrice } = useCart();
    const { language } = useLanguage();

    return (
        <AnimatePresence>
            {totalItems > 0 && (
                <motion.button
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed bottom-6 left-4 right-4 z-50 flex items-center justify-between px-4 rounded-[var(--radius-xl)] max-w-lg mx-auto"
                    style={{
                        height: '56px',
                        background: 'var(--brand-color)',
                        boxShadow: 'var(--shadow-brand), var(--shadow-lg)'
                    }}
                    onClick={() => {
                        window.dispatchEvent(new CustomEvent('openCartDrawer'));
                    }}
                    aria-label={`View cart with ${totalItems} items`}
                >
                    {/* Left: Icon + Count */}
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <ShoppingCart className="w-5 h-5 text-black" />
                            <span 
                                className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center font-bold"
                                style={{
                                    background: '#000',
                                    color: 'var(--brand-color)',
                                    fontSize: '11px'
                                }}
                            >
                                {totalItems}
                            </span>
                        </div>
                        <span 
                            className="font-semibold text-black"
                            style={{ fontSize: 'var(--text-body)' }}
                        >
                            {language === 'am' ? 'ቅርጫት ይመልከቱ' : 'View Cart'}
                        </span>
                    </div>

                    {/* Right: Total */}
                    <div className="flex items-center gap-1">
                        <span 
                            className="text-black opacity-60"
                            style={{ fontSize: 'var(--text-caption)' }}
                        >
                            {language === 'am' ? 'ጠቅላላ:' : 'Total:'}
                        </span>
                        <span 
                            className="font-bold text-black"
                            style={{ fontSize: 'var(--text-body-lg)' }}
                        >
                            Br {totalPrice.toLocaleString()}
                        </span>
                    </div>
                </motion.button>
            )}
        </AnimatePresence>
    );
}
