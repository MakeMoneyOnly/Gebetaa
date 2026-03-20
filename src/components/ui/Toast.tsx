'use client';

import * as React from 'react';
import * as ToastPrimitives from '@radix-ui/react-toast';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const ToastProvider = ToastPrimitives.Provider;

interface ToastViewportProps extends React.ComponentPropsWithoutRef<
    typeof ToastPrimitives.Viewport
> {}

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
                default: 'border-black/10 bg-white text-black',
                destructive: 'destructive group border-red-500/50 bg-red-50 text-red-600',
                success: 'border-green-500/50 bg-green-50 text-green-700',
                warning: 'border-yellow-500/50 bg-yellow-50 text-yellow-700',
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

interface ToastActionProps extends React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action> {}

const ToastAction = React.forwardRef<
    React.ElementRef<typeof ToastPrimitives.Action>,
    ToastActionProps
>(({ className, ...props }, ref) => (
    <ToastPrimitives.Action
        ref={ref}
        className={cn(
            'focus:ring-brand-crimson inline-flex h-8 shrink-0 items-center justify-center rounded-md border border-black/10 bg-transparent px-3 text-sm font-medium ring-offset-white transition-colors group-[.destructive]:border-red-100/50 hover:bg-black/5 group-[.destructive]:hover:border-red-500/30 group-[.destructive]:hover:bg-red-500 group-[.destructive]:hover:text-white focus:ring-2 focus:ring-offset-2 focus:outline-none group-[.destructive]:focus:ring-red-500 disabled:pointer-events-none disabled:opacity-50',
            className
        )}
        {...props}
    />
));
ToastAction.displayName = ToastPrimitives.Action.displayName;

interface ToastCloseProps extends React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close> {}

const ToastClose = React.forwardRef<
    React.ElementRef<typeof ToastPrimitives.Close>,
    ToastCloseProps
>(({ className, ...props }, ref) => (
    <ToastPrimitives.Close
        ref={ref}
        className={cn(
            'absolute top-2 right-2 rounded-md p-1 text-black/50 opacity-0 transition-opacity group-hover:opacity-100 group-[.destructive]:text-red-300 hover:text-black group-[.destructive]:hover:text-red-50 focus:opacity-100 focus:ring-2 focus:outline-none group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600',
            className
        )}
        toast-close=""
        {...props}
    >
        <X className="h-4 w-4" />
    </ToastPrimitives.Close>
));
ToastClose.displayName = ToastPrimitives.Close.displayName;

interface ToastTitleProps extends React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title> {}

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

interface ToastDescriptionProps extends React.ComponentPropsWithoutRef<
    typeof ToastPrimitives.Description
> {}

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

type ToastPropsAll = React.ComponentPropsWithoutRef<typeof Toast>;

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
