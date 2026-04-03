'use client';

import { useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform, animate, useInView } from 'framer-motion';

interface CounterProps {
    value: number;
    from?: number;
    className?: string;
}

export function Counter({ value, from = 1347, className }: CounterProps) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-100px' });
    const count = useMotionValue(from);
    const rounded = useTransform(count, latest => Math.round(latest).toLocaleString());

    useEffect(() => {
        if (isInView) {
            const controls = animate(count, value, {
                duration: 1.5,
                ease: [0.1, 0.9, 0.1, 1],
                delay: 0,
            });
            return () => controls.stop();
        }
    }, [count, value, isInView]);

    return (
        <motion.span ref={ref} className={className}>
            {rounded}
        </motion.span>
    );
}
