import { apiError, apiSuccess } from '@/lib/api/response';
import { getAuthenticatedUser, getAuthorizedRestaurantContext } from '@/lib/api/authz';
import {
    getAddisInvoiceReviewPolicy,
    ingestInvoiceDocument,
    type InvoiceExtractionProvider,
} from '@/lib/inventory/invoiceIngestion';
import { parseInvoiceText } from '@/lib/inventory/invoiceOcr';

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/tiff',
]);

function parseProvider(value: FormDataEntryValue | null): 'auto' | InvoiceExtractionProvider {
    if (typeof value !== 'string' || !value.trim()) return 'auto';
    const normalized = value.trim().toLowerCase();
    if (normalized === 'auto') return 'auto';
    if (normalized === 'oss') return 'oss';
    if (normalized === 'aws' || normalized === 'aws_textract') return 'aws_textract';
    if (normalized === 'google' || normalized === 'google_document_ai') return 'google_document_ai';
    if (normalized === 'azure' || normalized === 'azure_document_intelligence') {
        return 'azure_document_intelligence';
    }
    return 'auto';
}

export async function POST(request: Request) {
    const auth = await getAuthenticatedUser();
    if (!auth.ok) return auth.response;

    const context = await getAuthorizedRestaurantContext(auth.user.id, { phase: 'p2' });
    if (!context.ok) return context.response;

    let formData: FormData;
    try {
        formData = await request.formData();
    } catch {
        return apiError('Invalid multipart/form-data payload', 400, 'INVALID_MULTIPART_BODY');
    }

    const file = formData.get('file');
    if (!(file instanceof File)) {
        return apiError('Missing invoice file', 400, 'INVOICE_FILE_REQUIRED');
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
        return apiError(
            'Unsupported file type. Use PDF, JPG, PNG, WEBP, or TIFF.',
            400,
            'UNSUPPORTED_INVOICE_FILE_TYPE'
        );
    }

    if (file.size <= 0 || file.size > MAX_UPLOAD_BYTES) {
        return apiError(
            'Invoice file size must be between 1 byte and 10MB',
            400,
            'INVALID_INVOICE_FILE_SIZE'
        );
    }

    const provider = parseProvider(formData.get('provider'));
    const supplierHint =
        typeof formData.get('supplier_hint') === 'string'
            ? String(formData.get('supplier_hint')).trim()
            : undefined;
    const currency =
        typeof formData.get('currency') === 'string' && String(formData.get('currency')).trim()
            ? String(formData.get('currency')).trim().toUpperCase()
            : 'ETB';

    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    const db = context.supabase;
    const { data: inventoryItems, error: inventoryError } = await db
        .from('inventory_items')
        .select('id, name, sku, uom')
        .eq('restaurant_id', context.restaurantId)
        .eq('is_active', true)
        .limit(500);

    if (inventoryError) {
        return apiError(
            'Failed to load inventory items for invoice mapping',
            500,
            'INVOICE_INGEST_INVENTORY_FETCH_FAILED',
            inventoryError.message
        );
    }

    try {
        const extraction = await ingestInvoiceDocument({
            fileName: file.name,
            mimeType: file.type,
            bytes,
            providerPreference: provider,
        });

        const parsed = parseInvoiceText({
            raw_text: extraction.raw_text,
            supplier_hint: supplierHint || extraction.fields?.supplier_name || undefined,
            currency: extraction.fields?.currency || currency,
            inventory_items: (inventoryItems ?? []).map(item => ({
                id: item.id,
                name: item.name,
                sku: item.sku,
                uom: item.uom,
            })),
        });

        const fieldDraft = extraction.fields ?? {};
        const mergedDraft = {
            ...parsed.draft,
            supplier_name: fieldDraft.supplier_name || parsed.draft.supplier_name,
            invoice_number: fieldDraft.invoice_number || parsed.draft.invoice_number,
            currency: fieldDraft.currency || parsed.draft.currency,
            subtotal:
                fieldDraft.subtotal !== null && fieldDraft.subtotal !== undefined
                    ? fieldDraft.subtotal
                    : parsed.draft.subtotal,
            tax_amount:
                fieldDraft.tax_amount !== null && fieldDraft.tax_amount !== undefined
                    ? fieldDraft.tax_amount
                    : parsed.draft.tax_amount,
            total_amount:
                fieldDraft.total_amount !== null && fieldDraft.total_amount !== undefined
                    ? fieldDraft.total_amount
                    : parsed.draft.total_amount,
            issued_at: fieldDraft.issued_at || parsed.draft.issued_at,
            due_at: fieldDraft.due_at || parsed.draft.due_at,
        };

        const mappedRatio =
            parsed.line_items.length === 0
                ? 0
                : parsed.summary.mapped_items / parsed.line_items.length;
        const addisPolicy = getAddisInvoiceReviewPolicy({
            providerConfidence: extraction.confidence,
            mappedRatio,
            averageMatchConfidence: parsed.summary.average_match_confidence,
        });

        return apiSuccess({
            draft: mergedDraft,
            line_items: parsed.line_items,
            summary: parsed.summary,
            metadata: {
                processing_mode: 'direct_file_ingest',
                provider: extraction.provider,
                provider_confidence: extraction.confidence,
                parsed_at: new Date().toISOString(),
                file_name: file.name,
                mime_type: file.type,
                file_size_bytes: file.size,
            },
            addis_review_policy: addisPolicy,
        });
    } catch (error) {
        return apiError(
            'Invoice extraction failed. Review manually or check OCR provider configuration.',
            422,
            'INVOICE_EXTRACTION_FAILED',
            error instanceof Error ? error.message : String(error)
        );
    }
}
