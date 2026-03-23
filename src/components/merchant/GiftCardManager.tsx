'use client';

import { useState, useMemo } from 'react';
import { CreditCard, Loader2, Plus, Search, Trash2, Archive, UserPlus, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatETBCurrency } from '@/lib/format/et';
import type { AppLocale } from '@/lib/i18n/locale';
import type { GuestDirectoryRow } from '@/components/merchant/GuestDirectory';

export type GiftCardRow = {
    id: string;
    code: string;
    initial_balance: number;
    current_balance: number;
    currency: string;
    status: 'active' | 'redeemed' | 'expired' | 'archived';
    expires_at: string | null;
    created_at: string;
    guest_id?: string;
    guest_name?: string;
};

interface GiftCardManagerProps {
    cards: GiftCardRow[];
    guests: GuestDirectoryRow[];
    loading: boolean;
    creating: boolean;
    redeemingId: string | null;
    locale: AppLocale;
    onCreate: (payload: {
        code?: string;
        initial_balance: number;
        currency: string;
        expires_at?: string;
        guest_id?: string;
    }) => Promise<void>;
    onRedeem: (cardId: string, amount: number) => Promise<void>;
    onDelete?: (cardId: string) => Promise<void>;
    onArchive?: (cardId: string) => Promise<void>;
}

