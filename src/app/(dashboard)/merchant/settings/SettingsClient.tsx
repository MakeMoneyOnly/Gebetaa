'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Bell, CreditCard, Loader2, Lock, Save, Shield } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { PaymentAccountsSettingsPanel } from '@/components/merchant/PaymentAccountsSettingsPanel';

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

type BankOption = {
    id: string;
    name: string;
    code: string;
};

type SettingsClientProps = {
    security: SecuritySettings;
    notifications: NotificationSettings;
    payments: PaymentSettings;
    banks: BankOption[];
    directoryUnavailable: boolean;
};

export function SettingsClient({
    security: initialSecurity,
    notifications: initialNotifications,
    payments: initialPayments,
    banks: initialBanks,
    directoryUnavailable: initialDirectoryUnavailable,
}: SettingsClientProps) {
    const [activeTab, setActiveTab] = useState<'security' | 'notifications' | 'payments'>(
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
                    onSettingsSaved={(updated) => setCurrentPayments(updated)}
                />
            )}
        </div>
    );
}