import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type PrinterJobRow = Record<string, unknown>;

const store = {
    jobs: [] as PrinterJobRow[],
};

const mockExecute = vi.fn(async (sql: string, params: unknown[] = []) => {
    if (sql.includes('INSERT INTO printer_jobs')) {
        const row: PrinterJobRow = {
            id: String(params[0]),
            order_id: String(params[1]),
            station: String(params[2]),
            route_key: String(params[3]),
            fallback_route_key: params[4] ? String(params[4]) : null,
            driver_kind: String(params[5]),
            printer_device_id: params[6] ? String(params[6]) : null,
            printer_name: params[7] ? String(params[7]) : null,
            payload_json: String(params[8]),
            status: 'pending',
            attempts: 0,
            max_attempts: Number(params[9] ?? 3),
            last_error: null,
            status_reason: null,
            next_attempt_at: null,
            last_dispatch_at: null,
            last_heartbeat_at: null,
            rerouted_from_job_id: null,
            created_at: String(params[10]),
            printed_at: null,
        };
        store.jobs.push(row);
    }

    if (sql.includes("SET status = 'printing'")) {
        const row = store.jobs.find(job => job.id === params[1]);
        if (row) {
            row.status = 'printing';
            row.attempts = Number(row.attempts ?? 0) + 1;
            row.last_dispatch_at = params[0];
            row.status_reason = 'dispatching';
        }
    }

    if (sql.includes("SET status = 'completed'")) {
        const row = store.jobs.find(job => job.id === params[1]);
        if (row) {
            row.status = 'completed';
            row.printed_at = params[0];
            row.status_reason = 'printed';
        }
    }

    if (sql.includes("SET status = 'rerouted'")) {
        const row = store.jobs.find(job => job.id === params[0]);
        if (row) {
            row.status = 'rerouted';
            row.status_reason = 'rerouted_to_backup';
        }
    }

    if (sql.includes('SET status = ?')) {
        const row = store.jobs.find(job => job.id === params[4]);
        if (row) {
            row.status = params[0];
            row.last_error = params[1];
            row.status_reason = params[2];
            row.next_attempt_at = params[3];
        }
    }

    return { rowsAffected: 1 };
});

const mockGetFirstAsync = vi.fn(async (_sql: string, params: unknown[] = []) => {
    const row = store.jobs.find(job => job.id === params[0]) ?? null;
    return row ? structuredClone(row) : null;
});

const mockGetAllAsync = vi.fn(async (sql: string, params: unknown[] = []) => {
    if (sql.includes("WHERE status = 'pending'")) {
        return store.jobs
            .filter(job => job.status === 'pending')
            .slice(0, Number(params.at(-1) ?? 20))
            .map(job => structuredClone(job));
    }

    if (sql.includes('WHERE order_id = ?')) {
        return store.jobs
            .filter(job => job.order_id === params[0])
            .map(job => structuredClone(job));
    }

    if (sql.includes('GROUP BY status')) {
        const counts = new Map<string, number>();
        for (const job of store.jobs) {
            counts.set(String(job.status), (counts.get(String(job.status)) ?? 0) + 1);
        }
        return [...counts.entries()].map(([status, count]) => ({ status, count }));
    }

    if (sql.includes('GROUP BY route_key')) {
        const grouped = new Map<string, PrinterJobRow[]>();
        for (const job of store.jobs) {
            const key = String(job.route_key);
            grouped.set(key, [...(grouped.get(key) ?? []), job]);
        }

        return [...grouped.entries()].map(([route_key, rows]) => ({
            route_key,
            printer_device_id: rows[0]?.printer_device_id ?? route_key,
            printer_name: rows[0]?.printer_name ?? route_key,
            driver_kind: rows[0]?.driver_kind ?? 'network',
            last_heartbeat_at: rows[0]?.last_heartbeat_at ?? null,
            last_error: rows.find(row => row.last_error)?.last_error ?? null,
            pending_jobs: rows.filter(row => row.status === 'pending').length,
            printing_jobs: rows.filter(row => row.status === 'printing').length,
            failed_jobs: rows.filter(row => row.status === 'failed').length,
            total_queue_depth: rows.length,
        }));
    }

    if (sql.includes('FROM printer_jobs')) {
        return store.jobs.map(job => structuredClone(job));
    }

    return [];
});

