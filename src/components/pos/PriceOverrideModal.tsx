/**
 * Price Override Modal Component
 * TASK-POS-001: Price Overrides with Audit Trail
 *
 * Modal for staff to adjust item prices with reason codes
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface PriceOverrideModalProps {
    orderId: string;
    orderItemId: string;
    itemName: string;
    currentPrice: number;
    onClose: () => void;
    onSuccess: () => void;
}

const REASON_CODES = [
    { value: 'manager_discount', label: 'Manager Discount' },
    { value: 'complimentary', label: 'Complimentary' },
    { value: 'price_error', label: 'Price Error' },
    { value: 'customer_complaint', label: 'Customer Complaint' },
    { value: 'promotion', label: 'Promotion' },
    { value: 'other', label: 'Other' },
] as const;

export function PriceOverrideModal({
    orderId,
    orderItemId,
    itemName,
    currentPrice,
    onClose,
    onSuccess,
}: PriceOverrideModalProps) {
    const router = useRouter();
    const [newPrice, setNewPrice] = useState(currentPrice.toString());
    const [reasonCode, setReasonCode] = useState<string>('');
    const [reasonNotes, setReasonNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const priceDiff = parseFloat(newPrice) - currentPrice;
    const percentChange = currentPrice > 0 ? (Math.abs(priceDiff) / currentPrice) * 100 : 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!reasonCode) {
            setError('Please select a reason for the price override');
            return;
        }

        if (percentChange > 200) {
            setError('Price change exceeds maximum allowed (200%)');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch(
                `/api/orders/${orderId}/items/${orderItemId}/override-price`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        originalPrice: currentPrice,
                        newPrice: parseFloat(newPrice),
                        reasonCode,
                        reasonNotes: reasonNotes || undefined,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error?.message || 'Failed to apply price override');
            }

            router.refresh();
            onSuccess();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="mx-4 w-full max-w-md rounded-lg bg-white shadow-xl dark:bg-gray-800">
                <div className="p-6">
                    <h2 className="mb-4 text-xl font-semibold">Price Override</h2>

                    <div className="mb-4 rounded bg-gray-100 p-3 dark:bg-gray-700">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Item</p>
                        <p className="font-medium">{itemName}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="mb-1 block text-sm font-medium">
                                Current Price (ETB)
                            </label>
                            <input
                                type="text"
                                value={currentPrice.toFixed(2)}
                                disabled
                                className="w-full rounded border bg-gray-50 px-3 py-2 dark:bg-gray-700"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium">
                                New Price (ETB) *
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={newPrice}
                                onChange={e => setNewPrice(e.target.value)}
                                className="w-full rounded border px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                required
                            />
                            {priceDiff !== 0 && (
                                <p
                                    className={`mt-1 text-sm ${priceDiff < 0 ? 'text-green-600' : 'text-red-600'}`}
                                >
                                    {priceDiff < 0 ? 'Discount: ' : 'Increase: '}
                                    {Math.abs(priceDiff).toFixed(2)} ETB ({percentChange.toFixed(1)}
                                    %)
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium">Reason Code *</label>
                            <select
                                value={reasonCode}
                                onChange={e => setReasonCode(e.target.value)}
                                className="w-full rounded border px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                required
                            >
                                <option value="">Select a reason...</option>
                                {REASON_CODES.map(code => (
                                    <option key={code.value} value={code.value}>
                                        {code.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium">
                                Additional Notes
                            </label>
                            <textarea
                                value={reasonNotes}
                                onChange={e => setReasonNotes(e.target.value)}
                                rows={2}
                                className="w-full rounded border px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                placeholder="Optional details about this override..."
                            />
                        </div>

                        {error && (
                            <div className="rounded bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                                {error}
                            </div>
                        )}

                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 rounded border px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex-1 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Applying...' : 'Apply Override'}
                            </button>
                        </div>
                    </form>
                </div>

                <div className="rounded-b-lg bg-gray-50 px-6 py-3 text-xs text-gray-500 dark:bg-gray-900/50 dark:text-gray-400">
                    All price overrides are logged and auditable
                </div>
            </div>
        </div>
    );
}
