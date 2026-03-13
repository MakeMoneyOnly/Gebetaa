'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, Utensils, Star } from 'lucide-react';
import { motion } from 'framer-motion';

// Register GSAP plugins safely
if (typeof window !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
}

// ----------------------------------------------------------------------
// MAGNETIC BUTTON COMPONENT
// ----------------------------------------------------------------------
function MagneticButton({
    children,
    href,
    variant = 'primary',
    className = '',
}: {
    children: React.ReactNode;
    href: string;
    variant?: 'primary' | 'secondary';
    className?: string;
}) {
    const buttonRef = useRef<HTMLAnchorElement>(null);

    useEffect(() => {
        const btn = buttonRef.current;
        if (!btn) return;

        let ctx = gsap.context(() => {
            btn.addEventListener('mouseenter', () => {
                gsap.to(btn, {
                    scale: 1.03,
                    y: -1,
                    duration: 0.4,
                    ease: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                });
            });

            btn.addEventListener('mouseleave', () => {
                gsap.to(btn, {
                    scale: 1,
                    y: 0,
                    duration: 0.4,
                    ease: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                });
            });
        }, btn);

        return () => ctx.revert();
    }, []);

    const baseStyles =
        'relative overflow-hidden inline-flex items-center justify-center rounded-full px-8 py-4 font-inter font-medium transition-colors outline-none focus-visible:ring-4 focus-visible:ring-Ember/20';
    const primaryStyles = 'bg-Ember text-white hover:bg-Ember-dark';
    const secondaryStyles = 'bg-white text-Charcoal hover:text-Ember';

    return (
        <Link
            ref={buttonRef}
            href={href}
            className={`${baseStyles} ${variant === 'primary' ? primaryStyles : secondaryStyles} ${className}`}
        >
            <span className="relative z-10 flex items-center gap-2">{children}</span>
        </Link>
    );
}

