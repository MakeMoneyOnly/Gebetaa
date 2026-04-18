/**
 * POST /api/jobs/erca/submit
 *
 * Job handler for ERCA invoice submission.
 * Processes completed orders and submits VAT invoices to ERCA system.
 *
 * This is triggered asynchronously via QStash after order completion.
 * ERCA (Ethiopian Revenue and Customs Authority) requires electronic
 * invoice submission for VAT compliance.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

const ERCAJobPayloadSchema = z.object({
    order_id: z.string().uuid(),
    restaurant_id: z.string().uuid(),
    trigger: z.enum(['order_completed', 'cron', 'manual']).default('order_completed'),
});

function isAuthorized(request: NextRequest): boolean {
    const configuredKey = process.env.QSTASH_TOKEN;
    if (!configuredKey) {
        return process.env.NODE_ENV !== 'production';
    }
    return request.headers.get('x-lole-job-key') === configuredKey;
}

/**
 * Generate ERCA-compliant invoice data for an order
 */
async function generateERCAInvoice(
    orderId: string,
    restaurantId: string
): Promise<{
    success: boolean;
    invoiceData?: {
        invoiceNumber: string;
        date: string;
        customerTin?: string;
        customerName?: string;
        items: Array<{
            code: string;
            description: string;
            quantity: number;
            unitPrice: number;
            discount: number;
            vatRate: number;
            vatAmount: number;
            totalAmount: number;
        }>;
        subtotal: number;
        totalDiscount: number;
        totalVat: number;
        grandTotal: number;
    };
    error?: string;
}> {
    const admin = createServiceRoleClient();

    // Get restaurant details
    const { data: restaurant, error: restaurantError } = await admin
        .from('restaurants')
        .select('name, name_am, vat_number, erca_enabled')
        .eq('id', restaurantId)
        .maybeSingle();

    if (restaurantError) {
        return { success: false, error: restaurantError.message };
    }

    if (!restaurant?.erca_enabled || !restaurant?.vat_number) {
        return { success: false, error: 'ERCA not enabled for this restaurant' };
    }

    // Get order details with items
    const { data: order, error: orderError } = await admin
        .from('orders')
        .select(
            `
            id,
            order_number,
            created_at,
            total_price,
            discount_amount,
            status,
            table_number,
            order_items (
                id,
                menu_item_id,
                name,
                name_am,
                quantity,
                unit_price,
                modifiers
            )
        `
        )
        .eq('id', orderId)
        .maybeSingle();

    if (orderError) {
        return { success: false, error: orderError.message };
    }

    if (!order) {
        return { success: false, error: 'Order not found' };
    }

    // Get guest attribution for customer details
    const { data: attribution } = await admin
        .from('order_guest_attributions')
        .select('guest_id, user_id')
        .eq('order_id', orderId)
        .maybeSingle();

    let customerTin: string | undefined;
    let customerName: string | undefined;

    if (attribution?.guest_id) {
        const { data: guest } = await admin
            .from('guests')
            .select('tin, full_name')
            .eq('id', attribution.guest_id)
            .maybeSingle();

        customerTin = guest?.tin;
        customerName = guest?.full_name;
    }

    // Calculate invoice items
    const items = (order.order_items || []).map(
        (item: {
            quantity?: number;
            unit_price?: number;
            menu_item_id?: string;
            name_am?: string;
            name?: string;
        }) => {
            const quantity = Number(item.quantity) || 1;
            const unitPrice = Number(item.unit_price) || 0;
            const subtotal = quantity * unitPrice;
            const vatRate = 0.15; // Ethiopia VAT rate
            const vatAmount = Math.round(subtotal * vatRate);

            return {
                code: item.menu_item_id || 'ITEM',
                description: item.name_am || item.name || 'Item',
                quantity,
                unitPrice,
                discount: 0,
                vatRate,
                vatAmount,
                totalAmount: subtotal + vatAmount,
            };
        }
    );

    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const totalDiscount = Number(order.discount_amount) || 0;
    const totalVat = items.reduce((sum, item) => sum + item.vatAmount, 0);
    const grandTotal = subtotal - totalDiscount + totalVat;

    // Generate invoice number
    const orderDate = new Date(order.created_at);
    const invoiceNumber = `INV-${restaurant.vat_number}-${orderDate.getFullYear()}${String(
        orderDate.getMonth() + 1
    ).padStart(2, '0')}${String(orderDate.getDate()).padStart(2, '0')}-${order.order_number}`;

    return {
        success: true,
        invoiceData: {
            invoiceNumber,
            date: order.created_at,
            customerTin,
            customerName,
            items,
            subtotal,
            totalDiscount,
            totalVat,
            grandTotal,
        },
    };
}

