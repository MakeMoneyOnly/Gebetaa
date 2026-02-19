import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiSuccess, apiError } from '@/lib/api/response';

export interface OnboardingPayload {
    full_name: string;
    restaurant_name: string;
    location: string;
    contact_phone?: string;
    description?: string;
    brand_color?: string;
    cuisine_type?: string;
}

function slugify(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
}

export async function POST(req: NextRequest) {
    const supabase = await createClient();

    // 1. Verify authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
        return apiError('Unauthorized', 401);
    }

    // 2. Parse + validate body
    let body: OnboardingPayload;
    try {
        body = await req.json() as OnboardingPayload;
    } catch {
        return apiError('Invalid request body', 400);
    }

    const { full_name, restaurant_name, location, contact_phone, description, brand_color, cuisine_type } = body;
    if (!full_name?.trim()) return apiError('Owner name is required', 400);
    if (!restaurant_name?.trim()) return apiError('Restaurant name is required', 400);
    if (!location?.trim()) return apiError('Location is required', 400);

    // 3. Find the auto-bootstrapped restaurant (created by DB trigger on signup)
    const { data: existingStaff } = await supabase
        .from('restaurant_staff')
        .select('restaurant_id')
        .eq('user_id', user.id)
        .eq('role', 'owner')
        .maybeSingle();

    const slug = `${slugify(restaurant_name)}-${Date.now().toString(36)}`;

    let restaurantId: string;

    if (existingStaff?.restaurant_id) {
        // Update the auto-bootstrapped restaurant with the real data from the wizard
        const { data: updated, error: updateError } = await supabase
            .from('restaurants')
            .update({
                name: restaurant_name.trim(),
                slug,
                location: location.trim(),
                contact_phone: contact_phone?.trim() || null,
                contact_email: user.email,
                description: description?.trim() || `Welcome to ${restaurant_name.trim()}!`,
                brand_color: brand_color || '#0D3B40',
                is_active: true,
                onboarding_completed: true,
                settings: {
                    branding: {
                        primary_color: brand_color || '#0D3B40',
                        secondary_color: '#ffffff',
                    },
                    cuisine_type: cuisine_type || null,
                    currency: 'ETB',
                    enable_ordering: true,
                    telegram_chat_id: null,
                    telegram_bot_token: null,
                    telegram_kitchen_chat_id: null,
                    telegram_bar_chat_id: null,
                },
            })
            .eq('id', existingStaff.restaurant_id)
            .select('id')
            .single();

        if (updateError || !updated) {
            console.error('Restaurant update failed:', updateError);
            return apiError('Failed to update restaurant', 500);
        }
        restaurantId = updated.id;
    } else {
        // No auto-bootstrapped restaurant exists (edge case) — create one from scratch
        const { data: restaurant, error: restaurantError } = await supabase
            .from('restaurants')
            .insert({
                name: restaurant_name.trim(),
                slug,
                location: location.trim(),
                contact_phone: contact_phone?.trim() || null,
                contact_email: user.email,
                description: description?.trim() || `Welcome to ${restaurant_name.trim()}!`,
                brand_color: brand_color || '#0D3B40',
                is_active: true,
                onboarding_completed: true,
                settings: {
                    branding: {
                        primary_color: brand_color || '#0D3B40',
                        secondary_color: '#ffffff',
                    },
                    cuisine_type: cuisine_type || null,
                    currency: 'ETB',
                    enable_ordering: true,
                    telegram_chat_id: null,
                    telegram_bot_token: null,
                    telegram_kitchen_chat_id: null,
                    telegram_bar_chat_id: null,
                },
            })
            .select('id')
            .single();

        if (restaurantError || !restaurant) {
            console.error('Restaurant creation failed:', restaurantError);
            return apiError('Failed to create restaurant', 500);
        }

        // Link user as owner
        await supabase.from('restaurant_staff').insert({
            user_id: user.id,
            restaurant_id: restaurant.id,
            role: 'owner',
            is_active: true,
        });

        restaurantId = restaurant.id;
    }

    // 4. Update user metadata with full_name
    await supabase.auth.updateUser({
        data: { full_name: full_name.trim() },
    });

    return apiSuccess({
        restaurant_id: restaurantId,
        restaurant_slug: slug,
    });
}
