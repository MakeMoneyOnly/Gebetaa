'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User,
    Building2,
    MapPin,
    Phone,
    Palette,
    Check,
    ChevronRight,
    ChevronLeft,
    Zap,
    UtensilsCrossed,
    ArrowRight,
    Sparkles,
} from 'lucide-react';
import { createClient } from '@/lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

interface OnboardingData {
    full_name: string;
    restaurant_name: string;
    cuisine_type: string;
    location: string;
    contact_phone: string;
    description: string;
    brand_color: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CUISINE_TYPES = [
    'Ethiopian',
    'Italian',
    'Japanese',
    'Chinese',
    'Indian',
    'Mexican',
    'American',
    'Mediterranean',
    'Thai',
    'French',
    'Middle Eastern',
    'Korean',
    'Other',
];

const BRAND_COLORS = [
    { label: 'Midnight Teal', value: '#0D3B40' },
    { label: 'Crimson', value: '#C0392B' },
    { label: 'Deep Navy', value: '#1a2a4a' },
    { label: 'Forest', value: '#1a4a2a' },
    { label: 'Royal Purple', value: '#4a1a6a' },
    { label: 'Burnt Orange', value: '#B35A1A' },
    { label: 'Slate', value: '#2d3748' },
    { label: 'Rose Gold', value: '#8B4560' },
];

const STEPS = [
    { id: 1, label: 'You', icon: User },
    { id: 2, label: 'Restaurant', icon: Building2 },
    { id: 3, label: 'Brand', icon: Palette },
    { id: 4, label: 'Launch', icon: Zap },
];

// ─── Slide animation ──────────────────────────────────────────────────────────

const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

// ─── Step Components ──────────────────────────────────────────────────────────

function InputField({
    label,
    icon: Icon,
    required,
    ...props
}: {
    label: string;
    icon: React.ElementType;
    required?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <div className="space-y-1.5">
            <label className="text-sm font-bold text-gray-700">
                {label}
                {required && <span className="text-brand-crimson ml-0.5">*</span>}
            </label>
            <div className="group relative">
                <Icon className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-[#0D3B40]" />
                <input
                    {...props}
                    className="w-full rounded-xl border border-gray-200 bg-white py-3.5 pr-4 pl-11 text-sm font-medium text-gray-900 shadow-sm transition-all outline-none placeholder:text-gray-400 focus:border-[#0D3B40] focus:ring-4 focus:ring-[#0D3B40]/8"
                />
            </div>
        </div>
    );
}

// Step 1: Owner Profile
function StepOwnerProfile({
    data,
    onChange,
}: {
    data: OnboardingData;
    onChange: (d: Partial<OnboardingData>) => void;
}) {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="font-manrope text-3xl font-bold tracking-tight text-gray-900">
                    Welcome! Let&apos;s start with you.
                </h2>
                <p className="mt-2 font-medium text-gray-500">
                    This is how your staff will know who manages the restaurant.
                </p>
            </div>

            <InputField
                label="Your Full Name"
                icon={User}
                required
                type="text"
                value={data.full_name}
                onChange={e => onChange({ full_name: e.target.value })}
                placeholder="e.g. Dawit Bekele"
                autoFocus
            />

            <InputField
                label="Your Phone Number"
                icon={Phone}
                type="tel"
                value={data.contact_phone}
                onChange={e => onChange({ contact_phone: e.target.value })}
                placeholder="e.g. +251 91 234 5678"
            />

            <p className="text-xs font-medium text-gray-400">
                📍 Used for urgent alerts and staff communication only. Never shared publicly.
            </p>
        </div>
    );
}

// Step 2: Restaurant Details
function StepRestaurantDetails({
    data,
    onChange,
}: {
    data: OnboardingData;
    onChange: (d: Partial<OnboardingData>) => void;
}) {
    return (
        <div className="space-y-5">
            <div>
                <h2 className="font-manrope text-3xl font-bold tracking-tight text-gray-900">
                    Tell us about your restaurant.
                </h2>
                <p className="mt-2 font-medium text-gray-500">
                    This sets up your menu URL and kitchen display.
                </p>
            </div>

            <InputField
                label="Restaurant Name"
                icon={Building2}
                required
                type="text"
                value={data.restaurant_name}
                onChange={e => onChange({ restaurant_name: e.target.value })}
                placeholder="e.g. Cafe Lucia"
            />

            <InputField
                label="Location / Address"
                icon={MapPin}
                required
                type="text"
                value={data.location}
                onChange={e => onChange({ location: e.target.value })}
                placeholder="e.g. Bole Road, Addis Ababa"
            />

            <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700">
                    Cuisine Type <span className="font-medium text-gray-400">(optional)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                    {CUISINE_TYPES.map(c => (
                        <button
                            key={c}
                            type="button"
                            onClick={() =>
                                onChange({ cuisine_type: c === data.cuisine_type ? '' : c })
                            }
                            className={`rounded-xl border px-3.5 py-2 text-xs font-bold transition-all ${
                                data.cuisine_type === c
                                    ? 'border-[#0D3B40] bg-[#0D3B40] text-white shadow-lg shadow-[#0D3B40]/20'
                                    : 'border-gray-200 bg-white text-gray-600 hover:border-[#0D3B40]/40'
                            }`}
                        >
                            {c}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

// Step 3: Brand
function StepBrand({
    data,
    onChange,
}: {
    data: OnboardingData;
    onChange: (d: Partial<OnboardingData>) => void;
}) {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="font-manrope text-3xl font-bold tracking-tight text-gray-900">
                    Make it yours.
                </h2>
                <p className="mt-2 font-medium text-gray-500">
                    Choose a brand color for your digital menu and QR codes.
                </p>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Brand Color</label>
                <div className="grid grid-cols-4 gap-3">
                    {BRAND_COLORS.map(({ label, value }) => (
                        <button
                            key={value}
                            type="button"
                            title={label}
                            onClick={() => onChange({ brand_color: value })}
                            className="relative aspect-square rounded-2xl transition-all hover:scale-105 focus:outline-none"
                            style={{ backgroundColor: value }}
                        >
                            {data.brand_color === value && (
                                <span className="absolute inset-0 flex items-center justify-center">
                                    <Check
                                        className="h-5 w-5 text-white drop-shadow-md"
                                        strokeWidth={3}
                                    />
                                </span>
                            )}
                            {data.brand_color === value && (
                                <span
                                    className="absolute inset-0 rounded-2xl ring-2 ring-white ring-offset-2"
                                    style={{ boxShadow: `0 0 0 3px ${value}` }}
                                />
                            )}
                        </button>
                    ))}
                </div>
                <p className="text-xs text-gray-400">
                    You can always update this from Settings later.
                </p>
            </div>

            {/* Preview */}
            <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-sm">
                <div className="h-12 w-full" style={{ backgroundColor: data.brand_color }} />
                <div className="flex items-center gap-3 bg-white p-4">
                    <div
                        className="flex h-10 w-10 items-center justify-center rounded-xl text-lg font-bold text-white shadow-md"
                        style={{ backgroundColor: data.brand_color }}
                    >
                        {(data.restaurant_name || 'R').charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-900">
                            {data.restaurant_name || 'Your Restaurant'}
                        </p>
                        <p className="text-xs text-gray-400">
                            {data.cuisine_type || 'Restaurant'} · {data.location || 'Your Location'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Step 4: Go Live
function StepGoLive({ data, loading }: { data: OnboardingData; loading: boolean }) {
    const checks = [
        { label: 'Restaurant profile created', done: true },
        { label: 'Digital menu ready to populate', done: true },
        { label: 'QR code system activated', done: true },
        { label: 'Kitchen display linked', done: true },
        { label: 'Owner account secured', done: true },
    ];

    return (
        <div className="space-y-6">
            <div className="text-center">
                <div
                    className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl shadow-xl"
                    style={{ backgroundColor: data.brand_color }}
                >
                    <Sparkles className="h-10 w-10 text-white" />
                </div>
                <h2 className="font-manrope text-3xl font-bold tracking-tight text-gray-900">
                    Ready to go live, {data.full_name.split(' ')[0]}!
                </h2>
                <p className="mt-2 font-medium text-gray-500">
                    Here&apos;s everything we&apos;ve set up for{' '}
                    <span className="font-bold text-gray-800">{data.restaurant_name}</span>:
                </p>
            </div>

            <div className="space-y-2.5 rounded-2xl border border-gray-100 bg-gray-50/50 p-4">
                {checks.map(({ label }) => (
                    <div key={label} className="flex items-center gap-3">
                        <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500">
                            <Check className="h-3 w-3 text-white" strokeWidth={3} />
                        </div>
                        <span className="text-sm font-medium text-gray-700">{label}</span>
                    </div>
                ))}
            </div>

            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                <p className="text-sm font-bold text-amber-800">
                    ⚡ Your 30-minute checklist after launch:
                </p>
                <ol className="mt-2 space-y-1.5 text-sm text-amber-700">
                    <li>1. Add your first menu categories &amp; items</li>
                    <li>2. Set up table numbers &amp; print QR codes</li>
                    <li>3. Configure your kitchen display station</li>
                    <li>4. Place a test order to confirm it works</li>
                </ol>
            </div>

            {loading && (
                <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#0D3B40] border-t-transparent" />
                    Creating your restaurant workspace...
                </div>
            )}
        </div>
    );
}

// ─── Main Wizard ──────────────────────────────────────────────────────────────

export default function OnboardingPage() {
    const router = useRouter();
    const supabase = useMemo(() => createClient(), []);

    const [step, setStep] = useState(1);
    const [direction, setDirection] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [data, setData] = useState<OnboardingData>({
        full_name: '',
        restaurant_name: '',
        cuisine_type: '',
        location: '',
        contact_phone: '',
        description: '',
        brand_color: '#0D3B40',
    });

    const merge = (patch: Partial<OnboardingData>) => setData(prev => ({ ...prev, ...patch }));

    // Validation per step
    const canProceed = useMemo(() => {
        if (step === 1) return data.full_name.trim().length > 1;
        if (step === 2)
            return data.restaurant_name.trim().length > 1 && data.location.trim().length > 1;
        if (step === 3) return true;
        return false;
    }, [step, data]);

    const go = (newStep: number) => {
        setDirection(newStep > step ? 1 : -1);
        setStep(newStep);
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/onboarding', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    full_name: data.full_name.trim(),
                    restaurant_name: data.restaurant_name.trim(),
                    location: data.location.trim(),
                    contact_phone: data.contact_phone.trim() || undefined,
                    description: data.description.trim() || undefined,
                    brand_color: data.brand_color,
                    cuisine_type: data.cuisine_type || undefined,
                }),
            });

            const json = (await res.json()) as { data?: unknown; error?: string };

            if (!res.ok || json.error) {
                throw new Error(json.error ?? 'Something went wrong. Please try again.');
            }

            // ✅ Prime the sessionStorage cache BEFORE navigation
            // so the dashboard shows the real name instantly
            sessionStorage.setItem('gebeta_restaurant_name', data.restaurant_name.trim());
            sessionStorage.setItem(
                'gebeta_restaurant_handle',
                `@${data.restaurant_name.toLowerCase().replace(/\s+/g, '')}_admin`
            );

            // Success — refresh session then go to merchant dashboard
            await supabase.auth.refreshSession();
            router.replace('/merchant');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unexpected error');
            setLoading(false);
        }
    };

    const totalSteps = STEPS.length;
    const progress = ((step - 1) / (totalSteps - 1)) * 100;

    return (
        <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 p-4">
            <div className="w-full max-w-lg">
                {/* Header */}
                <div className="mb-8 text-center">
                    <div className="mb-6 inline-flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0D3B40] font-bold text-white shadow-lg">
                            G
                        </div>
                        <span className="font-manrope text-lg font-bold text-gray-900">
                            Gebeta OS
                        </span>
                    </div>

                    {/* Step dots */}
                    <div className="mb-3 flex items-center justify-center gap-2">
                        {STEPS.map(s => {
                            const Icon = s.icon;
                            const isActive = s.id === step;
                            const isDone = s.id < step;
                            return (
                                <div
                                    key={s.id}
                                    className={`flex items-center gap-1 transition-all ${isActive ? 'opacity-100' : isDone ? 'opacity-60' : 'opacity-30'}`}
                                >
                                    <div
                                        className={`flex h-7 w-7 items-center justify-center rounded-full transition-all ${
                                            isDone
                                                ? 'bg-emerald-500 text-white'
                                                : isActive
                                                  ? 'bg-[#0D3B40] text-white ring-4 ring-[#0D3B40]/15'
                                                  : 'bg-gray-200 text-gray-400'
                                        }`}
                                    >
                                        {isDone ? (
                                            <Check className="h-3.5 w-3.5" strokeWidth={3} />
                                        ) : (
                                            <Icon className="h-3.5 w-3.5" />
                                        )}
                                    </div>
                                    {s.id < STEPS.length && (
                                        <div
                                            className={`h-0.5 w-8 rounded-full transition-all ${s.id < step ? 'bg-emerald-400' : 'bg-gray-200'}`}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
                        Step {step} of {totalSteps}
                    </p>
                </div>

                {/* Card */}
                <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-xl shadow-gray-200/60">
                    {/* Progress bar */}
                    <div className="h-1 bg-gray-100">
                        <motion.div
                            className="h-full bg-gradient-to-r from-[#0D3B40] to-emerald-500"
                            initial={false}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.4, ease: 'easeOut' }}
                        />
                    </div>

                    <div className="p-8">
                        {/* Animated step content */}
                        <AnimatePresence mode="wait" custom={direction}>
                            <motion.div
                                key={step}
                                custom={direction}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.28, ease: 'easeInOut' }}
                            >
                                {step === 1 && <StepOwnerProfile data={data} onChange={merge} />}
                                {step === 2 && (
                                    <StepRestaurantDetails data={data} onChange={merge} />
                                )}
                                {step === 3 && <StepBrand data={data} onChange={merge} />}
                                {step === 4 && <StepGoLive data={data} loading={loading} />}
                            </motion.div>
                        </AnimatePresence>

                        {/* Error */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
                            >
                                {error}
                            </motion.div>
                        )}

                        {/* Navigation */}
                        <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-6">
                            {step > 1 ? (
                                <button
                                    onClick={() => go(step - 1)}
                                    disabled={loading}
                                    className="flex items-center gap-1.5 text-sm font-bold text-gray-400 transition-colors hover:text-gray-700 disabled:opacity-40"
                                >
                                    <ChevronLeft className="h-4 w-4" /> Back
                                </button>
                            ) : (
                                <div />
                            )}

                            {step < 3 && (
                                <motion.button
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => go(step + 1)}
                                    disabled={!canProceed}
                                    className="flex items-center gap-2 rounded-2xl bg-[#0D3B40] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#0D3B40]/25 transition-all hover:bg-[#08282C] disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Continue <ChevronRight className="h-4 w-4" />
                                </motion.button>
                            )}

                            {step === 3 && (
                                <motion.button
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => go(4)}
                                    className="flex items-center gap-2 rounded-2xl bg-[#0D3B40] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#0D3B40]/25 transition-all hover:bg-[#08282C]"
                                >
                                    Preview &amp; Launch <UtensilsCrossed className="h-4 w-4" />
                                </motion.button>
                            )}

                            {step === 4 && (
                                <motion.button
                                    whileTap={{ scale: 0.97 }}
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 transition-all hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {loading ? 'Launching...' : 'Go Live'}{' '}
                                    <ArrowRight className="h-4 w-4" />
                                </motion.button>
                            )}
                        </div>
                    </div>
                </div>

                <p className="mt-6 text-center text-xs font-medium text-gray-400">
                    © 2026 Gebeta Inc. · Enterprise Restaurant OS
                </p>
            </div>
        </main>
    );
}
