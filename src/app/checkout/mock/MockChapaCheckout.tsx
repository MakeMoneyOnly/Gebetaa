'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { CheckCircle2, Lock, CreditCard, Phone, Building2, ChevronRight, X } from 'lucide-react';

type PaymentMethod = 'telebirr' | 'cbe' | 'awash' | 'dashen' | 'card';

const PAYMENT_METHODS = [
    { id: 'telebirr' as PaymentMethod, name: 'Telebirr', color: '#FF6B00', emoji: '📱', desc: 'M-Pesa-like mobile wallet' },
    { id: 'cbe' as PaymentMethod, name: 'CBE Birr', color: '#006633', emoji: '🏦', desc: 'Commercial Bank of Ethiopia' },
    { id: 'awash' as PaymentMethod, name: 'Awash Bank', color: '#003087', emoji: '🏦', desc: 'Awash Bank mobile' },
    { id: 'dashen' as PaymentMethod, name: 'Dashen Bank', color: '#C8102E', emoji: '🏦', desc: 'Dashen Bank' },
    { id: 'card' as PaymentMethod, name: 'Visa / Mastercard', color: '#1A1A2E', emoji: '💳', desc: 'International cards' },
];

export default function MockChapaCheckout() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const txRef = searchParams.get('tx_ref') ?? '';
    const orderId = searchParams.get('order_id') ?? '';
    const returnUrl = searchParams.get('return_url') ?? '/';
    const amount = Number(searchParams.get('amount') ?? 0);

    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('telebirr');
    const [phone, setPhone] = useState('');
    const [pin, setPin] = useState('');
    const [step, setStep] = useState<'select' | 'enter' | 'processing' | 'success'>('select');
    const [error, setError] = useState('');
    const [countdown, setCountdown] = useState(3);

    // After success, countdown and redirect
    useEffect(() => {
        if (step !== 'success') return;
        if (countdown <= 0) {
            // Call webhook to confirm order before redirecting
            void fetch('/api/payments/chapa/webhook?trx_ref=' + txRef + '&status=success&order_id=' + orderId)
                .catch(() => null)
                .finally(() => {
                    const url = new URL(returnUrl.startsWith('http') ? returnUrl : `${window.location.origin}${returnUrl}`);
                    url.searchParams.set('payment', 'success');
                    url.searchParams.set('tx_ref', txRef);
                    router.replace(url.toString());
                });
            return;
        }
        const t = setTimeout(() => setCountdown(c => c - 1), 1000);
        return () => clearTimeout(t);
    }, [step, countdown, txRef, orderId, returnUrl, router]);

    const handleProceed = () => {
        if (step === 'select') {
            setStep('enter');
            return;
        }
        if (step === 'enter') {
            if (selectedMethod !== 'card' && phone.length < 10) {
                setError('Enter a valid phone number (10 digits starting with 09 or 07)');
                return;
            }
            if (pin.length < 4) {
                setError('Enter your 4-digit PIN');
                return;
            }
            setError('');
            setStep('processing');
            // Simulate processing delay
            setTimeout(() => setStep('success'), 2500);
        }
    };

    const method = PAYMENT_METHODS.find(m => m.id === selectedMethod)!;

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-white rounded-[28px] shadow-2xl overflow-hidden">
                {/* Header */}
                <div
                    className="px-6 py-5 flex items-center justify-between"
                    style={{ background: 'linear-gradient(135deg, #2D1B69 0%, #1a0a4e 100%)' }}
                >
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                            <Lock size={16} className="text-white" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-white/60 uppercase tracking-widest">Chapa</p>
                            <p className="text-base font-black text-white">Secure Checkout</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-white/60">Total</p>
                        <p className="text-lg font-black text-white">{amount.toLocaleString()} ETB</p>
                    </div>
                </div>

                {/* Demo banner */}
                <div className="bg-amber-50 border-b border-amber-100 px-4 py-2 flex items-center gap-2">
                    <span className="text-amber-600 text-xs font-black">⚠ DEMO MODE</span>
                    <span className="text-amber-700 text-xs">No real payment — testing only</span>
                </div>

                <div className="p-6">
                    {/* ── Step: Select payment method ─────────────────── */}
                    {step === 'select' && (
                        <>
                            <p className="mb-4 text-sm font-bold text-gray-500">Choose payment method</p>
                            <div className="space-y-2">
                                {PAYMENT_METHODS.map(m => (
                                    <button
                                        key={m.id}
                                        type="button"
                                        onClick={() => setSelectedMethod(m.id)}
                                        className={`flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left transition-all ${
                                            selectedMethod === m.id
                                                ? 'border-[#2D1B69] bg-[#2D1B69]/5'
                                                : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                                        }`}
                                    >
                                        <span className="text-2xl">{m.emoji}</span>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-gray-900">{m.name}</p>
                                            <p className="text-xs text-gray-400">{m.desc}</p>
                                        </div>
                                        {selectedMethod === m.id && (
                                            <div className="h-5 w-5 rounded-full bg-[#2D1B69] flex items-center justify-center">
                                                <div className="h-2 w-2 rounded-full bg-white" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}

                    {/* ── Step: Enter credentials ─────────────────────── */}
                    {step === 'enter' && (
                        <>
                            <div className="mb-4 flex items-center gap-2">
                                <span className="text-2xl">{method.emoji}</span>
                                <p className="text-base font-black text-gray-900">{method.name}</p>
                            </div>

                            {selectedMethod === 'card' ? (
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        placeholder="Card number"
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium outline-none focus:border-[#2D1B69] focus:ring-2 focus:ring-[#2D1B69]/20"
                                        maxLength={19}
                                    />
                                    <div className="flex gap-3">
                                        <input
                                            type="text"
                                            placeholder="MM/YY"
                                            className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium outline-none focus:border-[#2D1B69] focus:ring-2 focus:ring-[#2D1B69]/20"
                                            maxLength={5}
                                        />
                                        <input
                                            type="text"
                                            placeholder="CVV"
                                            value={pin}
                                            onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 3))}
                                            className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium outline-none focus:border-[#2D1B69] focus:ring-2 focus:ring-[#2D1B69]/20"
                                        />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Cardholder name"
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium outline-none focus:border-[#2D1B69] focus:ring-2 focus:ring-[#2D1B69]/20"
                                    />
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="relative">
                                        <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="tel"
                                            placeholder="09xxxxxxxx"
                                            value={phone}
                                            onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm font-medium outline-none focus:border-[#2D1B69] focus:ring-2 focus:ring-[#2D1B69]/20"
                                        />
                                    </div>
                                    <input
                                        type="password"
                                        placeholder="4-digit PIN"
                                        value={pin}
                                        onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                        inputMode="numeric"
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium outline-none focus:border-[#2D1B69] focus:ring-2 focus:ring-[#2D1B69]/20"
                                    />
                                    <div className="rounded-xl bg-[#2D1B69]/5 px-4 py-3">
                                        <p className="text-xs font-bold text-[#2D1B69]">
                                            💡 DEMO: Enter any 10-digit phone and any 4-digit PIN
                                        </p>
                                    </div>
                                </div>
                            )}
                            {error && (
                                <p className="mt-2 text-xs font-bold text-red-500">{error}</p>
                            )}
                        </>
                    )}

                    {/* ── Step: Processing ────────────────────────────── */}
                    {step === 'processing' && (
                        <div className="flex flex-col items-center gap-4 py-8">
                            <div className="relative h-16 w-16">
                                <div className="absolute inset-0 animate-spin rounded-full border-4 border-gray-100 border-t-[#2D1B69]" />
                            </div>
                            <div className="text-center">
                                <p className="text-base font-black text-gray-900">Processing payment…</p>
                                <p className="mt-1 text-sm text-gray-400">Please wait</p>
                            </div>
                        </div>
                    )}

                    {/* ── Step: Success ───────────────────────────────── */}
                    {step === 'success' && (
                        <div className="flex flex-col items-center gap-4 py-6">
                            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50">
                                <CheckCircle2 size={44} className="text-emerald-500" />
                            </div>
                            <div className="text-center">
                                <p className="text-xl font-black text-gray-900">Payment Successful!</p>
                                <p className="mt-1 text-sm text-gray-400">
                                    {amount.toLocaleString()} ETB paid via {method.name}
                                </p>
                            </div>
                            <div className="w-full rounded-2xl bg-emerald-50 px-4 py-3 text-center">
                                <p className="text-xs font-bold text-emerald-600">
                                    Notifying kitchen… redirecting in {countdown}s
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {(step === 'select' || step === 'enter') && (
                    <div className="px-6 pb-6 space-y-3">
                        <button
                            type="button"
                            onClick={handleProceed}
                            className="flex w-full h-12 items-center justify-center gap-2 rounded-2xl font-black text-white transition-transform active:scale-95"
                            style={{ background: 'linear-gradient(135deg, #2D1B69 0%, #4B2CC4 100%)' }}
                        >
                            {step === 'select' ? 'Continue' : `Pay ${amount.toLocaleString()} ETB`}
                            <ChevronRight size={16} />
                        </button>
                        {step === 'enter' && (
                            <button
                                type="button"
                                onClick={() => { setStep('select'); setError(''); setPin(''); setPhone(''); }}
                                className="w-full text-center text-sm font-bold text-gray-400 hover:text-gray-600"
                            >
                                ← Back
                            </button>
                        )}
                        <div className="flex items-center justify-center gap-1.5 pt-1">
                            <Lock size={11} className="text-gray-300" />
                            <p className="text-[10px] font-bold text-gray-300">Secured by Chapa · PCI DSS Compliant</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
