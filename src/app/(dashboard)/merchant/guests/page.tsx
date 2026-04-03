import { redirect } from 'next/navigation';
import { resolveRestaurantId } from '@/lib/services/dashboardDataService';
import { GuestsPageClient } from '@/components/merchant/GuestsPageClient';

// Force dynamic rendering - guest data changes frequently
export const dynamic = 'force-dynamic';

// Revalidate every 60 seconds
export const revalidate = 60;

export default async function GuestsPage() {
    // Check authentication and restaurant context
    const restaurantId = await resolveRestaurantId();

    if (!restaurantId) {
        redirect('/auth/signin?error=no_restaurant');
    }

    // Guest data is fetched client-side by GuestsPageClient
    // The initialData prop is optional and not used by the component
    return <GuestsPageClient />;
}
