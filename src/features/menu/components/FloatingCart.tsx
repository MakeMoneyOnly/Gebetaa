'use client';

import { ShoppingBag } from 'lucide-react';
import { useHaptic } from '@/hooks/useHaptic';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';

export function FloatingCart({ count, onClick }: { count: number; onClick?: () => void }) {
    const { trigger } = useHaptic();

    useEffect(() => {
        if (count > 0) {
            trigger('success');
        }
    }, [count, trigger]);

    return (
        <AnimatePresence>
            {count > 0 && (
                <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.4, ease: "easeOut" }} // Smooth fade up, no spring
                    onClick={() => {
                        trigger('medium');
                        onClick?.();
                    }}
                    className="fixed bottom-6 right-6 w-16 h-16 rounded-full bg-brand-crimson text-white shadow-2xl z-50 flex items-center justify-center active:scale-90 transition-transform touch-manipulation"
                >
                    <div className="relative">
                        <ShoppingBag size={24} />
                        <span className="absolute -top-1 -right-1 bg-white text-brand-crimson text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-in zoom-in">
                            {count}
                        </span>
                    </div>
                </motion.button>
            )}
        </AnimatePresence>
    );
}
