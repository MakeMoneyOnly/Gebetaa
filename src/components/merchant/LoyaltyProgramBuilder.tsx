'use client';

import { useMemo, useState } from 'react';
import { Loader2, Plus } from 'lucide-react';

export type LoyaltyProgramRow = {
    id: string;
    name: string;
    status: 'draft' | 'active' | 'paused' | 'archived';
    created_at: string;
};

interface LoyaltyProgramBuilderProps {
    programs: LoyaltyProgramRow[];
    loading: boolean;
    creating: boolean;
    onCreate: (payload: { name: string; status: LoyaltyProgramRow['status'] }) => Promise<void>;
}

export function LoyaltyProgramBuilder({
    programs,
    loading,
    creating,
    onCreate,
}: LoyaltyProgramBuilderProps) {
    const [name, setName] = useState('');
    const [status, setStatus] = useState<LoyaltyProgramRow['status']>('draft');

    const activeCount = useMemo(
        () => programs.filter(program => program.status === 'active').length,
        [programs]
    );

    const submit = async () => {
        const trimmed = name.trim();
        if (trimmed.length < 2) {
            return;
        }

        await onCreate({ name: trimmed, status });
        setName('');
        setStatus('draft');
    };

    return (
        <section className="rounded-[2rem] border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Loyalty Program Builder</h3>
                    <p className="text-sm text-gray-500">
                        Create points programs and activate them for guests.
                    </p>
                </div>
                <div className="rounded-xl bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700">
                    Active: {activeCount}
                </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px_auto]">
                <input
                    value={name}
                    onChange={event => setName(event.target.value)}
                    placeholder="Program name"
                    className="h-10 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-gray-400"
                />
                <select
                    value={status}
                    onChange={event => setStatus(event.target.value as LoyaltyProgramRow['status'])}
                    className="h-10 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-gray-400"
                >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="archived">Archived</option>
                </select>
                <button
                    type="button"
                    onClick={submit}
                    disabled={creating || name.trim().length < 2}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-black px-4 text-sm font-semibold text-white disabled:opacity-50"
                >
                    {creating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Plus className="h-4 w-4" />
                    )}
                    Create
                </button>
            </div>

            {loading ? (
                <p className="mt-4 text-sm text-gray-500">Loading programs...</p>
            ) : programs.length === 0 ? (
                <p className="mt-4 text-sm text-gray-500">No programs yet.</p>
            ) : (
                <div className="mt-4 space-y-2">
                    {programs.map(program => (
                        <div
                            key={program.id}
                            className="flex items-center justify-between rounded-xl border border-gray-100 px-3 py-2"
                        >
                            <div>
                                <p className="text-sm font-semibold text-gray-900">
                                    {program.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                    Created{' '}
                                    {new Date(program.created_at).toLocaleDateString('en-ET')}
                                </p>
                            </div>
                            <span className="rounded-lg bg-gray-100 px-2 py-1 text-[11px] font-semibold text-gray-700 uppercase">
                                {program.status}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
