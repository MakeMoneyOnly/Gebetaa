BEGIN;

ALTER TABLE public.hardware_devices
    ADD COLUMN IF NOT EXISTS target_app_version text,
    ADD COLUMN IF NOT EXISTS ota_status text DEFAULT 'current',
    ADD COLUMN IF NOT EXISTS ota_requested_at timestamp with time zone,
    ADD COLUMN IF NOT EXISTS ota_completed_at timestamp with time zone,
    ADD COLUMN IF NOT EXISTS ota_error text;

ALTER TABLE public.hardware_devices
    ALTER COLUMN ota_status SET DEFAULT 'current';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'hardware_devices_ota_status_check'
    ) THEN
        ALTER TABLE public.hardware_devices
            ADD CONSTRAINT hardware_devices_ota_status_check
            CHECK (ota_status IN ('current', 'queued', 'installing', 'failed', 'outdated'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_hardware_devices_ota_status
    ON public.hardware_devices (restaurant_id, ota_status);

CREATE INDEX IF NOT EXISTS idx_hardware_devices_target_app_version
    ON public.hardware_devices (target_app_version)
    WHERE target_app_version IS NOT NULL;

COMMENT ON COLUMN public.hardware_devices.target_app_version IS 'Target APK/app version staged for OTA rollout through Esper.';
COMMENT ON COLUMN public.hardware_devices.ota_status IS 'Fleet update state for the current device shell version.';
COMMENT ON COLUMN public.hardware_devices.ota_requested_at IS 'When the latest OTA request was queued.';
COMMENT ON COLUMN public.hardware_devices.ota_completed_at IS 'When the device first reported the target OTA version.';
COMMENT ON COLUMN public.hardware_devices.ota_error IS 'Last OTA failure reported by device management or heartbeat.';

COMMIT;
