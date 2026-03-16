/**
 * FocusTrap Component for Modal/Dialog Accessibility
 *
 * Addresses COMPREHENSIVE_PLATFORM_AUDIT_REPORT Section 9.2
 * Traps focus within a container for modals, dialogs, and drawers
 * Wraps the useFocusTrap hook for easy integration
 *
 * Usage:
 * <FocusTrap active={isOpen} onClose={handleClose}>
 *   <div role="dialog" aria-modal="true" aria-labelledby="dialog-title">
 *     <h2 id="dialog-title">Dialog Title</h2>
 *     <!-- dialog content -->
 *   </div>
 * </FocusTrap>
 */

'use client';

import { useFocusTrap } from '@/hooks/useFocusTrap';
import { forwardRef, HTMLAttributes, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface FocusTrapProps extends HTMLAttributes<HTMLDivElement> {
    /** Whether the focus trap is active */
    active?: boolean;
    /** Callback when Escape key is pressed */
    onClose?: () => void;
    /** Whether to return focus to the trigger element on close */
    returnFocusOnDeactivate?: boolean;
    /** Whether to auto-focus the first element on activation */
    autoFocus?: boolean;
    /** Initial focus element selector or element */
    initialFocus?: string | HTMLElement | null;
}

export const FocusTrap = forwardRef<HTMLDivElement, FocusTrapProps>(
    (
        {
            className,
            active = false,
            onClose,
            returnFocusOnDeactivate = true,
            autoFocus = true,
            initialFocus,
            children,
            ...props
        },
        ref
    ) => {
        const handleDeactivate = useCallback(() => {
            onClose?.();
        }, [onClose]);

        const { containerRef, isActive } = useFocusTrap({
            active,
            onDeactivate: onClose ? handleDeactivate : undefined,
            returnFocusOnDeactivate,
            autoFocus,
            initialFocus,
        });

        // Merge the external ref with internal ref
        const mergedRef = useCallback(
            (element: HTMLDivElement | null) => {
                // Set internal ref
                (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = element;
                // Set external ref if provided
                if (typeof ref === 'function') {
                    ref(element);
                } else if (ref) {
                    ref.current = element;
                }
            },
            [containerRef, ref]
        );

        return (
            <div
                ref={mergedRef}
                className={cn(className)}
                // These attributes help screen readers understand the context
                tabIndex={-1}
                {...props}
            >
                {children}
            </div>
        );
    }
);

FocusTrap.displayName = 'FocusTrap';

export default FocusTrap;
