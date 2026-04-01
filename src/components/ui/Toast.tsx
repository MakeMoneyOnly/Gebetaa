'use client';

import * as React from 'react';
import * as ToastPrimitives from '@radix-ui/react-toast';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const ToastProvider = ToastPrimitives.Provider;

type ToastViewportProps = React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>;

const ToastViewport = React.forwardRef<
    React.ElementRef<typeof ToastPrimitives.Viewport>,
    ToastViewportProps
>(({ className, ...props }, ref) => (
    <ToastPrimitives.Viewport
        ref={ref}
        className={cn(
            'fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:top-auto sm:right-0 sm:bottom-0 sm:flex-col md:max-w-[420px]',
            className
        )}
        {...props}
    />
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

const toastVariants = cva(
    'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full',
    {
        variants: {
            variant: {
                default: 'border-brand-neutral-soft/10 bg-surface-raised text-text-primary',
                destructive:
                    'destructive group border-state-danger/30 bg-state-danger-bg text-state-danger',
                success: 'border-state-success/30 bg-state-success-bg text-state-success',
                warning: 'border-state-warning/30 bg-state-warning-bg text-state-warning',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    }
);

interface ToastProps
    extends
        React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root>,
        VariantProps<typeof toastVariants> {
    variant?: 'default' | 'destructive' | 'success' | 'warning';
}

const Toast = React.forwardRef<React.ElementRef<typeof ToastPrimitives.Root>, ToastProps>(
    ({ className, variant, ...props }, ref) => {
        return (
            <ToastPrimitives.Root
                ref={ref}
                className={cn(toastVariants({ variant }), className)}
                {...props}
            />
        );
    }
);
Toast.displayName = ToastPrimitives.Root.displayName;

type ToastActionProps = React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>;

const ToastAction = React.forwardRef<
    React.ElementRef<typeof ToastPrimitives.Action>,
    ToastActionProps
>(({ className, ...props }, ref) => (
    <ToastPrimitives.Action
        ref={ref}
        className={cn(
            'focus:ring-brand-accent border-brand-neutral-soft/10 group-[.destructive]:border-state-danger/30 hover:bg-surface-muted group-[.destructive]:hover:border-state-danger/30 group-[.destructive]:hover:bg-state-danger group-[.destructive]:focus:ring-state-danger inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-white transition-colors group-[.destructive]:hover:text-white focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:pointer-events-none disabled:opacity-50',
            className
        )}
        {...props}
    />
));
ToastAction.displayName = ToastPrimitives.Action.displayName;

type ToastCloseProps = React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>;

const ToastClose = React.forwardRef<
    React.ElementRef<typeof ToastPrimitives.Close>,
    ToastCloseProps
>(({ className, ...props }, ref) => (
    <ToastPrimitives.Close
        ref={ref}
        className={cn(
            'text-text-secondary group-[.destructive]:text-state-danger/70 hover:text-text-primary group-[.destructive]:hover:text-state-danger group-[.destructive]:focus:ring-state-danger group-[.destructive]:focus:ring-offset-state-danger-bg absolute top-2 right-2 rounded-md p-1 opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100 focus:ring-2 focus:outline-none',
            className
        )}
        toast-close=""
        {...props}
    >
        <X className="h-4 w-4" />
    </ToastPrimitives.Close>
));
ToastClose.displayName = ToastPrimitives.Close.displayName;

type ToastTitleProps = React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>;

const ToastTitle = React.forwardRef<
    React.ElementRef<typeof ToastPrimitives.Title>,
    ToastTitleProps
>(({ className, ...props }, ref) => (
    <ToastPrimitives.Title
        ref={ref}
        className={cn('text-sm font-semibold', className)}
        {...props}
    />
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

type ToastDescriptionProps = React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>;

const ToastDescription = React.forwardRef<
    React.ElementRef<typeof ToastPrimitives.Description>,
    ToastDescriptionProps
>(({ className, ...props }, ref) => (
    <ToastPrimitives.Description
        ref={ref}
        className={cn('text-sm opacity-90', className)}
        {...props}
    />
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

type ToastActionElement = React.ReactElement<typeof ToastAction>;

export {
    type ToastProps,
    type ToastActionElement,
    ToastProvider,
    ToastViewport,
    Toast,
    ToastTitle,
    ToastDescription,
    ToastClose,
    ToastAction,
};
