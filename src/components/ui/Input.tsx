import * as React from 'react';
import { cn } from '@/lib/utils';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, ...props }, ref) => {
        return (
            <input
                type={type}
                className={cn(
                    'focus:border-brand-accent focus:ring-brand-accent/20 border-brand-neutral-soft/20 bg-surface-raised text-text-primary placeholder:text-text-secondary flex h-12 w-full rounded-xl border px-4 py-3 text-base transition-all focus:ring-4 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
                    className
                )}
                ref={ref}
                aria-invalid={props['aria-invalid']}
                aria-describedby={props['aria-describedby']}
                {...props}
            />
        );
    }
);
Input.displayName = 'Input';

export { Input };
