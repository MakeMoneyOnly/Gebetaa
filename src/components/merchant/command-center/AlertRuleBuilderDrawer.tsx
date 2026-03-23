'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'react-hot-toast';

type AlertRule = {
    id: string;
    name: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    enabled: boolean;
    condition_json: Record<string, unknown>;
    target_json: Record<string, unknown>;
};

type RuleDraft = {
    id: string | null;
    name: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    enabled: boolean;
    metric: string;
    operator: string;
    threshold: number;
    channel: string;
};

const DEFAULT_DRAFT: RuleDraft = {
    id: null,
    name: '',
    severity: 'medium',
    enabled: true,
    metric: 'orders_in_flight',
    operator: 'gte',
    threshold: 10,
    channel: 'in_app',
};

function fromRule(rule: AlertRule): RuleDraft {
    return {
        id: rule.id,
        name: rule.name,
        severity: rule.severity,
        enabled: rule.enabled,
        metric: String(rule.condition_json.metric ?? 'orders_in_flight'),
        operator: String(rule.condition_json.operator ?? 'gte'),
        threshold: Number(rule.condition_json.threshold ?? 10),
        channel: String((rule.target_json.channels as string[] | undefined)?.[0] ?? 'in_app'),
    };
}

export function AlertRuleBuilderDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [rules, setRules] = useState<AlertRule[]>([]);
    const [draft, setDraft] = useState<RuleDraft>(DEFAULT_DRAFT);

    useEffect(() => {
        if (!open) return;

        const load = async () => {
            setLoading(true);
            try {
                const response = await fetch('/api/alerts/rules', { cache: 'no-store' });
                const payload = await response.json();
                if (!response.ok) {
                    throw new Error(payload?.error ?? 'Failed to load alert rules.');
                }

                setRules((payload?.data?.rules ?? []) as AlertRule[]);
            } catch (error) {
                toast.error(error instanceof Error ? error.message : 'Failed to load alert rules.');
            } finally {
                setLoading(false);
            }
        };

        void load();
    }, [open]);

    const saveDraft = async () => {
        setSaving(true);
        try {
            const payload = {
                name: draft.name,
                severity: draft.severity,
                enabled: draft.enabled,
                condition_json: {
                    metric: draft.metric,
                    operator: draft.operator,
                    threshold: draft.threshold,
                },
                target_json: {
                    channels: [draft.channel],
                },
            };

            const endpoint = draft.id ? `/api/alerts/rules/${draft.id}` : '/api/alerts/rules';
            const method = draft.id ? 'PATCH' : 'POST';

            const response = await fetch(endpoint, {
                method,
                headers: {
                    'content-type': 'application/json',
                    'x-idempotency-key': crypto.randomUUID(),
                },
                body: JSON.stringify(payload),
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result?.error ?? 'Failed to save alert rule.');
            }

            toast.success(draft.id ? 'Alert rule updated.' : 'Alert rule created.');
            setDraft(DEFAULT_DRAFT);

            const refresh = await fetch('/api/alerts/rules', { cache: 'no-store' });
            const refreshPayload = await refresh.json();
            if (refresh.ok) {
                setRules((refreshPayload?.data?.rules ?? []) as AlertRule[]);
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to save alert rule.');
        } finally {
            setSaving(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/40">
            <div className="ml-auto h-full w-full max-w-xl overflow-y-auto border-l border-gray-200 bg-white p-6 shadow-2xl">
                <div className="mb-5 flex items-start justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Alert Rule Builder</h2>
                        <p className="text-sm text-gray-500">
                            Configure thresholds and escalation targets.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="h-9 w-9 rounded-lg border border-gray-200 hover:bg-gray-50"
                    >
                        <X className="mx-auto h-4 w-4 text-gray-600" />
                    </button>
                </div>

                <div className="space-y-3 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <input
                        value={draft.name}
                        onChange={event =>
                            setDraft(prev => ({ ...prev, name: event.target.value }))
                        }
                        placeholder="Rule name"
                        className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm"
                    />
                    <div className="grid grid-cols-2 gap-2">
                        <select
                            value={draft.metric}
                            onChange={event =>
                                setDraft(prev => ({ ...prev, metric: event.target.value }))
                            }
                            className="h-10 rounded-lg border border-gray-200 bg-white px-2 text-sm"
                        >
                            <option value="orders_in_flight">Orders In Flight</option>
                            <option value="open_requests">Open Requests</option>
                            <option value="avg_ticket_time_minutes">Avg Ticket Time</option>
                        </select>
                        <select
                            value={draft.operator}
                            onChange={event =>
                                setDraft(prev => ({ ...prev, operator: event.target.value }))
                            }
                            className="h-10 rounded-lg border border-gray-200 bg-white px-2 text-sm"
                        >
                            <option value="gte">&gt;=</option>
                            <option value="gt">&gt;</option>
                            <option value="lte">&lt;=</option>
                            <option value="lt">&lt;</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        <input
                            type="number"
                            min={1}
                            value={draft.threshold}
                            onChange={event =>
                                setDraft(prev => ({
                                    ...prev,
                                    threshold: Number(event.target.value || 1),
                                }))
                            }
                            className="h-10 rounded-lg border border-gray-200 bg-white px-2 text-sm"
                        />
                        <select
                            value={draft.severity}
                            onChange={event =>
                                setDraft(prev => ({
                                    ...prev,
                                    severity: event.target.value as RuleDraft['severity'],
                                }))
                            }
                            className="h-10 rounded-lg border border-gray-200 bg-white px-2 text-sm"
                        >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="critical">Critical</option>
                        </select>
                        <select
                            value={draft.channel}
                            onChange={event =>
                                setDraft(prev => ({ ...prev, channel: event.target.value }))
                            }
                            className="h-10 rounded-lg border border-gray-200 bg-white px-2 text-sm"
                        >
                            <option value="in_app">In-app</option>
                            <option value="email">Email</option>
                            <option value="sms">SMS</option>
                        </select>
                    </div>
                    <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                        <input
                            type="checkbox"
                            checked={draft.enabled}
                            onChange={event =>
                                setDraft(prev => ({ ...prev, enabled: event.target.checked }))
                            }
                            className="h-4 w-4 rounded border-gray-300"
                        />
                        Enabled
                    </label>
                    <button
                        type="button"
                        disabled={saving || draft.name.trim().length < 2}
                        onClick={() => {
                            void saveDraft();
                        }}
                        className="bg-brand-crimson h-10 w-full rounded-lg text-sm font-bold text-white hover:bg-[#a0151e] disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : draft.id ? 'Update Rule' : 'Create Rule'}
                    </button>
                </div>

                <div className="mt-5 space-y-2">
                    <h3 className="text-sm font-bold text-gray-800">Existing Rules</h3>
                    {loading ? <p className="text-xs text-gray-500">Loading rules...</p> : null}
                    {!loading && rules.length === 0 ? (
                        <p className="text-xs text-gray-500">No rules yet.</p>
                    ) : null}
                    {rules.map(rule => (
                        <button
                            key={rule.id}
                            type="button"
                            onClick={() => setDraft(fromRule(rule))}
                            className="card-shadow hover:card-shadow-lg w-full rounded-2xl bg-white p-4 text-left transition-all"
                        >
                            <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-semibold text-gray-900">{rule.name}</p>
                                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-700 uppercase">
                                    {rule.severity}
                                </span>
                            </div>
                            <p className="mt-1 text-xs text-gray-500">
                                {String(rule.condition_json.metric ?? 'metric')}{' '}
                                {String(rule.condition_json.operator ?? 'op')}{' '}
                                {String(rule.condition_json.threshold ?? '-')}
                            </p>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
