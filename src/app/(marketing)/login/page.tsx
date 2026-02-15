import React from 'react';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Login | Gebeta',
    description: 'Staff login for Gebeta Restaurant Platform',
};

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[url('https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=2874&auto=format&fit=crop')] bg-cover bg-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div className="relative z-10 w-full max-w-md px-4">
                <LoginForm />
            </div>
        </div>
    );
}
