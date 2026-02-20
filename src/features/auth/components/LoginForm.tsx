'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';


export const LoginForm = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    // We instantiate the client here
    const supabase = createClient();
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;
            if (!data.user) throw new Error('No user returned');

            // Fetch role to determine redirection
            // Since we can't use the hook easily inside this async handler for immediate one-off logic,
            // we query manually similar to the hook logic.

            const { data: staffData, error: roleError } = await supabase
                .from('restaurant_staff')
                .select('role')
                .eq('user_id', data.user.id)
                .maybeSingle();

            if (roleError) {
                console.error('Role fetch error:', roleError);
                // Fallback or just go to dashboard and let the guard handle it
                router.push('/merchant');
                return;
            }

            const role = staffData?.role;

            if (role === 'kitchen') {
                router.push('/kds');
            } else if (role === 'waiter') {
                router.push('/staff'); // Future: Staff App
            } else {
                router.push('/merchant'); // Admin/Owner/Manager
            }

        } catch (err: any) {
            setError(err.message || 'Failed to sign in');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-md p-8 bg-surface-0/80 backdrop-blur-xl border border-surface-200 shadow-2xl">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-brand-crimson mb-2">Gebeta</h1>
                <p className="text-text-secondary">Restaurant Operations Platform</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-text-primary">Email</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-3 h-5 w-5 text-text-tertiary" />
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-lg border border-surface-200 bg-surface-50 pl-10 pr-4 py-2.5 text-text-primary focus:border-brand-crimson focus:ring-1 focus:ring-brand-crimson outline-none transition-all"
                            placeholder="name@restaurant.com"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-text-primary">Password</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3 h-5 w-5 text-text-tertiary" />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full rounded-lg border border-surface-200 bg-surface-50 pl-10 pr-12 py-2.5 text-text-primary focus:border-brand-crimson focus:ring-1 focus:ring-brand-crimson outline-none transition-all"
                            placeholder="••••••••"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-3 text-text-tertiary hover:text-text-primary"
                        >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium border border-red-100">
                        {error}
                    </div>
                )}

                <Button
                    type="submit"
                    className="w-full bg-brand-crimson hover:bg-brand-crimson-hover text-white h-12 text-lg font-bold shadow-lg shadow-brand-crimson/20"
                    isLoading={loading}
                >
                    Sign In
                </Button>
            </form>

            <div className="mt-6 text-center">
                <a href="#" className="text-sm text-text-tertiary hover:text-brand-crimson transition-colors">
                    Forgot your password?
                </a>
            </div>
        </Card>
    );
};
