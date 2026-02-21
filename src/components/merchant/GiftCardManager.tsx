'use client';

import { useState } from 'react';
import { CreditCard, Loader2 } from 'lucide-react';
import { formatETBCurrency } from '@/lib/format/et';
import type { AppLocale } from '@/lib/i18n/locale';

export type GiftCardRow = {
    id: string;
    code: string;
    currency: string;
    current_balance: number;
    initial_balance: number;
    status: 'active' | 'redeemed' | 'expired' | 'voided';
    created_at: string;
};

interface GiftCardManagerProps {
    cards: GiftCardRow[];
    loading: boolean;
    creating: boolean;
    redeemingId: string | null;
    locale: AppLocale;
    onCreate: (payload: {
        initial_balance: number;
        currency: string;
        expires_at?: string;
    }) => Promise<void>;
    onRedeem: (giftCardId: string, amount: number) => Promise<void>;
}

export function GiftCardManager({
    cards,
    loading,
    creating,
    redeemingId,
    locale,
    onCreate,
    onRedeem,
}: GiftCardManagerProps) {
    const [balance, setBalance] = useState('250');
    const [currency, setCurrency] = useState('ETB');
    const [expiresAt, setExpiresAt] = useState('');
    const [redeemById, setRedeemById] = useState<Record<string, string>>({});

    const submitCreate = async () => {
        const parsed = Number(balance);
        if (!Number.isFinite(parsed) || parsed <= 0) return;

        await onCreate({
            initial_balance: parsed,
            currency,
            ...(expiresAt ? { expires_at: new Date(expiresAt).toISOString() } : {}),
        });
        setBalance('250');
        setExpiresAt('');
    };

    return (
        <section className="rounded-[2rem] border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Gift Card Manager</h3>
                    <p className="text-sm text-gray-500">
                        Issue and redeem gift cards directly from merchant ops.
                    </p>
                </div>
                <CreditCard className="h-5 w-5 text-gray-500" />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
                <input
                    value={balance}
                    onChange={event => setBalance(event.target.value)}
                    inputMode="decimal"
                    placeholder="Initial balance"
                    className="h-10 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-gray-400"
                />
                <input
                    value={currency}
                    onChange={event => setCurrency(event.target.value.toUpperCase())}
                    placeholder="Currency"
                    className="h-10 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-gray-400"
                />
                <input
                    type="date"
                    value={expiresAt}
                    onChange={event => setExpiresAt(event.target.value)}
                    className="h-10 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-gray-400"
                />
                <button
                    type="button"
                    onClick={submitCreate}
                    disabled={creating}
                    className="bg-brand-crimson inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-white disabled:opacity-50"
                >
                    {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Issue Card
                </button>
            </div>

            {loading ? (
                <p className="mt-4 text-sm text-gray-500">Loading gift cards...</p>
            ) : cards.length === 0 ? (
                <p className="mt-4 text-sm text-gray-500">No gift cards yet.</p>
            ) : (
                <div className="mt-4 space-y-2">
                    {cards.map(card => {
                        const redeemValue = redeemById[card.id] ?? '';
                        return (
                            <div key={card.id} className="rounded-xl border border-gray-100 p-3">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">
                                            {card.code}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {formatETBCurrency(Number(card.current_balance), {
                                                locale,
                                            })}{' '}
                                            /{' '}
                                            {formatETBCurrency(Number(card.initial_balance), {
                                                locale,
                                            })}
                                        </p>
                                    </div>
                                    <span className="rounded-lg bg-gray-100 px-2 py-1 text-[11px] font-semibold text-gray-700 uppercase">
                                        {card.status}
                                    </span>
                                </div>
                                <div className="mt-3 flex gap-2">
                                    <input
                                        value={redeemValue}
                                        onChange={event =>
                                            setRedeemById(prev => ({
                                                ...prev,
                                                [card.id]: event.target.value,
                                            }))
                                        }
                                        inputMode="decimal"
                                        placeholder="Redeem amount"
                                        className="h-9 flex-1 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-gray-400"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const amount = Number(redeemValue);
                                            if (!Number.isFinite(amount) || amount <= 0) return;
                                            void onRedeem(card.id, amount);
                                        }}
                                        disabled={
                                            redeemingId === card.id || card.status !== 'active'
                                        }
                                        className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-gray-900 px-3 text-xs font-semibold text-white disabled:opacity-50"
                                    >
                                        {redeemingId === card.id ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : null}
                                        Redeem
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
