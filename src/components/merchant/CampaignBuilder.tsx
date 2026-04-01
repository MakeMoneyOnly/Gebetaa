'use client';

import { useState } from 'react';
import { Megaphone, Loader2, Plus, Edit2, Trash2, Repeat } from 'lucide-react';
import { cn } from '@/lib/utils';

export type CampaignRow = {
    id: string;
    name: string;
    channel: 'sms' | 'email' | 'whatsapp' | 'in_app';
    status: 'draft' | 'scheduled' | 'running' | 'completed';
    scheduled_at: string | null;
    template_json: { content: string };
    tracking?: {
        total: number;
        converted: number;
    };
    created_at: string;
    target_segment_name?: string;
};

export type SegmentOption = {
    id: string;
    name: string;
};

interface CampaignBuilderProps {
    campaigns: CampaignRow[];
    segments: SegmentOption[];
    loading: boolean;
    creating: boolean;
    launchingId: string | null;
    onCreate: (payload: {
        id?: string;
        name: string;
        channel: CampaignRow['channel'];
        segment_id?: string;
        scheduled_at?: string;
        template_json?: { content: string };
    }) => Promise<void>;
    onLaunch: (campaignId: string) => Promise<void>;
    onDelete?: (campaignId: string) => Promise<void>;
    onEdit?: (campaignId: string) => void;
}

