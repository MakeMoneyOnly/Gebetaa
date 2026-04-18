'use client';

import { cn } from '@/lib/utils';

export interface OnlineOrderingSettings {
    enabled: boolean;
    accepts_scheduled_orders: boolean;
    auto_accept_orders: boolean;
    prep_time_minutes: number;
    max_daily_orders: number;
    service_hours: { start: string; end: string };
    order_throttling_enabled: boolean;
    throttle_limit_per_15m: number;
}

interface OnlineOrderingSettingsPanelProps {
    loading: boolean;
    saving: boolean;
    error: string | null;
    settings: OnlineOrderingSettings;
    restaurantSlug: string | null;
    onChange: (settings: OnlineOrderingSettings) => void;
    onSave: () => void;
}

export function OnlineOrderingSettingsPanel({
    loading,
    saving,
    error,
    settings,
    restaurantSlug,
    onChange,
    onSave,
}: OnlineOrderingSettingsPanelProps) {
    return (
        <div className="rounded-xl border border-gray-100 bg-white p-6">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-gray-900">Online Ordering Settings</h2>
                    {restaurantSlug && (
                        <p className="text-sm text-gray-500">Restaurant: {restaurantSlug}</p>
                    )}
                </div>
                <button
                    onClick={onSave}
                    disabled={loading || saving}
                    className={cn(
                        'rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
                        saving || loading
                            ? 'cursor-not-allowed bg-gray-100 text-gray-400'
                            : 'bg-black text-white hover:bg-gray-800'
                    )}
                >
                    {saving ? 'Saving...' : 'Save Settings'}
                </button>
            </div>

            {error && (
                <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
            )}

            {loading ? (
                <div className="py-8 text-center text-gray-400">Loading settings...</div>
            ) : (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-semibold text-gray-900">Enable Online Ordering</p>
                            <p className="text-sm text-gray-500">
                                Accept orders from online channels
                            </p>
                        </div>
                        <label className="relative inline-flex cursor-pointer items-center">
                            <input
                                type="checkbox"
                                checked={settings.enabled}
                                onChange={e => onChange({ ...settings, enabled: e.target.checked })}
                                className="peer sr-only"
                            />
                            <div className="peer h-6 w-11 rounded-full bg-gray-200 peer-checked:bg-black after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-full" />
                        </label>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-semibold text-gray-900">Accept Scheduled Orders</p>
                            <p className="text-sm text-gray-500">
                                Allow customers to schedule orders
                            </p>
                        </div>
                        <label className="relative inline-flex cursor-pointer items-center">
                            <input
                                type="checkbox"
                                checked={settings.accepts_scheduled_orders}
                                onChange={e =>
                                    onChange({
                                        ...settings,
                                        accepts_scheduled_orders: e.target.checked,
                                    })
                                }
                                className="peer sr-only"
                            />
                            <div className="peer h-6 w-11 rounded-full bg-gray-200 peer-checked:bg-black after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-full" />
                        </label>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-semibold text-gray-900">Auto-Accept Orders</p>
                            <p className="text-sm text-gray-500">
                                Automatically accept incoming orders
                            </p>
                        </div>
                        <label className="relative inline-flex cursor-pointer items-center">
                            <input
                                type="checkbox"
                                checked={settings.auto_accept_orders}
                                onChange={e =>
                                    onChange({ ...settings, auto_accept_orders: e.target.checked })
                                }
                                className="peer sr-only"
                            />
                            <div className="peer h-6 w-11 rounded-full bg-gray-200 peer-checked:bg-black after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-full" />
                        </label>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-sm font-semibold text-gray-900">
                                Prep Time (minutes)
                            </label>
                            <input
                                type="number"
                                value={settings.prep_time_minutes}
                                onChange={e =>
                                    onChange({
                                        ...settings,
                                        prep_time_minutes: parseInt(e.target.value) || 0,
                                    })
                                }
                                min={0}
                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-semibold text-gray-900">
                                Max Daily Orders
                            </label>
                            <input
                                type="number"
                                value={settings.max_daily_orders}
                                onChange={e =>
                                    onChange({
                                        ...settings,
                                        max_daily_orders: parseInt(e.target.value) || 0,
                                    })
                                }
                                min={0}
                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-sm font-semibold text-gray-900">
                                Service Hours Start
                            </label>
                            <input
                                type="time"
                                value={settings.service_hours.start}
                                onChange={e =>
                                    onChange({
                                        ...settings,
                                        service_hours: {
                                            ...settings.service_hours,
                                            start: e.target.value,
                                        },
                                    })
                                }
                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-semibold text-gray-900">
                                Service Hours End
                            </label>
                            <input
                                type="time"
                                value={settings.service_hours.end}
                                onChange={e =>
                                    onChange({
                                        ...settings,
                                        service_hours: {
                                            ...settings.service_hours,
                                            end: e.target.value,
                                        },
                                    })
                                }
                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-semibold text-gray-900">Order Throttling</p>
                            <p className="text-sm text-gray-500">Limit orders during peak times</p>
                        </div>
                        <label className="relative inline-flex cursor-pointer items-center">
                            <input
                                type="checkbox"
                                checked={settings.order_throttling_enabled}
                                onChange={e =>
                                    onChange({
                                        ...settings,
                                        order_throttling_enabled: e.target.checked,
                                    })
                                }
                                className="peer sr-only"
                            />
                            <div className="peer h-6 w-11 rounded-full bg-gray-200 peer-checked:bg-black after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-full" />
                        </label>
                    </div>

                    {settings.order_throttling_enabled && (
                        <div>
                            <label className="mb-1 block text-sm font-semibold text-gray-900">
                                Throttle Limit (per 15 min)
                            </label>
                            <input
                                type="number"
                                value={settings.throttle_limit_per_15m}
                                onChange={e =>
                                    onChange({
                                        ...settings,
                                        throttle_limit_per_15m: parseInt(e.target.value) || 0,
                                    })
                                }
                                min={1}
                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
