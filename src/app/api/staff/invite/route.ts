import { randomUUID } from 'crypto';
import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api/response';
import { getAuthenticatedUser, getAuthorizedRestaurantContext } from '@/lib/api/authz';
import { parseJsonBody } from '@/lib/api/validation';
import { writeAuditLog } from '@/lib/api/audit';

const InviteStaffSchema = z.object({
    email: z.string().email().optional().nullable(),
    role: z.enum(['owner', 'admin', 'manager', 'kitchen', 'waiter', 'bar']),
});

export async function POST(request: Request) {
    const auth = await getAuthenticatedUser();
    if (!auth.ok) {
        return auth.response;
    }

    const context = await getAuthorizedRestaurantContext(auth.user.id);
    if (!context.ok) {
        return context.response;
    }

    const parsed = await parseJsonBody(request, InviteStaffSchema);
    if (!parsed.success) {
        return parsed.response;
    }

    const code = randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await context.supabase
        .from('staff_invites')
        .insert({
            code,
            email: parsed.data.email ?? null,
            role: parsed.data.role,
            restaurant_id: context.restaurantId,
            created_by: auth.user.id,
            expires_at: expiresAt,
            status: 'pending',
        })
        .select('*')
        .single();

    if (error) {
        return apiError('Failed to create staff invite', 500, 'STAFF_INVITE_CREATE_FAILED', error.message);
    }

    await writeAuditLog(context.supabase, {
        restaurant_id: context.restaurantId,
        user_id: auth.user.id,
        action: 'staff_invite_created',
        entity_type: 'staff_invite',
        entity_id: data.id,
        metadata: {
            role: parsed.data.role,
            has_email: Boolean(parsed.data.email),
        },
        new_value: {
            status: data.status,
            expires_at: data.expires_at,
        },
    });

    return apiSuccess({
        invite: data,
        invite_url: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/auth/invite?code=${code}`,
    }, 201);
}
