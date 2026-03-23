'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Bell, CreditCard, Loader2, Lock, Save, Shield, Sparkles, Crown, Star } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { PaymentAccountsSettingsPanel } from '@/components/merchant/PaymentAccountsSettingsPanel';
import { PlanPricing, FeatureDescriptions, getNextPlan } from '@/lib/subscription/plan-types';
import type { PlanLevel } from '@/lib/subscription/plan-types';

type SecuritySettings = {
    require_mfa: boolean;
    session_timeout_minutes: number;
    allowed_ip_ranges: string[];
    alert_on_suspicious_login: boolean;
};

type NotificationSettings = {
    email_enabled: boolean;
    sms_enabled: boolean;
    in_app_enabled: boolean;
    escalation_enabled: boolean;
    escalation_minutes: number;
};

type PaymentSettings = {
    provider: 'chapa';
    provider_available: boolean;
    settlement_bank_code: string;
    settlement_bank_name: string;
    settlement_account_name: string;
    settlement_account_number_masked: string;
    settlement_status: string;
    subaccount_id: string | null;
    last_error: string | null;
    provisioned_at: string | null;
    hosted_checkout_fee_percentage: number;
};

type PlanSettings = {
    plan: PlanLevel;
    plan_expires_at: string | null;
    plan_tier: number;
};

type BankOption = {
    id: string;
    name: string;
    code: string;
};

type SettingsClientProps = {
    security: SecuritySettings;
    notifications: NotificationSettings;
    payments: PaymentSettings;
    plan: PlanSettings;
    banks: BankOption[];
    directoryUnavailable: boolean;
};

