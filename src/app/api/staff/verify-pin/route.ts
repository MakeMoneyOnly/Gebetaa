import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api/response';
import { getAuthenticatedUser, getAuthorizedRestaurantContext } from '@/lib/api/authz';
import { parseJsonBody } from '@/lib/api/validation';

const VerifyPinSchema = z.object({
    restaurantId: z.string().uuid(),
    pin: z.string().length(4), // Assume a 4-digit numeric PIN
});

export async function POST(request: Request) {
    const auth = await getAuthenticatedUser();
    if (!auth.ok) {
        return auth.response;
    }

    const parsed = await parseJsonBody(request, VerifyPinSchema);
    if (!parsed.success) {
        return parsed.response;
    }

    // Usually, the device (iPad) itself has an authenticated session (auth.user.id).
    // We check if this device is authorized for this restaurant.
    const context = await getAuthorizedRestaurantContext(auth.user.id);
    if (!context.ok) {
        return context.response;
    }
    
    // We also make sure the device is verifying a PIN for its own restaurant
    if (context.restaurantId !== parsed.data.restaurantId) {
        return apiError('Unauthorized', 403, 'RESTAURANT_MISMATCH');
    }

    // Now, let's find the specific staff member using this PIN
    const { data: staff, error } = await context.supabase
        .from('restaurant_staff_with_users')
        .select('id, user_id, role, name, email')
        .eq('restaurant_id', context.restaurantId)
        .eq('pin_code', parsed.data.pin)
        .eq('is_active', true)
        .single();
        
    if (error || !staff) {
        // Fallback: If `restaurant_staff_with_users` doesn't expose pin_code (since it's a view),
        // we hit `restaurant_staff` directly if the first query fails.
        const { data: rawStaff, error: rawError } = await context.supabase
            .from('restaurant_staff')
            .select('id, user_id, role')
            .eq('restaurant_id', context.restaurantId)
            .eq('pin_code', parsed.data.pin)
            .eq('is_active', true)
            .single();
            
        if (rawError || !rawStaff) {
             return apiError('Invalid PIN', 400, 'INVALID_PIN');
        }
        
        return apiSuccess(
            {
                staff: {
                    id: rawStaff.id,
                    role: rawStaff.role,
                    name: 'Waitstaff', // Fallback name if we didn't join to auth.users
                },
            },
            200
        );
    }

    return apiSuccess(
        {
            staff: {
                id: staff.id,
                role: staff.role,
                name: staff.name || staff.email || 'Waitstaff',
            },
        },
        200
    );
}
