import { getPowerSync } from '@/lib/sync/powersync-config';

export type FiscalJobStatus = 'pending' | 'submitted' | 'failed';

export interface FiscalQueueJob {
    id: string;
    order_id: string;
    payload_json: string;
    status: FiscalJobStatus;
    attempts: number;
    last_error?: string;
    warning_text?: string;
    created_at: string;
    submitted_at?: string;
    synced_at?: string;
}

export async function queueFiscalJob(args: {
    orderId: string;
    payload: Record<string, unknown>;
    warningText?: string | null;
}): Promise<FiscalQueueJob | null> {
    const db = getPowerSync();
    if (!db) {
        return null;
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await db.execute(
        `INSERT INTO fiscal_jobs (
            id, order_id, payload_json, status, attempts, warning_text, created_at
        ) VALUES (?, ?, ?, 'pending', 0, ?, ?)`,
        [id, args.orderId, JSON.stringify(args.payload), args.warningText ?? null, now]
    );

    return {
        id,
        order_id: args.orderId,
        payload_json: JSON.stringify(args.payload),
        status: 'pending',
        attempts: 0,
        warning_text: args.warningText ?? undefined,
        created_at: now,
    };
}

export async function getPendingFiscalJobs(limit: number = 20): Promise<FiscalQueueJob[]> {
    const db = getPowerSync();
    if (!db) {
        return [];
    }

    return (
        (await db.getAllAsync<FiscalQueueJob>(
            `SELECT * FROM fiscal_jobs WHERE status = 'pending' ORDER BY created_at ASC LIMIT ?`,
            [limit]
        )) ?? []
    );
}

export async function markFiscalJobSubmitted(jobId: string): Promise<void> {
    const db = getPowerSync();
    if (!db) {
        return;
    }

    const now = new Date().toISOString();
    await db.execute(
        `UPDATE fiscal_jobs SET status = 'submitted', submitted_at = ?, synced_at = ? WHERE id = ?`,
        [now, now, jobId]
    );
}

export async function markFiscalJobFailed(jobId: string, errorMessage: string): Promise<void> {
    const db = getPowerSync();
    if (!db) {
        return;
    }

    await db.execute(
        `UPDATE fiscal_jobs SET status = 'failed', attempts = attempts + 1, last_error = ? WHERE id = ?`,
        [errorMessage, jobId]
    );
}
