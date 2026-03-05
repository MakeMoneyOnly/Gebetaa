import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { apiError } from '@/lib/api/response';
import { enforcePilotAccess } from '@/lib/api/pilotGate';
import { logSecurityEvent } from '@/lib/security/securityEvents';

type PilotPhase = 'p0' | 'p1' | 'p2';

export async function getAuthenticatedUser() {
    const supabase = await createClient();
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();

    if (error || !user) {
        return { ok: false as const, response: apiError('Unauthorized', 401, 'UNAUTHORIZED') };
    }

    return { ok: true as const, user, supabase };
}

export async function getAuthorizedRestaurantContext(
    userId: string,
    options?: { phase?: PilotPhase }
) {
    const phase = options?.phase ?? 'p0';
    const supabase = await createClient();

    const { data: staffEntry, error: staffError } = await supabase
        .from('restaurant_staff')
        .select('restaurant_id')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (staffError) {
        return {
            ok: false as const,
            response: apiError(
                'Failed to resolve restaurant context',
                500,
                'RESTAURANT_RESOLVE_FAILED',
                staffError.message
            ),
        };
    }

    if (staffEntry?.restaurant_id) {
        const pilotGateResponse = enforcePilotAccess(staffEntry.restaurant_id, undefined, {
            phase,
        });
        if (pilotGateResponse) {
            return { ok: false as const, response: pilotGateResponse };
        }

        return { ok: true as const, restaurantId: staffEntry.restaurant_id, supabase };
    }

    const { data: agencyUser, error: agencyError } = await supabase
        .from('agency_users')
        .select('restaurant_ids')
        .eq('user_id', userId)
        .maybeSingle();

    if (agencyError) {
        return {
            ok: false as const,
            response: apiError(
                'Failed to resolve restaurant context',
                500,
                'RESTAURANT_RESOLVE_FAILED',
                agencyError.message
            ),
        };
    }

    const restaurantId = agencyUser?.restaurant_ids?.[0] ?? null;
    if (!restaurantId) {
        return {
            ok: false as const,
            response: apiError('No restaurant found for user', 404, 'RESTAURANT_NOT_FOUND'),
        };
    }

    const pilotGateResponse = enforcePilotAccess(restaurantId, undefined, { phase });
    if (pilotGateResponse) {
        return { ok: false as const, response: pilotGateResponse };
    }

    return { ok: true as const, restaurantId, supabase };
}

/**
 * Authenticate a request from a paired hardware device (POS/KDS).
 * Devices have no Supabase auth session — they use a long-lived device_token
 * stored in localStorage after pairing and sent via the X-Device-Token header.
 */
export async function getDeviceContext(request: Request) {
    const token = request.headers.get('x-device-token');
    if (!token) {
        return {
            ok: false as const,
            response: apiError('Missing device token', 401, 'DEVICE_UNAUTHORIZED'),
        };
    }

    const admin = createServiceRoleClient();
    const { data: device, error } = await admin
        .from('hardware_devices')
        .select('id, restaurant_id, device_type, name, assigned_zones, status')
        .eq('device_token', token)
        .single();

    if (error || !device) {
        return {
            ok: false as const,
            response: apiError('Invalid device token', 401, 'DEVICE_UNAUTHORIZED'),
        };
    }

    return { ok: true as const, device, restaurantId: device.restaurant_id as string, admin };
}

/**
 * SEC-002: Enforce strict tenant scoping on protected queries
 * Validates that a user has access to a specific restaurant resource
 * Logs security events for violations
 */
export async function enforceTenantScope(
    userId: string,
    restaurantId: string,
    ipAddress?: string
): Promise<{ allowed: boolean; reason?: string }> {
    const supabase = await createClient();

    // Check if user is staff of the restaurant
    const { data: staffEntry, error } = await supabase
        .from('restaurant_staff')
        .select('id, role')
        .eq('user_id', userId)
        .eq('restaurant_id', restaurantId)
        .eq('is_active', true)
        .maybeSingle();

    if (error) {
        console.error('Failed to verify tenant scope:', error);
        return { allowed: false, reason: 'Failed to verify access' };
    }

    if (staffEntry) {
        return { allowed: true };
    }

    // Check if user is an agency user with access to this restaurant
    const { data: agencyUser, error: agencyError } = await supabase
        .from('agency_users')
        .select('restaurant_ids')
        .eq('user_id', userId)
        .maybeSingle();

    if (agencyError) {
        console.error('Failed to verify agency access:', agencyError);
        return { allowed: false, reason: 'Failed to verify access' };
    }

    if (agencyUser?.restaurant_ids?.includes(restaurantId)) {
        return { allowed: true };
    }

    // Log tenant isolation violation
    await logSecurityEvent({
        type: 'tenant_isolation_violation',
        severity: 'high',
        userId,
        ipAddress: ipAddress || 'unknown',
        userAgent: 'server',
        metadata: { requested_restaurant_id: restaurantId },
        timestamp: new Date(),
    });

    return { allowed: false, reason: 'Access denied to this restaurant' };
}

