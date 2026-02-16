import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { insertServiceRequest } from '@/lib/supabase/queries';
import { resolveGuestContext } from '@/lib/security/guestContext';

const CreateServiceRequestSchema = z.object({
    guest_context: z.object({
        slug: z.string().min(1),
        table: z.string().min(1),
        sig: z.string().min(1),
        exp: z.union([z.string(), z.number()]),
    }),
    request_type: z.enum(['waiter', 'bill', 'cutlery', 'other']),
    notes: z.string().max(500, 'Notes too long').optional(),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const parsed = CreateServiceRequestSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Invalid request payload', details: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const supabase = await createClient();
        const guestContext = await resolveGuestContext(supabase, parsed.data.guest_context);
        if (!guestContext.valid) {
            return NextResponse.json({ error: guestContext.reason }, { status: guestContext.status });
        }

        const { data, error } = await insertServiceRequest(supabase, {
            restaurant_id: guestContext.data.restaurantId,
            table_number: guestContext.data.tableNumber,
            request_type: parsed.data.request_type,
            notes: parsed.data.notes,
        });

        if (error || !data) {
            return NextResponse.json(
                { error: error?.message ?? 'Failed to create service request' },
                { status: 400 }
            );
        }

        const { error: auditError } = await supabase.from('audit_logs').insert({
            restaurant_id: guestContext.data.restaurantId,
            action: 'service_request_created_guest',
            entity_type: 'service_request',
            entity_id: data.id,
            metadata: {
                table_number: guestContext.data.tableNumber,
                request_type: parsed.data.request_type,
                source: 'guest_web',
                slug: guestContext.data.slug,
            },
            new_value: {
                status: data.status,
            },
        });
        if (auditError) {
            console.warn('[POST /api/service-requests] audit insert failed:', auditError.message);
        }

        return NextResponse.json({ data }, { status: 201 });
    } catch (error) {
        console.error('[POST /api/service-requests] failed:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
