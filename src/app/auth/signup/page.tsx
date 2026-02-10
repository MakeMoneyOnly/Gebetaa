'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { CanvasRevealEffect } from '@/components/ui/CanvasRevealEffect';
import { MiniNavbar } from '@/components/ui/MiniNavbar';

interface SignUpPageProps {
    className?: string;
}

export default function SignUpPage({ className }: SignUpPageProps) {
    const [email, setEmail] = useState('');
    const [step, setStep] = useState<'email' | 'code' | 'success'>('email');
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const codeInputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const [initialCanvasVisible, setInitialCanvasVisible] = useState(true);
    const [reverseCanvasVisible, setReverseCanvasVisible] = useState(false);

    const handleEmailSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (email) {
            setStep('code');
        }
    };

    useEffect(() => {
        if (step === 'code') {
            setTimeout(() => {
                codeInputRefs.current[0]?.focus();
            }, 500);
        }
    }, [step]);

    const handleCodeChange = (index: number, value: string) => {
        if (value.length <= 1) {
            const newCode = [...code];
            newCode[index] = value;
            setCode(newCode);

            if (value && index < 5) {
                codeInputRefs.current[index + 1]?.focus();
            }

            if (index === 5 && value) {
                const isComplete = newCode.every(digit => digit.length === 1);
                if (isComplete) {
                    setReverseCanvasVisible(true);

                    setTimeout(() => {
                        setInitialCanvasVisible(false);
                    }, 50);

                    setTimeout(() => {
                        setStep('success');
                    }, 2000);
                }
            }
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            codeInputRefs.current[index - 1]?.focus();
        }
    };

    const handleBackClick = () => {
        setStep('email');
        setCode(['', '', '', '', '', '']);
        setReverseCanvasVisible(false);
        setInitialCanvasVisible(true);
    };

    return (
        <div className={cn('relative flex min-h-screen w-[100%] flex-col bg-black', className)}>
            <div className="absolute inset-0 z-0">
                {initialCanvasVisible && (
                    <div className="absolute inset-0">
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
                    </div>
                )}

                {reverseCanvasVisible && (
                    <div className="absolute inset-0">
                        <CanvasRevealEffect
                            animationSpeed={4}
                            containerClassName="bg-black"
                            colors={[
                                [168, 24, 24],
                                [168, 24, 24],
                            ]}
                            dotSize={6}
                            reverse={true}
                        />
                    </div>
                )}

                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,0,0,1)_0%,_transparent_100%)]" />
                <div className="absolute top-0 right-0 left-0 h-1/3 bg-gradient-to-b from-black to-transparent" />
            </div>

            <div className="relative z-10 flex flex-1 flex-col">
                <MiniNavbar />

                <div className="flex flex-1 flex-col lg:flex-row">
                    <div className="flex flex-1 flex-col items-center justify-center">
                        <div className="mt-[150px] w-full max-w-sm">
                            <AnimatePresence mode="wait">
                                {step === 'email' ? (
                                    <motion.div
                                        key="email-step"
                                        initial={{ opacity: 0, x: -100 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -100 }}
                                        transition={{ duration: 0.4, ease: 'easeOut' }}
                                        className="space-y-6 text-center"
                                    >
                                        <div className="space-y-1">
                                            <h1 className="text-[2.5rem] leading-[1.1] font-bold tracking-tight text-white">
                                                Welcome to Gebeta
                                            </h1>
                                            <p className="text-[1.8rem] font-light text-white/70">
                                                Create your account
                                            </p>
                                        </div>

                                        <div className="space-y-4">
                                            <button className="flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-white backdrop-blur-[2px] transition-colors hover:bg-white/10">
                                                <span className="text-lg">G</span>
                                                <span>Sign up with Google</span>
                                            </button>

                                            <div className="flex items-center gap-4">
                                                <div className="h-px flex-1 bg-white/10" />
                                                <span className="text-sm text-white/40">or</span>
                                                <div className="h-px flex-1 bg-white/10" />
                                            </div>

                                            <form onSubmit={handleEmailSubmit}>
                                                <div className="relative">
                                                    <input
                                                        type="email"
                                                        placeholder="info@gmail.com"
                                                        value={email}
                                                        onChange={e => setEmail(e.target.value)}
                                                        className="w-full rounded-full border-1 border-white/10 bg-white/5 px-4 py-3 text-center text-white backdrop-blur-[1px] focus:border focus:border-white/30 focus:outline-none"
                                                        required
                                                    />
                                                    <button
                                                        type="submit"
                                                        className="group absolute top-1.5 right-1.5 flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                                                    >
                                                        <span className="relative block h-full w-full overflow-hidden">
                                                            <span className="absolute inset-0 flex items-center justify-center transition-transform duration-300 group-hover:translate-x-full">
                                                                →
                                                            </span>
                                                            <span className="absolute inset-0 flex -translate-x-full items-center justify-center transition-transform duration-300 group-hover:translate-x-0">
                                                                →
                                                            </span>
                                                        </span>
                                                    </button>
                                                </div>
                                            </form>
                                        </div>

                                        <p className="pt-10 text-xs text-white/40">
                                            By signing up, you agree to the{' '}
                                            <Link
                                                href="#"
                                                className="text-white/40 underline transition-colors hover:text-white/60"
                                            >
                                                Terms of Service
                                            </Link>
                                            ,{' '}
                                            <Link
                                                href="#"
                                                className="text-white/40 underline transition-colors hover:text-white/60"
                                            >
                                                Privacy Policy
                                            </Link>
                                            , and{' '}
                                            <Link
                                                href="#"
                                                className="text-white/40 underline transition-colors hover:text-white/60"
                                            >
                                                Cookie Notice
                                            </Link>
                                            .
                                        </p>
                                    </motion.div>
                                ) : step === 'code' ? (
                                    <motion.div
                                        key="code-step"
                                        initial={{ opacity: 0, x: 100 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 100 }}
                                        transition={{ duration: 0.4, ease: 'easeOut' }}
                                        className="space-y-6 text-center"
                                    >
                                        <div className="space-y-1">
                                            <h1 className="text-[2.5rem] leading-[1.1] font-bold tracking-tight text-white">
                                                We sent you a code
                                            </h1>
                                            <p className="text-[1.25rem] font-light text-white/50">
                                                Please enter it
                                            </p>
                                        </div>

                                        <div className="w-full">
                                            <div className="relative rounded-full border border-white/10 bg-transparent px-5 py-4">
                                                <div className="flex items-center justify-center">
                                                    {code.map((digit, i) => (
                                                        <div key={i} className="flex items-center">
                                                            <div className="relative">
                                                                <input
                                                                    ref={el => {
                                                                        codeInputRefs.current[i] =
                                                                            el;
                                                                    }}
                                                                    type="text"
                                                                    inputMode="numeric"
                                                                    pattern="[0-9]*"
                                                                    maxLength={1}
                                                                    value={digit}
                                                                    onChange={e =>
                                                                        handleCodeChange(
                                                                            i,
                                                                            e.target.value
                                                                        )
                                                                    }
                                                                    onKeyDown={e =>
                                                                        handleKeyDown(i, e)
                                                                    }
                                                                    className="w-8 appearance-none border-none bg-transparent text-center text-xl text-white focus:ring-0 focus:outline-none"
                                                                    style={{
                                                                        caretColor: 'transparent',
                                                                    }}
                                                                />
                                                                {!digit && (
                                                                    <div className="pointer-events-none absolute top-0 left-0 flex h-full w-full items-center justify-center">
                                                                        <span className="text-xl text-white">
                                                                            0
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {i < 5 && (
                                                                <span className="text-xl text-white/20">
                                                                    |
                                                                </span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <motion.p
                                                className="cursor-pointer text-sm text-white/50 transition-colors hover:text-white/70"
                                                whileHover={{ scale: 1.02 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                Resend code
                                            </motion.p>
                                        </div>

                                        <div className="flex w-full gap-3">
                                            <motion.button
                                                onClick={handleBackClick}
                                                className="w-[30%] rounded-full bg-white px-8 py-3 font-medium text-black transition-colors hover:bg-white/90"
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                Back
                                            </motion.button>
                                            <motion.button
                                                className={`flex-1 rounded-full border py-3 font-medium transition-all duration-300 ${
                                                    code.every(d => d !== '')
                                                        ? 'cursor-pointer border-transparent bg-white text-black hover:bg-white/90'
                                                        : 'cursor-not-allowed border-white/10 bg-[#111] text-white/50'
                                                }`}
                                                disabled={!code.every(d => d !== '')}
                                            >
                                                Continue
                                            </motion.button>
                                        </div>

                                        <div className="pt-16">
                                            <p className="text-xs text-white/40">
                                                By signing up, you agree to the{' '}
                                                <Link
                                                    href="#"
                                                    className="text-white/40 underline transition-colors hover:text-white/60"
                                                >
                                                    Terms of Service
                                                </Link>
                                                ,{' '}
                                                <Link
                                                    href="#"
                                                    className="text-white/40 underline transition-colors hover:text-white/60"
                                                >
                                                    Privacy Policy
                                                </Link>
                                                , and{' '}
                                                <Link
                                                    href="#"
                                                    className="text-white/40 underline transition-colors hover:text-white/60"
                                                >
                                                    Cookie Notice
                                                </Link>
                                                .
                                            </p>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="success-step"
                                        initial={{ opacity: 0, y: 50 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.4, ease: 'easeOut', delay: 0.3 }}
                                        className="space-y-6 text-center"
                                    >
                                        <div className="space-y-1">
                                            <h1 className="text-[2.5rem] leading-[1.1] font-bold tracking-tight text-white">
                                                You&apos;re in!
                                            </h1>
                                            <p className="text-[1.25rem] font-light text-white/50">
                                                Welcome to Gebeta
                                            </p>
                                        </div>

                                        <motion.div
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{ duration: 0.5, delay: 0.5 }}
                                            className="py-10"
                                        >
                                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-white to-white/70">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-8 w-8 text-black"
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            </div>
                                        </motion.div>

                                        <motion.button
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 1 }}
                                            className="w-full rounded-full bg-white py-3 font-medium text-black transition-colors hover:bg-white/90"
                                        >
                                            Continue to Dashboard
                                        </motion.button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
