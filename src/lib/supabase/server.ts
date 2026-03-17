import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';
import { getPoolConfig, isPoolEnabled } from './pool';

export async function createClient() {
    const cookieStore = await cookies();

    // Check for E2E test bypass
    const isE2EBypass = cookieStore.get('sb-access-token')?.value === 'e2e-mock-access-token';

    // Get and clean environment variables
    // Vercel can store values with extra quotes and \r\n when set via CLI/API
    // e.g. '"actual-value" \r\n' — we need to strip all of that
    const cleanEnvVar = (val: string | undefined): string => {
        if (!val) return '';
        return val
            .replace(/\r/g, '') // carriage returns
            .replace(/\n/g, '') // newlines
            .replace(/^["']+/, '') // leading quotes (one or more)
            .replace(/["']+$/, '') // trailing quotes (one or more)
            .trim();
    };

    const supabaseUrl = cleanEnvVar(process.env.NEXT_PUBLIC_SUPABASE_URL);
    const supabaseKey = cleanEnvVar(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

    // If environment variables are missing or E2E bypass is active, return a mock client
    if (!supabaseUrl || !supabaseKey || isE2EBypass) {
        if (isE2EBypass) {
            console.log('[E2E] Using mock Supabase client for testing');
        }
        // Helper to create chainable mock methods.
        // NOTE: data is the list-level result; maybeSingle returns null (no row found)
        // unless overridden by a table-specific mock below.
        const createChainableMock = (data: unknown, singleData: unknown = null) => ({
            data,
            error: null,
            eq: function () {
                return this;
            },
            neq: function () {
                return this;
            },
            gt: function () {
                return this;
            },
            gte: function () {
                return this;
            },
            lt: function () {
                return this;
            },
            lte: function () {
                return this;
            },
            like: function () {
                return this;
            },
            ilike: function () {
                return this;
            },
            is: function () {
                return this;
            },
            in: function () {
                return this;
            },
            contains: function () {
                return this;
            },
            containedBy: function () {
                return this;
            },
            overlaps: function () {
                return this;
            },
            or: function () {
                return this;
            },
            order: function () {
                return this;
            },
            limit: function () {
                return this;
            },
            range: function () {
                return this;
            },
            single: async () => ({ data: singleData, error: null }),
            maybeSingle: async () => ({ data: singleData, error: null }),
            then: function (resolve: (value: unknown) => void) {
                return resolve({ data, error: null, count: null });
            },
        });

        // E2E mock restaurant_staff row — satisfies resolveRestaurantId()
        const e2eStaffRow = { restaurant_id: 'rest-1', role: 'owner', is_active: true };

        // E2E mock restaurant row — contains all fields accessed by settings/dashboard routes
        // so that .single() calls on the restaurants table never return null.
        const e2eRestaurantRow = {
            id: 'rest-1',
            name: 'Saba Grill',
            slug: 'saba-grill',
            // JSONB settings blob covering security, notifications, dashboard, channels, etc.
            settings: {
                security: {
                    require_mfa: false,
                    session_timeout_minutes: 120,
                    allowed_ip_ranges: [],
                    alert_on_suspicious_login: true,
                },
                notifications: {
                    email_enabled: true,
                    sms_enabled: false,
                    in_app_enabled: true,
                    escalation_enabled: true,
                    escalation_minutes: 15,
                },
                channels: {
                    online_ordering: {
                        enabled: true,
                        accepts_scheduled_orders: true,
                        auto_accept_orders: false,
                        prep_time_minutes: 30,
                        max_daily_orders: 300,
                        service_hours: { start: '08:00', end: '22:00' },
                        order_throttling_enabled: false,
                        throttle_limit_per_15m: 40,
                    },
                },
                dashboard_preset: null,
                zones: [],
                kds: {},
            },
            // Chapa payment fields (used by the Settings page server component)
            chapa_settlement_bank_code: '',
            chapa_settlement_bank_name: '',
            chapa_settlement_account_name: '',
            chapa_settlement_account_number_masked: '',
            chapa_subaccount_status: 'not_configured',
            chapa_subaccount_id: null,
            chapa_subaccount_last_error: null,
            chapa_subaccount_provisioned_at: null,
            hosted_checkout_fee_percentage: 0.03,
        };

        const updateChainable = {
            data: null,
            error: null,
            eq: function () {
                return this;
            },
        };

        return {
            auth: {
                getUser: async () => ({
                    data: {
                        user: {
                            id: 'staff-user-1',
                            email: 'e2e@example.com',
                            aud: 'authenticated',
                            role: 'authenticated',
                        },
                    },
                    error: null,
                }),
                getSession: async () => ({
                    data: {
                        session: {
                            access_token: 'e2e-mock-access-token',
                            refresh_token: 'e2e-mock-refresh-token',
                            expires_in: 3600,
                            expires_at: 2099999999,
                            user: {
                                id: 'staff-user-1',
                                email: 'e2e@example.com',
                            },
                        },
                    },
                    error: null,
                }),
            },
            from: (table: string) => ({
                // Return a valid staff row for restaurant_staff lookups so
                // resolveRestaurantId() returns 'rest-1' instead of null.
                // Return a valid restaurant row for restaurants lookups so routes
                // that access data.settings don't crash with a null dereference.
                select: () =>
                    table === 'restaurant_staff'
                        ? createChainableMock([e2eStaffRow], e2eStaffRow)
                        : table === 'restaurants'
                          ? createChainableMock([e2eRestaurantRow], e2eRestaurantRow)
                          : createChainableMock([], null),
                insert: () => ({ data: null, error: null }),
                update: () => updateChainable,
                delete: () => ({ data: null, error: null }),
            }),
        } as unknown as ReturnType<typeof createServerClient<Database>>;
    }

    return createServerClient<Database>(supabaseUrl, supabaseKey, {
        cookies: {
            getAll() {
                return cookieStore.getAll();
            },
            setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
                try {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        cookieStore.set(name, value, options)
                    );
                } catch {
                    // The `setAll` method was called from a Server Component.
                    // This can be ignored if you have middleware refreshing
                    // user sessions.
                }
            },
        },
        // Supabase client configuration
        db: {
            schema: 'public',
        },
    });
}
