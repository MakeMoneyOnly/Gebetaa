import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

/**
 * Happy hour schedule type definition
 */
interface HappyHourSchedule {
    id: string;
    restaurant_id: string;
    name: string;
    name_am: string | null;
    description: string | null;
    description_am: string | null;
    is_active: boolean;
    schedule_days: string[];
    schedule_start_time: string;
    schedule_end_time: string;
    discount_percentage: number | null;
    discount_fixed_amount: number | null;
    applies_to: string;
    target_category_id: string | null;
    target_menu_item_ids: string[];
    priority: number;
    requires_manager_pin: boolean;
    created_by: string | null;
    created_at: string;
    updated_at: string;
}

/**
 * Get the day of week abbreviation for the current day
 */
function getCurrentDayAbbrev(): string {
    const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    return days[new Date().getDay()];
}

/**
 * Check if a time falls within a happy hour schedule
 */
function isTimeInRange(startTime: string, endTime: string): boolean {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

    // Handle overnight ranges (e.g., 22:00 to 02:00)
    if (endTime < startTime) {
        return currentTime >= startTime || currentTime < endTime;
    }

    return currentTime >= startTime && currentTime < endTime;
}

/**
 * Find the active happy hour for a restaurant at the current time
 */
export async function getActiveHappyHour(
    supabase: SupabaseClient<Database>,
    restaurantId: string
): Promise<HappyHourSchedule | null> {
    const currentDay = getCurrentDayAbbrev();
    const now = new Date();

    // Get all active happy hours for this restaurant
    const { data: schedules, error } = await (supabase
        .from('happy_hour_schedules' as any)
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('is_active', true)
        .order('priority', { ascending: false })
        .limit(10) as any);

    if (error || !schedules) {
        console.error('Failed to fetch happy hour schedules:', error);
        return null;
    }

    // Find the first matching schedule
    for (const schedule of schedules) {
        const days = schedule.schedule_days as string[];
        if (!days.includes(currentDay)) {
            continue;
        }

        if (isTimeInRange(schedule.schedule_start_time, schedule.schedule_end_time)) {
            return schedule;
        }
    }

    return null;
}

/**
 * Calculate happy hour discount for a given amount
 */
export function calculateHappyHourDiscount(
    amount: number,
    happyHour: HappyHourSchedule
): { discount: number; finalAmount: number } {
    let discount = 0;

    if (happyHour.discount_percentage) {
        discount = Math.round(amount * (happyHour.discount_percentage / 10000));
    } else if (happyHour.discount_fixed_amount) {
        discount = Math.min(happyHour.discount_fixed_amount, amount);
    }

    return {
        discount,
        finalAmount: Math.max(0, amount - discount),
    };
}
