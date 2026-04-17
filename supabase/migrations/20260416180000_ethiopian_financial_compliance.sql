-- ═══════════════════════════════════════════════════════════════════
-- Ethiopian Financial Compliance Schema
-- Purpose: Separate VAT / TOT transactions at the DB layer to prevent
--          accounting errors during Ethiopian Revenue Authority audits.
-- Retention: 7 years minimum (Ethiopian Commercial Code, Art. 78)
-- ═══════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────
-- 1. merchant_tax_config
--    One row per restaurant; the "master tax identity" record.
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS merchant_tax_config (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id           UUID NOT NULL UNIQUE REFERENCES restaurants(id) ON DELETE CASCADE,

    -- Tax registration type (STRICTLY one at a time)
    tax_type                TEXT NOT NULL DEFAULT 'TOT'
                                CHECK (tax_type IN ('VAT', 'TOT')),

    -- VAT fields (only populated when tax_type = 'VAT')
    vat_registration_number TEXT,           -- 10-digit, MoR-issued
    vat_effective_date      DATE,

    -- TOT fields (only populated when tax_type = 'TOT')
    tot_rate                NUMERIC(5,4)    -- 0.02 or 0.10
                                CHECK (tot_rate IS NULL OR tot_rate IN (0.02, 0.10)),

    -- Fiscal Machine
    efm_id                  TEXT,           -- Electronic Fiscal Machine device ID

    -- WHT configuration
    wht_threshold_etb       NUMERIC(12,2) NOT NULL DEFAULT 3000.00,  -- static system constant
    wht_rate                NUMERIC(5,4)  NOT NULL DEFAULT 0.02,

    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW(),

    -- Constraint: VAT reg number required when VAT-registered
    CONSTRAINT vat_requires_number CHECK (
        (tax_type = 'VAT' AND vat_registration_number IS NOT NULL)
        OR tax_type = 'TOT'
    ),
    -- Constraint: TOT rate required when TOT-registered
    CONSTRAINT tot_requires_rate CHECK (
        (tax_type = 'TOT' AND tot_rate IS NOT NULL)
        OR tax_type = 'VAT'
    )
);

CREATE INDEX IF NOT EXISTS idx_merchant_tax_config_restaurant
    ON merchant_tax_config (restaurant_id);

ALTER TABLE merchant_tax_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_tax_config FORCE ROW LEVEL SECURITY;

CREATE POLICY "Staff view own tax config"
    ON merchant_tax_config FOR SELECT TO authenticated
    USING (restaurant_id IN (
        SELECT restaurant_id FROM restaurant_staff
        WHERE user_id = (SELECT auth.uid())
    ));

CREATE POLICY "Service role full access to tax config"
    ON merchant_tax_config FOR ALL TO service_role
    USING (true) WITH CHECK (true);

COMMENT ON TABLE merchant_tax_config IS
    'Master tax identity per restaurant. Strictly mutually-exclusive VAT/TOT rows. Audit retention: 7 years.';

-- ───────────────────────────────────────────────────────────────────
-- 2. merchant_vat_ledger
--    Monthly VAT/TOT declaration rows — mirrors MoR monthly form.
--    Each row = one calendar month for one restaurant.
--    SEPARATE rows for VAT vs TOT to prevent audit cross-contamination.
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS merchant_vat_ledger (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id               UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    tax_type                    TEXT NOT NULL CHECK (tax_type IN ('VAT', 'TOT')),

    -- Period
    period_year                 SMALLINT NOT NULL,
    period_month                SMALLINT NOT NULL CHECK (period_month BETWEEN 1 AND 12),

    -- VAT rows (Row codes mirror MoR Monthly Declaration Form)
    row10_standard_sales_etb    NUMERIC(14,2) DEFAULT 0,   -- Row 10: Standard-rated sales
    row11_vat_collected_etb     NUMERIC(14,2)              -- Row 11: Row10 * 0.15 (computed)
                                    GENERATED ALWAYS AS (ROUND(row10_standard_sales_etb * 0.15, 2)) STORED,
    row20_exempt_sales_etb      NUMERIC(14,2) DEFAULT 0,   -- Row 20: Exempt sales
    row25_zero_rated_sales_etb  NUMERIC(14,2) DEFAULT 0,   -- Row 25: Zero-rated (exports)
    row30_input_vat_etb         NUMERIC(14,2) DEFAULT 0,   -- Row 30: Input VAT credit
    row40_net_vat_payable_etb   NUMERIC(14,2)              -- Row 40: Row11 - Row30 (computed)
                                    GENERATED ALWAYS AS (ROUND(
                                        (row10_standard_sales_etb * 0.15) - row30_input_vat_etb
                                    , 2)) STORED,
    row50_wht_credit_etb        NUMERIC(14,2) DEFAULT 0,   -- Row 50: WHT credits received
    final_amount_to_remit_etb   NUMERIC(14,2)              -- Final: Row40 - Row50 (computed)
                                    GENERATED ALWAYS AS (ROUND(
                                        ((row10_standard_sales_etb * 0.15) - row30_input_vat_etb)
                                        - row50_wht_credit_etb
                                    , 2)) STORED,

    -- TOT rows (separate; only populated when tax_type = 'TOT')
    tot_gross_sales_etb         NUMERIC(14,2) DEFAULT 0,
    tot_rate                    NUMERIC(5,4),
    tot_payable_etb             NUMERIC(14,2)
                                    GENERATED ALWAYS AS (ROUND(
                                        tot_gross_sales_etb * COALESCE(tot_rate, 0)
                                    , 2)) STORED,

    -- Fiscal close status
    z_report_closed             BOOLEAN NOT NULL DEFAULT FALSE,
    z_report_closed_at          TIMESTAMPTZ,
    z_report_closed_by          UUID REFERENCES auth.users(id),

    -- Export tracking
    mor_xml_exported_at         TIMESTAMPTZ,
    mor_csv_exported_at         TIMESTAMPTZ,

    -- Locking: closed periods cannot be updated
    is_locked                   BOOLEAN NOT NULL DEFAULT FALSE,

    created_at                  TIMESTAMPTZ DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (restaurant_id, period_year, period_month, tax_type)
);