export function SettingsClient({
    security: initialSecurity,
    notifications: initialNotifications,
    payments: initialPayments,
    plan: initialPlan,
    banks: initialBanks,
    directoryUnavailable: initialDirectoryUnavailable,
}: SettingsClientProps) {
    const [activeTab, setActiveTab] = useState<'security' | 'notifications' | 'payments' | 'plan'>(
        'security'
    );
    const [saving, setSaving] = useState(false);
    const [security, setSecurity] = useState<SecuritySettings>(initialSecurity);
    const [notifications, setNotifications] = useState<NotificationSettings>(initialNotifications);
    const [ipRangesText, setIpRangesText] = useState(
        (initialSecurity.allowed_ip_ranges ?? []).join('\n')
    );

    // Lift payment settings state so it survives PaymentAccountsSettingsPanel unmount/remount on tab switch
    const [currentPayments, setCurrentPayments] = useState<PaymentSettings>(initialPayments);

    // Plan state
    const [currentPlan, setCurrentPlan] = useState<PlanSettings>(initialPlan);

    // Re-fetch persisted payment settings from the server
    const refreshPayments = useCallback(async () => {
        try {
            const response = await fetch('/api/settings/payments', { cache: 'no-store' });
            if (!response.ok) return;
            const payload = await response.json();
            const fresh = payload?.data as PaymentSettings | undefined;
            if (fresh) {
                setCurrentPayments(fresh);
            }
        } catch {
            // Silently ignore — user sees last-known state
        }
    }, []);

    // Refresh payment settings when the browser tab regains focus
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                void refreshPayments();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [refreshPayments]);

    const saveSecurity = async () => {
        try {
            setSaving(true);
            const payload = {
                ...security,
                allowed_ip_ranges: ipRangesText
                    .split('\n')
                    .map(line => line.trim())
                    .filter(line => line.length > 0),
            };
            const response = await fetch('/api/settings/security', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const body = await response.json();
            if (!response.ok) {
                throw new Error(body?.error ?? 'Failed to save security settings.');
            }
            setSecurity(body?.data ?? payload);
            toast.success('Security settings saved.');
        } catch (saveError) {
            toast.error(
                saveError instanceof Error ? saveError.message : 'Failed to save security settings.'
            );
        } finally {
            setSaving(false);
        }
    };

    const saveNotifications = async () => {
        try {
            setSaving(true);
            const response = await fetch('/api/settings/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(notifications),
            });
            const body = await response.json();
            if (!response.ok) {
                throw new Error(body?.error ?? 'Failed to save notifications.');
            }
            setNotifications(body?.data ?? notifications);
            toast.success('Notification settings saved.');
        } catch (saveError) {
            toast.error(
                saveError instanceof Error ? saveError.message : 'Failed to save notifications.'
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen space-y-8 bg-white pb-20">
            <div>
                <h1 className="mb-2 text-4xl font-bold tracking-tight text-black">Settings</h1>
                <p className="font-medium text-gray-500">
                    Security, notifications, and payout preferences.
                </p>
            </div>

            <div className="flex gap-2">
                <button
                    onClick={() => setActiveTab('security')}
                    className={`inline-flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold ${activeTab === 'security' ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                    <Shield className="h-4 w-4" />
                    Security
                </button>
                <button
                    onClick={() => setActiveTab('notifications')}
                    className={`inline-flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold ${activeTab === 'notifications' ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                    <Bell className="h-4 w-4" />
                    Notifications
                </button>
                <button
                    onClick={() => setActiveTab('payments')}
                    className={`inline-flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold ${activeTab === 'payments' ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                    <CreditCard className="h-4 w-4" />
                    Payment Accounts
                </button>
                <button
                    onClick={() => setActiveTab('plan')}
                    className={`inline-flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold ${activeTab === 'plan' ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                    <Sparkles className="h-4 w-4" />
                    Plan
                </button>
            </div>

            {activeTab === 'security' && (
                <div className="max-w-3xl space-y-4 rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm">
                    <h2 className="text-xl font-bold text-gray-900">Security Controls</h2>
                    <label className="flex items-center justify-between rounded-xl border border-gray-200 p-3">
                        <span className="text-sm font-medium text-gray-700">Require MFA</span>
                        <input
                            type="checkbox"
                            checked={security.require_mfa}
                            onChange={event =>
                                setSecurity(prev => ({
                                    ...prev,
                                    require_mfa: event.target.checked,
                                }))
                            }
                        />
                    </label>
                    <label className="block space-y-1">
                        <span className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                            Session Timeout (minutes)
                        </span>
                        <input
                            type="number"
                            min={5}
                            max={1440}
                            value={security.session_timeout_minutes}
                            onChange={event =>
                                setSecurity(prev => ({
                                    ...prev,
                                    session_timeout_minutes:
                                        Number.parseInt(event.target.value, 10) || 120,
                                }))
                            }
                            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
                        />
                    </label>
                    <label className="block space-y-1">
                        <span className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                            Allowed IP Ranges (one per line)
                        </span>
                        <textarea
                            value={ipRangesText}
                            onChange={event => setIpRangesText(event.target.value)}
                            className="min-h-[120px] w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
                            placeholder="10.0.0.0/24"
                        />
                    </label>
                    <label className="flex items-center justify-between rounded-xl border border-gray-200 p-3">
                        <span className="text-sm font-medium text-gray-700">
                            Alert on Suspicious Login
                        </span>
                        <input
                            type="checkbox"
                            checked={security.alert_on_suspicious_login}
                            onChange={event =>
                                setSecurity(prev => ({
                                    ...prev,
                                    alert_on_suspicious_login: event.target.checked,
                                }))
                            }
                        />
                    </label>
                    <div className="flex justify-end pt-2">
                        <button
                            onClick={() => void saveSecurity()}
                            disabled={saving}
                            className="bg-brand-crimson inline-flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold text-white hover:bg-[#a0151e] disabled:opacity-50"
                        >
                            {saving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Lock className="h-4 w-4" />
                            )}
                            Save Security
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'notifications' && (
                <div className="max-w-3xl space-y-4 rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm">
                    <h2 className="text-xl font-bold text-gray-900">Notification Routing</h2>
                    <label className="flex items-center justify-between rounded-xl border border-gray-200 p-3">
                        <span className="text-sm font-medium text-gray-700">
                            Email Notifications
                        </span>
                        <input
                            type="checkbox"
                            checked={notifications.email_enabled}
                            onChange={event =>
                                setNotifications(prev => ({
                                    ...prev,
                                    email_enabled: event.target.checked,
                                }))
                            }
                        />
                    </label>
                    <label className="flex items-center justify-between rounded-xl border border-gray-200 p-3">
                        <span className="text-sm font-medium text-gray-700">SMS Notifications</span>
                        <input
                            type="checkbox"
                            checked={notifications.sms_enabled}
                            onChange={event =>
                                setNotifications(prev => ({
                                    ...prev,
                                    sms_enabled: event.target.checked,
                                }))
                            }
                        />
                    </label>
                    <label className="flex items-center justify-between rounded-xl border border-gray-200 p-3">
                        <span className="text-sm font-medium text-gray-700">
                            In-app Notifications
                        </span>
                        <input
                            type="checkbox"
                            checked={notifications.in_app_enabled}
                            onChange={event =>
                                setNotifications(prev => ({
                                    ...prev,
                                    in_app_enabled: event.target.checked,
                                }))
                            }
                        />
                    </label>
                    <label className="flex items-center justify-between rounded-xl border border-gray-200 p-3">
                        <span className="text-sm font-medium text-gray-700">
                            Escalation Enabled
                        </span>
                        <input
                            type="checkbox"
                            checked={notifications.escalation_enabled}
                            onChange={event =>
                                setNotifications(prev => ({
                                    ...prev,
                                    escalation_enabled: event.target.checked,
                                }))
                            }
                        />
                    </label>
                    <label className="block space-y-1">
                        <span className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                            Escalation Time (minutes)
                        </span>
                        <input
                            type="number"
                            min={1}
                            max={240}
                            value={notifications.escalation_minutes}
                            onChange={event =>
                                setNotifications(prev => ({
                                    ...prev,
                                    escalation_minutes:
                                        Number.parseInt(event.target.value, 10) || 15,
                                }))
                            }
                            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
                        />
                    </label>
                    <div className="flex justify-end pt-2">
                        <button
                            onClick={() => void saveNotifications()}
                            disabled={saving}
                            className="bg-brand-crimson inline-flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold text-white hover:bg-[#a0151e] disabled:opacity-50"
                        >
                            {saving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4" />
                            )}
                            Save Routing
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'payments' && (
                <PaymentAccountsSettingsPanel
                    initialSettings={currentPayments}
                    initialBanks={initialBanks}
                    initialDirectoryUnavailable={initialDirectoryUnavailable}
                    onSettingsSaved={updated => setCurrentPayments(updated)}
                />
            )}

            {activeTab === 'plan' && (
                <div className="max-w-3xl space-y-6">
                    {/* Current Plan Display */}
                    <div className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm">
                        <h2 className="mb-4 text-xl font-bold text-gray-900">Current Plan</h2>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div
                                    className={`flex h-16 w-16 items-center justify-center rounded-2xl ${currentPlan.plan === 'free' ? 'bg-gray-100' : currentPlan.plan === 'pro' ? 'bg-gradient-to-br from-purple-500 to-indigo-600' : 'bg-gradient-to-br from-amber-500 to-orange-600'}`}
                                >
                                    {currentPlan.plan === 'free' ? (
                                        <Star className="h-8 w-8 text-gray-400" />
                                    ) : currentPlan.plan === 'pro' ? (
                                        <Crown className="h-8 w-8 text-white" />
                                    ) : (
                                        <Crown className="h-8 w-8 text-white" />
                                    )}
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900 capitalize">
                                        {currentPlan.plan}
                                        {currentPlan.plan === 'enterprise' && ' 🏢'}
                                        {currentPlan.plan === 'pro' && ' ⚡'}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {PlanPricing[currentPlan.plan].monthly === 0
                                            ? 'Free forever'
                                            : `ETB ${PlanPricing[currentPlan.plan].monthly.toLocaleString()}/month`}
                                    </p>
                                    {currentPlan.plan_expires_at && (
                                        <p className="text-sm text-amber-600">
                                            Renews on{' '}
                                            {new Date(
                                                currentPlan.plan_expires_at
                                            ).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>
                            </div>
                            {currentPlan.plan !== 'enterprise' && (
                                <button
                                    className="bg-brand-crimson inline-flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold text-white hover:bg-[#a0151e]"
                                    onClick={() => {
                                        const nextPlan = getNextPlan(currentPlan.plan);
                                        if (nextPlan) {
                                            window.location.href = `/merchant/upgrade?plan=${nextPlan}`;
                                        }
                                    }}
                                >
                                    <Sparkles className="h-4 w-4" />
                                    Upgrade to {getNextPlan(currentPlan.plan)}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Plan Comparison */}
                    <div className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm">
                        <h2 className="mb-4 text-xl font-bold text-gray-900">Available Plans</h2>
                        <div className="grid gap-4 md:grid-cols-3">
                            {/* Free Plan */}
                            <div
                                className={`rounded-xl border-2 p-4 ${currentPlan.plan === 'free' ? 'border-purple-500 bg-purple-50' : 'border-gray-200'}`}
                            >
                                <div className="mb-2 flex items-center gap-2">
                                    <Star className="h-5 w-5 text-gray-400" />
                                    <span className="font-bold text-gray-900">Free</span>
                                </div>
                                <p className="mb-3 text-2xl font-bold text-gray-900">ETB 0</p>
                                <ul className="space-y-2 text-sm text-gray-600">
                                    <li>✓ Basic Menu</li>
                                    <li>✓ Orders & Tables</li>
                                    <li>✓ QR Ordering</li>
                                    <li>✓ Staff Management</li>
                                </ul>
                            </div>

                            {/* Pro Plan */}
                            <div
                                className={`rounded-xl border-2 p-4 ${currentPlan.plan === 'pro' ? 'border-purple-500 bg-purple-50' : currentPlan.plan_tier < 1 ? 'border-purple-200 hover:border-purple-400' : 'border-gray-200'}`}
                            >
                                <div className="mb-2 flex items-center gap-2">
                                    <Crown className="h-5 w-5 text-purple-600" />
                                    <span className="font-bold text-gray-900">Pro</span>
                                    {currentPlan.plan === 'pro' && (
                                        <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                                            Current
                                        </span>
                                    )}
                                </div>
                                <p className="mb-3 text-2xl font-bold text-gray-900">
                                    ETB 2,999<span className="text-sm font-normal">/mo</span>
                                </p>
                                <ul className="space-y-2 text-sm text-gray-600">
                                    <li>✓ Everything in Free</li>
                                    <li>✓ Analytics Dashboard</li>
                                    <li>✓ Inventory Management</li>
                                    <li>✓ Guest Directory</li>
                                    <li>✓ Loyalty & Gift Cards</li>
                                    <li>✓ Delivery Integration</li>
                                </ul>
                            </div>

                            {/* Enterprise Plan */}
                            <div
                                className={`rounded-xl border-2 p-4 ${currentPlan.plan === 'enterprise' ? 'border-purple-500 bg-purple-50' : currentPlan.plan_tier < 2 ? 'border-amber-200 hover:border-amber-400' : 'border-gray-200'}`}
                            >
                                <div className="mb-2 flex items-center gap-2">
                                    <Crown className="h-5 w-5 text-amber-600" />
                                    <span className="font-bold text-gray-900">Enterprise</span>
                                    {currentPlan.plan === 'enterprise' && (
                                        <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                                            Current
                                        </span>
                                    )}
                                </div>
                                <p className="mb-3 text-2xl font-bold text-gray-900">
                                    ETB 9,999<span className="text-sm font-normal">/mo</span>
                                </p>
                                <ul className="space-y-2 text-sm text-gray-600">
                                    <li>✓ Everything in Pro</li>
                                    <li>✓ Multi-Location</li>
                                    <li>✓ API Access</li>
                                    <li>✓ Custom Integrations</li>
                                    <li>✓ Priority Support</li>
                                    <li>✓ Dedicated Account Manager</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Pro Features Info */}
                    {currentPlan.plan === 'free' && (
                        <div className="rounded-[2rem] border border-purple-100 bg-purple-50 p-6">
                            <h3 className="mb-2 flex items-center gap-2 text-lg font-bold text-purple-900">
                                <Sparkles className="h-5 w-5" />
                                Unlock PRO Features
                            </h3>
                            <p className="mb-4 text-purple-700">
                                Upgrade to Pro to access powerful features like analytics, inventory
                                management, guest directory, loyalty programs, and more.
                            </p>
                            <button
                                className="inline-flex h-11 items-center gap-2 rounded-xl bg-purple-600 px-4 text-sm font-semibold text-white hover:bg-purple-700"
                                onClick={() => {
                                    window.location.href = '/merchant/upgrade?plan=pro';
                                }}
                            >
                                Upgrade to Pro - ETB 2,999/month
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