export default function LandingPage() {
    const containerRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Hero Animation (Handled by Framer Motion)

            // Features ScrollTrigger
            const featureSections = gsap.utils.toArray('.feature-card');
            featureSections.forEach((card: any) => {
                gsap.fromTo(
                    card,
                    { y: 60, opacity: 0 },
                    {
                        y: 0,
                        opacity: 1,
                        duration: 1,
                        ease: 'power3.out',
                        scrollTrigger: {
                            trigger: card,
                            start: 'top 85%',
                        },
                    }
                );
            });
        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <main
            ref={containerRef}
            className="bg-Cream font-inter selection:bg-Ember min-h-screen selection:text-white"
        >
            {/* NOISE OVERLAY */}
            <svg
                className="pointer-events-none fixed z-[9999] opacity-[0.04]"
                width="100%"
                height="100%"
            >
                <filter id="noiseFilter">
                    <feTurbulence
                        type="fractalNoise"
                        baseFrequency="0.8"
                        numOctaves="3"
                        stitchTiles="stitch"
                    />
                </filter>
                <rect width="100%" height="100%" filter="url(#noiseFilter)" />
            </svg>

            {/* NAVBAR: The Floating Ember */}
            <Navbar />

            {/* HERO SECTION: The Redesigned Landing */}
            <section className="relative flex min-h-screen justify-center overflow-hidden bg-white">
                {/* Hero Background Video */}
                <div className="absolute inset-0 z-0 h-full w-full bg-white">
                    <video
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="h-full w-full [transform:scaleY(-1)] object-cover"
                        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260302_085640_276ea93b-d7da-4418-a09b-2aa5b490e838.mp4"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-[rgba(255,255,255,0)] from-[26.416%] to-white to-[66.943%]" />
                </div>

                {/* Main Content Container */}
                <div className="relative z-20 flex w-full max-w-[1200px] flex-col items-center gap-[32px] px-6 pt-[290px] text-center">
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="font-geist text-Charcoal flex flex-col items-center gap-x-4 text-5xl leading-[1.1] font-medium tracking-[-0.04em] md:flex-row md:flex-wrap md:justify-center md:text-[80px]"
                    >
                        <span>Seamless</span>
                        <span className="font-instrument text-Ember text-[70px] leading-none font-normal italic md:text-[100px]">
                            management
                        </span>
                        <span className="w-full text-center md:mt-2">for your restaurant</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                        className="font-geist max-w-[554px] text-[18px] text-[#373a46] opacity-80"
                    >
                        From order to payment, manage your entire operation with one powerful
                        platform. Built for Ethiopia.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="flex w-full max-w-lg flex-col items-center pb-24"
                    >
                        {/* Email Navbar Container */}
                        <div className="flex w-full items-center justify-between rounded-[40px] border border-gray-200 bg-[#fcfcfc] p-2 shadow-[0px_10px_40px_5px_rgba(194,194,194,0.25)]">
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="font-geist text-Charcoal ml-4 w-full bg-transparent text-[15px] placeholder:text-[#888] focus:outline-none"
                            />
                            <button className="font-geist rounded-[30px] bg-gradient-to-b from-[#2a2a2a] to-[#121212] px-6 py-3 text-sm font-medium whitespace-nowrap text-white shadow-[inset_-4px_-6px_25px_0px_rgba(201,201,201,0.08),inset_4px_4px_10px_0px_rgba(29,29,29,0.24)] transition-transform hover:scale-[1.02]">
                                Create Free Account
                            </button>
                        </div>

                        {/* Social Proof */}
                        <div className="mt-8 flex flex-col items-center gap-3">
                            <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <Star
                                        key={i}
                                        className="h-5 w-5 fill-[#FFB800] text-[#FFB800]"
                                    />
                                ))}
                            </div>
                            <span className="font-geist text-[13px] font-semibold text-[#666]">
                                1,020+ Reviews
                            </span>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* FEATURES SECTION: Interactive Functional Artifacts */}
            <section className="bg-Cream relative z-20 -mt-8 rounded-t-[3rem] px-6 py-32 sm:px-12 lg:px-24">
                <div className="mx-auto max-w-7xl">
                    <div className="mb-24 flex flex-col gap-4 text-center">
                        <h2 className="font-jetbrains text-Ember text-sm tracking-widest uppercase">
                            The Complete OS
                        </h2>
                        <h3 className="font-jakarta text-Charcoal text-4xl font-bold tracking-tight sm:text-6xl">
                            Function designed with{' '}
                            <span className="font-playfair font-normal italic">intent.</span>
                        </h3>
                    </div>

                    <div className="grid gap-8 lg:grid-cols-3">
                        {/* CARD 1: Order Flow Shuffler */}
                        <div className="feature-card group border-Slate/5 rounded-[2rem] border bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)]">
                            <div className="bg-Cream/50 relative mb-12 flex h-64 flex-col justify-center overflow-hidden rounded-xl p-6">
                                <OrderShuffler />
                            </div>
                            <h4 className="font-jakarta text-Charcoal mt-8 mb-4 text-2xl font-bold">
                                Built for Ethiopia
                            </h4>
                            <p className="font-inter text-Slate">
                                Telebirr, Chapa, and local payment methods. Amharic and English.
                                Designed for how Ethiopian restaurants actually work.
                            </p>
                        </div>

                        {/* CARD 2: Live Kitchen Telemetry */}
                        <div className="feature-card group border-Slate/5 bg-Charcoal rounded-[2rem] border p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)]">
                            <div className="relative mb-12 h-64 overflow-hidden rounded-xl bg-[#0a0f18] p-6">
                                <div className="absolute top-4 right-4 flex items-center gap-2">
                                    <span className="relative flex h-2 w-2">
                                        <span className="bg-Success absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"></span>
                                        <span className="bg-Success relative inline-flex h-2 w-2 rounded-full"></span>
                                    </span>
                                    <span className="font-jetbrains text-Success text-[10px] tracking-wider uppercase">
                                        Live Feed
                                    </span>
                                </div>
                                <TelemetryFeed />
                            </div>
                            <h4 className="font-jakarta mt-8 mb-4 text-2xl font-bold text-white">
                                Offline-First Reliability
                            </h4>
                            <p className="font-inter text-Slate-300 text-gray-400">
                                Keep working even when the internet doesn't. Every order queues
                                locally and syncs automatically when you're back online.
                            </p>
                        </div>

                        {/* CARD 3: Command Scheduler */}
                        <div className="feature-card group border-Slate/5 rounded-[2rem] border bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)]">
                            <div className="bg-Cream/50 relative mb-12 flex h-64 cursor-default items-center justify-center overflow-hidden rounded-xl p-6">
                                <CommandScheduler />
                            </div>
                            <h4 className="font-jakarta text-Charcoal mt-8 mb-4 text-2xl font-bold">
                                Complete Restaurant OS
                            </h4>
                            <p className="font-inter text-Slate">
                                QR ordering, kitchen display, payments, analytics, and staff
                                management — all in one unified platform.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* PHILOSOPHY SECTION: The Manifesto */}
            <section className="bg-Charcoal relative overflow-hidden rounded-t-[3rem] px-6 py-32 text-center sm:px-12 lg:px-24">
                <div className="relative z-10 mx-auto max-w-4xl">
                    <Utensils className="text-Ember mx-auto mb-12 h-12 w-12 opacity-80" />
                    <h2 className="font-playfair text-Ember-light text-4xl leading-tight italic sm:text-6xl lg:text-7xl">
                        "The heartbeat of Addis, synchronized for the digital era."
                    </h2>
                    <p className="font-inter text-Slate-300 mx-auto mt-12 max-w-2xl text-lg text-gray-400">
                        We believe technology should amplify hospitality, not replace it. Gebeta
                        provides the foundation for your team to focus on what matters most — the
                        food and the guest.
                    </p>
                    <div className="mt-16">
                        <MagneticButton
                            href="/auth/signup"
                            variant="primary"
                            className="!text-Charcoal hover:!text-Ember !bg-white"
                        >
                            Join the Platform
                        </MagneticButton>
                    </div>
                </div>

                {/* Decorative background glow */}
                <div className="bg-Ember-dark/30 pointer-events-none absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]" />
            </section>

            {/* FOOTER */}
            <footer className="bg-Charcoal border-t border-white/5 px-6 py-12 sm:px-12 lg:px-24">
                <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">
                    <p className="font-jakarta text-xl font-bold text-white">
                        Gebeta<span className="text-Ember">.</span>
                    </p>
                    <div className="font-inter flex gap-8 text-sm text-gray-400">
                        <Link href="/terms" className="transition-colors hover:text-white">
                            Terms of Service
                        </Link>
                        <Link href="/privacy" className="transition-colors hover:text-white">
                            Privacy Policy
                        </Link>
                        <Link href="/contact" className="transition-colors hover:text-white">
                            Contact
                        </Link>
                    </div>
                    <p className="font-inter text-sm text-gray-500">
                        © {new Date().getFullYear()} Gebeta Inc. Addis Ababa.
                    </p>
                </div>
            </footer>
        </main>
    );
}