CREATE INDEX IF NOT EXISTS idx_vat_ledger_restaurant_period
    ON merchant_vat_ledger (restaurant_id, period_year DESC, period_month DESC);

CREATE INDEX IF NOT EXISTS idx_vat_ledger_tax_type
    ON merchant_vat_ledger (restaurant_id, tax_type);

CREATE INDEX IF NOT EXISTS idx_vat_ledger_open_periods
    ON merchant_vat_ledger (restaurant_id, period_year, period_month)
    WHERE is_locked = FALSE;

ALTER TABLE merchant_vat_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_vat_ledger FORCE ROW LEVEL SECURITY;

CREATE POLICY "Staff view own VAT ledger"
    ON merchant_vat_ledger FOR SELECT TO authenticated
    USING (restaurant_id IN (
        SELECT restaurant_id FROM restaurant_staff
        WHERE user_id = (SELECT auth.uid())
    ));

CREATE POLICY "Service role full access to VAT ledger"
    ON merchant_vat_ledger FOR ALL TO service_role
    USING (true) WITH CHECK (true);

COMMENT ON TABLE merchant_vat_ledger IS
    'Monthly VAT/TOT declaration ledger. Generated columns auto-compute MoR form rows. Separate rows per tax_type prevent audit cross-contamination.';

-- ───────────────────────────────────────────────────────────────────
-- 3. merchant_wht_receipts
--    WHT certificates uploaded by B2B customers (2% deducted at source).
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS merchant_wht_receipts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id       UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    ledger_id           UUID REFERENCES merchant_vat_ledger(id) ON DELETE SET NULL,

    receipt_number      TEXT NOT NULL,          -- WHT certificate number
    buyer_tin           TEXT,                   -- TIN of the withholding party
    buyer_name          TEXT,
    transaction_date    DATE NOT NULL,
    gross_amount_etb    NUMERIC(14,2) NOT NULL,
    wht_amount_etb      NUMERIC(14,2) NOT NULL, -- Should equal gross * 0.02
    document_url        TEXT,                   -- Supabase Storage URL

    -- Validation
    amount_verified     BOOLEAN NOT NULL DEFAULT FALSE,
    verified_by         UUID REFERENCES auth.users(id),
    verified_at         TIMESTAMPTZ,

    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT wht_positive_amounts CHECK (
        gross_amount_etb > 0 AND wht_amount_etb > 0
        AND wht_amount_etb <= gross_amount_etb
    )
);

CREATE INDEX IF NOT EXISTS idx_wht_receipts_restaurant
    ON merchant_wht_receipts (restaurant_id, transaction_date DESC);

CREATE INDEX IF NOT EXISTS idx_wht_receipts_ledger
    ON merchant_wht_receipts (ledger_id);

ALTER TABLE merchant_wht_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_wht_receipts FORCE ROW LEVEL SECURITY;

CREATE POLICY "Staff view own WHT receipts"
    ON merchant_wht_receipts FOR SELECT TO authenticated
    USING (restaurant_id IN (
        SELECT restaurant_id FROM restaurant_staff
        WHERE user_id = (SELECT auth.uid())
    ));

CREATE POLICY "Service role full access to WHT receipts"
    ON merchant_wht_receipts FOR ALL TO service_role
    USING (true) WITH CHECK (true);

