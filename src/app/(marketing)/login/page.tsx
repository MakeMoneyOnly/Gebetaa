import React from 'react';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Login | Gebeta',
    description: 'Staff login for Gebeta Restaurant Platform',
};

export default function LoginPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-[url('/splash-bg-opt.webp')] bg-cover bg-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div className="relative z-10 w-full max-w-md px-4">
                <LoginForm />
            </div>
        </div>
    );
}
