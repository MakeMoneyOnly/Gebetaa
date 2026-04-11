import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockExecute = vi.fn().mockResolvedValue({ rowsAffected: 1 });
const mockGetAllAsync = vi.fn().mockResolvedValue([]);

const mockGetPowerSync = vi.fn(() => ({
    execute: mockExecute,
    getFirstAsync: vi.fn().mockResolvedValue(null),
    getAllAsync: mockGetAllAsync,
}));

vi.mock('@/lib/sync/powersync-config', () => ({
    getPowerSync: mockGetPowerSync,
}));

describe('Offline Fiscal Queue', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockExecute.mockResolvedValue({ rowsAffected: 1 });
        mockGetAllAsync.mockResolvedValue([]);
        mockGetPowerSync.mockReturnValue({
            execute: mockExecute,
            getFirstAsync: vi.fn().mockResolvedValue(null),
            getAllAsync: mockGetAllAsync,
        });
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    describe('queueFiscalJob', () => {
        it('should insert a pending fiscal job', async () => {
            const { queueFiscalJob } = await import('../offline-queue');
            const result = await queueFiscalJob({
                orderId: 'order-123',
                payload: { total: 1000, items: [] },
            });

            expect(result).not.toBeNull();
            expect(result!.order_id).toBe('order-123');
            expect(result!.status).toBe('pending');
            expect(result!.attempts).toBe(0);
            expect(result!.id).toBeDefined();
            expect(result!.created_at).toBeDefined();
            expect(mockExecute).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO fiscal_jobs'),
                [expect.any(String), 'order-123', expect.any(String), null, expect.any(String)]
            );
        });

        it('should include warning text when provided', async () => {
            const { queueFiscalJob } = await import('../offline-queue');
            const result = await queueFiscalJob({
                orderId: 'order-456',
                payload: { total: 500 },
                warningText: 'Stub mode',
            });

            expect(result!.warning_text).toBe('Stub mode');
        });

        it('should return null when PowerSync is not available', async () => {
            mockGetPowerSync.mockReturnValueOnce(
                null as unknown as ReturnType<typeof mockGetPowerSync>
            );

            const { queueFiscalJob } = await import('../offline-queue');
            const result = await queueFiscalJob({
                orderId: 'order-789',
                payload: { total: 200 },
            });

            expect(result).toBeNull();
            expect(mockExecute).not.toHaveBeenCalled();
        });

        it('should serialize payload to JSON', async () => {
            const { queueFiscalJob } = await import('../offline-queue');
            const payload = { total: 1000, items: [{ name: 'test' }] };

            await queueFiscalJob({
                orderId: 'order-json',
                payload,
            });

            const callArgs = mockExecute.mock.calls[0];
            expect(callArgs[1][2]).toBe(JSON.stringify(payload));
        });

        it('should set warning_text to undefined when not provided', async () => {
            const { queueFiscalJob } = await import('../offline-queue');
            const result = await queueFiscalJob({
                orderId: 'order-no-warn',
                payload: { total: 100 },
            });

            expect(result!.warning_text).toBeUndefined();
        });

        it('should set warning_text to undefined when warningText is null', async () => {
            const { queueFiscalJob } = await import('../offline-queue');
            const result = await queueFiscalJob({
                orderId: 'order-null-warn',
                payload: { total: 100 },
                warningText: null,
            });

            expect(result!.warning_text).toBeUndefined();
        });
    });

    describe('getPendingFiscalJobs', () => {
        it('should return pending jobs ordered by created_at', async () => {
            const mockJobs = [
                {
                    id: 'job-1',
                    order_id: 'order-1',
                    payload_json: '{"total":100}',
                    status: 'pending',
                    attempts: 0,
                    created_at: '2024-01-01T10:00:00Z',
                },
                {
                    id: 'job-2',
                    order_id: 'order-2',
                    payload_json: '{"total":200}',
                    status: 'pending',
                    attempts: 1,
                    last_error: 'Network error',
                    created_at: '2024-01-01T11:00:00Z',
                },
            ];
            mockGetAllAsync.mockResolvedValueOnce(mockJobs);

            const { getPendingFiscalJobs } = await import('../offline-queue');
            const result = await getPendingFiscalJobs();

            expect(result).toEqual(mockJobs);
            expect(mockGetAllAsync).toHaveBeenCalledWith(
                expect.stringContaining("status = 'pending'"),
                [20]
            );
        });

        it('should respect limit parameter', async () => {
            mockGetAllAsync.mockResolvedValueOnce([]);

            const { getPendingFiscalJobs } = await import('../offline-queue');
            await getPendingFiscalJobs(50);

            expect(mockGetAllAsync).toHaveBeenCalledWith(expect.any(String), [50]);
        });

        it('should return empty array when PowerSync is not available', async () => {
            mockGetPowerSync.mockReturnValueOnce(
                null as unknown as ReturnType<typeof mockGetPowerSync>
            );

            const { getPendingFiscalJobs } = await import('../offline-queue');
            const result = await getPendingFiscalJobs();

            expect(result).toEqual([]);
        });
    });

    describe('markFiscalJobSubmitted', () => {
        it('should update job status to submitted', async () => {
            const { markFiscalJobSubmitted } = await import('../offline-queue');
            await markFiscalJobSubmitted('job-123');

            expect(mockExecute).toHaveBeenCalledWith(
                expect.stringContaining("status = 'submitted'"),
                expect.arrayContaining([expect.any(String), expect.any(String), 'job-123'])
            );
        });

        it('should set submitted_at and synced_at timestamps', async () => {
            const { markFiscalJobSubmitted } = await import('../offline-queue');
            await markFiscalJobSubmitted('job-456');

            const callArgs = mockExecute.mock.calls[0];
            const now = callArgs[1][0];
            expect(new Date(now).toISOString()).toBe(now);
        });

        it('should do nothing when PowerSync is not available', async () => {
            mockGetPowerSync.mockReturnValueOnce(
                null as unknown as ReturnType<typeof mockGetPowerSync>
            );

            const { markFiscalJobSubmitted } = await import('../offline-queue');
            await markFiscalJobSubmitted('job-789');

            expect(mockExecute).not.toHaveBeenCalled();
        });
    });

    describe('markFiscalJobFailed', () => {
        it('should update status to failed and increment attempts', async () => {
            const { markFiscalJobFailed } = await import('../offline-queue');
            await markFiscalJobFailed('job-fail', 'Network timeout');

            expect(mockExecute).toHaveBeenCalledWith(expect.stringContaining("status = 'failed'"), [
                'Network timeout',
                'job-fail',
            ]);
        });

        it('should store the error message', async () => {
            const { markFiscalJobFailed } = await import('../offline-queue');
            await markFiscalJobFailed('job-err', 'Connection refused');

            const callArgs = mockExecute.mock.calls[0];
            expect(callArgs[1][0]).toBe('Connection refused');
        });

        it('should do nothing when PowerSync is not available', async () => {
            mockGetPowerSync.mockReturnValueOnce(
                null as unknown as ReturnType<typeof mockGetPowerSync>
            );

            const { markFiscalJobFailed } = await import('../offline-queue');
            await markFiscalJobFailed('job-1', 'error');

            expect(mockExecute).not.toHaveBeenCalled();
        });
    });

    describe('FiscalQueueJob type', () => {
        it('should return job with all expected fields', async () => {
            const { queueFiscalJob } = await import('../offline-queue');
            const result = await queueFiscalJob({
                orderId: 'order-typed',
                payload: { total: 500 },
            });

            expect(result).toHaveProperty('id');
            expect(result).toHaveProperty('order_id');
            expect(result).toHaveProperty('payload_json');
            expect(result).toHaveProperty('status');
            expect(result).toHaveProperty('attempts');
            expect(result).toHaveProperty('created_at');
        });
    });
});
