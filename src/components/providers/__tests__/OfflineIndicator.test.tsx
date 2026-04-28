import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { OfflineIndicator } from '../OfflineIndicator';
import { useSyncStatus } from '@/lib/sync/usePowerSync';

vi.mock('@/lib/sync/usePowerSync', () => ({
    useSyncStatus: vi.fn(),
}));

const useSyncStatusMock = vi.mocked(useSyncStatus);

describe('OfflineIndicator', () => {
    it('renders degraded operating mode explicitly', () => {
        useSyncStatusMock.mockReturnValue({
            isSyncing: false,
            isOnline: true,
            lastSyncAt: new Date('2026-04-22T10:00:00.000Z'),
            pendingCount: 0,
            operatingMode: 'degraded',
            bootstrapStatus: {
                state: 'not_configured',
                message: 'missing bootstrap',
                updatedAt: '2026-04-22T10:00:00.000Z',
            },
            sync: vi.fn(),
        } as never);

        render(<OfflineIndicator />);

        expect(screen.getByText(/^Degraded$/i)).toBeInTheDocument();
        expect(screen.getByText(/local store active/i)).toBeInTheDocument();
    });

    it('renders reconciling operating mode with pending count', () => {
        useSyncStatusMock.mockReturnValue({
            isSyncing: true,
            isOnline: true,
            lastSyncAt: new Date('2026-04-22T10:00:00.000Z'),
            pendingCount: 3,
            operatingMode: 'reconciling',
            bootstrapStatus: {
                state: 'ready',
                message: 'ready',
                updatedAt: '2026-04-22T10:00:00.000Z',
            },
            sync: vi.fn(),
        } as never);

        render(<OfflineIndicator />);

        expect(screen.getByText(/reconciling/i)).toBeInTheDocument();
        expect(screen.getByText(/3 pending/i)).toBeInTheDocument();
    });
});