const mockWrite = vi.fn(async (fn: () => Promise<unknown>) => fn());
const mockAppendLocalJournalEntryInDatabase = vi.fn().mockResolvedValue(undefined);

vi.mock('../powersync-config', () => ({
    getPowerSync: vi.fn(() => ({
        execute: mockExecute,
        getFirstAsync: mockGetFirstAsync,
        getAllAsync: mockGetAllAsync,
        write: mockWrite,
    })),
}));

vi.mock('../idempotency', () => ({
    generateIdempotencyKey: vi.fn((prefix: string) => `${prefix}-idem`),
}));

vi.mock('@/lib/journal/local-journal', () => ({
    appendLocalJournalEntryInDatabase: mockAppendLocalJournalEntryInDatabase,
}));

vi.mock('../../logger', () => ({
    logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}));

describe('printer spooler', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        store.jobs = [];
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    it('creates print job with command journal and route metadata', async () => {
        const { createPrintJob } = await import('../printerFallback');
        const result = await createPrintJob({
            orderId: 'order-1',
            station: 'grill',
            route: {
                routeKey: 'kitchen-hot',
                station: 'grill',
                fallbackRouteKey: 'kitchen-backup',
                preferredDeviceId: 'printer-1',
                preferredPrinterName: 'Hot Printer',
            },
            payload: {
                restaurantId: 'rest-1',
                orderId: 'order-1',
                orderNumber: '1001',
                items: [],
                station: 'grill',
                firedAt: '2026-04-27T00:00:00.000Z',
                reason: 'test',
            },
        });

        expect(result).not.toBeNull();
        expect(result?.route_key).toBe('kitchen-hot');
        expect(result?.fallback_route_key).toBe('kitchen-backup');
        expect(mockAppendLocalJournalEntryInDatabase).toHaveBeenCalledOnce();
    });

    it('reroutes queued job when primary printer route offline', async () => {
        const { createPrintJob, processPrintQueue, readPrinterSpoolerStatus } =
            await import('../printerFallback');

        await createPrintJob({
            orderId: 'order-1',
            station: 'grill',
            route: {
                routeKey: 'kitchen-hot',
                station: 'grill',
                fallbackRouteKey: 'kitchen-backup',
            },
            payload: {
                restaurantId: 'rest-1',
                orderId: 'order-1',
                orderNumber: '1001',
                items: [],
                station: 'grill',
                firedAt: '2026-04-27T00:00:00.000Z',
                reason: 'test',
            },
        });

        const result = await processPrintQueue({
            routeHealth: new Map([
                [
                    'kitchen-hot',
                    {
                        printerDeviceId: 'printer-1',
                        printerName: 'Hot Printer',
                        driverKind: 'network',
                        state: 'offline',
                        queueDepth: 1,
                        failedJobs: 1,
                        pendingJobs: 1,
                        printingJobs: 0,
                        routeKeys: ['kitchen-hot'],
                    },
                ],
            ]),
        });

        const spooler = await readPrinterSpoolerStatus();
        expect(result.rerouted).toBe(1);
        expect(spooler.stats.rerouted).toBe(1);
        expect(spooler.queue.some(job => job.route_key === 'kitchen-backup')).toBe(true);
    });

    it('tracks printer health, queue state, and retry exhaustion', async () => {
        const { createPrintJob, processPrintQueue, readPrinterSpoolerStatus } =
            await import('../printerFallback');

        await createPrintJob({
            orderId: 'order-2',
            station: 'bar',
            payload: {
                restaurantId: 'rest-1',
                orderId: 'order-2',
                orderNumber: '1002',
                items: [],
                station: 'bar',
                firedAt: '2026-04-27T00:00:00.000Z',
                reason: 'bar',
            },
            maxAttempts: 1,
        });

        const result = await processPrintQueue({
            onPrint: async () => false,
        });

        const spooler = await readPrinterSpoolerStatus();
        expect(result.failed).toBe(1);
        expect(spooler.stats.failed).toBe(1);
        expect(spooler.queue[0]?.status).toBe('failed');
    });
});
