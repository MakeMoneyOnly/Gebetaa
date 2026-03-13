import { redirect } from 'next/navigation';
import { getGuestsPageData, resolveRestaurantId } from '@/lib/services/dashboardDataService';
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

    // Fetch initial data on the server
    const initialData = await getGuestsPageData(100);

    // Pass server-fetched data to Client Component
    return <GuestsPageClient initialData={initialData} />;
}