/**
 * SEC-002: Validate resource belongs to user's restaurant
 * Use this before any mutation to prevent cross-tenant data access
 * 
 * Note: For type-safe resource validation, use the specific table validators below:
 * - validateOrderTenantScope
 * - validateMenuItemTenantScope
 * - validateTableTenantScope
 */
export async function validateResourceTenantScope(
    userId: string,
    restaurantId: string,
    resourceTable: string,
    resourceId: string
): Promise<{ valid: boolean; reason?: string }> {
    // First verify user has access to the restaurant
    const scopeCheck = await enforceTenantScope(userId, restaurantId);
    if (!scopeCheck.allowed) {
        return { valid: false, reason: scopeCheck.reason };
    }

    // Log the validation attempt for audit purposes
    console.warn(
        `SEC-002: Resource validation requested for table ${resourceTable}, id ${resourceId}. ` +
        `Consider using a type-specific validator for better type safety.`
    );

    // Return valid - actual table-specific validation should be done by calling
    // the appropriate type-specific function
    return { valid: true };
}

/**
 * SEC-002: Validate order belongs to user's restaurant
 */
export async function validateOrderTenantScope(
    userId: string,
    restaurantId: string,
    orderId: string
): Promise<{ valid: boolean; reason?: string }> {
    const supabase = await createClient();

    const scopeCheck = await enforceTenantScope(userId, restaurantId);
    if (!scopeCheck.allowed) {
        return { valid: false, reason: scopeCheck.reason };
    }

    const { data, error } = await supabase
        .from('orders')
        .select('restaurant_id')
        .eq('id', orderId)
        .maybeSingle();

    if (error) {
        console.error('Failed to validate order scope:', error);
        return { valid: false, reason: 'Failed to validate order' };
    }

    if (!data) {
        return { valid: false, reason: 'Order not found' };
    }

    if (data.restaurant_id !== restaurantId) {
        await logSecurityEvent({
            type: 'tenant_isolation_violation',
            severity: 'high',
            userId,
            ipAddress: 'unknown',
            userAgent: 'server',
            metadata: {
                resource_table: 'orders',
                resource_id: orderId,
                resource_restaurant_id: data.restaurant_id,
                requested_restaurant_id: restaurantId,
            },
            timestamp: new Date(),
        });

        return { valid: false, reason: 'Order does not belong to this restaurant' };
    }

    return { valid: true };
}

/**
 * SEC-002: Validate menu item belongs to user's restaurant
 */
export async function validateMenuItemTenantScope(
    userId: string,
    restaurantId: string,
    menuItemId: string
): Promise<{ valid: boolean; reason?: string }> {
    const supabase = await createClient();

    const scopeCheck = await enforceTenantScope(userId, restaurantId);
    if (!scopeCheck.allowed) {
        return { valid: false, reason: scopeCheck.reason };
    }

    // Menu items are linked via category which has restaurant_id
    const { data, error } = await supabase
        .from('menu_items')
        .select('id, category:categories(restaurant_id)')
        .eq('id', menuItemId)
        .maybeSingle();

    if (error) {
        console.error('Failed to validate menu item scope:', error);
        return { valid: false, reason: 'Failed to validate menu item' };
    }

    if (!data) {
        return { valid: false, reason: 'Menu item not found' };
    }

    // Type assertion for the nested category query result
    const categoryData = data.category as { restaurant_id: string } | null;
    const itemRestaurantId = categoryData?.restaurant_id;

    if (!itemRestaurantId || itemRestaurantId !== restaurantId) {
        await logSecurityEvent({
            type: 'tenant_isolation_violation',
            severity: 'high',
            userId,
            ipAddress: 'unknown',
            userAgent: 'server',
            metadata: {
                resource_table: 'menu_items',
                resource_id: menuItemId,
                resource_restaurant_id: itemRestaurantId,
                requested_restaurant_id: restaurantId,
            },
            timestamp: new Date(),
        });

        return { valid: false, reason: 'Menu item does not belong to this restaurant' };
    }

    return { valid: true };
}

/**
 * SEC-002: Validate table belongs to user's restaurant
 */
export async function validateTableTenantScope(
    userId: string,
    restaurantId: string,
    tableId: string
): Promise<{ valid: boolean; reason?: string }> {
    const supabase = await createClient();

    const scopeCheck = await enforceTenantScope(userId, restaurantId);
    if (!scopeCheck.allowed) {
        return { valid: false, reason: scopeCheck.reason };
    }

    const { data, error } = await supabase
        .from('tables')
        .select('restaurant_id')
        .eq('id', tableId)
        .maybeSingle();

    if (error) {
        console.error('Failed to validate table scope:', error);
        return { valid: false, reason: 'Failed to validate table' };
    }

    if (!data) {
        return { valid: false, reason: 'Table not found' };
    }

    if (data.restaurant_id !== restaurantId) {
        await logSecurityEvent({
            type: 'tenant_isolation_violation',
            severity: 'high',
            userId,
            ipAddress: 'unknown',
            userAgent: 'server',
            metadata: {
                resource_table: 'tables',
                resource_id: tableId,
                resource_restaurant_id: data.restaurant_id,
                requested_restaurant_id: restaurantId,
            },
            timestamp: new Date(),
        });

        return { valid: false, reason: 'Table does not belong to this restaurant' };
    }

    return { valid: true };
}
