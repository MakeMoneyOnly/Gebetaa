'use client';

import { ShoppingBag } from 'lucide-react';
import { useHaptic } from '@/hooks/useHaptic';
import { useEffect } from 'react';

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
                    transition={{ duration: 0.4, ease: 'easeOut' }} // Smooth fade up, no spring
                    onClick={() => {
                        trigger('medium');
                        onClick?.();
                    }}
                    className="bg-brand-accent hover:bg-brand-accent/90 fixed right-6 bottom-6 z-50 flex h-16 w-16 touch-manipulation items-center justify-center rounded-full border border-black/20 text-black shadow-2xl backdrop-blur-xl transition-all active:scale-95 dark:border-white/20"
                >
                    <div className="relative">
                        <ShoppingBag size={24} className="text-black" />
                        <span className="bg-brand-accent absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black text-black shadow-lg ring-2 ring-white dark:ring-black">
                            {count}
                        </span>
                    </div>
                </motion.button>
            )}
        </AnimatePresence>
    );
}
