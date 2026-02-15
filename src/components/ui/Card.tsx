import { HTMLAttributes, forwardRef } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'glass' | 'elevated' | 'flat';
    padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
    ({ className, variant = 'default', padding = 'md', children, ...props }, ref) => {
        const variants = {
            default: 'bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] dark:shadow-none hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-shadow duration-300',
            glass: 'backdrop-blur-xl bg-white/70 dark:bg-black/60 border border-white/20 dark:border-white/10 shadow-glass',
            elevated: 'bg-white dark:bg-zinc-900 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)] border-none',
            flat: 'bg-zinc-50 dark:bg-zinc-900/50 border-none',
        };

        const paddings = {
            none: 'p-0',
            sm: 'p-4',
            md: 'p-6',
            lg: 'p-8',
        };

        return (
            <div
                ref={ref}
                className={cn('rounded-2xl overflow-hidden', variants[variant], paddings[padding], className)}
                {...props}
            >
                {children}
            </div>
        );
    }
);

Card.displayName = 'Card';
