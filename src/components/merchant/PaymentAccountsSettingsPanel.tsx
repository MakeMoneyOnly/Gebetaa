'use client';

import { useEffect, useMemo, useState } from 'react';
import {
    AlertCircle,
    Building2,
    CheckCircle2,
    ChevronDown,
    Info,
    Landmark,
    Loader2,
    Save,
    WalletCards,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

type ChapaBankOption = {
    id: string;
    name: string;
    code: string;
};

type DestinationType = 'bank' | 'wallet';

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

type PaymentAccountsSettingsPanelProps = {
    initialSettings: PaymentSettings;
    initialBanks: ChapaBankOption[];
    initialDirectoryUnavailable: boolean;
    onSettingsSaved?: (updated: PaymentSettings) => void;
};

const WALLET_KEYWORDS = ['telebirr', 'cbebirr', 'ebirr', 'mpesa', 'm-pesa', 'kacha', 'yaya'];

function detectDestinationType(option?: ChapaBankOption | null): DestinationType {
    const haystack = `${option?.name ?? ''} ${option?.code ?? ''}`.toLowerCase();
    return WALLET_KEYWORDS.some(keyword => haystack.includes(keyword)) ? 'wallet' : 'bank';
}

function formatStatusLabel(status: string) {
    if (status === 'active') return 'Connected';
    if (status === 'pending_review') return 'Review pending';
    if (status === 'verification_required') return 'Not configured';
    if (status === 'failed') return 'Needs attention';
    if (status === 'provisioning') return 'Provisioning';
    return 'Not configured';
}

function formatProvisionedAt(value: string | null) {
    if (!value) {
        return null;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(date);
}

export function PaymentAccountsSettingsPanel({
    initialSettings,
    initialBanks,
    initialDirectoryUnavailable,
    onSettingsSaved,
}: PaymentAccountsSettingsPanelProps) {
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [options] = useState<ChapaBankOption[]>(initialBanks);
    const [directoryUnavailable] = useState(initialDirectoryUnavailable);
    const [settings, setSettings] = useState<PaymentSettings>(initialSettings);

    const currentOption =
        options.find(option => option.code === settings.settlement_bank_code) ?? null;
    const [destinationType, setDestinationType] = useState<DestinationType>(
        detectDestinationType(currentOption)
    );
    const [settlementBankCode, setSettlementBankCode] = useState(currentOption?.code ?? '');
    const [settlementAccountName, setSettlementAccountName] = useState(
        initialSettings.settlement_account_name
    );
    const [settlementAccountNumber, setSettlementAccountNumber] = useState(
        initialSettings.settlement_account_number_masked ?? ''
    );

    // Sync state when parent passes new initialSettings (e.g. from a background refresh)
    useEffect(() => {
        setSettings(initialSettings);
        setSettlementBankCode(initialSettings.settlement_bank_code ?? '');
        setSettlementAccountName(initialSettings.settlement_account_name ?? '');
        setSettlementAccountNumber(initialSettings.settlement_account_number_masked ?? '');
        const currentOption =
            options.find(option => option.code === initialSettings.settlement_bank_code) ?? null;
        setDestinationType(detectDestinationType(currentOption));
    }, [initialSettings, options]);

    const statusLabel = useMemo(
        () => formatStatusLabel(settings.settlement_status),
        [settings.settlement_status]
    );
    const provisionedAt = useMemo(
        () => formatProvisionedAt(settings.provisioned_at),
        [settings.provisioned_at]
    );
    const statusClasses =
        settings.settlement_status === 'active'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
            : settings.settlement_status === 'pending_review'
              ? 'border-blue-200 bg-blue-50 text-blue-700'
              : settings.settlement_status === 'verification_required' ||
                  settings.settlement_status === 'failed'
                ? 'border-amber-200 bg-amber-50 text-amber-700'
                : 'border-gray-200 bg-gray-50 text-gray-700';
    const bankOptions = useMemo(
        () => options.filter(option => detectDestinationType(option) === 'bank'),
        [options]
    );
    const walletOptions = useMemo(
        () => options.filter(option => detectDestinationType(option) === 'wallet'),
        [options]
    );
    const visibleOptions = destinationType === 'wallet' ? walletOptions : bankOptions;
    const hasSelectedDestination = visibleOptions.some(
        option => option.code === settlementBankCode
    );
    const hasVisibleOptions = visibleOptions.length > 0;
    const savedDestinationMissing =
        Boolean(settings.settlement_bank_code) &&
        !options.some(option => option.code === settings.settlement_bank_code);

    // Check if any changes have been made (compare against current saved settings)
    const hasChanges = useMemo(() => {
        const bankCodeChanged = settlementBankCode !== (currentOption?.code ?? '');
        const accountNameChanged = settlementAccountName !== settings.settlement_account_name;
        // Check if account number changed from the masked value
        const accountNumberChanged =
            settlementAccountNumber !== settings.settlement_account_number_masked;

        return bankCodeChanged || accountNameChanged || accountNumberChanged;
    }, [
        settlementBankCode,
        settlementAccountName,
        settlementAccountNumber,
        currentOption?.code,
        settings.settlement_account_name,
        settings.settlement_account_number_masked,
    ]);

    const handleSave = async () => {
        try {
            setSaving(true);
            setError(null);

            // Determine if the user entered a new account number or just has the masked one
            // Masked numbers contain asterisks, so if there are asterisks, it's the masked value
            const hasMaskedNumber = settlementAccountNumber.includes('*');
            const accountNumberToSend = hasMaskedNumber ? '' : settlementAccountNumber.trim();

            const response = await fetch('/api/settings/payments', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    settlement_bank_code: settlementBankCode,
                    settlement_account_name: settlementAccountName,
                    settlement_account_number: accountNumberToSend,
                }),
            });
            const payload = await response.json();

            if (!response.ok) {
                throw new Error(payload?.error ?? 'Failed to save payment account settings.');
            }

            // Update settings with the full response from the server
            const nextSettings = payload?.data as PaymentSettings | undefined;

            if (nextSettings) {
                setSettings(nextSettings);
                setSettlementBankCode(nextSettings.settlement_bank_code ?? '');
                setSettlementAccountName(nextSettings.settlement_account_name ?? '');
                setSettlementAccountNumber(nextSettings.settlement_account_number_masked ?? '');

                // Update destination type based on the saved bank
                const savedOption =
                    options.find(option => option.code === nextSettings.settlement_bank_code) ??
                    null;
                setDestinationType(detectDestinationType(savedOption));

                // Notify parent so lifted state stays in sync across tab switches
                onSettingsSaved?.(nextSettings);
            }

            toast.success('Payout account settings saved.');
        } catch (saveError) {
            const message =
                saveError instanceof Error
                    ? saveError.message
                    : 'Failed to save payment account settings.';
            setError(message);
            toast.error(message);
        } finally {
            setSaving(false);
        }
    };

    // Check if the last_error is actually a success message
    const lastErrorIsSuccess =
        settings.last_error?.toLowerCase().includes('success') ||
        settings.last_error?.toLowerCase().includes('created') ||
        settings.last_error?.toLowerCase().includes('approved');

    return (
        <div className="max-w-3xl space-y-4 rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Payment Accounts</h2>
                    <p className="mt-1 text-sm font-medium text-gray-500">
                        Connect the payout destination where Chapa should settle hosted guest
                        payments for this restaurant.
                    </p>
                </div>
                <span
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusClasses}`}
                >
                    {statusLabel}
                </span>
            </div>

            {!settings.provider_available && (
                <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <div className="space-y-1 text-sm">
                        <p className="font-semibold">
                            Chapa is not configured on this environment.
                        </p>
                        <p>
                            Add a valid `CHAPA_SECRET_KEY` on the server before merchants can save
                            payout destinations.
                        </p>
                    </div>
                </div>
            )}

            {error && (
                <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}

            {directoryUnavailable && (
                <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-blue-800">
                    <Info className="mt-0.5 h-4 w-4 shrink-0" />
                    <p className="text-sm font-medium">
                        Chapa's payout directory is temporarily unavailable. Retry in a moment
                        before changing the destination on file.
                    </p>
                </div>
            )}

            {savedDestinationMissing && (
                <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <div className="space-y-1 text-sm">
                        <p className="font-semibold">
                            Previously saved payout destination is unavailable
                        </p>
                        <p>
                            Chapa's current live directory does not include code{' '}
                            <span className="font-semibold">{settings.settlement_bank_code}</span>.
                            Choose a new bank or wallet destination to continue.
                        </p>
                    </div>
                </div>
            )}

            <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                        <WalletCards className="h-4 w-4" />
                        Payout destination
                    </div>
                    <p className="mt-2 text-sm font-medium text-gray-600">
                        Live Chapa directory for bank and wallet subaccount destinations
                    </p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                        <CheckCircle2 className="h-4 w-4" />
                        Current hosted checkout fee
                    </div>
                    <p className="mt-2 text-sm font-medium text-gray-600">
                        {(settings.hosted_checkout_fee_percentage * 100).toFixed(0)}% on
                        Chapa-hosted guest payments
                    </p>
                </div>
            </div>

            <label className="block space-y-2">
                <span className="text-sm font-semibold text-gray-700">Payout destination</span>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => {
                            setDestinationType('bank');
                            setSettlementBankCode('');
                        }}
                        className={`inline-flex h-10 items-center rounded-xl px-4 text-sm font-semibold transition ${
                            destinationType === 'bank'
                                ? 'bg-black text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        Banks
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setDestinationType('wallet');
                            setSettlementBankCode('');
                        }}
                        className={`inline-flex h-10 items-center rounded-xl px-4 text-sm font-semibold transition ${
                            destinationType === 'wallet'
                                ? 'bg-black text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        Wallets
                    </button>
                </div>
                <div className="relative">
                    <Landmark className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <select
                        value={settlementBankCode}
                        onChange={event => setSettlementBankCode(event.target.value)}
                        disabled={!hasVisibleOptions}
                        className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-3 pr-10 pl-10 text-sm outline-none focus:border-gray-400 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                    >
                        <option value="">
                            {!hasVisibleOptions
                                ? directoryUnavailable
                                    ? 'Directory unavailable - please retry'
                                    : `No ${destinationType === 'wallet' ? 'wallets' : 'banks'} available`
                                : destinationType === 'wallet'
                                  ? 'Select a payout wallet'
                                  : 'Select a payout bank'}
                        </option>
                        {visibleOptions.map(option => (
                            <option key={option.code} value={option.code}>
                                {option.name}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </div>
            </label>

            <label className="block space-y-1">
                <span className="text-sm font-semibold text-gray-700">
                    {destinationType === 'wallet' ? 'Wallet holder name' : 'Account holder name'}
                </span>
                <div className="relative">
                    <Building2 className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={settlementAccountName}
                        onChange={event => setSettlementAccountName(event.target.value)}
                        placeholder={
                            destinationType === 'wallet'
                                ? 'Wallet owner or business name'
                                : 'Business or account holder name'
                        }
                        className="w-full rounded-xl border border-gray-200 px-10 py-3 text-sm outline-none focus:border-gray-400"
                    />
                </div>
            </label>

            <label className="block space-y-1">
                <span className="text-sm font-semibold text-gray-700">
                    {destinationType === 'wallet' ? 'Wallet number' : 'Account number'}
                </span>
                <input
                    type="text"
                    value={settlementAccountNumber}
                    onChange={event => setSettlementAccountNumber(event.target.value)}
                    placeholder={
                        destinationType === 'wallet'
                            ? 'Enter the full wallet number'
                            : 'Enter the full account number'
                    }
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-gray-400"
                />
            </label>

            <div className="space-y-2 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                {provisionedAt && (
                    <p>
                        Last connected:{' '}
                        <span className="font-semibold text-gray-800">{provisionedAt}</span>
                    </p>
                )}
                <p>
                    Enter details exactly as registered with your bank or wallet provider. Leave the
                    number blank to keep the current destination.
                </p>
            </div>

            {settings.last_error &&
                settings.settlement_status !== 'active' &&
                !lastErrorIsSuccess && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                        <p className="font-semibold">Last Chapa error</p>
                        <p className="mt-1">{settings.last_error}</p>
                    </div>
                )}

            <div className="flex justify-end pt-2">
                <button
                    onClick={() => void handleSave()}
                    disabled={saving || !hasSelectedDestination || !hasChanges}
                    className="bg-brand-crimson inline-flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold text-white hover:bg-[#a0151e] disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Save className="h-4 w-4" />
                    )}
                    Save Payout Account
                </button>
            </div>
        </div>
    );
}