// ----------------------------------------------------------------------
// FLOATING NAVBAR
// ----------------------------------------------------------------------
function Navbar() {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 100);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <header className="fixed top-0 right-0 left-0 z-50 flex w-full justify-center px-6 pt-6">
            <nav
                className={`flex w-full max-w-5xl items-center justify-between rounded-full px-6 py-4 transition-all duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] ${scrolled ? 'bg-Cream/90 border-Slate/10 border shadow-[0_8px_30px_rgb(0,0,0,0.08)] backdrop-blur-xl' : 'bg-transparent'}`}
            >
                <div className="flex items-center gap-3">
                    <span className="font-jakarta text-Ember text-2xl font-bold">Gebeta</span>
                </div>

                <div className="font-inter hidden items-center gap-8 text-sm font-medium md:flex">
                    <Link
                        href="#features"
                        className={`hover:text-Ember transition-colors ${scrolled ? 'text-Charcoal' : 'text-Ember/70'}`}
                    >
                        Features
                    </Link>
                    <Link
                        href="#pricing"
                        className={`hover:text-Ember transition-colors ${scrolled ? 'text-Charcoal' : 'text-Ember/70'}`}
                    >
                        Pricing
                    </Link>
                    <Link
                        href="#about"
                        className={`hover:text-Ember transition-colors ${scrolled ? 'text-Charcoal' : 'text-Ember/70'}`}
                    >
                        About
                    </Link>
                </div>

                <div className="flex items-center gap-4">
                    <Link
                        href="/auth/login"
                        className={`font-inter text-sm font-medium transition-colors hover:opacity-75 ${scrolled ? 'text-Charcoal' : 'text-Ember/70'}`}
                    >
                        Sign In
                    </Link>
                    <MagneticButton
                        href="/auth/signup"
                        variant="primary"
                        className="!px-6 !py-2.5 !text-sm"
                    >
                        Start Free Trial
                    </MagneticButton>
                </div>
            </nav>
        </header>
    );
}

