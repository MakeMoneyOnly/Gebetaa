'use client';

import React, { useState } from 'react';
import { MapPin, Phone, User, MessageSquare, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DeliveryAddress, PickupDetails, FulfillmentType } from '@/lib/security/offPremiseContext';

interface DeliveryAddressFormProps {
    fulfillmentType: FulfillmentType;
    onSubmit: (data: DeliveryAddress | PickupDetails) => void;
    onBack?: () => void;
    isLoading?: boolean;
}

// Common areas in Addis Ababa for suggestions
const ADDIS_ABABA_AREAS = [
    'Bole', 'Kazanchis', 'Piazza', 'Megenagna', 'CMC', 'Gerji', 
    'Sarbet', 'Merkato', 'Lideta', 'Kirkos', 'Old Airport', 'Sarbet'
];

export const DeliveryAddressForm: React.FC<DeliveryAddressFormProps> = ({
    fulfillmentType,
    onSubmit,
    onBack,
    isLoading = false,
}) => {
    // Delivery state
    const [deliveryData, setDeliveryData] = useState<DeliveryAddress>({
        addressLine1: '',
        addressLine2: '',
        city: 'Addis Ababa',
        area: '',
        landmark: '',
        phone: '',
        instructions: '',
    });

    // Pickup state
    const [pickupData, setPickupData] = useState<PickupDetails>({
        customerName: '',
        phone: '',
        requestedTime: '',
        notes: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateDelivery = (): boolean => {
        const newErrors: Record<string, string> = {};
        
        if (!deliveryData.addressLine1 || deliveryData.addressLine1.length < 5) {
            newErrors.addressLine1 = 'Please enter a valid address';
        }
        if (!deliveryData.city) {
            newErrors.city = 'City is required';
        }
        if (!deliveryData.phone || deliveryData.phone.length < 9) {
            newErrors.phone = 'Valid phone number is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validatePickup = (): boolean => {
        const newErrors: Record<string, string> = {};
        
        if (!pickupData.customerName || pickupData.customerName.length < 2) {
            newErrors.customerName = 'Name is required';
        }
        if (!pickupData.phone || pickupData.phone.length < 9) {
            newErrors.phone = 'Valid phone number is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (fulfillmentType === 'delivery') {
            if (validateDelivery()) {
                onSubmit(deliveryData);
            }
        } else {
            if (validatePickup()) {
                onSubmit(pickupData);
            }
        }
    };

    if (fulfillmentType === 'pickup') {
        return (
            <div className="bg-white rounded-2xl shadow-lg p-6 max-w-md mx-auto">
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Pickup Details</h2>
                    <p className="text-gray-500 text-sm mt-1">We'll notify you when your order is ready</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Customer Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Your Name
                        </label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={pickupData.customerName}
                                onChange={(e) => setPickupData({ ...pickupData, customerName: e.target.value })}
                                className={cn(
                                    'w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent',
                                    errors.customerName ? 'border-red-500' : 'border-gray-200'
                                )}
                                placeholder="Enter your name"
                            />
                        </div>
                        {errors.customerName && (
                            <p className="text-red-500 text-xs mt-1">{errors.customerName}</p>
                        )}
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Phone Number
                        </label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="tel"
                                value={pickupData.phone}
                                onChange={(e) => setPickupData({ ...pickupData, phone: e.target.value })}
                                className={cn(
                                    'w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent',
                                    errors.phone ? 'border-red-500' : 'border-gray-200'
                                )}
                                placeholder="0911 234 567"
                            />
                        </div>
                        {errors.phone && (
                            <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                        )}
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Special Instructions (Optional)
                        </label>
                        <div className="relative">
                            <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                            <textarea
                                value={pickupData.notes}
                                onChange={(e) => setPickupData({ ...pickupData, notes: e.target.value })}
                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                                rows={3}
                                placeholder="Any special requests?"
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        {onBack && (
                            <button
                                type="button"
                                onClick={onBack}
                                className="flex-1 py-3 px-4 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Back
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={cn(
                                'flex-1 py-3 px-4 bg-green-600 text-white rounded-xl font-medium',
                                'hover:bg-green-700 transition-colors flex items-center justify-center gap-2',
                                isLoading && 'opacity-50 cursor-not-allowed'
                            )}
                        >
                            {isLoading ? 'Processing...' : 'Continue to Menu'}
                            {!isLoading && <ChevronRight className="w-4 h-4" />}
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    // Delivery Form
    return (
        <div className="bg-white rounded-2xl shadow-lg p-6 max-w-md mx-auto">
            <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">Delivery Address</h2>
                <p className="text-gray-500 text-sm mt-1">Where should we deliver your order?</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Address Line 1 */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Street Address
                    </label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={deliveryData.addressLine1}
                            onChange={(e) => setDeliveryData({ ...deliveryData, addressLine1: e.target.value })}
                            className={cn(
                                'w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                                errors.addressLine1 ? 'border-red-500' : 'border-gray-200'
                            )}
                            placeholder="House number, street name"
                        />
                    </div>
                    {errors.addressLine1 && (
                        <p className="text-red-500 text-xs mt-1">{errors.addressLine1}</p>
                    )}
                </div>

                {/* Area Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Area / Sub-city
                    </label>
                    <select
                        value={deliveryData.area}
                        onChange={(e) => setDeliveryData({ ...deliveryData, area: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="">Select area</option>
                        {ADDIS_ABABA_AREAS.map((area) => (
                            <option key={area} value={area}>{area}</option>
                        ))}
                    </select>
                </div>

                {/* City */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        City
                    </label>
                    <input
                        type="text"
                        value={deliveryData.city}
                        onChange={(e) => setDeliveryData({ ...deliveryData, city: e.target.value })}
                        className={cn(
                            'w-full px-4 py-3 border rounded-xl bg-gray-50',
                            errors.city ? 'border-red-500' : 'border-gray-200'
                        )}
                    />
                </div>

                {/* Landmark */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nearby Landmark (Optional)
                    </label>
                    <input
                        type="text"
                        value={deliveryData.landmark}
                        onChange={(e) => setDeliveryData({ ...deliveryData, landmark: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Near Bole International School"
                    />
                </div>

                {/* Phone */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number
                    </label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="tel"
                            value={deliveryData.phone}
                            onChange={(e) => setDeliveryData({ ...deliveryData, phone: e.target.value })}
                            className={cn(
                                'w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                                errors.phone ? 'border-red-500' : 'border-gray-200'
                            )}
                            placeholder="0911 234 567"
                        />
                    </div>
                    {errors.phone && (
                        <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                    )}
                </div>

                {/* Instructions */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Delivery Instructions (Optional)
                    </label>
                    <textarea
                        value={deliveryData.instructions}
                        onChange={(e) => setDeliveryData({ ...deliveryData, instructions: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        rows={2}
                        placeholder="Gate color, building name, etc."
                    />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                    {onBack && (
                        <button
                            type="button"
                            onClick={onBack}
                            className="flex-1 py-3 px-4 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Back
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className={cn(
                            'flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl font-medium',
                            'hover:bg-blue-700 transition-colors flex items-center justify-center gap-2',
                            isLoading && 'opacity-50 cursor-not-allowed'
                        )}
                    >
                        {isLoading ? 'Processing...' : 'Continue to Menu'}
                        {!isLoading && <ChevronRight className="w-4 h-4" />}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default DeliveryAddressForm;