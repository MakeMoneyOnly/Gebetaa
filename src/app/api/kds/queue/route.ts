/**
 * KDS Unified Queue API
 * 
 * GET /api/kds/queue
 * 
 * Fetches orders from both standard orders (Dine-In) and external_orders (Delivery Partners)
 * for unified KDS display. Sorts by prep time and order age.
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiError, apiSuccess } from '@/lib/api/response';
import { z } from 'zod';

const QueueRequestSchema = z.object({
    restaurant_id: z.string().uuid('Invalid restaurant ID'),
    status: z.string().optional(),
    limit: z.coerce.number().min(1).max(100).default(50),
});

export interface UnifiedKDSOrder {
    id: string;
    source: 'dine-in' | 'direct_delivery' | 'direct_pickup' | 'beu' | 'zmall' | 'deliver_addis' | 'esoora';
    sourceLabel: string;
    sourceColor: string;
    orderNumber: string;
    tableNumber?: string;
    customerName?: string;
    items: Array<{
        id: string;
        name: string;
        quantity: number;
        notes?: string;
        modifiers?: string[];
    }>;
    status: string;
    priority: 'normal' | 'high' | 'urgent';
    createdAt: string;
    acknowledgedAt?: string;
    estimatedPrepTime?: number;
    elapsedMinutes: number;
    driverInfo?: {
        status: 'pending' | 'assigned' | 'arrived';
        name?: string;
        phone?: string;
        etaMinutes?: number;
    };
    externalOrderId?: string;
}

const SOURCE_CONFIG = {
    'dine-in': { label: 'Dine In', color: '#DC2626' }, // Red
    'direct_delivery': { label: 'Delivery', color: '#2563EB' }, // Blue
    'direct_pickup': { label: 'Pickup', color: '#16A34A' }, // Green
    'beu': { label: 'Beu', color: '#F97316' }, // Orange
    'zmall': { label: 'Zmall', color: '#22C55E' }, // Green
    'deliver_addis': { label: 'Deliver Addis', color: '#8B5CF6' }, // Purple
    'esoora': { label: 'Esoora', color: '#06B6D4' }, // Cyan
};

function calculateElapsedMinutes(createdAt: string): number {
    return Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
}

function determinePriority(elapsedMinutes: number, estimatedPrepTime?: number): 'normal' | 'high' | 'urgent' {
    const threshold = estimatedPrepTime ?? 30;
    if (elapsedMinutes >= threshold + 10) return 'urgent';
    if (elapsedMinutes >= threshold) return 'high';
    return 'normal';
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    
    const params = {
        restaurant_id: searchParams.get('restaurant_id'),
        status: searchParams.get('status') ?? undefined,
        limit: searchParams.get('limit') ?? '50',
    };

    const parseResult = QueueRequestSchema.safeParse(params);
    if (!parseResult.success) {
        return apiError('Invalid parameters', 400, 'VALIDATION_ERROR', parseResult.error.flatten());
    }

    const { restaurant_id, status, limit } = parseResult.data;
    const supabase = await createClient();

    const unifiedOrders: UnifiedKDSOrder[] = [];

    // Fetch dine-in orders
    const dineInStatuses = status 
        ? [status]
        : ['pending', 'confirmed', 'preparing'];
    
    const { data: dineInOrders, error: dineInError } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurant_id', restaurant_id)
        .in('status', dineInStatuses)
        .order('created_at', { ascending: true })
        .limit(limit);

    if (!dineInError && dineInOrders) {
        for (const order of dineInOrders) {
            const orderData = order as Record<string, unknown>;
            const elapsed = calculateElapsedMinutes(orderData.created_at as string);
            
            unifiedOrders.push({
                id: orderData.id as string,
                source: 'dine-in',
                sourceLabel: SOURCE_CONFIG['dine-in'].label,
                sourceColor: SOURCE_CONFIG['dine-in'].color,
                orderNumber: `T-${orderData.table_id ?? 'N/A'}`,
                tableNumber: orderData.table_id as string | undefined,
                items: (orderData.items as Array<{ id: string; name: string; quantity: number; notes?: string }>) ?? [],
                status: orderData.status as string,
                priority: determinePriority(elapsed),
                createdAt: orderData.created_at as string,
                acknowledgedAt: orderData.acknowledged_at as string | undefined,
                elapsedMinutes: elapsed,
            });
        }
    }

    // Fetch external orders
    const externalStatuses = status 
        ? [status]
        : ['pending', 'confirmed', 'preparing'];
    
    const { data: externalOrders, error: externalError } = await supabase
        .from('external_orders')
        .select('*')
        .eq('restaurant_id', restaurant_id)
        .in('normalized_status', externalStatuses)
        .order('created_at', { ascending: true })
        .limit(limit);

    if (!externalError && externalOrders) {
        for (const order of externalOrders) {
            const orderData = order as Record<string, unknown>;
            const payloadJson = orderData.payload_json as Record<string, unknown> | null;
            const elapsed = calculateElapsedMinutes(orderData.created_at as string);
            const provider = orderData.provider as string;
            
            const source = provider === 'custom_local' 
                ? (payloadJson?.fulfillment_type === 'pickup' ? 'direct_pickup' : 'direct_delivery')
                : provider;
            
            const config = SOURCE_CONFIG[source as keyof typeof SOURCE_CONFIG] ?? SOURCE_CONFIG['direct_delivery'];
            
            unifiedOrders.push({
                id: orderData.id as string,
                source: source as UnifiedKDSOrder['source'],
                sourceLabel: config.label,
                sourceColor: config.color,
                orderNumber: orderData.provider_order_id as string ?? `EXT-${orderData.id}`,
                customerName: payloadJson?.customer_name as string | undefined,
                items: (payloadJson?.items as Array<{ id: string; name: string; quantity: number; notes?: string; modifiers?: string[] }>) ?? [],
                status: orderData.normalized_status as string,
                priority: determinePriority(elapsed),
                createdAt: orderData.created_at as string,
                acknowledgedAt: orderData.acknowledged_at as string | undefined,
                elapsedMinutes: elapsed,
                externalOrderId: orderData.provider_order_id as string,
                driverInfo: payloadJson?.driver_info as UnifiedKDSOrder['driverInfo'],
            });
        }
    }

    // Sort by priority and elapsed time
    const priorityOrder = { urgent: 0, high: 1, normal: 2 };
    unifiedOrders.sort((a, b) => {
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return a.elapsedMinutes - b.elapsedMinutes;
    });

    return apiSuccess({
        orders: unifiedOrders.slice(0, limit),
        total: unifiedOrders.length,
        summary: {
            dineIn: unifiedOrders.filter(o => o.source === 'dine-in').length,
            directDelivery: unifiedOrders.filter(o => o.source === 'direct_delivery').length,
            directPickup: unifiedOrders.filter(o => o.source === 'direct_pickup').length,
            partners: unifiedOrders.filter(o => ['beu', 'zmall', 'deliver_addis', 'esoora'].includes(o.source)).length,
        },
    });
}