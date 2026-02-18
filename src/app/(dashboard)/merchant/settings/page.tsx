'use client';

import React, { useEffect, useState } from 'react';
import { Bell, Loader2, Lock, Save, Shield } from 'lucide-react';
import { toast } from 'react-hot-toast';

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

const defaultSecurity: SecuritySettings = {
    require_mfa: false,
    session_timeout_minutes: 120,
    allowed_ip_ranges: [],
    alert_on_suspicious_login: true,
};

const defaultNotifications: NotificationSettings = {
    email_enabled: true,
    sms_enabled: false,
    in_app_enabled: true,
    escalation_enabled: true,
    escalation_minutes: 15,
};

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<'security' | 'notifications'>('security');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [security, setSecurity] = useState<SecuritySettings>(defaultSecurity);
    const [notifications, setNotifications] = useState<NotificationSettings>(defaultNotifications);
    const [ipRangesText, setIpRangesText] = useState('');

    const loadSettings = async () => {
        try {
            setLoading(true);
            setError(null);
            const [securityRes, notificationsRes] = await Promise.all([
                fetch('/api/settings/security', { method: 'GET' }),
                fetch('/api/settings/notifications', { method: 'GET' }),
            ]);
            const securityPayload = await securityRes.json();
            const notificationsPayload = await notificationsRes.json();

            if (!securityRes.ok) {
                throw new Error(securityPayload?.error ?? 'Failed to load security settings.');
            }
            if (!notificationsRes.ok) {
                throw new Error(notificationsPayload?.error ?? 'Failed to load notification settings.');
            }

            const resolvedSecurity = {
                ...defaultSecurity,
                ...(securityPayload?.data ?? {}),
            } as SecuritySettings;
            const resolvedNotifications = {
                ...defaultNotifications,
                ...(notificationsPayload?.data ?? {}),
            } as NotificationSettings;

            setSecurity(resolvedSecurity);
            setNotifications(resolvedNotifications);
            setIpRangesText((resolvedSecurity.allowed_ip_ranges ?? []).join('\n'));
        } catch (loadError) {
            console.error(loadError);
            setError(loadError instanceof Error ? loadError.message : 'Failed to load settings.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadSettings();
    }, []);

    const saveSecurity = async () => {
        try {
            setSaving(true);
            const payload = {
                ...security,
                allowed_ip_ranges: ipRangesText
                    .split('\n')
                    .map((line) => line.trim())
                    .filter((line) => line.length > 0),
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
            toast.error(saveError instanceof Error ? saveError.message : 'Failed to save security settings.');
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
            toast.error(saveError instanceof Error ? saveError.message : 'Failed to save notifications.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-8 pb-20 min-h-screen bg-white">
            <div>
                <h1 className="text-4xl font-bold text-black mb-2 tracking-tight">Settings</h1>
                <p className="text-gray-500 font-medium">Security and routing preferences.</p>
                {error && <p className="text-xs mt-2 text-amber-700 font-semibold">{error}</p>}
            </div>

            <div className="flex gap-2">
                <button
                    onClick={() => setActiveTab('security')}
                    className={`h-11 px-4 rounded-xl text-sm font-semibold inline-flex items-center gap-2 ${activeTab === 'security' ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                    <Shield className="h-4 w-4" />
                    Security
                </button>
                <button
                    onClick={() => setActiveTab('notifications')}
                    className={`h-11 px-4 rounded-xl text-sm font-semibold inline-flex items-center gap-2 ${activeTab === 'notifications' ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                    <Bell className="h-4 w-4" />
                    Notifications
                </button>
            </div>

            {loading && (
                <div className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm flex items-center gap-2 text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading settings...
                </div>
            )}

            {!loading && activeTab === 'security' && (
                <div className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm space-y-4 max-w-3xl">
                    <h2 className="text-xl font-bold text-gray-900">Security Controls</h2>
                    <label className="flex items-center justify-between rounded-xl border border-gray-200 p-3">
                        <span className="text-sm font-medium text-gray-700">Require MFA</span>
                        <input
                            type="checkbox"
                            checked={security.require_mfa}
                            onChange={(event) => setSecurity((prev) => ({ ...prev, require_mfa: event.target.checked }))}
                        />
                    </label>
                    <label className="space-y-1 block">
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Session Timeout (minutes)</span>
                        <input
                            type="number"
                            min={5}
                            max={1440}
                            value={security.session_timeout_minutes}
                            onChange={(event) =>
                                setSecurity((prev) => ({
                                    ...prev,
                                    session_timeout_minutes: Number.parseInt(event.target.value, 10) || 120,
                                }))
                            }
                            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
                        />
                    </label>
                    <label className="space-y-1 block">
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Allowed IP Ranges (one per line)</span>
                        <textarea
                            value={ipRangesText}
                            onChange={(event) => setIpRangesText(event.target.value)}
                            className="w-full min-h-[120px] rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
                            placeholder="10.0.0.0/24"
                        />
                    </label>
                    <label className="flex items-center justify-between rounded-xl border border-gray-200 p-3">
                        <span className="text-sm font-medium text-gray-700">Alert on Suspicious Login</span>
                        <input
                            type="checkbox"
                            checked={security.alert_on_suspicious_login}
                            onChange={(event) =>
                                setSecurity((prev) => ({ ...prev, alert_on_suspicious_login: event.target.checked }))
                            }
                        />
                    </label>
                    <div className="pt-2 flex justify-end">
                        <button
                            onClick={() => void saveSecurity()}
                            disabled={saving}
                            className="h-11 px-4 rounded-xl bg-black text-white text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 inline-flex items-center gap-2"
                        >
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                            Save Security
                        </button>
                    </div>
                </div>
            )}

            {!loading && activeTab === 'notifications' && (
                <div className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm space-y-4 max-w-3xl">
                    <h2 className="text-xl font-bold text-gray-900">Notification Routing</h2>
                    <label className="flex items-center justify-between rounded-xl border border-gray-200 p-3">
                        <span className="text-sm font-medium text-gray-700">Email Notifications</span>
                        <input
                            type="checkbox"
                            checked={notifications.email_enabled}
                            onChange={(event) =>
                                setNotifications((prev) => ({ ...prev, email_enabled: event.target.checked }))
                            }
                        />
                    </label>
                    <label className="flex items-center justify-between rounded-xl border border-gray-200 p-3">
                        <span className="text-sm font-medium text-gray-700">SMS Notifications</span>
                        <input
                            type="checkbox"
                            checked={notifications.sms_enabled}
                            onChange={(event) =>
                                setNotifications((prev) => ({ ...prev, sms_enabled: event.target.checked }))
                            }
                        />
                    </label>
                    <label className="flex items-center justify-between rounded-xl border border-gray-200 p-3">
                        <span className="text-sm font-medium text-gray-700">In-app Notifications</span>
                        <input
                            type="checkbox"
                            checked={notifications.in_app_enabled}
                            onChange={(event) =>
                                setNotifications((prev) => ({ ...prev, in_app_enabled: event.target.checked }))
                            }
                        />
                    </label>
                    <label className="flex items-center justify-between rounded-xl border border-gray-200 p-3">
                        <span className="text-sm font-medium text-gray-700">Escalation Enabled</span>
                        <input
                            type="checkbox"
                            checked={notifications.escalation_enabled}
                            onChange={(event) =>
                                setNotifications((prev) => ({ ...prev, escalation_enabled: event.target.checked }))
                            }
                        />
                    </label>
                    <label className="space-y-1 block">
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Escalation Time (minutes)</span>
                        <input
                            type="number"
                            min={1}
                            max={240}
                            value={notifications.escalation_minutes}
                            onChange={(event) =>
                                setNotifications((prev) => ({
                                    ...prev,
                                    escalation_minutes: Number.parseInt(event.target.value, 10) || 15,
                                }))
                            }
                            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
                        />
                    </label>
                    <div className="pt-2 flex justify-end">
                        <button
                            onClick={() => void saveNotifications()}
                            disabled={saving}
                            className="h-11 px-4 rounded-xl bg-black text-white text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 inline-flex items-center gap-2"
                        >
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            Save Routing
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
