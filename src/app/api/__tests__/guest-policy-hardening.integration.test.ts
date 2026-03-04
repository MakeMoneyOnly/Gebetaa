import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceRoleKey = process.env.SUPABASE_SECRET_KEY;

// Check if all required secrets are available
function hasRequiredSecrets(): boolean {
    if (!supabaseUrl || !publishableKey || !serviceRoleKey) {
        return false;
    }
    // Validate URL format
    try {
        new URL(supabaseUrl);
        return true;
    } catch {
        return false;
    }
}

const runId = `policy-hardening-${Date.now()}`;
let restaurantId = '';
let anonClient: SupabaseClient | null = null;
let adminClient: SupabaseClient | null = null;
let secretsAvailable = false;

function randomOrderNumber() {
    return `TEST-${Math.floor(Math.random() * 1_000_000_000)}`;
}

function randomUuidLike() {
    return crypto.randomUUID();
}

function buildValidOrderPayload(fingerprint: string, note: string) {
    return {
        restaurant_id: restaurantId,
        order_number: randomOrderNumber(),
        table_number: 'T-TEST-1',
        items: [{ id: randomUuidLike(), name: 'Test Item', quantity: 1, price: 10 }],
        total_price: 10,
        status: 'pending',
        notes: note,
        idempotency_key: randomUuidLike(),
        guest_fingerprint: fingerprint,
        order_type: 'dine_in',
        fire_mode: 'auto',
    };
}

describe('Guest policy hardening integration', () => {
    beforeAll(async () => {
        // Skip everything if secrets are not available
        if (!hasRequiredSecrets()) {
            console.log('Skipping policy hardening tests: Supabase secrets not configured');
            return;
        }

        secretsAvailable = true;

        // Create clients only if secrets are available
        anonClient = createClient(supabaseUrl!, publishableKey!, {
            auth: { persistSession: false, autoRefreshToken: false },
        });

        adminClient = createClient(supabaseUrl!, serviceRoleKey!, {
            auth: { persistSession: false, autoRefreshToken: false },
        });

        const { data, error } = await adminClient!
            .from('restaurants')
            .select('id')
            .eq('is_active', true)
            .limit(1)
            .maybeSingle();

        if (error || !data?.id) {
            throw new Error(`Failed to resolve active restaurant for tests: ${error?.message}`);
        }

        restaurantId = data.id;
    });

    afterAll(async () => {
        if (!secretsAvailable || !adminClient) {
            return;
        }

        await adminClient.from('orders').delete().ilike('notes', `%${runId}%`);
        await adminClient.from('service_requests').delete().ilike('notes', `%${runId}%`);
        await adminClient
            .from('rate_limit_logs')
            .delete()
            .contains('metadata', { test_run: runId } as Record<string, unknown>);
    });

    it('orders policy rejects insert without idempotency_key', async () => {
        if (!secretsAvailable || !anonClient) {
            return;
        }
        const payload = buildValidOrderPayload(
            'fingerprint-1234567890',
            `${runId}:orders-missing-idempotency`
        );
        delete (payload as any).idempotency_key;

        const { error } = await anonClient.from('orders').insert(payload as any);
        expect(error).toBeTruthy();
    });

    it('orders policy rejects short guest_fingerprint', async () => {
        if (!secretsAvailable || !anonClient) {
            return;
        }
        const payload = buildValidOrderPayload('short-fp', `${runId}:orders-short-fp`);
        const { error } = await anonClient.from('orders').insert(payload as any);
        expect(error).toBeTruthy();
    });

    it('orders policy enforces per-fingerprint 10-minute cap', async () => {
        if (!secretsAvailable || !anonClient) {
            return;
        }
        const fingerprint = `fp-${runId}-cap-1234567890123456`;
        for (let i = 0; i < 5; i += 1) {
            const payload = buildValidOrderPayload(fingerprint, `${runId}:orders-cap-${i}`);
            const { error } = await anonClient.from('orders').insert(payload as any);
            expect(error).toBeNull();
        }

        const blockedPayload = buildValidOrderPayload(fingerprint, `${runId}:orders-cap-blocked`);
        const { error: blockedError } = await anonClient.from('orders').insert(blockedPayload as any);
        expect(blockedError).toBeTruthy();
    });

    it('service_requests policy rejects non-pending status on guest insert', async () => {
        if (!secretsAvailable || !anonClient) {
            return;
        }
        const { error } = await anonClient.from('service_requests').insert({
            restaurant_id: restaurantId,
            table_number: 'T-TEST-1',
            request_type: 'waiter',
            status: 'completed',
            notes: `${runId}:service-status`,
        } as any);

        expect(error).toBeTruthy();
    });

    it('service_requests policy enforces duplicate-spam cap per table/request', async () => {
        if (!secretsAvailable || !anonClient) {
            return;
        }
        for (let i = 0; i < 3; i += 1) {
            const { error } = await anonClient.from('service_requests').insert({
                restaurant_id: restaurantId,
                table_number: 'T-SPAM-1',
                request_type: 'bill',
                status: 'pending',
                notes: `${runId}:service-cap-${i}`,
            } as any);
            expect(error).toBeNull();
        }

        const { error: blockedError } = await anonClient.from('service_requests').insert({
            restaurant_id: restaurantId,
            table_number: 'T-SPAM-1',
            request_type: 'bill',
            status: 'pending',
            notes: `${runId}:service-cap-blocked`,
        } as any);

        expect(blockedError).toBeTruthy();
    });

    it('rate_limit_logs policy rejects non-allowlisted action', async () => {
        if (!secretsAvailable || !anonClient) {
            return;
        }
        const { error } = await anonClient.from('rate_limit_logs').insert({
            fingerprint: `fp-${runId}-rate-limit`,
            action: 'not_allowlisted_action',
            metadata: { test_run: runId },
        } as any);

        expect(error).toBeTruthy();
    });

    it('rate_limit_logs policy rejects non-object metadata', async () => {
        if (!secretsAvailable || !anonClient) {
            return;
        }
        const { error } = await anonClient.from('rate_limit_logs').insert({
            fingerprint: `fp-${runId}-metadata`,
            action: 'rl:guest',
            metadata: ['invalid-metadata-shape'],
        } as any);

        expect(error).toBeTruthy();
    });
});