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
                    className="bg-brand-crimson fixed right-6 bottom-6 z-50 flex h-16 w-16 touch-manipulation items-center justify-center rounded-full text-white shadow-2xl transition-transform active:scale-90"
                >
                    <div className="relative">
                        <ShoppingBag size={24} />
                        <span className="text-brand-crimson animate-in zoom-in absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold shadow-md">
                            {count}
                        </span>
                    </div>
                </motion.button>
            )}
        </AnimatePresence>
    );
}
