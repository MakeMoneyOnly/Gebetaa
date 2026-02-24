'use client';

import React from 'react';
import { Truck, ShoppingBag, X } from 'lucide-react';
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
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative z-10 w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-brand-crimson to-red-600 px-6 py-5 text-white">
                    <h2 className="text-xl font-bold">Welcome to {restaurantName}</h2>
                    <p className="text-white/80 text-sm mt-1">How would you like to order?</p>
                </div>

                {/* Options */}
                <div className="p-6 space-y-4">
                    {/* Delivery Option */}
                    <button
                        onClick={() => onSelect('delivery')}
                        className={cn(
                            'w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200',
                            'hover:border-blue-500 hover:bg-blue-50 transition-all duration-200',
                            'group cursor-pointer'
                        )}
                    >
                        <div className="flex-shrink-0 w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                            <Truck className="w-7 h-7 text-blue-600" />
                        </div>
                        <div className="flex-1 text-left">
                            <h3 className="font-bold text-gray-900 text-lg">Delivery</h3>
                            <p className="text-gray-500 text-sm">We'll bring it to your door</p>
                        </div>
                        <div className="text-blue-600 group-hover:translate-x-1 transition-transform">
                            →
                        </div>
                    </button>

                    {/* Pickup Option */}
                    <button
                        onClick={() => onSelect('pickup')}
                        className={cn(
                            'w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200',
                            'hover:border-green-500 hover:bg-green-50 transition-all duration-200',
                            'group cursor-pointer'
                        )}
                    >
                        <div className="flex-shrink-0 w-14 h-14 rounded-full bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                            <ShoppingBag className="w-7 h-7 text-green-600" />
                        </div>
                        <div className="flex-1 text-left">
                            <h3 className="font-bold text-gray-900 text-lg">Pickup</h3>
                            <p className="text-gray-500 text-sm">Ready when you arrive</p>
                        </div>
                        <div className="text-green-600 group-hover:translate-x-1 transition-transform">
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