export function GiftCardManager({
    cards,
    guests,
    loading,
    creating,
    redeemingId,
    locale,
    onCreate,
    onRedeem,
    onDelete,
    onArchive,
}: GiftCardManagerProps) {
    const [code, setCode] = useState('');
    const [balance, setBalance] = useState('250');
    const [expiresAt, setExpiresAt] = useState('');
    const [selectedGuestId, setSelectedGuestId] = useState('');
    const [guestQuery, setGuestQuery] = useState('');
    const [redeemById, setRedeemById] = useState<Record<string, string>>({});

    const filteredGuests = useMemo(() => {
        if (!guestQuery.trim()) return [];
        return guests
            .filter(
                g =>
                    g.name?.toLowerCase().includes(guestQuery.toLowerCase()) ||
                    g.id.toLowerCase().includes(guestQuery.toLowerCase())
            )
            .slice(0, 5);
    }, [guests, guestQuery]);

    const submitCreate = async () => {
        const parsed = Number(balance);
        if (!Number.isFinite(parsed) || parsed <= 0) return;

        await onCreate({
            ...(code.trim() ? { code: code.trim() } : {}),
            initial_balance: parsed,
            currency: 'ETB',
            ...(expiresAt ? { expires_at: new Date(expiresAt).toISOString() } : {}),
            ...(selectedGuestId ? { guest_id: selectedGuestId } : {}),
        });
        setCode('');
        setBalance('250');
        setExpiresAt('');
        setSelectedGuestId('');
        setGuestQuery('');
    };

    return (
        <div className="grid min-h-[500px] grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left: Issuance Form */}
            <div className="flex flex-col rounded-3xl bg-white p-6 shadow-xl shadow-gray-200/50 lg:col-span-4">
                <div className="mb-6">
                    <h3 className="text-xl leading-tight font-bold text-gray-900">
                        Issue gift card
                    </h3>
                    <p className="mt-1 text-sm font-medium text-gray-500">
                        Create a new balance for a specific guest.
                    </p>
                </div>

                <div className="flex-1 space-y-5 rounded-4xl border border-gray-100 bg-gray-50/40 p-5">
                    <div className="relative space-y-1.5">
                        <label className="ml-1 text-xs font-bold tracking-tight text-gray-400">
                            Select guest
                        </label>
                        <div className="relative">
                            <input
                                value={guestQuery}
                                onChange={event => {
                                    setGuestQuery(event.target.value);
                                    if (selectedGuestId) setSelectedGuestId('');
                                }}
                                placeholder="Search guests by name..."
                                className="h-12 w-full rounded-xl border border-gray-200 bg-white pr-4 pl-10 text-sm font-semibold transition-all outline-none placeholder:text-gray-300 focus:border-gray-400"
                            />
                            <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            {selectedGuestId && (
                                <div className="absolute top-1/2 right-3 h-2 w-2 -translate-y-1/2 rounded-full bg-emerald-500" />
                            )}
                        </div>
                        {guestQuery && !selectedGuestId && filteredGuests.length > 0 && (
                            <div className="z-10 mt-2 max-h-32 overflow-y-auto rounded-xl border border-gray-100 bg-white p-1.5 shadow-lg transition-all">
                                {filteredGuests.map(g => (
                                    <button
                                        key={g.id}
                                        onClick={() => {
                                            setSelectedGuestId(g.id);
                                            setGuestQuery(g.name || `Guest ${g.id.slice(0, 8)}`);
                                        }}
                                        className={cn(
                                            'w-full rounded-lg px-3 py-2 text-left text-xs font-bold transition-all',
                                            selectedGuestId === g.id
                                                ? 'bg-brand-crimson/5 text-brand-crimson'
                                                : 'text-gray-600 hover:bg-gray-50'
                                        )}
                                    >
                                        {g.name || `Guest ${g.id.slice(0, 8)}`}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="ml-1 text-xs font-bold tracking-tight text-gray-400">
                                Card code
                            </label>
                            <input
                                value={code}
                                onChange={event => setCode(event.target.value)}
                                placeholder="Auto"
                                className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold transition-all outline-none focus:border-gray-400"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="ml-1 text-xs font-bold tracking-tight text-gray-400">
                                Balance (ETB)
                            </label>
                            <input
                                value={balance}
                                onChange={event => setBalance(event.target.value)}
                                inputMode="decimal"
                                className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-bold transition-all outline-none focus:border-gray-400"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="ml-1 text-xs font-bold tracking-tight text-gray-400">
                            Expiry date
                        </label>
                        <input
                            type="date"
                            value={expiresAt}
                            onChange={event => setExpiresAt(event.target.value)}
                            className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium transition-all outline-none focus:border-gray-400"
                        />
                    </div>

                    <div className="mt-auto pt-4">
                        <button
                            type="button"
                            onClick={submitCreate}
                            disabled={creating}
                            className="bg-brand-crimson shadow-crimson-900/10 flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-bold text-white shadow-xl transition-all active:scale-[0.98] disabled:opacity-50"
                        >
                            {creating ? (
                                <Loader2 className="h-5 w-5 animate-spin text-white/70" />
                            ) : (
                                <Gift className="h-5 w-5" />
                            )}
                            Issue gift card
                        </button>
                    </div>
                </div>
            </div>

            {/* Right: Management List */}
            <div className="flex flex-col overflow-hidden rounded-3xl bg-white p-6 shadow-xl shadow-gray-200/50 lg:col-span-8">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h3 className="text-xl leading-tight font-bold text-gray-900">
                            Card management
                        </h3>
                        <p className="mt-1 text-sm font-medium text-gray-500">
                            Currently managing {cards.length} issued gift cards.
                        </p>
                    </div>
                    <CreditCard className="h-6 w-6 text-gray-300" />
                </div>

                <div className="flex-1 overflow-hidden">
                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3, 4].map(i => (
                                <div
                                    key={i}
                                    className="h-24 w-full animate-pulse rounded-2xl bg-gray-50"
                                />
                            ))}
                        </div>
                    ) : cards.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center rounded-4xl border border-dashed border-gray-200 bg-gray-50/30 py-20">
                            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100">
                                <CreditCard className="h-6 w-6 text-gray-300" />
                            </div>
                            <p className="text-sm font-bold text-gray-500">No cards issued</p>
                            <p className="mt-1 text-xs font-medium text-gray-400">
                                Start by issuing your first gift card.
                            </p>
                        </div>
                    ) : (
                        <div className="no-scrollbar h-[400px] space-y-4 overflow-y-auto pr-2 pb-4">
                            {cards.map(card => {
                                const redeemValue = redeemById[card.id] ?? '';
                                return (
                                    <div
                                        key={card.id}
                                        className="group rounded-2xl border-none bg-white p-5 shadow-sm transition-all hover:bg-gray-50/30"
                                    >
                                        <div className="mb-4 flex items-start justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 font-mono text-xs font-bold text-gray-400 transition-all group-hover:bg-white group-hover:shadow-sm">
                                                    CC
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-md leading-none font-extrabold tracking-tight text-gray-900">
                                                            {card.code}
                                                        </p>
                                                        {card.guest_name && (
                                                            <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-gray-400">
                                                                {card.guest_name}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="mt-1 text-sm font-bold text-emerald-600">
                                                        {formatETBCurrency(
                                                            Number(card.current_balance),
                                                            { locale }
                                                        )}{' '}
                                                        balance
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={cn(
                                                        'rounded-xl border px-3 py-1 text-[11px] font-bold capitalize transition-all',
                                                        card.status === 'active'
                                                            ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                                                            : card.status === 'archived'
                                                              ? 'border-gray-200 bg-gray-100 text-gray-400'
                                                              : 'border-gray-200 bg-gray-100 text-gray-500'
                                                    )}
                                                >
                                                    {card.status}
                                                </span>
                                                <div className="flex items-center gap-1">
                                                    {onArchive && (
                                                        <button
                                                            onClick={() => void onArchive(card.id)}
                                                            className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-50 text-gray-400 shadow-sm transition-all hover:bg-gray-100 hover:text-gray-900 active:scale-[0.92] active:bg-gray-200"
                                                            title="Archive card"
                                                        >
                                                            <Archive className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                    {onDelete && (
                                                        <button
                                                            onClick={() => void onDelete(card.id)}
                                                            className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-50 text-gray-400 shadow-sm transition-all hover:bg-red-50 hover:text-red-600 active:scale-[0.92] active:bg-red-100"
                                                            title="Delete card"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2 border-t border-gray-50 pt-4">
                                            <div className="flex items-center justify-between px-1">
                                                <p className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">
                                                    Process redemption (at counter)
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="relative flex-1">
                                                    <input
                                                        value={redeemValue}
                                                        onChange={event =>
                                                            setRedeemById(prev => ({
                                                                ...prev,
                                                                [card.id]: event.target.value,
                                                            }))
                                                        }
                                                        inputMode="decimal"
                                                        placeholder="Enter amount to apply"
                                                        className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-xs font-bold transition-all outline-none focus:border-gray-400 focus:ring-4 focus:ring-gray-100/50"
                                                    />
                                                    <div className="absolute top-1/2 right-3 -translate-y-1/2 text-[10px] font-bold text-gray-400">
                                                        ETB
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const amount = Number(redeemValue);
                                                        if (!Number.isFinite(amount) || amount <= 0)
                                                            return;
                                                        void onRedeem(card.id, amount);
                                                    }}
                                                    disabled={
                                                        redeemingId === card.id ||
                                                        card.status !== 'active'
                                                    }
                                                    className="h-10 rounded-xl bg-gray-900 px-6 text-xs font-bold text-white transition-all hover:bg-black active:scale-[0.97] disabled:opacity-40"
                                                >
                                                    {redeemingId === card.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        'Apply'
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