// ----------------------------------------------------------------------
// FEATURE INTERACTIONS
// ----------------------------------------------------------------------

function OrderShuffler() {
    const shufflerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Logic for a continuous spring bounce 3-card stack swap
            const tl = gsap.timeline({ repeat: -1 });

            // Using simple stagger or repeating transitions to simulate card shuffling
            tl.to(
                '.shuffle-card-1',
                {
                    y: -10,
                    scale: 0.95,
                    opacity: 0.6,
                    duration: 1,
                    ease: 'back.out(1.7)',
                    zIndex: 1,
                },
                '+=2'
            );
            tl.to(
                '.shuffle-card-2',
                {
                    y: 0,
                    scale: 1,
                    opacity: 1,
                    duration: 1,
                    ease: 'back.out(1.7)',
                    zIndex: 3,
                },
                '<'
            );
            tl.to(
                '.shuffle-card-3',
                {
                    y: 10,
                    scale: 0.9,
                    opacity: 0.4,
                    duration: 1,
                    ease: 'back.out(1.7)',
                    zIndex: 0,
                },
                '<'
            );

            tl.to(
                '.shuffle-card-2',
                {
                    y: -10,
                    scale: 0.95,
                    opacity: 0.6,
                    duration: 1,
                    ease: 'back.out(1.7)',
                    zIndex: 1,
                },
                '+=2'
            );
            tl.to(
                '.shuffle-card-3',
                {
                    y: 0,
                    scale: 1,
                    opacity: 1,
                    duration: 1,
                    ease: 'back.out(1.7)',
                    zIndex: 3,
                },
                '<'
            );
            tl.to(
                '.shuffle-card-1',
                {
                    y: 10,
                    scale: 0.9,
                    opacity: 0.4,
                    duration: 1,
                    ease: 'back.out(1.7)',
                    zIndex: 0,
                },
                '<'
            );

            tl.to(
                '.shuffle-card-3',
                {
                    y: -10,
                    scale: 0.95,
                    opacity: 0.6,
                    duration: 1,
                    ease: 'back.out(1.7)',
                    zIndex: 1,
                },
                '+=2'
            );
            tl.to(
                '.shuffle-card-1',
                {
                    y: 0,
                    scale: 1,
                    opacity: 1,
                    duration: 1,
                    ease: 'back.out(1.7)',
                    zIndex: 3,
                },
                '<'
            );
            tl.to(
                '.shuffle-card-2',
                {
                    y: 10,
                    scale: 0.9,
                    opacity: 0.4,
                    duration: 1,
                    ease: 'back.out(1.7)',
                    zIndex: 0,
                },
                '<'
            );
        }, shufflerRef);
        return () => ctx.revert();
    }, []);

    return (
        <div ref={shufflerRef} className="relative flex h-full w-full items-center justify-center">
            {/* Card 1 */}
            <div
                className="shuffle-card-1 border-Slate/10 absolute w-full max-w-xs rounded-xl border bg-white p-4 shadow-sm"
                style={{ zIndex: 3 }}
            >
                <div className="mb-2 flex items-center justify-between">
                    <span className="font-jakarta text-Charcoal text-sm font-bold">Table 5</span>
                    <span className="bg-Ember/10 text-Ember rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase">
                        Preparing
                    </span>
                </div>
                <div className="font-inter text-Slate flex flex-col gap-1 text-xs">
                    <span>2x Special Firfir</span>
                    <span>1x Tej</span>
                </div>
            </div>
            {/* Card 2 */}
            <div
                className="shuffle-card-2 border-Slate/10 absolute w-full max-w-xs rounded-xl border bg-white p-4 shadow-sm"
                style={{ y: -10, scale: 0.95, opacity: 0.6, zIndex: 1 }}
            >
                <div className="mb-2 flex items-center justify-between">
                    <span className="font-jakarta text-Charcoal text-sm font-bold">Delivery</span>
                    <span className="bg-Success/10 text-Success rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase">
                        Ready
                    </span>
                </div>
                <div className="font-inter text-Slate flex flex-col gap-1 text-xs">
                    <span>1x Doro Wot</span>
                    <span>2x Injera</span>
                </div>
            </div>
            {/* Card 3 */}
            <div
                className="shuffle-card-3 border-Slate/10 absolute w-full max-w-xs rounded-xl border bg-white p-4 shadow-sm"
                style={{ y: 10, scale: 0.9, opacity: 0.4, zIndex: 0 }}
            >
                <div className="mb-2 flex items-center justify-between">
                    <span className="font-jakarta text-Charcoal text-sm font-bold">Table 12</span>
                    <span className="bg-Slate/10 text-Charcoal rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase">
                        New
                    </span>
                </div>
                <div className="font-inter text-Slate flex flex-col gap-1 text-xs">
                    <span>3x Macchiato</span>
                </div>
            </div>
        </div>
    );
}