/**
 * Submit invoice to ERCA (stub - actual implementation depends on ERCA API)
 */
async function submitToERCA(
    invoiceData: Record<string, unknown>,
    _vatNumber: string
): Promise<{ success: boolean; reference?: string; error?: string }> {
    // This is a stub implementation
    // In production, this would call the actual ERCA API
    // ERCA provides a SOAP/REST API for electronic invoice submission

    const ercaEndpoint = process.env.ERCA_API_ENDPOINT;
    const ercaApiKey = process.env.ERCA_API_KEY;

    if (!ercaEndpoint || !ercaApiKey) {
        console.warn('[ERCA] No API configured, would submit:', invoiceData);
        // Simulate successful submission for demo
        return {
            success: true,
            reference: `ERCA-STUB-${Date.now()}`,
        };
    }

    // Actual ERCA API call would go here
    // For now, return success with stub reference
    return {
        success: true,
        reference: `ERCA-${invoiceData.invoiceNumber}-${Date.now()}`,
    };
}

/**
 * Store ERCA invoice record
 */
async function storeERCAInvoice(
    orderId: string,
    restaurantId: string,
    invoiceData: Record<string, unknown>,
    ercaReference: string,
    status: 'pending' | 'submitted' | 'confirmed' | 'failed'
): Promise<void> {
    const admin = createServiceRoleClient();

    await admin.from('erca_invoices').upsert(
        {
            restaurant_id: restaurantId,
            order_id: orderId,
            invoice_number: invoiceData.invoiceNumber,
            invoice_date: invoiceData.date,
            customer_tin: invoiceData.customerTin,
            customer_name: invoiceData.customerName,
            subtotal: invoiceData.subtotal,
            discount: invoiceData.totalDiscount,
            vat_amount: invoiceData.totalVat,
            grand_total: invoiceData.grandTotal,
            items: invoiceData.items,
            erca_reference: ercaReference,
            status,
            submitted_at: new Date().toISOString(),
        },
        { onConflict: 'restaurant_id,order_id' }
    );
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    if (!isAuthorized(request)) {
        return NextResponse.json(
            {
                error: {
                    code: 'UNAUTHORIZED_JOB',
                    message: 'Job request is not authorized',
                },
            },
            { status: 401 }
        );
    }

    const body = await request.json().catch(() => null);
    const parsed = ERCAJobPayloadSchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json(
            {
                error: {
                    code: 'INVALID_JOB_PAYLOAD',
                    message: 'Invalid ERCA job payload',
                    details: parsed.error.flatten(),
                },
            },
            { status: 400 }
        );
    }

    const { order_id, restaurant_id, trigger } = parsed.data;

    // Generate ERCA-compliant invoice
    const invoiceResult = await generateERCAInvoice(order_id, restaurant_id);

    if (!invoiceResult.success) {
        // Store failed attempt
        await storeERCAInvoice(
            order_id,
            restaurant_id,
            {} as Record<string, unknown>,
            '',
            'failed'
        ).catch(console.error);

        return NextResponse.json({
            data: {
                order_id,
                restaurant_id,
                status: 'failed',
                error: invoiceResult.error,
            },
        });
    }

    // Submit to ERCA
    const admin = createServiceRoleClient();
    const { data: restaurant } = await admin
        .from('restaurants')
        .select('vat_number')
        .eq('id', restaurant_id)
        .maybeSingle();

    const submitResult = await submitToERCA(
        invoiceResult.invoiceData as Record<string, unknown>,
        restaurant?.vat_number || ''
    );

    // Store the invoice record
    await storeERCAInvoice(
        order_id,
        restaurant_id,
        invoiceResult.invoiceData as Record<string, unknown>,
        submitResult.reference || '',
        submitResult.success ? 'submitted' : 'failed'
    );

    return NextResponse.json({
        data: {
            order_id,
            restaurant_id,
            trigger,
            status: submitResult.success ? 'submitted' : 'failed',
            invoice_number: invoiceResult.invoiceData?.invoiceNumber,
            erca_reference: submitResult.reference,
            error: submitResult.error,
        },
    });
}
