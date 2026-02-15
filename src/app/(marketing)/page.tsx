'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CanvasRevealEffect } from '@/components/ui/CanvasRevealEffect';
import { MiniNavbar } from '@/components/ui/MiniNavbar';
import { ArrowRight, QrCode, LayoutDashboard, Smartphone, ChevronRight, UtensilsCrossed } from 'lucide-react';
import { useTheme } from 'next-themes';

export default function LandingPage() {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div className="relative min-h-screen w-full bg-background text-foreground font-manrope selection:bg-brand-crimson/30 selection:text-brand-crimson transition-colors duration-300">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <CanvasRevealEffect
                    animationSpeed={3}
                    containerClassName="bg-transparent"
                    colors={[[168, 24, 24], [168, 24, 24]]}
                    dotSize={6}
                />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--background)_0%,transparent_100%)] opacity-80 dark:opacity-100" />
                <div className="absolute top-0 right-0 left-0 h-1/3 bg-gradient-to-b from-background to-transparent" />
            </div>

            {/* Navbar */}
            <MiniNavbar />

            {/* Main Content */}
            <div className="relative z-10 flex flex-col items-center justify-center min-h-screen pt-32 pb-20 px-4">

                {/* Hero Wrapper */}
                <div className="max-w-4xl mx-auto text-center space-y-8">
                    {/* Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-foreground/5 dark:bg-white/5 backdrop-blur-sm"
                    >
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-crimson opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-crimson"></span>
                        </span>
                        <span className="text-sm font-bold text-foreground/80 dark:text-white/80">Now Live in Ethiopia</span>
                    </motion.div>

                    {/* Headlines */}
                    <div className="space-y-4">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="text-5xl md:text-7xl font-bold tracking-tight text-foreground leading-[1.1]"
                        >
                            The Modern Operating System <br />
                            <span className="opacity-60">for Restaurants</span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="text-lg md:text-xl text-foreground max-w-2xl mx-auto font-medium leading-relaxed opacity-90"
                        >
                            Streamline operations, delight guests, and grow your business with Gebeta's all-in-one platform.
                        </motion.p>
                    </div>

                    {/* CTA Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
                    >
                        <Link href="/demo-table" className="w-full sm:w-auto">
                            <button className="group w-full sm:w-auto flex items-center justify-center gap-2 bg-white dark:bg-white text-black dark:text-black px-8 py-4 rounded-full text-lg font-black transition-all hover:scale-105 active:scale-95 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] dark:shadow-none">
                                Try Demo Menu
                                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                            </button>
                        </Link>
                        <Link href="/auth/login" className="w-full sm:w-auto">
                            <button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white dark:bg-white/10 text-black dark:text-white px-8 py-4 rounded-full text-lg font-black shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] dark:shadow-none transition-all hover:scale-105 active:scale-95">
                                Merchant Login
                            </button>
                        </Link>
                    </motion.div>
                </div>

                {/* Feature Cards - Staggered Grid */}
                <div className="mx-auto mt-32 max-w-7xl w-full px-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                        {/* Card 1 - Normal */}
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            className="group relative overflow-hidden rounded-[2.5rem] bg-white/50 p-8 shadow-xl shadow-black/5 backdrop-blur-md transition-all hover:bg-white/80 dark:bg-white/5 dark:hover:bg-white/10 dark:shadow-none"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-brand-crimson/10 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                            <div className="relative z-10 flex flex-col h-full">
                                <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-crimson/10 text-brand-crimson dark:bg-white/10 dark:text-white transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
                                    <QrCode className="h-8 w-8" />
                                </div>
                                <h3 className="mb-3 text-2xl font-bold tracking-tight text-foreground">
                                    QR Menus
                                </h3>
                                <p className="mb-8 text-lg font-medium leading-relaxed text-foreground/60 text-balance">
                                    Lightning-fast digital menus that load instantly. No app download required for your guests.
                                </p>
                                <div className="mt-auto flex items-center text-sm font-bold uppercase tracking-wider text-brand-crimson">
                                    View Live Demo <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                </div>
                            </div>
                        </motion.div>

                        {/* Card 2 - Offset Down */}
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                            className="group relative mt-0 md:mt-16 overflow-hidden rounded-[2.5rem] bg-white/50 p-8 shadow-xl shadow-black/5 backdrop-blur-md transition-all hover:bg-white/80 dark:bg-white/5 dark:hover:bg-white/10 dark:shadow-none bg-gradient-to-b from-transparent to-black/5 dark:to-white/5"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                            <div className="relative z-10 flex flex-col h-full">
                                <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:bg-white/10 dark:text-white transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3">
                                    <LayoutDashboard className="h-8 w-8" />
                                </div>
                                <h3 className="mb-3 text-2xl font-bold tracking-tight text-foreground">
                                    Command Center
                                </h3>
                                <p className="mb-8 text-lg font-medium leading-relaxed text-foreground/60 text-balance">
                                    Powerful dashboard to manage your entire restaurant operation from a single screen.
                                </p>
                                <div className="mt-auto flex items-center text-sm font-bold uppercase tracking-wider text-amber-600 dark:text-white group-hover:text-amber-700">
                                    Explore Features <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                </div>
                            </div>
                        </motion.div>

                        {/* Card 3 - Normal */}
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
                            className="group relative overflow-hidden rounded-[2.5rem] bg-white/50 p-8 shadow-xl shadow-black/5 backdrop-blur-md transition-all hover:bg-white/80 dark:bg-white/5 dark:hover:bg-white/10 dark:shadow-none"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                            <div className="relative z-10 flex flex-col h-full">
                                <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:bg-white/10 dark:text-white transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
                                    <Smartphone className="h-8 w-8" />
                                </div>
                                <div className="mb-3 flex items-center justify-between">
                                    <h3 className="text-2xl font-bold tracking-tight text-foreground">
                                        Waiter App
                                    </h3>
                                    <span className="rounded-full bg-blue-100 px-3 py-1 text-[10px] font-black uppercase text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                        Coming Soon
                                    </span>
                                </div>
                                <p className="mb-8 text-lg font-medium leading-relaxed text-foreground/60 text-balance">
                                    Dedicated mobile application for your waitstaff to take orders efficiently tableside.
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Footer */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.8 }}
                    className="mt-32 pt-8 border-t border-foreground/10 w-full max-w-7xl flex flex-col md:flex-row items-center justify-between gap-6 text-foreground/40 text-sm"
                >
                    <div className="flex items-center gap-2">
                        <UtensilsCrossed className="w-4 h-4" />
                        <span className="font-bold tracking-tight text-foreground/60">Gebeta</span>
                    </div>
                    <p>© 2026 Gebeta Technology. Built for Ethiopia 🇪🇹</p>
                </motion.div>
            </div>
        </div>
    );
}
