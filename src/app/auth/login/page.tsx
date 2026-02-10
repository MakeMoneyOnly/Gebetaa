"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import { MiniNavbar } from '@/components/ui/MiniNavbar';
import { CanvasRevealEffect } from '@/components/ui/CanvasRevealEffect';
import { useState } from 'react';

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Handle login logic here
    };

    return (
        <div className="min-h-screen bg-black relative flex flex-col">
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
                <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-black to-transparent" />
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col flex-1">
                <MiniNavbar />

                <div className="flex-1 flex items-center justify-center px-6 py-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="w-full max-w-md space-y-8"
                    >
                        {/* Header */}
                        <div className="text-center space-y-2">
                            <h1 className="text-4xl font-black tracking-tight text-white">
                                Welcome back
                            </h1>
                            <p className="text-white/60 font-medium">
                                Or{' '}
                                <Link href="/auth/signup" className="text-brand-crimson hover:text-brand-crimson/80 transition-colors font-bold">
                                    create a new account
                                </Link>
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-4">
                                <button
                                    type="button"
                                    className="w-full backdrop-blur-[2px] flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-full py-3 px-4 transition-colors"
                                >
                                    <span className="text-lg">G</span>
                                    <span>Sign in with Google</span>
                                </button>

                                <div className="flex items-center gap-4">
                                    <div className="h-px bg-white/10 flex-1" />
                                    <span className="text-white/40 text-sm">or</span>
                                    <div className="h-px bg-white/10 flex-1" />
                                </div>

                                <div className="space-y-4">
                                    <input
                                        type="email"
                                        placeholder="Email address"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full backdrop-blur-[1px] bg-white/5 text-white border border-white/10 rounded-full py-3 px-6 focus:outline-none focus:border-white/30 placeholder:text-white/40"
                                        required
                                    />
                                    <input
                                        type="password"
                                        placeholder="Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full backdrop-blur-[1px] bg-white/5 text-white border border-white/10 rounded-full py-3 px-6 focus:outline-none focus:border-white/30 placeholder:text-white/40"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <label className="flex items-center gap-2 text-white/60 cursor-pointer">
                                    <input type="checkbox" className="rounded border-white/20 bg-white/5" />
                                    <span>Remember me</span>
                                </label>
                                <Link href="#" className="text-brand-crimson hover:text-brand-crimson/80 transition-colors font-medium">
                                    Forgot password?
                                </Link>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-white text-black font-bold py-3 rounded-full hover:bg-white/90 transition-all active:scale-95"
                            >
                                Sign in
                            </button>
                        </form>

                        <p className="text-xs text-white/40 text-center pt-4">
                            By signing in, you agree to the{' '}
                            <Link href="#" className="underline text-white/40 hover:text-white/60 transition-colors">
                                Terms of Service
                            </Link>
                            {' '}and{' '}
                            <Link href="#" className="underline text-white/40 hover:text-white/60 transition-colors">
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