function TelemetryFeed() {
    const logs = [
        '[14:32:05] Order #1847 received — Table 8',
        '[14:32:07] Kitchen acknowledged — ETA 12min',
        '[14:32:15] Order #1848 received — Delivery',
        '[14:32:18] Payment confirmed — Telebirr — 450 ETB',
        '[14:32:22] Order #1847 preparing...',
    ];
    const [visibleLines, setVisibleLines] = useState<string[]>([]);
    const [currentLineIndex, setCurrentLineIndex] = useState(0);
    const [currentCharacterIndex, setCurrentCharacterIndex] = useState(0);

    useEffect(() => {
        if (currentLineIndex >= logs.length) return;

        const currentFullLine = logs[currentLineIndex];

        if (currentCharacterIndex < currentFullLine.length) {
            const timeout = setTimeout(
                () => {
                    setCurrentCharacterIndex(prev => prev + 1);
                },
                30 + Math.random() * 40
            ); // Random typing delay
            return () => clearTimeout(timeout);
        } else {
            const timeout = setTimeout(() => {
                setVisibleLines(prev => [...prev, currentFullLine]);
                setCurrentLineIndex(prev => prev + 1);
                setCurrentCharacterIndex(0);
            }, 1000); // Wait before next line
            return () => clearTimeout(timeout);
        }
    }, [currentLineIndex, currentCharacterIndex, logs]);

    return (
        <div className="font-jetbrains text-Slate-300 h-full w-full pt-6 text-xs">
            <div className="flex flex-col gap-2">
                {visibleLines.map((line, i) => (
                    <div key={i} className="text-gray-400">
                        {line}
                    </div>
                ))}
                {currentLineIndex < logs.length && (
                    <div className="text-white">
                        {logs[currentLineIndex].substring(0, currentCharacterIndex)}
                        <span className="text-Ember animate-pulse">_</span>
                    </div>
                )}
            </div>
        </div>
    );
}

