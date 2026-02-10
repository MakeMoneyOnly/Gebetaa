"use client";

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
            className={`w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl shadow-xl text-lg font-black text-white bg-black hover:bg-brand-crimson focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-crimson transition-all active:scale-[0.98] ${pending ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            {pending ? 'Signing In...' : 'Sign In'}
        </button>
    );
}

export default function LoginForm() {
    const [state, formAction] = useFormState(login, initialState);

    return (
        <div className="bg-white py-12 px-8 shadow-apple-lg rounded-[48px] border border-black/5 sm:px-12 backdrop-blur-sm bg-white/95">
            <form action={formAction} className="space-y-8">
                {state?.error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-[13px] font-black border border-red-100/50 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-600 flex-shrink-0" />
                            {state.error}
                        </div>
                    </div>
                )}
                <div className="space-y-2">
                    <label htmlFor="email" className="block text-[10px] font-black text-black/40 uppercase tracking-[0.15em] ml-1">
                        Email Address
                    </label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        className="appearance-none block w-full px-6 py-4.5 bg-surface-1 border border-transparent rounded-[20px] shadow-inner-soft placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-crimson/20 focus:bg-white focus:border-brand-crimson/30 transition-all duration-300 font-bold text-black"
                        placeholder="name@restaurant.com"
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="password" className="block text-[10px] font-black text-black/40 uppercase tracking-[0.15em] ml-1">
                        Password
                    </label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        required
                        className="appearance-none block w-full px-6 py-4.5 bg-surface-1 border border-transparent rounded-[20px] shadow-inner-soft placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-crimson/20 focus:bg-white focus:border-brand-crimson/30 transition-all duration-300 font-bold text-black"
                        placeholder="••••••••"
                    />
                </div>

                <div className="flex items-center justify-between px-1">
                    <div className="flex items-center group cursor-pointer">
                        <input
                            id="remember-me"
                            name="remember-me"
                            type="checkbox"
                            className="h-4.5 w-4.5 text-brand-crimson focus:ring-brand-crimson/20 border-gray-300 rounded-lg transition-colors"
                        />
                        <label htmlFor="remember-me" className="ml-3 block text-xs text-black/60 font-bold group-hover:text-black transition-colors">
                            Stay signed in
                        </label>
                    </div>

                    <div className="text-xs">
                        <Link href="#" className="font-black text-brand-crimson hover:text-black transition-colors uppercase tracking-widest text-[10px]">
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
                        <span className="px-4 bg-white text-black/20 font-black uppercase tracking-[0.2em]">
                            Enterprise Grade Security
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
