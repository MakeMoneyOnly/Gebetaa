import { SettingsClient } from './SettingsClient';
import { createClient } from '@/lib/supabase/server';
import { listChapaBanks, isChapaConfigured } from '@/lib/services/chapaService';
import type { PlanLevel } from '@/lib/subscription/plan-types';

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

type PlanSettings = {
    plan: PlanLevel;
    plan_expires_at: string | null;
    plan_tier: number;
};

type BankOption = {
    id: string;
    name: string;
    code: string;
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

const defaultPayments: PaymentSettings = {
    provider: 'chapa',
    provider_available: true,
    settlement_bank_code: '',
    settlement_bank_name: '',
    settlement_account_name: '',
    settlement_account_number_masked: '',
    settlement_status: 'not_configured',
    subaccount_id: null,
    last_error: null,
    provisioned_at: null,
    hosted_checkout_fee_percentage: 0.03,
};

const defaultPlan: PlanSettings = {
    plan: 'free',
    plan_expires_at: null,
    plan_tier: 0,
};

async function getPaymentSettings(
    supabase: Awaited<ReturnType<typeof createClient>>,
    restaurantId: string
): Promise<PaymentSettings> {
    const { data, error } = await supabase
        .from('restaurants')
        .select(
            `
            chapa_settlement_bank_code,
            chapa_settlement_bank_name,
            chapa_settlement_account_name,
            chapa_settlement_account_number_masked,
            chapa_subaccount_status,
            chapa_subaccount_id,
            chapa_subaccount_last_error,
            chapa_subaccount_provisioned_at,
            hosted_checkout_fee_percentage
        `
        )
        .eq('id', restaurantId)
        .single();

    if (error || !data) {
        console.error('Error fetching payment settings:', error);
        return {
            ...defaultPayments,
            provider_available: isChapaConfigured(),
        };
    }

    return {
        ...defaultPayments,
        provider_available: isChapaConfigured(),
        settlement_bank_code: data.chapa_settlement_bank_code ?? '',
        settlement_bank_name: data.chapa_settlement_bank_name ?? '',
        settlement_account_name: data.chapa_settlement_account_name ?? '',
        settlement_account_number_masked: data.chapa_settlement_account_number_masked ?? '',
        settlement_status: data.chapa_subaccount_status ?? 'not_configured',
        subaccount_id: data.chapa_subaccount_id,
        last_error: data.chapa_subaccount_last_error,
        provisioned_at: data.chapa_subaccount_provisioned_at,
        hosted_checkout_fee_percentage: data.hosted_checkout_fee_percentage ?? 0.03,
    };
}

async function getPlanSettings(
    supabase: Awaited<ReturnType<typeof createClient>>,
    restaurantId: string
): Promise<PlanSettings> {
    // Use type assertion to handle columns that may not be in the generated types yet
    const { data, error } = await supabase
        .from('restaurants')
        .select('id')
        .eq('id', restaurantId)
        .single();

    if (error || !data) {
        console.error('Error fetching plan settings:', error);
        return defaultPlan;
    }

    // Plan settings are currently defaulted - when plan columns are added to the schema,
    // this function can be updated to fetch actual plan data
    const planTier: Record<string, number> = {
        free: 0,
        pro: 1,
        enterprise: 2,
    };

    // Return default plan settings for now
    return {
        plan: 'free',
        plan_expires_at: null,
        plan_tier: planTier['free'] ?? 0,
    };
}

async function getBanks(): Promise<{ banks: BankOption[]; directoryUnavailable: boolean }> {
    if (!isChapaConfigured()) {
        console.log('Chapa not configured - skipping bank fetch');
        return { banks: [], directoryUnavailable: true };
    }

    try {
        const banks = await listChapaBanks();
        console.log(`Successfully fetched ${banks.length} banks from Chapa`);
        return { banks, directoryUnavailable: false };
    } catch (error) {
        console.error('Failed to fetch banks from Chapa:', error);
        return { banks: [], directoryUnavailable: true };
    }
}

async function getRestaurantId(
    supabase: Awaited<ReturnType<typeof createClient>>
): Promise<string | null> {
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return null;
    }

    const { data: staffData } = await supabase
        .from('restaurant_staff')
        .select('restaurant_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

    return staffData?.restaurant_id ?? null;
}

// Disable caching for this page to always fetch fresh data
export const revalidate = 0;

export default async function SettingsPage() {
    const supabase = await createClient();
    const restaurantId = await getRestaurantId(supabase);

    // Fetch all data in parallel
    const [payments, plan, banksResult] = await Promise.all([
        restaurantId
            ? getPaymentSettings(supabase, restaurantId)
            : Promise.resolve({
                  ...defaultPayments,
                  provider_available: isChapaConfigured(),
              }),
        restaurantId ? getPlanSettings(supabase, restaurantId) : Promise.resolve(defaultPlan),
        getBanks(),
    ]);

    return (
        <SettingsClient
            security={defaultSecurity}
            notifications={defaultNotifications}
            payments={payments}
            plan={plan}
            banks={banksResult.banks}
            directoryUnavailable={banksResult.directoryUnavailable}
        />
    );
}
