'use client';

import React from 'react';
import { Truck, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FulfillmentType } from '@/lib/security/offPremiseContext';

interface FulfillmentSelectionModalProps {
    isOpen: boolean;
    onSelect: (type: FulfillmentType) => void;
    onClose?: () => void;
    restaurantName?: string;
}

export const FulfillmentSelectionModal: React.FC<FulfillmentSelectionModalProps> = ({
    isOpen,
    onSelect,
    onClose,
    restaurantName = 'Restaurant',
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative z-10 mx-4 w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl">
                {/* Header */}
                <div className="from-brand-accent bg-gradient-to-r to-red-600 px-6 py-5 text-white">
                    <h2 className="text-xl font-bold">Welcome to {restaurantName}</h2>
                    <p className="mt-1 text-sm text-white/80">How would you like to order?</p>
                </div>

                {/* Options */}
                <div className="space-y-4 p-6">
                    {/* Delivery Option */}
                    <button
                        onClick={() => onSelect('delivery')}
                        className={cn(
                            'flex w-full items-center gap-4 rounded-xl border-2 border-gray-200 p-4',
                            'transition-all duration-200 hover:border-blue-500 hover:bg-blue-50',
                            'group cursor-pointer'
                        )}
                    >
                        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 transition-colors group-hover:bg-blue-200">
                            <Truck className="h-7 w-7 text-blue-600" />
                        </div>
                        <div className="flex-1 text-left">
                            <h3 className="text-lg font-bold text-gray-900">Delivery</h3>
                            <p className="text-sm text-gray-500">We'll bring it to your door</p>
                        </div>
                        <div className="text-blue-600 transition-transform group-hover:translate-x-1">
                            →
                        </div>
                    </button>

                    {/* Pickup Option */}
                    <button
                        onClick={() => onSelect('pickup')}
                        className={cn(
                            'flex w-full items-center gap-4 rounded-xl border-2 border-gray-200 p-4',
                            'transition-all duration-200 hover:border-green-500 hover:bg-green-50',
                            'group cursor-pointer'
                        )}
                    >
                        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-green-100 transition-colors group-hover:bg-green-200">
                            <ShoppingBag className="h-7 w-7 text-green-600" />
                        </div>
                        <div className="flex-1 text-left">
                            <h3 className="text-lg font-bold text-gray-900">Pickup</h3>
                            <p className="text-sm text-gray-500">Ready when you arrive</p>
                        </div>
                        <div className="text-green-600 transition-transform group-hover:translate-x-1">
                            →
                        </div>
                    </button>
                </div>

                {/* Footer */}
                <div className="px-6 pb-6">
                    <p className="text-center text-xs text-gray-400">
                        Payment required before order confirmation
                    </p>
                </div>
            </div>
        </div>
    );
};

export default FulfillmentSelectionModal;