-- ───────────────────────────────────────────────────────────────────
-- 4. merchant_bank_accounts
--    ETB settlement accounts via local Ethiopian banks.
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS merchant_bank_accounts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id       UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,

    bank_name           TEXT NOT NULL,
    branch_name         TEXT,
    account_number      TEXT NOT NULL,          -- Encrypted at rest (app layer)
    account_holder_name TEXT NOT NULL,
    swift_code          TEXT,                   -- Required for foreign-owned entities
    iban                TEXT,

    -- Mobile money
    account_type        TEXT NOT NULL DEFAULT 'bank'
                            CHECK (account_type IN ('bank', 'telebirr', 'mpesa', 'ethswitch')),

    is_primary          BOOLEAN NOT NULL DEFAULT FALSE,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,

    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bank_accounts_restaurant
    ON merchant_bank_accounts (restaurant_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_bank_accounts_primary
    ON merchant_bank_accounts (restaurant_id)
    WHERE is_primary = TRUE;

ALTER TABLE merchant_bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_bank_accounts FORCE ROW LEVEL SECURITY;

CREATE POLICY "Staff view own bank accounts"
    ON merchant_bank_accounts FOR SELECT TO authenticated
    USING (restaurant_id IN (
        SELECT restaurant_id FROM restaurant_staff
        WHERE user_id = (SELECT auth.uid())
    ));

CREATE POLICY "Service role full access to bank accounts"
    ON merchant_bank_accounts FOR ALL TO service_role
    USING (true) WITH CHECK (true);

COMMENT ON TABLE merchant_bank_accounts IS
    'ETB settlement accounts. account_number encrypted at application layer before insert.';

-- ───────────────────────────────────────────────────────────────────
-- 5. merchant_fiscal_days
--    Z-Report: Locks a 24-hour fiscal period (immutable after close).
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS merchant_fiscal_days (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id       UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,

    fiscal_date         DATE NOT NULL,
    opened_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at           TIMESTAMPTZ,
    closed_by           UUID REFERENCES auth.users(id),

    -- Snapshot totals at close (immutable after close)
    gross_sales_etb     NUMERIC(14,2),
    vat_collected_etb   NUMERIC(14,2),
    tot_collected_etb   NUMERIC(14,2),
    wht_deducted_etb    NUMERIC(14,2),
    net_deposit_etb     NUMERIC(14,2),

    is_closed           BOOLEAN NOT NULL DEFAULT FALSE,

    created_at          TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (restaurant_id, fiscal_date)
);

CREATE INDEX IF NOT EXISTS idx_fiscal_days_restaurant
    ON merchant_fiscal_days (restaurant_id, fiscal_date DESC);

ALTER TABLE merchant_fiscal_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_fiscal_days FORCE ROW LEVEL SECURITY;

CREATE POLICY "Staff view own fiscal days"
    ON merchant_fiscal_days FOR SELECT TO authenticated
    USING (restaurant_id IN (
        SELECT restaurant_id FROM restaurant_staff
        WHERE user_id = (SELECT auth.uid())
    ));

CREATE POLICY "Service role full access to fiscal days"
    ON merchant_fiscal_days FOR ALL TO service_role
    USING (true) WITH CHECK (true);

COMMENT ON TABLE merchant_fiscal_days IS
    'Z-Report fiscal day closure records. Immutable once is_closed = TRUE. 7-year retention required.';

-- ───────────────────────────────────────────────────────────────────
-- 6. updated_at triggers (shared helper)
-- ───────────────────────────────────────────────────────────────────
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOREACH tbl IN ARRAY ARRAY[
        'merchant_tax_config',
        'merchant_vat_ledger',
        'merchant_wht_receipts',
        'merchant_bank_accounts'
    ] LOOP
        EXECUTE format(
            'CREATE OR REPLACE FUNCTION set_updated_at_%s()
             RETURNS TRIGGER LANGUAGE plpgsql AS
             $fn$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $fn$',
            tbl
        );
        EXECUTE format(
            'DROP TRIGGER IF EXISTS trg_updated_at ON %I;
             CREATE TRIGGER trg_updated_at
             BEFORE UPDATE ON %I
             FOR EACH ROW EXECUTE FUNCTION set_updated_at_%s()',
            tbl, tbl, tbl
        );
    END LOOP;
END $$;

-- ───────────────────────────────────────────────────────────────────
-- 7. Grants
-- ───────────────────────────────────────────────────────────────────
GRANT SELECT ON merchant_tax_config    TO authenticated;
GRANT SELECT ON merchant_vat_ledger    TO authenticated;
GRANT SELECT ON merchant_wht_receipts  TO authenticated;
GRANT SELECT ON merchant_bank_accounts TO authenticated;
GRANT SELECT ON merchant_fiscal_days   TO authenticated;

GRANT ALL ON merchant_tax_config       TO service_role;
GRANT ALL ON merchant_vat_ledger       TO service_role;
GRANT ALL ON merchant_wht_receipts     TO service_role;
GRANT ALL ON merchant_bank_accounts    TO service_role;
GRANT ALL ON merchant_fiscal_days      TO service_role;
