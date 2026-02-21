'use client';

import { useState } from 'react';
import { Loader2, Megaphone } from 'lucide-react';

export type CampaignRow = {
    id: string;
    name: string;
    channel: 'sms' | 'email' | 'whatsapp' | 'in_app';
    status: 'draft' | 'scheduled' | 'running' | 'completed' | 'cancelled';
    segment_id: string | null;
    scheduled_at: string | null;
    tracking?: {
        total: number;
        sent: number;
        opened: number;
        clicked: number;
        converted: number;
        failed: number;
    };
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
        name: string;
        channel: CampaignRow['channel'];
        segment_id?: string;
        scheduled_at?: string;
    }) => Promise<void>;
    onLaunch: (campaignId: string) => Promise<void>;
}

export function CampaignBuilder({
    campaigns,
    segments,
    loading,
    creating,
    launchingId,
    onCreate,
    onLaunch,
}: CampaignBuilderProps) {
    const [name, setName] = useState('');
    const [channel, setChannel] = useState<CampaignRow['channel']>('sms');
    const [segmentId, setSegmentId] = useState('');
    const [schedule, setSchedule] = useState('');

    const submit = async () => {
        const trimmed = name.trim();
        if (trimmed.length < 2) {
            return;
        }

        await onCreate({
            name: trimmed,
            channel,
            ...(segmentId ? { segment_id: segmentId } : {}),
            ...(schedule ? { scheduled_at: new Date(schedule).toISOString() } : {}),
        });

        setName('');
        setChannel('sms');
        setSegmentId('');
        setSchedule('');
    };

    return (
        <section className="rounded-[2rem] border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Campaign Builder</h3>
                    <p className="text-sm text-gray-500">
                        Create guest campaigns and launch with one click.
                    </p>
                </div>
                <Megaphone className="h-5 w-5 text-gray-500" />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
                <input
                    value={name}
                    onChange={event => setName(event.target.value)}
                    placeholder="Campaign name"
                    className="h-10 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-gray-400"
                />
                <select
                    value={channel}
                    onChange={event => setChannel(event.target.value as CampaignRow['channel'])}
                    className="h-10 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-gray-400"
                >
                    <option value="sms">SMS</option>
                    <option value="email">Email</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="in_app">In-App</option>
                </select>
                <select
                    value={segmentId}
                    onChange={event => setSegmentId(event.target.value)}
                    className="h-10 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-gray-400"
                >
                    <option value="">All guests</option>
                    {segments.map(segment => (
                        <option key={segment.id} value={segment.id}>
                            {segment.name}
                        </option>
                    ))}
                </select>
                <input
                    type="datetime-local"
                    value={schedule}
                    onChange={event => setSchedule(event.target.value)}
                    className="h-10 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-gray-400"
                />
                <button
                    type="button"
                    onClick={submit}
                    disabled={creating || name.trim().length < 2}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-black px-4 text-sm font-semibold text-white disabled:opacity-50"
                >
                    {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Create Campaign
                </button>
            </div>

            {loading ? (
                <p className="mt-4 text-sm text-gray-500">Loading campaigns...</p>
            ) : campaigns.length === 0 ? (
                <p className="mt-4 text-sm text-gray-500">No campaigns yet.</p>
            ) : (
                <div className="mt-4 space-y-2">
                    {campaigns.map(campaign => (
                        <div key={campaign.id} className="rounded-xl border border-gray-100 p-3">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">
                                        {campaign.name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {campaign.channel.toUpperCase()} |{' '}
                                        {campaign.tracking?.total ?? 0} deliveries |{' '}
                                        {campaign.tracking?.converted ?? 0} conversions
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="rounded-lg bg-gray-100 px-2 py-1 text-[11px] font-semibold text-gray-700 uppercase">
                                        {campaign.status}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => void onLaunch(campaign.id)}
                                        disabled={
                                            launchingId === campaign.id ||
                                            campaign.status === 'running'
                                        }
                                        className="inline-flex h-8 items-center gap-2 rounded-lg bg-gray-900 px-3 text-xs font-semibold text-white disabled:opacity-50"
                                    >
                                        {launchingId === campaign.id ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : null}
                                        Launch
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
