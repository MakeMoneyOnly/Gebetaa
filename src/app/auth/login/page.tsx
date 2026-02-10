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
        <div className="relative flex min-h-screen flex-col bg-black">
            {/* Animated Background */}
            <div className="absolute inset-0 z-0">
                <CanvasRevealEffect
                    animationSpeed={3}
                    containerClassName="bg-black"
                    colors={[
                        [168, 24, 24], // Gebeta crimson
                        [168, 24, 24],
                    ]}
                    dotSize={6}
                    reverse={false}
                />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,0,0,1)_0%,_transparent_100%)]" />
                <div className="absolute top-0 right-0 left-0 h-1/3 bg-gradient-to-b from-black to-transparent" />
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
                            <h1 className="text-4xl font-black tracking-tight text-white">
                                Welcome back
                            </h1>
                            <p className="font-medium text-white/60">
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
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-4">
                                <button
                                    type="button"
                                    className="flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-white backdrop-blur-[2px] transition-colors hover:bg-white/10"
                                >
                                    <span className="text-lg">G</span>
                                    <span>Sign in with Google</span>
                                </button>

                                <div className="flex items-center gap-4">
                                    <div className="h-px flex-1 bg-white/10" />
                                    <span className="text-sm text-white/40">or</span>
                                    <div className="h-px flex-1 bg-white/10" />
                                </div>

                                <div className="space-y-4">
                                    <input
                                        type="email"
                                        placeholder="Email address"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        className="w-full rounded-full border border-white/10 bg-white/5 px-6 py-3 text-white backdrop-blur-[1px] placeholder:text-white/40 focus:border-white/30 focus:outline-none"
                                        required
                                    />
                                    <input
                                        type="password"
                                        placeholder="Password"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        className="w-full rounded-full border border-white/10 bg-white/5 px-6 py-3 text-white backdrop-blur-[1px] placeholder:text-white/40 focus:border-white/30 focus:outline-none"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <label className="flex cursor-pointer items-center gap-2 text-white/60">
                                    <input
                                        type="checkbox"
                                        className="rounded border-white/20 bg-white/5"
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
                                className="w-full rounded-full bg-white py-3 font-bold text-black transition-all hover:bg-white/90 active:scale-95"
                            >
                                Sign in
                            </button>
                        </form>

                        <p className="pt-4 text-center text-xs text-white/40">
                            By signing in, you agree to the{' '}
                            <Link
                                href="#"
                                className="text-white/40 underline transition-colors hover:text-white/60"
                            >
                                Terms of Service
                            </Link>{' '}
                            and{' '}
                            <Link
                                href="#"
                                className="text-white/40 underline transition-colors hover:text-white/60"
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
