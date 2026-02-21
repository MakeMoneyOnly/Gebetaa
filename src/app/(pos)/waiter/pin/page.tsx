'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Tablet } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function WaiterPinPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const restaurantId = searchParams.get('restaurantId');
    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);

    // If no restaurantId, they shouldn't be here (they should log in first, or it's an error)
    useEffect(() => {
        if (!restaurantId) {
            router.push('/auth/login');
        }
    }, [restaurantId, router]);

    const handleNumberClick = (num: number) => {
        if (pin.length < 4) {
            setPin(prev => prev + num);
        }
    };

    const handleDelete = () => {
        setPin(prev => prev.slice(0, -1));
    };

    const handleSubmit = async () => {
        if (pin.length !== 4) return;
        setLoading(true);

        try {
            // Note: In an actual production scenario, we'd hit an API to verify the PIN
            // and maybe return a momentary session token or set a cookie for this specific waiter.
            // For MVP, we will query the restaurant_staff table via API to verify the PIN.
            const res = await fetch('/api/staff/verify-pin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ restaurantId, pin }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Invalid PIN');
            }

            // Save the staff context to localStorage so the POS knows who is ringing things up
            localStorage.setItem('gebata_waiter_context', JSON.stringify(data.staff));
            
            toast.success(`Welcome, ${data.staff.name || 'Waitstaff'}`);
            router.push(`/waiter?restaurantId=${restaurantId}`);
        } catch (err: any) {
            toast.error(err.message || 'Verification failed');
            setPin(''); // Reset on failure
        } finally {
            setLoading(false);
        }
    };

    // Auto-submit when 4 digits are entered
    useEffect(() => {
        if (pin.length === 4) {
            void handleSubmit();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pin]);


    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-900 px-4">
            <div className="w-full max-w-sm rounded-3xl bg-gray-800 p-8 shadow-2xl">
                <div className="mb-8 flex flex-col items-center text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-700">
                        <Tablet className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-white">
                        Terminal Locked
                    </h1>
                    <p className="mt-2 text-sm text-gray-400">
                        Enter your 4-digit PIN to access the POS
                    </p>
                </div>

                <div className="mb-10 flex justify-center gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div
                            key={i}
                            className={`flex h-12 w-12 items-center justify-center rounded-xl border-2 transition-all ${
                                i < pin.length
                                    ? 'border-white bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)]'
                                    : 'border-gray-600 bg-gray-700'
                            }`}
                        >
                            {i < pin.length && <div className="h-3 w-3 rounded-full bg-black" />}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-3 gap-4">
                    {numbers.map(num => (
                        <button
                            key={num}
                            onClick={() => handleNumberClick(num)}
                            disabled={loading || pin.length >= 4}
                            className="flex h-16 items-center justify-center rounded-2xl bg-gray-700 text-2xl font-semibold text-white transition-all hover:bg-gray-600 active:scale-95 disabled:opacity-50"
                        >
                            {num}
                        </button>
                    ))}
                    <div className="flex items-center justify-center" />
                    <button
                        onClick={() => handleNumberClick(0)}
                        disabled={loading || pin.length >= 4}
                        className="flex h-16 items-center justify-center rounded-2xl bg-gray-700 text-2xl font-semibold text-white transition-all hover:bg-gray-600 active:scale-95 disabled:opacity-50"
                    >
                        0
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={loading || pin.length === 0}
                        className="flex h-16 items-center justify-center rounded-2xl bg-gray-700 text-xl font-semibold text-white transition-all hover:bg-red-500 hover:text-white active:scale-95 disabled:opacity-20"
                    >
                        Clear
                    </button>
                </div>

                {loading && (
                    <div className="mt-8 flex justify-center">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    </div>
                )}
            </div>
        </div>
    );
}
