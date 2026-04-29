'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tablet } from 'lucide-react';
import { toast } from 'react-hot-toast';

function WaiterPinContent() {
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

            // Save the staff context to sessionStorage so the POS knows who is ringing things up
            // sessionStorage is cleared when the tab/browser is closed, providing better XSS protection
            sessionStorage.setItem('gebata_waiter_context', JSON.stringify(data.data.staff));

            toast.success(`Welcome, ${data.data.staff.name || 'Waitstaff'}`);
            router.push(`/waiter?restaurantId=${restaurantId}`);
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Verification failed');
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
    }, [pin]);

    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];

    return (
        <main className="font-manrope flex min-h-screen flex-col items-center justify-center bg-[#fbfbfb] px-4 antialiased">
            <div className="w-full max-w-[420px] rounded-2xl border border-gray-100 bg-white p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <div className="mb-8 flex flex-col items-center text-center">
                    <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-gray-100 bg-gray-50 shadow-sm">
                        <Tablet className="h-8 w-8 text-gray-700" />
                    </div>
                    <h1 className="text-[26px] font-bold tracking-tight text-gray-900">
                        Terminal Locked
                    </h1>
                    <p className="text-body mt-2.5 font-medium text-gray-500">
                        Enter your 4-digit PIN to access the POS
                    </p>
                </div>

                <div className="mb-10 flex justify-center gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div
                            key={i}
                            className={`flex h-[52px] w-[52px] items-center justify-center rounded-xl border-2 transition-all duration-200 ${
                                i < pin.length
                                    ? 'border-gray-900 bg-white shadow-sm'
                                    : 'border-gray-100 bg-gray-50'
                            }`}
                        >
                            {i < pin.length && (
                                <div className="h-3.5 w-3.5 rounded-full bg-gray-900" />
                            )}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-3 gap-3">
                    {numbers.map(num => (
                        <button
                            key={num}
                            onClick={() => handleNumberClick(num)}
                            disabled={loading || pin.length >= 4}
                            className="flex h-[68px] items-center justify-center rounded-xl border border-gray-100 bg-white text-[26px] font-bold text-gray-900 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all hover:bg-gray-50 hover:shadow-md active:scale-[0.97] disabled:opacity-50"
                        >
                            {num}
                        </button>
                    ))}
                    <div className="flex items-center justify-center" />
                    <button
                        onClick={() => handleNumberClick(0)}
                        disabled={loading || pin.length >= 4}
                        className="flex h-[68px] items-center justify-center rounded-xl border border-gray-100 bg-white text-[26px] font-bold text-gray-900 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all hover:bg-gray-50 hover:shadow-md active:scale-[0.97] disabled:opacity-50"
                    >
                        0
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={loading || pin.length === 0}
                        className="flex h-[68px] items-center justify-center rounded-xl border border-red-50 bg-white text-lg font-bold text-red-500 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all hover:bg-red-50 hover:text-red-600 hover:shadow-md active:scale-[0.97] disabled:opacity-30 disabled:hover:bg-white"
                    >
                        Clear
                    </button>
                </div>

                {loading && (
                    <div className="mt-8 flex justify-center">
                        <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-gray-200 border-t-gray-900" />
                    </div>
                )}
            </div>
        </main>
    );
}

export default function WaiterPinPage() {
    return (
        <Suspense
            fallback={
                <main className="font-manrope flex min-h-screen items-center justify-center bg-[#fbfbfb] font-bold text-gray-900">
                    <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-gray-200 border-t-gray-900" />
                </main>
            }
        >
            <WaiterPinContent />
        </Suspense>
    );
}
