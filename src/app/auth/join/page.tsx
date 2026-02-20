'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader2, Tablet } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { provisionDevice } from './actions';

function DeviceProvisioningContent() {
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);

    const code = searchParams.get('code');

    // Form State
    const [password, setPassword] = useState('');
    const [deviceName, setDeviceName] = useState('');

    useEffect(() => {
        if (!code) {
            toast.error('Invalid setup link');
            return;
        }
        // Ideally fetch invite details here purely for display
        // For now, we'll infer role from params if available or fetch via server action check
    }, [code]);

    const handleSetup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (!code) throw new Error("No setup code found");

            const result = await provisionDevice({
                code,
                password,
                deviceName: deviceName || `Device-${Math.floor(Math.random() * 1000)}`
            });

            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success('Device Provisioned Successfully!');
                // Instant heavy redirect
                window.location.href = result.redirectTo;
            }
        } catch (err: any) {
            toast.error(err.message || "Setup failed");
        } finally {
            setLoading(false);
        }
    };

    if (!code) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center p-4">
                <div className="text-center space-y-4">
                    <h1 className="text-2xl font-bold text-red-600">Invalid Link</h1>
                    <p className="text-gray-500">This setup link is missing a code.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="mx-auto h-16 w-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                        <Tablet className="h-8 w-8 text-blue-600" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                        Device Setup
                    </h1>
                    <p className="text-sm text-gray-500">
                        Welcome to the team! Identify this device to get started.
                    </p>
                </div>

                <form onSubmit={handleSetup} className="space-y-6">
                    <div className="space-y-4">
                         {/* Device Name Input */}
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Device Name
                            </label>
                            <Input
                                type="text"
                                placeholder="e.g. Kitchen Display 1, Waiter Phone"
                                value={deviceName}
                                onChange={(e) => setDeviceName(e.target.value)}
                                required
                                className="h-12"
                            />
                        </div>

                        {/* Password / Access Code */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Create Access PIN / Password
                            </label>
                            <Input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                className="h-12"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                This will be used to unlock this device session.
                            </p>
                        </div>
                    </div>

                    <Button 
                        type="submit" 
                        disabled={loading}
                        className="w-full h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Provisioning...
                            </>
                        ) : (
                            'Install & Connect'
                        )}
                    </Button>
                </form>

                <p className="text-center text-xs text-gray-400">
                    This device will be linked to your restaurant securely.
                </p>
            </div>
        </div>
    );
}

export default function DeviceProvisioningPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        }>
            <DeviceProvisioningContent />
        </Suspense>
    );
}