export function CampaignBuilder({
    campaigns,
    segments,
    loading,
    creating: isOperationLoading,
    launchingId,
    onCreate,
    onLaunch,
    onDelete,
    onEdit,
}: CampaignBuilderProps) {
    const [name, setName] = useState('');
    const [channel, setChannel] = useState<CampaignRow['channel']>('sms');
    const [segmentId, setSegmentId] = useState('');
    const [message, setMessage] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);

    const handleEditInternal = (id: string) => {
        const campaign = campaigns.find(c => c.id === id);
        if (!campaign) return;

        setEditingId(id);
        setName(campaign.name);
        setChannel(campaign.channel);
        setSegmentId(campaign.target_segment_name || '');
        setMessage(campaign.template_json?.content || '');

        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setName('');
        setChannel('sms');
        setSegmentId('');
        setMessage('');
    };

    const submit = async () => {
        const trimmed = name.trim();
        if (trimmed.length < 2) return;

        await onCreate({
            ...(editingId ? { id: editingId } : {}),
            name: trimmed,
            channel,
            ...(segmentId ? { segment_id: segmentId } : {}),
            ...(message.trim() ? { template_json: { content: message.trim() } } : {}),
        });

        if (editingId) setEditingId(null);
        setName('');
        setChannel('sms');
        setSegmentId('');
        setMessage('');
    };

    return (
        <div className="grid min-h-[500px] grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left: Creation/Edit Form */}
            <div className="flex flex-col rounded-2xl bg-white p-6 shadow-xl shadow-gray-200/50 lg:col-span-4">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h3 className="text-xl leading-tight font-bold text-gray-900">
                            {editingId ? 'Edit campaign' : 'New campaign'}
                        </h3>
                        <p className="mt-1 text-sm font-medium text-gray-500">
                            {editingId
                                ? 'Modify your marketing push.'
                                : 'Launch a marketing push for your guests.'}
                        </p>
                    </div>
                    {editingId && (
                        <button
                            onClick={cancelEdit}
                            className="text-xs font-bold text-gray-400 underline underline-offset-4 transition-all hover:text-gray-900"
                        >
                            Cancel
                        </button>
                    )}
                </div>

                <div className="flex-1 space-y-6 rounded-4xl border border-gray-100 bg-gray-50/40 p-5">
                    <div className="space-y-1.5">
                        <label className="ml-1 text-xs font-bold tracking-tight text-gray-400">
                            Campaign name
                        </label>
                        <input
                            value={name}
                            onChange={event => setName(event.target.value)}
                            placeholder="e.g. Summer Promo"
                            className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold transition-all outline-none placeholder:text-gray-300 focus:border-gray-400"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="ml-1 text-xs font-bold tracking-tight text-gray-400">
                                Channel
                            </label>
                            <select
                                value={channel}
                                onChange={event => setChannel(event.target.value as any)}
                                className="h-12 w-full cursor-pointer appearance-none rounded-xl border border-gray-200 bg-white px-4 text-sm font-bold transition-all outline-none focus:border-gray-400"
                            >
                                <option value="sms">SMS</option>
                                <option value="email">Email</option>
                                <option value="whatsapp">WhatsApp</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="ml-1 text-xs font-bold tracking-tight text-gray-400">
                                Target audience
                            </label>
                            <select
                                value={segmentId}
                                onChange={event => setSegmentId(event.target.value)}
                                className="h-12 w-full cursor-pointer appearance-none rounded-xl border border-gray-200 bg-white px-4 text-sm font-bold transition-all outline-none focus:border-gray-400"
                            >
                                <option value="">All guests</option>
                                {segments.map(seg => (
                                    <option key={seg.id} value={seg.id}>
                                        {seg.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1.5 pt-2">
                        <label className="ml-1 text-xs font-bold tracking-tight text-gray-400">
                            Message content
                        </label>
                        <textarea
                            value={message}
                            onChange={event => setMessage(event.target.value)}
                            placeholder="Type your message here..."
                            rows={3}
                            className="w-full resize-none rounded-xl border border-gray-200 bg-white p-4 text-sm font-medium transition-all outline-none placeholder:text-gray-300 focus:border-gray-400"
                        />
                    </div>

                    <div className="mt-auto pt-4">
                        <button
                            type="button"
                            onClick={submit}
                            disabled={
                                isOperationLoading ||
                                name.trim().length < 2 ||
                                message.trim().length < 2
                            }
                            className={cn(
                                'flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-black shadow-xl transition-all active:scale-[0.98] disabled:opacity-50',
                                editingId
                                    ? 'bg-gray-900 shadow-gray-900/10'
                                    : 'bg-brand-accent shadow-crimson-900/10'
                            )}
                        >
                            {isOperationLoading ? (
                                <Loader2 className="h-5 w-5 animate-spin text-white/70" />
                            ) : editingId ? (
                                <Edit2 className="h-5 w-5" />
                            ) : (
                                <Megaphone className="h-5 w-5" />
                            )}
                            {editingId ? 'Update campaign' : 'Create campaign'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Right: Management List */}
            <div className="flex flex-col overflow-hidden rounded-2xl bg-white p-6 shadow-xl shadow-gray-200/50 lg:col-span-8">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h3 className="text-xl leading-tight font-bold text-gray-900">
                            Campaign management
                        </h3>
                        <p className="mt-1 text-sm font-medium text-gray-500">
                            Currently managing {campaigns.length} total campaigns.
                        </p>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden">
                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3, 4].map(i => (
                                <div
                                    key={i}
                                    className="h-24 w-full animate-pulse rounded-xl bg-gray-50"
                                />
                            ))}
                        </div>
                    ) : campaigns.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center rounded-4xl border border-dashed border-gray-200 bg-gray-50/30 py-20">
                            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100">
                                <Repeat className="h-6 w-6 text-gray-300" />
                            </div>
                            <p className="text-sm font-bold text-gray-500">No campaigns yet</p>
                            <p className="mt-1 text-xs font-medium text-gray-400">
                                Ready to reach out to your guests?
                            </p>
                        </div>
                    ) : (
                        <div className="no-scrollbar h-[400px] space-y-4 overflow-y-auto pr-2 pb-4">
                            {campaigns.map(camp => (
                                <div
                                    key={camp.id}
                                    className="group rounded-xl border-none bg-white p-5 shadow-sm transition-all hover:bg-gray-50/30"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-50 text-gray-400 transition-all group-hover:bg-white group-hover:shadow-sm">
                                                <Megaphone className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-md font-bold text-gray-900">
                                                        {camp.name}
                                                    </p>
                                                    <span
                                                        className={cn(
                                                            'rounded-lg border px-2 py-0.5 text-[10px] font-bold capitalize transition-all',
                                                            camp.status === 'completed'
                                                                ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                                                                : camp.status === 'running'
                                                                  ? 'border-blue-100 bg-blue-50 text-blue-700'
                                                                  : 'border-gray-200 bg-gray-100 text-gray-600'
                                                        )}
                                                    >
                                                        {camp.status}
                                                    </span>
                                                </div>
                                                <p className="mt-1 text-xs font-bold tracking-tighter text-gray-400 uppercase">
                                                    {camp.channel} •{' '}
                                                    {camp.target_segment_name || 'All guests'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1 transition-all">
                                                {camp.status === 'draft' && (
                                                    <button
                                                        onClick={() => handleEditInternal(camp.id)}
                                                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-gray-400 shadow-sm transition-all hover:bg-gray-100 hover:text-gray-900 active:scale-[0.92] active:bg-gray-200"
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </button>
                                                )}
                                                {onDelete && (
                                                    <button
                                                        onClick={() => void onDelete(camp.id)}
                                                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-gray-400 shadow-sm transition-all hover:bg-red-50 hover:text-red-600 active:scale-[0.92] active:bg-red-100"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>

                                            <button
                                                onClick={() => void onLaunch(camp.id)}
                                                disabled={
                                                    launchingId === camp.id ||
                                                    camp.status === 'running' ||
                                                    camp.status === 'completed'
                                                }
                                                className="ml-2 h-10 rounded-xl bg-gray-900 px-6 text-xs font-bold text-white shadow-sm transition-all hover:bg-black active:scale-[0.97] disabled:opacity-40"
                                            >
                                                {launchingId === camp.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : camp.status === 'completed' ? (
                                                    'Launched'
                                                ) : (
                                                    'Launch now'
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                    {camp.template_json?.content && (
                                        <div className="mt-4 line-clamp-2 rounded-xl border border-gray-100 bg-gray-50/50 p-4 text-xs font-medium text-gray-500 italic">
                                            "{camp.template_json.content}"
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
