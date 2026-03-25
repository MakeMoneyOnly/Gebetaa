import React from 'react';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { generateAuthMetadata } from '@/lib/seo';

export const metadata = generateAuthMetadata(
    'Login',
    "Staff login for Gebeta Restaurant Platform - Ethiopia's leading restaurant operating system"
);

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
