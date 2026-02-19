-- P2 Campaign Deliveries Foundation
-- Date: 2026-02-18
-- Purpose: track delivery and conversion events per campaign recipient

BEGIN;

CREATE TABLE IF NOT EXISTS public.campaign_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    guest_id UUID NOT NULL REFERENCES public.guests(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'opened', 'clicked', 'converted', 'failed')),
    sent_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    conversion_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (campaign_id, guest_id)
);

CREATE INDEX IF NOT EXISTS idx_campaign_deliveries_campaign_status
    ON public.campaign_deliveries(campaign_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_campaign_deliveries_guest
    ON public.campaign_deliveries(guest_id, created_at DESC);

ALTER TABLE public.campaign_deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant staff can view campaign deliveries" ON public.campaign_deliveries;
CREATE POLICY "Tenant staff can view campaign deliveries"
    ON public.campaign_deliveries
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.campaigns c
            JOIN public.restaurant_staff rs ON rs.restaurant_id = c.restaurant_id
            WHERE c.id = campaign_deliveries.campaign_id
                AND rs.user_id = auth.uid()
                AND COALESCE(rs.is_active, true) = true
        )
        OR EXISTS (
            SELECT 1
            FROM public.campaigns c
            JOIN public.agency_users au ON au.user_id = auth.uid()
            WHERE c.id = campaign_deliveries.campaign_id
                AND (
                    au.role = 'admin'
                    OR c.restaurant_id = ANY (COALESCE(au.restaurant_ids, ARRAY[]::uuid[]))
                )
        )
    );

DROP POLICY IF EXISTS "Tenant staff can manage campaign deliveries" ON public.campaign_deliveries;
CREATE POLICY "Tenant staff can manage campaign deliveries"
    ON public.campaign_deliveries
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.campaigns c
            JOIN public.restaurant_staff rs ON rs.restaurant_id = c.restaurant_id
            WHERE c.id = campaign_deliveries.campaign_id
                AND rs.user_id = auth.uid()
                AND COALESCE(rs.is_active, true) = true
        )
        OR EXISTS (
            SELECT 1
            FROM public.campaigns c
            JOIN public.agency_users au ON au.user_id = auth.uid()
            WHERE c.id = campaign_deliveries.campaign_id
                AND (
                    au.role = 'admin'
                    OR c.restaurant_id = ANY (COALESCE(au.restaurant_ids, ARRAY[]::uuid[]))
                )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.campaigns c
            JOIN public.restaurant_staff rs ON rs.restaurant_id = c.restaurant_id
            WHERE c.id = campaign_deliveries.campaign_id
                AND rs.user_id = auth.uid()
                AND COALESCE(rs.is_active, true) = true
        )
        OR EXISTS (
            SELECT 1
            FROM public.campaigns c
            JOIN public.agency_users au ON au.user_id = auth.uid()
            WHERE c.id = campaign_deliveries.campaign_id
                AND (
                    au.role = 'admin'
                    OR c.restaurant_id = ANY (COALESCE(au.restaurant_ids, ARRAY[]::uuid[]))
                )
        )
    );

COMMIT;