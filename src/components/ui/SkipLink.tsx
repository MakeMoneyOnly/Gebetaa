/**
 * SkipLink Component for Keyboard Navigation
 *
 * Addresses COMPREHENSIVE_PLATFORM_AUDIT_REPORT Section 9.2
 * Provides keyboard-accessible skip links for WCAG compliance
 *
 * Usage:
 * ```tsx
 * <SkipLink href="#main-content">Skip to main content</SkipLink>
 * ```
 */

import { forwardRef, AnchorHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface SkipLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
    /** The target ID to skip to */
    href: string;
    /** Visual text for the skip link */
    children: React.ReactNode;
}

export const SkipLink = forwardRef<HTMLAnchorElement, SkipLinkProps>(
    ({ className, href, children, ...props }, ref) => {
        return (
            <a
                ref={ref}
                href={href}
                className={cn(
                    // Base styles - hidden by default
                    'absolute top-0 left-0 z-[9999] -translate-y-full px-4 py-3',
                    'bg-brand-crimson font-semibold text-white',
                    'transition-transform duration-200 ease-out',
                    // Focus styles - visible on focus
                    'focus:ring-brand-crimson/50 focus:translate-y-0 focus:ring-4 focus:outline-none',
                    // Ensure it appears above everything
                    'pointer-events-auto',
                    className
                )}
                // Prevent tab order until focused
                tabIndex={-1}
                onFocus={e => {
                    // When focused, bring into normal tab order
                    e.currentTarget.tabIndex = 0;
                }}
                onBlur={e => {
                    // Return to hidden state when blurred
                    e.currentTarget.tabIndex = -1;
                }}
                {...props}
            >
                {children}
            </a>
        );
    }
);

SkipLink.displayName = 'SkipLink';

export default SkipLink;
