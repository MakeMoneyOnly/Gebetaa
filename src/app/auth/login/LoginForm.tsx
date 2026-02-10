'use client';

import React from 'react';
import Link from 'next/link';
import { useFormState, useFormStatus } from 'react-dom';
import { login } from '../actions';

const initialState = {
    error: null as string | null,
};

function SubmitButton() {
    const { pending } = useFormStatus();

    return (
        <button
            type="submit"
            disabled={pending}
            className={`hover:bg-brand-crimson focus:ring-brand-crimson flex w-full justify-center rounded-2xl border border-transparent bg-black px-4 py-4 text-lg font-black text-white shadow-xl transition-all focus:ring-2 focus:ring-offset-2 focus:outline-none active:scale-[0.98] ${pending ? 'cursor-not-allowed opacity-50' : ''}`}
        >
            {pending ? 'Signing In...' : 'Sign In'}
        </button>
    );
}

export default function LoginForm() {
    const [state, formAction] = useFormState(login, initialState);

    return (
        <div className="shadow-apple-lg rounded-[48px] border border-black/5 bg-white bg-white/95 px-8 py-12 backdrop-blur-sm sm:px-12">
            <form action={formAction} className="space-y-8">
                {state?.error && (
                    <div className="animate-in fade-in slide-in-from-top-4 rounded-2xl border border-red-100/50 bg-red-50 p-4 text-[13px] font-black text-red-600 duration-500">
                        <div className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-600" />
                            {state.error}
                        </div>
                    </div>
                )}
                <div className="space-y-2">
                    <label
                        htmlFor="email"
                        className="ml-1 block text-[10px] font-black tracking-[0.15em] text-black/40 uppercase"
                    >
                        Email Address
                    </label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        className="bg-surface-1 shadow-inner-soft focus:ring-brand-crimson/20 focus:border-brand-crimson/30 block w-full appearance-none rounded-[20px] border border-transparent px-6 py-4.5 font-bold text-black placeholder-gray-400 transition-all duration-300 focus:bg-white focus:ring-2 focus:outline-none"
                        placeholder="name@restaurant.com"
                    />
                </div>

                <div className="space-y-2">
                    <label
                        htmlFor="password"
                        className="ml-1 block text-[10px] font-black tracking-[0.15em] text-black/40 uppercase"
                    >
                        Password
                    </label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        required
                        className="bg-surface-1 shadow-inner-soft focus:ring-brand-crimson/20 focus:border-brand-crimson/30 block w-full appearance-none rounded-[20px] border border-transparent px-6 py-4.5 font-bold text-black placeholder-gray-400 transition-all duration-300 focus:bg-white focus:ring-2 focus:outline-none"
                        placeholder="••••••••"
                    />
                </div>

                <div className="flex items-center justify-between px-1">
                    <div className="group flex cursor-pointer items-center">
                        <input
                            id="remember-me"
                            name="remember-me"
                            type="checkbox"
                            className="text-brand-crimson focus:ring-brand-crimson/20 h-4.5 w-4.5 rounded-lg border-gray-300 transition-colors"
                        />
                        <label
                            htmlFor="remember-me"
                            className="ml-3 block text-xs font-bold text-black/60 transition-colors group-hover:text-black"
                        >
                            Stay signed in
                        </label>
                    </div>

                    <div className="text-xs">
                        <Link
                            href="#"
                            className="text-brand-crimson text-[10px] font-black tracking-widest uppercase transition-colors hover:text-black"
                        >
                            Forgot?
                        </Link>
                    </div>
                </div>

                <div className="pt-2">
                    <SubmitButton />
                </div>
            </form>

            <div className="mt-10">
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-black/[0.03]" />
                    </div>
                    <div className="relative flex justify-center text-[10px]">
                        <span className="bg-white px-4 font-black tracking-[0.2em] text-black/20 uppercase">
                            Enterprise Grade Security
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
