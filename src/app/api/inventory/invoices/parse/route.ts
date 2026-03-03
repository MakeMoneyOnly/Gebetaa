import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api/response';
import { getAuthenticatedUser, getAuthorizedRestaurantContext } from '@/lib/api/authz';
import { parseJsonBody } from '@/lib/api/validation';
import { parseInvoiceText } from '@/lib/inventory/invoiceOcr';

const ParseInvoiceSchema = z.object({
    raw_text: z.string().trim().min(20).max(50000),
    supplier_hint: z.string().trim().min(2).max(140).optional(),
    currency: z.string().trim().length(3).optional().default('ETB'),
});

export async function POST(request: Request) {
    const auth = await getAuthenticatedUser();
    if (!auth.ok) {
        return auth.response;
    }

    const context = await getAuthorizedRestaurantContext(auth.user.id, { phase: 'p2' });
    if (!context.ok) {
        return context.response;
    }

    const parsed = await parseJsonBody(request, ParseInvoiceSchema);
    if (!parsed.success) {
        return parsed.response;
    }

    const db = context.supabase;

    const { data: inventoryItems, error } = await db
        .from('inventory_items')
        .select('id, name, sku, uom')
        .eq('restaurant_id', context.restaurantId)
        .eq('is_active', true)
        .limit(500);

    if (error) {
        return apiError(
            'Failed to load inventory items for invoice mapping',
            500,
            'INVOICE_OCR_INVENTORY_FETCH_FAILED',
            error.message
        );
    }

    const result = parseInvoiceText({
        raw_text: parsed.data.raw_text,
        supplier_hint: parsed.data.supplier_hint,
        currency: parsed.data.currency,
        inventory_items: (inventoryItems ?? []).map(item => ({
            id: item.id,
            name: item.name,
            sku: item.sku,
            uom: item.uom,
        })),
    });

    return apiSuccess({
        ...result,
        metadata: {
            processing_mode: 'ocr_assisted',
            parsed_at: new Date().toISOString(),
        },
    });
}
