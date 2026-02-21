'use client';

import { Loader2, Save } from 'lucide-react';

export type OnlineOrderingSettings = {
    enabled: boolean;
    accepts_scheduled_orders: boolean;
    auto_accept_orders: boolean;
    prep_time_minutes: number;
    max_daily_orders: number;
    service_hours: {
        start: string;
        end: string;
    };
    order_throttling_enabled: boolean;
    throttle_limit_per_15m: number;
};

interface OnlineOrderingSettingsPanelProps {
    loading: boolean;
    saving: boolean;
    error: string | null;
    settings: OnlineOrderingSettings;
    onChange: (next: OnlineOrderingSettings) => void;
    onSave: () => Promise<void>;
}

export function OnlineOrderingSettingsPanel({
    loading,
    saving,
    error,
    settings,
    onChange,
    onSave,
}: OnlineOrderingSettingsPanelProps) {
    return (
        <div className="rounded-[1.5rem] border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Online Ordering Settings</h3>
                    <p className="text-sm text-gray-500">
                        Control online storefront availability and order intake rules.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => void onSave()}
                    disabled={saving || loading}
                    className="inline-flex h-10 items-center gap-2 rounded-xl bg-black px-4 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
                >
                    {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Save className="h-4 w-4" />
                    )}
                    Save
                </button>
            </div>

            {error && (
                <p
                    role="alert"
                    className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800"
                >
                    {error}
                </p>
            )}

            {loading ? (
                <div className="mt-4 h-48 animate-pulse rounded-2xl bg-gray-50" />
            ) : (
                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                    <label className="flex items-center justify-between rounded-xl border border-gray-200 p-3">
                        <span className="text-sm font-medium text-gray-700">
                            Online ordering enabled
                        </span>
                        <input
                            type="checkbox"
                            checked={settings.enabled}
                            onChange={event =>
                                onChange({ ...settings, enabled: event.target.checked })
                            }
                        />
                    </label>
                    <label className="flex items-center justify-between rounded-xl border border-gray-200 p-3">
                        <span className="text-sm font-medium text-gray-700">
                            Accept scheduled orders
                        </span>
                        <input
                            type="checkbox"
                            checked={settings.accepts_scheduled_orders}
                            onChange={event =>
                                onChange({
                                    ...settings,
                                    accepts_scheduled_orders: event.target.checked,
                                })
                            }
                        />
                    </label>
                    <label className="flex items-center justify-between rounded-xl border border-gray-200 p-3">
                        <span className="text-sm font-medium text-gray-700">
                            Auto-accept incoming orders
                        </span>
                        <input
                            type="checkbox"
                            checked={settings.auto_accept_orders}
                            onChange={event =>
                                onChange({ ...settings, auto_accept_orders: event.target.checked })
                            }
                        />
                    </label>
                    <label className="flex items-center justify-between rounded-xl border border-gray-200 p-3">
                        <span className="text-sm font-medium text-gray-700">Enable throttling</span>
                        <input
                            type="checkbox"
                            checked={settings.order_throttling_enabled}
                            onChange={event =>
                                onChange({
                                    ...settings,
                                    order_throttling_enabled: event.target.checked,
                                })
                            }
                        />
                    </label>

                    <label className="space-y-1 rounded-xl border border-gray-200 p-3">
                        <span className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                            Prep Time (minutes)
                        </span>
                        <input
                            type="number"
                            min={5}
                            max={180}
                            value={settings.prep_time_minutes}
                            onChange={event =>
                                onChange({
                                    ...settings,
                                    prep_time_minutes:
                                        Number.parseInt(event.target.value, 10) || 30,
                                })
                            }
                            className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-gray-400"
                        />
                    </label>

                    <label className="space-y-1 rounded-xl border border-gray-200 p-3">
                        <span className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                            Max Daily Orders
                        </span>
                        <input
                            type="number"
                            min={1}
                            max={5000}
                            value={settings.max_daily_orders}
                            onChange={event =>
                                onChange({
                                    ...settings,
                                    max_daily_orders:
                                        Number.parseInt(event.target.value, 10) || 300,
                                })
                            }
                            className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-gray-400"
                        />
                    </label>

                    <label className="space-y-1 rounded-xl border border-gray-200 p-3">
                        <span className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                            Service Start
                        </span>
                        <input
                            type="time"
                            value={settings.service_hours.start}
                            onChange={event =>
                                onChange({
                                    ...settings,
                                    service_hours: {
                                        ...settings.service_hours,
                                        start: event.target.value,
                                    },
                                })
                            }
                            className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-gray-400"
                        />
                    </label>

                    <label className="space-y-1 rounded-xl border border-gray-200 p-3">
                        <span className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                            Service End
                        </span>
                        <input
                            type="time"
                            value={settings.service_hours.end}
                            onChange={event =>
                                onChange({
                                    ...settings,
                                    service_hours: {
                                        ...settings.service_hours,
                                        end: event.target.value,
                                    },
                                })
                            }
                            className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-gray-400"
                        />
                    </label>

                    <label className="space-y-1 rounded-xl border border-gray-200 p-3 md:col-span-2">
                        <span className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                            Throttle Limit (orders / 15 min)
                        </span>
                        <input
                            type="number"
                            min={1}
                            max={500}
                            value={settings.throttle_limit_per_15m}
                            onChange={event =>
                                onChange({
                                    ...settings,
                                    throttle_limit_per_15m:
                                        Number.parseInt(event.target.value, 10) || 40,
                                })
                            }
                            className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-gray-400"
                        />
                    </label>
                </div>
            )}
        </div>
    );
}
