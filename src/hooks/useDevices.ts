import { useState, useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import type { HardwareDeviceMetadata, HardwareDeviceType } from '@/lib/devices/config';

export type HardwareDevice = {
    id: string;
    restaurant_id: string;
    name: string;
    device_type: HardwareDeviceType;
    status: 'active' | 'inactive' | 'maintenance';
    pairing_code: string | null;
    device_token: string | null;
    paired_at: string | null;
    last_active_at: string | null;
    assigned_zones: string[];
    metadata?: HardwareDeviceMetadata | null;
    created_at: string;
};

export function useDevices(initialData?: HardwareDevice[]) {
    const [devices, setDevices] = useState<HardwareDevice[]>(initialData ?? []);
    const [loading, setLoading] = useState(!initialData);
    const [error, setError] = useState<string | null>(null);

    const fetchDevices = useCallback(async () => {
        try {
            // Only set loading to true if we don't have data yet
            if (devices.length === 0) {
                setLoading(true);
            }
            setError(null);
            const response = await fetch('/api/devices', { method: 'GET' });

            if (!response.ok) {
                let errorMessage = 'Failed to fetch devices.';
                try {
                    const errorPayload = await response.json();
                    errorMessage = errorPayload?.error ?? errorMessage;
                } catch {
                    errorMessage = `Error ${response.status}: ${response.statusText}`;
                }
                throw new Error(errorMessage);
            }

            const payload = await response.json();
            const freshDevices = (payload?.data?.devices ?? []) as HardwareDevice[];
            setDevices(freshDevices);
        } catch (fetchError) {
            console.error(fetchError);
            setError(fetchError instanceof Error ? fetchError.message : 'Failed to fetch devices.');
        } finally {
            setLoading(false);
        }
    }, [devices.length]);

    useEffect(() => {
        void fetchDevices();
    }, [fetchDevices]);

    const handleProvisionDevice = async (payload: {
        name: string;
        device_type: HardwareDeviceType;
        assigned_zones?: string[];
        metadata?: HardwareDeviceMetadata;
    }) => {
        try {
            const response = await fetch('/api/devices/provision', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result?.error ?? 'Failed to provision device.');
            }

            // Re-fetch or locally append
            setDevices(prev => [...prev, result.data.device]);
            toast.success('Device provisioned successfully.');
            return result.data.device as HardwareDevice;
        } catch (err: any) {
            toast.error(err.message || 'Failed to provision device.');
            return null;
        }
    };

    const handleDeleteDevice = async (deviceId: string): Promise<boolean> => {
        // Optimistic remove
        setDevices(prev => prev.filter(d => d.id !== deviceId));
        try {
            const response = await fetch(`/api/devices/${deviceId}`, { method: 'DELETE' });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result?.error ?? 'Failed to delete device.');
            }
            toast.success('Device removed.');
            return true;
        } catch (err: any) {
            toast.error(err.message || 'Failed to delete device.');
            // Re-fetch to restore correct state
            void fetchDevices();
            return false;
        }
    };

    return {
        devices,
        loading,
        error,
        fetchDevices,
        handleProvisionDevice,
        handleDeleteDevice,
    };
}
