-- P2 Reconciliation Entries Foundation
-- Date: 2026-02-20
-- Purpose: track settlement matching and exceptions for payments/refunds/payouts

BEGIN;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.reconciliation_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    payout_id UUID REFERENCES public.payouts(id) ON DELETE SET NULL,
    payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
    refund_id UUID REFERENCES public.refunds(id) ON DELETE SET NULL,
    source_type TEXT NOT NULL CHECK (source_type IN ('payment', 'refund', 'payout', 'adjustment')),
    source_id UUID,
    ledger_type TEXT NOT NULL CHECK (ledger_type IN ('gateway', 'bank', 'book')),
    ledger_id TEXT NOT NULL,
    expected_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    settled_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    delta_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'matched' CHECK (status IN ('matched', 'exception', 'investigating', 'resolved')),
    notes TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reconciliation_entries_restaurant_status
    ON public.reconciliation_entries(restaurant_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reconciliation_entries_restaurant_source
    ON public.reconciliation_entries(restaurant_id, source_type, source_id);

CREATE INDEX IF NOT EXISTS idx_reconciliation_entries_restaurant_payout
    ON public.reconciliation_entries(restaurant_id, payout_id);

CREATE INDEX IF NOT EXISTS idx_reconciliation_entries_ledger
    ON public.reconciliation_entries(ledger_type, ledger_id);

DROP TRIGGER IF EXISTS trg_reconciliation_entries_set_updated_at ON public.reconciliation_entries;
CREATE TRIGGER trg_reconciliation_entries_set_updated_at
    BEFORE UPDATE ON public.reconciliation_entries
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.reconciliation_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant staff can view reconciliation entries" ON public.reconciliation_entries;
CREATE POLICY "Tenant staff can view reconciliation entries"
    ON public.reconciliation_entries
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.restaurant_staff rs
            WHERE rs.user_id = auth.uid()
                AND rs.restaurant_id = reconciliation_entries.restaurant_id
                AND COALESCE(rs.is_active, true) = true
        )
        OR EXISTS (
            SELECT 1 FROM public.agency_users au
            WHERE au.user_id = auth.uid()
                AND (
                    au.role = 'admin'
                    OR reconciliation_entries.restaurant_id = ANY (COALESCE(au.restaurant_ids, ARRAY[]::uuid[]))
                )
        )
    );

DROP POLICY IF EXISTS "Tenant staff can manage reconciliation entries" ON public.reconciliation_entries;
CREATE POLICY "Tenant staff can manage reconciliation entries"
    ON public.reconciliation_entries
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.restaurant_staff rs
            WHERE rs.user_id = auth.uid()
                AND rs.restaurant_id = reconciliation_entries.restaurant_id
                AND COALESCE(rs.is_active, true) = true
        )
        OR EXISTS (
            SELECT 1 FROM public.agency_users au
            WHERE au.user_id = auth.uid()
                AND (
                    au.role = 'admin'
                    OR reconciliation_entries.restaurant_id = ANY (COALESCE(au.restaurant_ids, ARRAY[]::uuid[]))
                )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.restaurant_staff rs
            WHERE rs.user_id = auth.uid()
                AND rs.restaurant_id = reconciliation_entries.restaurant_id
                AND COALESCE(rs.is_active, true) = true
        )
        OR EXISTS (
            SELECT 1 FROM public.agency_users au
            WHERE au.user_id = auth.uid()
                AND (
                    au.role = 'admin'
                    OR reconciliation_entries.restaurant_id = ANY (COALESCE(au.restaurant_ids, ARRAY[]::uuid[]))
                )
        )
    );

COMMIT;
