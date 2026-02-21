'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Tablet, ShieldCheck, ArrowRight, Loader2, CheckCircle2, Laptop } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

export default function DeviceSetupPage() {
    const [pairingCode, setPairingCode] = useState('');
    const [status, setStatus] = useState<'idle' | 'pairing' | 'success' | 'invalid'>('idle');
    const [deviceInfo, setDeviceInfo] = useState<any>(null);
    const [restaurantName, setRestaurantName] = useState<string>('');
    const router = useRouter();
    const params = useParams();
    const slug = params?.slug as string;

    // Fetch the restaurant name for the header title
    useEffect(() => {
        if (!slug) return;
        // Use the public Supabase REST API to look up the restaurant by its slug
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (supabaseUrl && supabaseKey) {
            fetch(`${supabaseUrl}/rest/v1/restaurants?slug=eq.${slug}&select=name`, {
                headers: {
                    apikey: supabaseKey,
                    Authorization: `Bearer ${supabaseKey}`,
                },
            })
                .then(r => r.json())
                .then((rows: any[]) => {
                    if (rows && rows.length > 0 && rows[0].name) {
                        setRestaurantName(rows[0].name);
                    } else {
                        setRestaurantName(
                            slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
                        );
                    }
                })
                .catch(() => {
                    setRestaurantName(
                        slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
                    );
                });
        } else {
            setRestaurantName(slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()));
        }
    }, [slug]);

    const getDeviceLabel = (deviceType?: string) => {
        switch (deviceType) {
            case 'kds':
                return 'Kitchen Display System';
            case 'pos':
                return 'Waiter POS';
            case 'kiosk':
                return 'Customer Kiosk';
            default:
                return 'Service Terminal';
        }
    };

    const getPageTitle = () => {
        const name =
            restaurantName ||
            slug?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) ||
            'Restaurant';
        return name;
    };

    const handlePair = async (e: React.FormEvent) => {
        e.preventDefault();
        if (pairingCode.length !== 4) return;

        setStatus('pairing');
        try {
            const response = await fetch('/api/devices/pair', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pairing_code: pairingCode }),
            });

            const result = await response.json();

            // apiSuccess wraps data in { data: {...} }; apiError returns { error: "..." }
            if (response.ok && result.data) {
                setStatus('success');
                setDeviceInfo(result.data);

                // Store device session in localStorage so the device app knows who it is
                localStorage.setItem('gebata_device_token', result.data.device_token);
                localStorage.setItem('gebata_device_info', JSON.stringify(result.data));

                // Redirect after a short delay
                setTimeout(() => {
                    if (result.data.device_type === 'kds') {
                        router.push('/kds');
                    } else if (result.data.device_type === 'pos') {
                        router.push('/waiter');
                    } else {
                        router.push('/');
                    }
                }, 2500);
            } else {
                setStatus('invalid');
                toast.error(result.error || 'Invalid pairing code. Please try again.');
            }
        } catch (error) {
            setStatus('invalid');
            toast.error('Connection error. Please try again.');
        }
    };

    return (
        <div className="font-manrope flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6">
            {/* Ambient Background Glows */}
            <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
                <div className="absolute -top-[20%] -left-[10%] h-[60%] w-[60%] rounded-full bg-emerald-100/40 blur-[120px]" />
                <div className="absolute -right-[10%] -bottom-[20%] h-[60%] w-[60%] rounded-full bg-indigo-100/40 blur-[120px]" />
            </div>

            <div className="relative z-10 w-full max-w-md">
                {status !== 'success' ? (
                    <div className="flex flex-col items-center text-center">
                        <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-white shadow-xl shadow-gray-200/50">
                            <Tablet className="h-12 w-12 text-gray-800" />
                        </div>

                        <h1 className="text-3xl font-black tracking-tight text-gray-900">
                            {getPageTitle()}
                        </h1>
                        <p className="mt-2 text-sm font-black tracking-widest text-gray-400 uppercase">
                            Terminal Setup
                        </p>
                        <p className="mt-3 text-sm font-semibold text-gray-500">
                            Enter the 4-digit pairing code from your Merchant Dashboard to link this
                            device.
                        </p>

                        <form onSubmit={handlePair} className="mt-10 w-full space-y-6">
                            <div className="flex justify-center">
                                <input
                                    type="text"
                                    maxLength={4}
                                    value={pairingCode}
                                    onChange={e => {
                                        const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                                        setPairingCode(val);
                                        if (status === 'invalid') setStatus('idle');
                                    }}
                                    autoFocus
                                    placeholder="••••"
                                    className={cn(
                                        'w-full max-w-[320px] rounded-2xl bg-white py-6 text-center font-mono text-5xl font-black tracking-[0.5em] shadow-lg shadow-gray-100 transition-all focus:outline-none',
                                        status === 'invalid'
                                            ? 'bg-red-50 text-red-600 ring-4 shadow-red-100 ring-red-500/10'
                                            : 'text-gray-900 focus:shadow-xl focus:ring-4 focus:ring-black/5'
                                    )}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={pairingCode.length !== 4 || status === 'pairing'}
                                className="group bg-brand-crimson disabled:hover:bg-brand-crimson relative mx-auto flex w-full max-w-[320px] items-center justify-center overflow-hidden rounded-2xl px-6 py-5 text-lg font-bold text-white shadow-xl shadow-black/10 transition-all hover:scale-[1.02] hover:bg-[#a0151e] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
                            >
                                {status === 'pairing' ? (
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                ) : (
                                    <>
                                        Pair This Device
                                        <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-12 flex items-center gap-2 text-sm font-bold text-gray-400">
                            <ShieldCheck className="h-5 w-5" />
                            Secure Terminal Provisioning
                        </div>
                    </div>
                ) : (
                    <div className="animate-in fade-in zoom-in flex flex-col items-center text-center duration-500">
                        <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-green-50 text-green-500 shadow-xl shadow-green-100/50">
                            <CheckCircle2 className="h-12 w-12" />
                        </div>

                        <p className="text-sm font-black tracking-widest text-gray-400 uppercase">
                            Paired Successfully
                        </p>
                        <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-900">
                            {getPageTitle()} {getDeviceLabel(deviceInfo?.device_type)}
                        </h1>
                        <p className="mt-3 text-sm font-semibold text-gray-500">
                            <span className="font-bold text-gray-900">{deviceInfo?.name}</span> is
                            ready to use.
                        </p>

                        <div className="mt-10 w-full max-w-[320px] rounded-3xl bg-white p-6 shadow-xl shadow-gray-100">
                            <div className="flex items-center gap-5 text-left">
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                                    <Laptop className="h-7 w-7" />
                                </div>
                                <div>
                                    <p className="text-[11px] font-black tracking-wider text-gray-400 uppercase">
                                        Launching
                                    </p>
                                    <p className="text-xl font-black text-gray-900">
                                        {getDeviceLabel(deviceInfo?.device_type)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 text-gray-300">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