function CommandScheduler() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            const tl = gsap.timeline({ repeat: -1, repeatDelay: 1 });

            // Cursor enters
            tl.fromTo(
                '.anim-cursor',
                { x: -50, y: 150, opacity: 0 },
                { x: 40, y: 40, opacity: 1, duration: 1, ease: 'power2.out' }
            )
                // Clicks Day cell
                .to('.anim-cursor', { scale: 0.8, duration: 0.1 })
                .to(
                    '.anim-day-tue',
                    {
                        backgroundColor: '#FDF2F2',
                        borderColor: '#A81818',
                        color: '#A81818',
                        duration: 0.2,
                    },
                    '<'
                )
                .to('.anim-cursor', { scale: 1, duration: 0.1 })
                // Moves to Save
                .to(
                    '.anim-cursor',
                    { x: 140, y: 110, duration: 0.8, ease: 'power2.inOut' },
                    '+=0.3'
                )
                // Clicks Save
                .to('.anim-cursor', { scale: 0.8, duration: 0.1 })
                .to('.anim-save-btn', { scale: 0.95, duration: 0.1 }, '<')
                .to('.anim-cursor', { scale: 1, duration: 0.1 })
                .to('.anim-save-btn', { scale: 1, duration: 0.1 }, '<')
                // Fade out
                .to('.anim-cursor', { opacity: 0, duration: 0.5 }, '+=0.5')
                .to(
                    '.anim-day-tue',
                    {
                        backgroundColor: '#ffffff',
                        borderColor: 'transparent',
                        color: '#111827',
                        duration: 0.5,
                    },
                    '<'
                ); // reset day
        }, containerRef);
        return () => ctx.revert();
    }, []);

    return (
        <div
            ref={containerRef}
            className="border-Slate/10 relative w-full max-w-[240px] rounded-xl border bg-white p-4 shadow-sm"
        >
            <h5 className="font-jakarta text-Charcoal mb-4 text-xs font-bold">Weekly Schedule</h5>
            <div className="grid grid-cols-5 gap-2">
                {['M', 'T', 'W', 'T', 'F'].map((day, i) => (
                    <div
                        key={i}
                        className={`font-inter flex aspect-square items-center justify-center rounded-lg border border-transparent text-xs font-medium ${day === 'T' && i === 1 ? 'anim-day-tue text-Charcoal' : 'text-Slate'}`}
                    >
                        {day}
                    </div>
                ))}
            </div>
            <div className="mt-4 flex justify-end">
                <div className="anim-save-btn border-Slate/10 bg-Charcoal font-inter rounded border px-4 py-1.5 text-[10px] font-bold tracking-wider text-white uppercase">
                    Save
                </div>
            </div>

            {/* SVG Cursor */}
            <div className="anim-cursor absolute top-0 left-0 z-50 drop-shadow-md">
                <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M5.5 3.21V20.8C5.5 21.46 6.27 21.82 6.77 21.4L11.43 17.5C11.62 17.34 11.85 17.26 12.1 17.26H18H18.5C19.05 17.26 19.5 16.81 19.5 16.26V16.03C19.5 15.68 19.33 15.35 19.04 15.16L6.54 2.66C6.01 2.13 5.5 2.5 5.5 3.21Z"
                        fill="#111827"
                        stroke="white"
                        strokeWidth="1.5"
                    />
                </svg>
            </div>
        </div>
    );
}
