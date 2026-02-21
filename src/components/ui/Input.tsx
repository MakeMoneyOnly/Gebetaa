import * as React from 'react';
import { cn } from '@/lib/utils';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, ...props }, ref) => {
        return (
            <input
                type={type}
                className={cn(
                    'focus:border-brand-crimson focus:ring-brand-crimson/5 flex h-12 w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-base text-black transition-all placeholder:text-black/30 focus:ring-4 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
                    className
                )}
                ref={ref}
                {...props}
            />
        );
    }
);
Input.displayName = 'Input';

export { Input };
