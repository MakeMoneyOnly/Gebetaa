-- P2 Gift Card Transactions Foundation
-- Date: 2026-02-18
-- Purpose: immutable ledger for gift card issuance, redemption, and adjustments

BEGIN;

CREATE TABLE IF NOT EXISTS public.gift_card_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    gift_card_id UUID NOT NULL REFERENCES public.gift_cards(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    amount_delta NUMERIC(12, 2) NOT NULL,
    balance_after NUMERIC(12, 2) NOT NULL CHECK (balance_after >= 0),
    type TEXT NOT NULL CHECK (type IN ('issue', 'redeem', 'adjustment_credit', 'adjustment_debit', 'expire', 'void')),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gift_card_tx_gift_card_created
    ON public.gift_card_transactions(gift_card_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_gift_card_tx_restaurant_created
    ON public.gift_card_transactions(restaurant_id, created_at DESC);

ALTER TABLE public.gift_card_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant staff can view gift card transactions" ON public.gift_card_transactions;
CREATE POLICY "Tenant staff can view gift card transactions"
    ON public.gift_card_transactions
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.restaurant_staff rs
            WHERE rs.user_id = auth.uid()
                AND rs.restaurant_id = gift_card_transactions.restaurant_id
                AND COALESCE(rs.is_active, true) = true
        )
        OR EXISTS (
            SELECT 1 FROM public.agency_users au
            WHERE au.user_id = auth.uid()
                AND (
                    au.role = 'admin'
                    OR gift_card_transactions.restaurant_id = ANY (COALESCE(au.restaurant_ids, ARRAY[]::uuid[]))
                )
        )
    );

DROP POLICY IF EXISTS "Tenant staff can manage gift card transactions" ON public.gift_card_transactions;
CREATE POLICY "Tenant staff can manage gift card transactions"
    ON public.gift_card_transactions
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.restaurant_staff rs
            WHERE rs.user_id = auth.uid()
                AND rs.restaurant_id = gift_card_transactions.restaurant_id
                AND COALESCE(rs.is_active, true) = true
        )
        OR EXISTS (
            SELECT 1 FROM public.agency_users au
            WHERE au.user_id = auth.uid()
                AND (
                    au.role = 'admin'
                    OR gift_card_transactions.restaurant_id = ANY (COALESCE(au.restaurant_ids, ARRAY[]::uuid[]))
                )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.restaurant_staff rs
            WHERE rs.user_id = auth.uid()
                AND rs.restaurant_id = gift_card_transactions.restaurant_id
                AND COALESCE(rs.is_active, true) = true
        )
        OR EXISTS (
            SELECT 1 FROM public.agency_users au
            WHERE au.user_id = auth.uid()
                AND (
                    au.role = 'admin'
                    OR gift_card_transactions.restaurant_id = ANY (COALESCE(au.restaurant_ids, ARRAY[]::uuid[]))
                )
        )
    );

COMMIT;