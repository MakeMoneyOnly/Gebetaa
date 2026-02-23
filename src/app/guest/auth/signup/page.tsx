'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { createClient } from '@/lib/supabase';

function sanitizeNextPath(rawNext: string | null): string {
    if (!rawNext || rawNext.trim().length === 0) return '/';
    return rawNext.startsWith('/') ? rawNext : '/';
}

function getAuthErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    if (typeof error === 'object' && error && 'message' in error) {
        const message = (error as { message?: unknown }).message;
        if (typeof message === 'string' && message.length > 0) return message;
    }
    return 'Unable to create account. Please try again.';
}

function SignUpContent() {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = useMemo(() => createClient(), []);
    const nextPath = sanitizeNextPath(searchParams.get('next'));

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            const returnTarget = `/guest/auth/post-login?next=${encodeURIComponent(nextPath)}`;
            const { data, error: signUpError } = await supabase.auth.signUp({
                email: email.trim(),
                password,
                options: {
                    data: {
                        account_type: 'guest',
                        full_name: fullName.trim() || undefined,
                    },
                    emailRedirectTo:
                        typeof window !== 'undefined'
                            ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(returnTarget)}`
                            : undefined,
                },
            });

            if (signUpError) throw signUpError;

            if (data.session) {
                router.push(returnTarget);
                router.refresh();
                return;
            }

            setMessage('Account created. Confirm your email, then continue to your table menu.');
        } catch (submitError) {
            const parsedMessage = getAuthErrorMessage(submitError);
            if (/already registered/i.test(parsedMessage)) {
                setError('This email is already registered. Please sign in.');
            } else {
                setError(parsedMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-2">
            <section className="relative flex flex-col items-center justify-center bg-white px-6 py-12 lg:px-12">
                <div className="absolute top-8 left-8 flex items-center gap-3 lg:top-12 lg:left-12">
                    <div className="bg-brand-crimson shadow-brand-crimson/30 flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-lg">
                        <span className="text-lg font-bold">G</span>
                    </div>
                    <span className="font-manrope text-xl font-bold tracking-tight text-black">
                        Gebeta
                    </span>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="w-full max-w-[440px]"
                >
                    <h1 className="font-manrope text-center text-4xl font-bold tracking-tight text-black lg:text-left">
                        Create Guest Account
                    </h1>
                    <p className="font-manrope mt-3 text-center text-base leading-relaxed font-medium text-black/60 lg:text-left">
                        Save loyalty points and gift cards for every future order.
                    </p>

                    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                        {error ? (
                            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                                {error}
                            </div>
                        ) : null}
                        {message ? (
                            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-700">
                                {message}
                            </div>
                        ) : null}

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-black/80">Name</label>
                            <div className="group relative">
                                <User className="group-focus-within:text-brand-crimson absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-black/40 transition-colors" />
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={e => setFullName(e.target.value)}
                                    placeholder="Enter your name (optional)"
                                    className="font-manrope focus:border-brand-crimson focus:ring-brand-crimson/5 focus:shadow-brand-crimson/10 w-full rounded-xl border border-black/15 bg-white px-12 py-3.5 text-base font-medium text-black transition-all outline-none placeholder:text-black/30 focus:shadow-lg focus:ring-4"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-black/80">Email</label>
                            <div className="group relative">
                                <Mail className="group-focus-within:text-brand-crimson absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-black/40 transition-colors" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    className="font-manrope focus:border-brand-crimson focus:ring-brand-crimson/5 focus:shadow-brand-crimson/10 w-full rounded-xl border border-black/15 bg-white px-12 py-3.5 text-base font-medium text-black transition-all outline-none placeholder:text-black/30 focus:shadow-lg focus:ring-4"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-black/80">Password</label>
                            <div className="group relative">
                                <Lock className="group-focus-within:text-brand-crimson absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-black/40 transition-colors" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="Create a password"
                                    className="font-manrope focus:border-brand-crimson focus:ring-brand-crimson/5 focus:shadow-brand-crimson/10 w-full rounded-xl border border-black/15 bg-white px-12 py-3.5 pr-14 text-base font-medium text-black transition-all outline-none placeholder:text-black/30 focus:shadow-lg focus:ring-4"
                                    minLength={6}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(prev => !prev)}
                                    className="absolute top-1/2 right-4 -translate-y-1/2 text-black/40 transition hover:text-black/70"
                                    aria-label="Toggle password visibility"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            whileHover={{ scale: 1.01 }}
                            disabled={loading}
                            type="submit"
                            className="group font-manrope flex w-full items-center justify-center gap-2 rounded-xl bg-[#0D3B40] px-6 py-3.5 text-lg font-bold text-white transition-all hover:bg-[#08282C] focus:ring-4 focus:ring-[#0D3B40]/20 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {loading ? 'Creating Account...' : 'Sign Up'}
                        </motion.button>
                    </form>

                    <p className="mt-8 text-center text-sm font-bold text-black/60">
                        Already have an account?{' '}
                        <Link
                            href={`/guest/auth/login?next=${encodeURIComponent(nextPath)}`}
                            className="text-brand-crimson hover:text-brand-crimson-hover hover:underline"
                        >
                            Sign In
                        </Link>
                    </p>
                    <p className="mt-3 text-center text-xs font-bold text-black/50">
                        <Link
                            href={nextPath}
                            className="hover:text-brand-crimson underline underline-offset-4"
                        >
                            Back to Menu
                        </Link>
                    </p>
                </motion.div>
            </section>

            <section className="relative hidden w-full flex-col justify-between overflow-hidden bg-[radial-gradient(circle_at_top_right,#2A0A0F_0%,#130607_45%,#090909_100%)] p-12 text-white lg:flex xl:p-24">
                <div className="bg-brand-crimson/10 absolute top-0 right-0 h-[500px] w-[500px] rounded-full blur-[120px]" />
                <div className="absolute bottom-0 left-0 h-[500px] w-[500px] rounded-full bg-white/5 blur-[120px]" />
                <div className="relative z-10" />
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="relative z-10 my-auto"
                >
                    <h2 className="font-manrope text-5xl leading-[1.1] font-bold tracking-tight text-white">
                        One account for every Gebeta table
                    </h2>
                    <div className="border-brand-crimson mt-8 border-l-2 pl-6">
                        <p className="text-xl leading-relaxed font-medium text-white/90 italic">
                            &ldquo;I sign up once, then every scan at participating restaurants keeps my rewards in sync.&rdquo;
                        </p>
                        <div className="mt-6 flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-white/10" />
                            <div>
                                <p className="text-base font-bold text-white">Gebeta Rewards</p>
                                <p className="text-sm font-medium text-white/50">Guest Membership</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </section>
        </main>
    );
}

import { Suspense } from 'react';

export default function GuestSignUpPage() {
    return (
        <Suspense fallback={null}>
            <SignUpContent />
        </Suspense>
    );
}
