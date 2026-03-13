/**
 * Printer Fallback Manager
 *
 * CRIT-05: Offline sync consolidation
 * Adds offline printing support with fallback queue
 */

import { getPowerSync } from './powersync-config';

/**
 * Printer job status
 */
export type PrinterJobStatus = 'pending' | 'printing' | 'completed' | 'failed';

/**
 * Printer job for offline queue
 */
export interface PrinterJob {
    id: string;
    order_id: string;
    station: string;
    payload_json: string;
    status: PrinterJobStatus;
    attempts: number;
    last_error?: string;
    created_at: string;
    printed_at?: string;
}

/**
 * Print payload for KDS tickets
 */
export interface KdsPrintPayload {
    restaurantId: string;
    orderId: string;
    orderNumber: string;
    tableNumber?: number;
    items: Array<{
        name: string;
        name_am?: string;
        quantity: number;
        notes?: string;
        modifiers?: string[];
    }>;
    station: string;
    firedAt: string;
    reason: string;
}

/**
 * Create a print job (offline-first)
 */
export async function createPrintJob(
    orderId: string,
    station: string,
    payload: KdsPrintPayload
): Promise<PrinterJob | null> {
    const db = getPowerSync();
    if (!db) return null;

    const jobId = crypto.randomUUID();
    const now = new Date().toISOString();

    try {
        await db.execute(
            `INSERT INTO printer_jobs (
                id, order_id, station, payload_json, status, attempts, created_at
            ) VALUES (?, ?, ?, ?, 'pending', 0, ?)`,
            [jobId, orderId, station, JSON.stringify(payload), now]
        );

        const job = await getPrintJob(jobId);
        return job;
    } catch (error) {
        console.error('[PrinterFallback] Failed to create print job:', error);
        return null;
    }
}

/**
 * Get a print job by ID
 */
export async function getPrintJob(jobId: string): Promise<PrinterJob | null> {
    const db = getPowerSync();
    if (!db) return null;

    const job = await db.getFirstAsync<PrinterJob>(`SELECT * FROM printer_jobs WHERE id = ?`, [
        jobId,
    ]);

    return job ?? null;
}

/**
 * Get pending print jobs
 */
export async function getPendingPrintJobs(limit: number = 20): Promise<PrinterJob[]> {
    const db = getPowerSync();
    if (!db) return [];

    const jobs = await db.getAllAsync<PrinterJob>(
        `SELECT * FROM printer_jobs WHERE status = 'pending' ORDER BY created_at ASC LIMIT ?`,
        [limit]
    );

    return jobs;
}

/**
 * Get print jobs for a specific order
 */
export async function getPrintJobsByOrder(orderId: string): Promise<PrinterJob[]> {
    const db = getPowerSync();
    if (!db) return [];

    const jobs = await db.getAllAsync<PrinterJob>(
        `SELECT * FROM printer_jobs WHERE order_id = ? ORDER BY created_at DESC`,
        [orderId]
    );

    return jobs;
}

/**
 * Mark a print job as started
 */
export async function startPrintJob(jobId: string): Promise<boolean> {
    const db = getPowerSync();
    if (!db) return false;

    try {
        await db.execute(
            `UPDATE printer_jobs SET status = 'printing', attempts = attempts + 1 WHERE id = ?`,
            [jobId]
        );
        return true;
    } catch (error) {
        console.error('[PrinterFallback] Failed to start print job:', error);
        return false;
    }
}

/**
 * Mark a print job as completed
 */
export async function completePrintJob(jobId: string): Promise<boolean> {
    const db = getPowerSync();
    if (!db) return false;

    const now = new Date().toISOString();

    try {
        await db.execute(
            `UPDATE printer_jobs SET status = 'completed', printed_at = ? WHERE id = ?`,
            [now, jobId]
        );
        return true;
    } catch (error) {
        console.error('[PrinterFallback] Failed to complete print job:', error);
        return false;
    }
}

/**
 * Mark a print job as failed
 */
export async function failPrintJob(jobId: string, error: string): Promise<boolean> {
    const db = getPowerSync();
    if (!db) return false;

    try {
        await db.execute(`UPDATE printer_jobs SET status = 'failed', last_error = ? WHERE id = ?`, [
            error,
            jobId,
        ]);
        return true;
    } catch (err) {
        console.error('[PrinterFallback] Failed to mark print job as failed:', err);
        return false;
    }
}

/**
 * Retry a failed print job
 */
export async function retryPrintJob(jobId: string): Promise<boolean> {
    const db = getPowerSync();
    if (!db) return false;

    try {
        await db.execute(
            `UPDATE printer_jobs SET status = 'pending', last_error = NULL WHERE id = ? AND status = 'failed'`,
            [jobId]
        );
        return true;
    } catch (error) {
        console.error('[PrinterFallback] Failed to retry print job:', error);
        return false;
    }
}

/**
 * Get printer queue statistics
 */
export async function getPrinterQueueStats(): Promise<{
    pending: number;
    printing: number;
    completed: number;
    failed: number;
}> {
    const db = getPowerSync();
    if (!db) {
        return { pending: 0, printing: 0, completed: 0, failed: 0 };
    }

    const [pending, printing, completed, failed] = await Promise.all([
        db.getFirstAsync<{ count: number }>(
            `SELECT COUNT(*) as count FROM printer_jobs WHERE status = 'pending'`
        ),
        db.getFirstAsync<{ count: number }>(
            `SELECT COUNT(*) as count FROM printer_jobs WHERE status = 'printing'`
        ),
        db.getFirstAsync<{ count: number }>(
            `SELECT COUNT(*) as count FROM printer_jobs WHERE status = 'completed'`
        ),
        db.getFirstAsync<{ count: number }>(
            `SELECT COUNT(*) as count FROM printer_jobs WHERE status = 'failed'`
        ),
    ]);

    return {
        pending: pending?.count ?? 0,
        printing: printing?.count ?? 0,
        completed: completed?.count ?? 0,
        failed: failed?.count ?? 0,
    };
}

/**
 * Clear old completed print jobs
 */
export async function clearOldPrintJobs(olderThanDays: number = 7): Promise<number> {
    const db = getPowerSync();
    if (!db) return 0;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await db.execute(
        `DELETE FROM printer_jobs WHERE status = 'completed' AND printed_at < ?`,
        [cutoffDate.toISOString()]
    );

    return result.rowsAffected;
}

/**
 * Process pending print jobs (called when online)
 * Integrates with the existing KDS printer system
 */
export async function processPrintQueue(
    onPrint: (job: PrinterJob) => Promise<boolean>
): Promise<{ processed: number; succeeded: number; failed: number }> {
    const pendingJobs = await getPendingPrintJobs(10);

    let processed = 0;
    let succeeded = 0;
    let failed = 0;

    for (const job of pendingJobs) {
        processed++;

        await startPrintJob(job.id);

        const success = await onPrint(job);

        if (success) {
            await completePrintJob(job.id);
            succeeded++;
        } else {
            await failPrintJob(job.id, 'Print dispatch failed');
            failed++;
        }
    }

    return { processed, succeeded, failed };
}
