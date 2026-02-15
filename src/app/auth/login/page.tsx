'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { MiniNavbar } from '@/components/ui/MiniNavbar';
import { CanvasRevealEffect } from '@/components/ui/CanvasRevealEffect';
import { useState } from 'react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Handle login logic here
    };

    return (
        <div className="relative flex min-h-screen flex-col bg-[var(--background)] transition-colors duration-300">
            {/* Animated Background */}
            <div className="absolute inset-0 z-0">
                <CanvasRevealEffect
                    animationSpeed={3}
                    containerClassName="bg-transparent"
                    colors={[
                        [168, 24, 24], // Gebeta crimson
                        [168, 24, 24],
                    ]}
                    dotSize={6}
                    reverse={false}
                />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--background)_0%,transparent_100%)] opacity-80 dark:opacity-100" />
                <div className="absolute top-0 right-0 left-0 h-1/3 bg-gradient-to-b from-background to-transparent" />
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-1 flex-col">
                <MiniNavbar />

                <div className="flex flex-1 items-center justify-center px-6 py-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="w-full max-w-md space-y-8"
                    >
                        {/* Header */}
                        <div className="space-y-2 text-center">
                            <h1 className="font-display text-4xl font-black tracking-tight text-foreground">
                                Welcome back
                            </h1>
                            <p className="font-body font-medium text-foreground opacity-60">
                                Or{' '}
                                <Link
                                    href="/auth/signup"
                                    className="text-brand-crimson hover:text-brand-crimson/80 font-bold transition-colors"
                                >
                                    create a new account
                                </Link>
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-6 font-body">
                            <div className="space-y-4">
                                <button
                                    type="button"
                                    className="flex w-full items-center justify-center gap-2 rounded-full bg-white dark:bg-white/5 px-4 py-3 text-black dark:text-white backdrop-blur-[2px] transition-all hover:bg-black/5 dark:hover:bg-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.12)]"
                                >
                                    <span className="text-lg">G</span>
                                    <span className="font-bold">Sign in with Google</span>
                                </button>

                                <div className="flex items-center gap-4">
                                    <div className="h-px flex-1 bg-black/10 dark:bg-white/10" />
                                    <span className="text-sm text-foreground/40 dark:text-white/40 font-medium">or</span>
                                    <div className="h-px flex-1 bg-black/10 dark:bg-white/10" />
                                </div>

                                <div className="space-y-4">
                                    <input
                                        type="email"
                                        placeholder="Email address"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        className="w-full rounded-full bg-white dark:bg-white/10 px-6 py-4 text-black dark:text-white placeholder:text-black/40 dark:placeholder:text-white/40 focus:outline-none font-bold shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] focus:shadow-[0_8px_30px_rgb(168,24,24,0.15)]"
                                        required
                                    />
                                    <input
                                        type="password"
                                        placeholder="Password"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        className="w-full rounded-full bg-white dark:bg-white/10 px-6 py-4 text-black dark:text-white placeholder:text-black/40 dark:placeholder:text-white/40 focus:outline-none font-bold shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] focus:shadow-[0_8px_30px_rgb(168,24,24,0.15)]"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <label className="flex cursor-pointer items-center gap-2 text-foreground/60 dark:text-white/60 font-bold">
                                    <input
                                        type="checkbox"
                                        className="rounded border-black/20 dark:border-white/20 bg-white/50 dark:bg-white/5"
                                    />
                                    <span>Remember me</span>
                                </label>
                                <Link
                                    href="#"
                                    className="text-brand-crimson hover:text-brand-crimson/80 font-medium transition-colors"
                                >
                                    Forgot password?
                                </Link>
                            </div>

                            <button
                                type="submit"
                                className="w-full rounded-full bg-black dark:bg-white py-4 font-bold text-white dark:text-black transition-all hover:opacity-90 active:scale-95 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] dark:shadow-[0_10px_40px_-10px_rgba(255,255,255,0.5)]"
                            >
                                Sign in
                            </button>

                            {/* Dev Helper */}
                            <button
                                type="button"
                                onClick={() => {
                                    localStorage.setItem('dev_bypass_auth', 'true');
                                    window.location.href = '/merchant';
                                }}
                                className="w-full rounded-full border border-dashed border-brand-crimson/30 bg-brand-crimson/5 py-3 font-medium text-brand-crimson transition-all hover:bg-brand-crimson/10"
                            >
                                🧪 Test Mode: Login as Guest Merchant
                            </button>
                        </form>

                        <p className="pt-4 text-center text-xs text-foreground/40 dark:text-white/40 font-medium">
                            By signing in, you agree to the{' '}
                            By signing in, you agree to the{' '}
                            <Link
                                href="#"
                                className="text-foreground/40 dark:text-white/40 underline transition-colors hover:text-foreground/60 dark:hover:text-white/60"
                            >
                                Terms of Service
                            </Link>{' '}
                            and{' '}
                            <Link
                                href="#"
                                className="text-foreground/40 dark:text-white/40 underline transition-colors hover:text-foreground/60 dark:hover:text-white/60"
                            >
                                Privacy Policy
                            </Link>
                            .
                        </p>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
