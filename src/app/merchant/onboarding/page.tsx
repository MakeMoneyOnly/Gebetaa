'use client';

import React from 'react';
import Link from 'next/link';

export default function OnboardingPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-gray-100 p-10 text-center">
                <div className="h-20 w-20 bg-black rounded-3xl mx-auto flex items-center justify-center text-white text-3xl mb-8 shadow-lg">
                    ✨
                </div>
                <h1 className="text-3xl font-extrabold text-black mb-3 tracking-tight">Welcome to Gebeta</h1>
                <p className="text-gray-500 mb-10 leading-relaxed font-medium">Let's set up your restaurant in under 3 minutes.</p>

                <div className="space-y-4">
                    <Link href="/merchant/onboarding/step1" className="block w-full bg-black text-white px-6 py-4 rounded-2xl font-bold text-lg hover:bg-gray-800 transition-all shadow-lg shadow-black/20 hover:-translate-y-1">
                        Start Setup
                    </Link>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-4">Takes ~3 minutes</p>
                </div>
            </div>

            <p className="fixed bottom-8 text-gray-400 text-xs font-medium">© 2026 Gebeta Inc.</p>
        </div>
    );
}
