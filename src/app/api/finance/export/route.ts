import { z } from 'zod';
import { apiError } from '@/lib/api/response';
import { getAuthenticatedUser, getAuthorizedRestaurantContext } from '@/lib/api/authz';
import { parseQuery } from '@/lib/api/validation';

/**
 * Finance Export API
 *
 * CRIT-02: All monetary values are exported as INTEGER (santim).
 * 100 santim = 1 ETB.
 * Use the monetary utilities (lib/utils/monetary.ts) to convert for display.
 */

const ExportDatasetSchema = z.enum(['payments', 'refunds', 'payouts', 'reconciliation']);
type ExportDataset = z.infer<typeof ExportDatasetSchema>;

const ExportQuerySchema = z.object({
    dataset: ExportDatasetSchema.optional().default('payments'),
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
    format: z.enum(['csv']).optional().default('csv'),
});

function csvCell(value: unknown): string {
    if (value === null || typeof value === 'undefined') {
        return '';
    }
    const text = String(value);
    if (text.includes(',') || text.includes('"') || text.includes('\n')) {
        return `"${text.replaceAll('"', '""')}"`;
    }
    return text;
}

function toCsv(rows: Array<Record<string, unknown>>): string {
    if (rows.length === 0) {
        return 'id\n';
    }
    const headers = Object.keys(rows[0]);
    const headerLine = headers.join(',');
    const bodyLines = rows.map(row => headers.map(header => csvCell(row[header])).join(','));
    return [headerLine, ...bodyLines].join('\n');
}

export async function GET(request: Request) {
    const auth = await getAuthenticatedUser();
    if (!auth.ok) {
        return auth.response;
    }

    const context = await getAuthorizedRestaurantContext(auth.user.id, { phase: 'p2' });
    if (!context.ok) {
        return context.response;
    }

    const parsed = parseQuery(
        Object.fromEntries(new URL(request.url).searchParams.entries()),
        ExportQuerySchema
    );
    if (!parsed.success) {
        return parsed.response;
    }

    const db = context.supabase;
    const { dataset, from, to } = parsed.data;
    const tableByDataset: Record<
        ExportDataset,
        'payments' | 'refunds' | 'payouts' | 'reconciliation_entries'
    > = {
        payments: 'payments',
        refunds: 'refunds',
        payouts: 'payouts',
        reconciliation: 'reconciliation_entries',
    };
    const tableName = tableByDataset[dataset];
    let query = db
        .from(tableName)
        .select('*')
        .eq('restaurant_id', context.restaurantId)
        .order('created_at', { ascending: false })
        .limit(5000);

    if (from) {
        query = query.gte('created_at', from);
    }
    if (to) {
        query = query.lte('created_at', to);
    }

    const { data, error } = await query;
    if (error) {
        return apiError(
            'Failed to export finance data',
            500,
            'FINANCE_EXPORT_FAILED',
            error.message
        );
    }

    const rows = (data ?? []) as Array<Record<string, unknown>>;
    const csv = toCsv(rows);
    const stamp = new Date().toISOString().slice(0, 10);
    const filename = `${dataset}-${stamp}.csv`;

    return new Response(csv, {
        status: 200,
        headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename=\"${filename}\"`,
        },
    });
}
