import { ButtonHTMLAttributes, forwardRef } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'glass' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    isLoading?: boolean;
    /** Accessible label for screen readers when icon-only button */
    ariaLabel?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            className,
            variant = 'primary',
            size = 'md',
            isLoading,
            children,
            disabled,
            ariaLabel,
            ...props
        },
        ref
    ) => {
        const baseStyles =
            'inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-offset-2';

        const variants = {
            primary:
                'bg-brand-crimson text-white hover:bg-brand-crimson-hover shadow-lg shadow-brand-crimson/20',
            secondary: 'bg-surface-100 text-text-primary hover:bg-surface-200',
            glass: 'bg-glass-white backdrop-blur-md border border-white/40 text-text-primary hover:bg-white/90 shadow-glass',
            ghost: 'bg-transparent text-text-secondary hover:bg-surface-100/50 hover:text-text-primary',
            danger: 'bg-red-100 text-red-600 hover:bg-red-200',
        };

        const sizes = {
            sm: 'h-8 px-3 text-xs',
            md: 'h-10 px-4 text-sm',
            lg: 'h-12 px-6 text-base',
            icon: 'h-10 w-10 p-2',
        };

        // Determine if button should have aria-label
        const hasAriaLabel = ariaLabel || (size === 'icon' && typeof children === 'undefined');

        return (
            <button
                ref={ref}
                className={cn(baseStyles, variants[variant], sizes[size], className)}
                disabled={disabled || isLoading}
                aria-busy={isLoading}
                aria-label={hasAriaLabel ? ariaLabel : undefined}
                {...props}
            >
                {isLoading ? (
                    <div
                        className="absolute inset-0 flex items-center justify-center"
                        aria-hidden="true"
                    >
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    </div>
                ) : null}
                <span className={cn(isLoading && 'invisible')}>{children}</span>
            </button>
        );
    }
);

Button.displayName = 'Button';
