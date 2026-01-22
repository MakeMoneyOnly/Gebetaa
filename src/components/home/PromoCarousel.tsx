'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { RestaurantWithMenu } from '@/types/database';

interface Props {
    restaurant: RestaurantWithMenu;
}

/**
 * PromoCarousel - Image-only promotional banner
 * Enables restaurants to use their own high-fidelity custom designs full-bleed.
 */
export function PromoCarousel({ restaurant }: Props) {
    const [current, setCurrent] = useState(0);
    const [mounted, setMounted] = useState(false);

    // Get banners from restaurant data
    const promos = (restaurant as any).promo_banners || [];

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted || promos.length <= 1) return;
        const timer = setInterval(() => {
            setCurrent(prev => (prev + 1) % promos.length);
        }, 6000);
        return () => clearInterval(timer);
    }, [mounted, promos.length]);

    if (promos.length === 0) return null;

    return (
        <div className="mx-4 relative">
            <div
                className="relative h-[160px] w-full overflow-hidden rounded-[var(--radius-xl)]"
                style={{ border: '1px solid var(--border-1)' }}
            >
                <AnimatePresence mode="wait">
                    <motion.div
                        key={current}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                        className="absolute inset-0"
                    >
                        {promos[current].image && (
                            <img
                                src={promos[current].image}
                                alt={`Promotion ${current + 1}`}
                                className="w-full h-full object-cover"
                            />
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Pagination Dots */}
            {promos.length > 1 && (
                <div className="flex justify-center gap-1.5 mt-3">
                    {promos.map((_: any, index: number) => (
                        <button
                            key={index}
                            onClick={() => setCurrent(index)}
                            className="transition-all duration-300"
                            style={{
                                width: current === index ? '16px' : '6px',
                                height: '6px',
                                borderRadius: '3px',
                                background: current === index ? 'var(--brand-color)' : 'var(--surface-4)',
                                opacity: current === index ? 1 : 0.5
                            }}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
