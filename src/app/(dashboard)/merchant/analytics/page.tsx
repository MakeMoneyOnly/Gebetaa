import { redirect } from 'next/navigation';
import { getAnalyticsPageData, resolveRestaurantId } from '@/lib/services/dashboardDataService';
import { AnalyticsPageClient } from '@/components/merchant/AnalyticsPageClient';

// Force dynamic rendering - analytics data changes frequently
export const dynamic = 'force-dynamic';

// Revalidate every 60 seconds
export const revalidate = 60;

export default async function AnalyticsPage() {
    // Check authentication and restaurant context
    const restaurantId = await resolveRestaurantId();

    if (!restaurantId) {
        redirect('/auth/signin?error=no_restaurant');
    }

    // Fetch initial data on the server
    const initialData = await getAnalyticsPageData('today');

    // Pass server-fetched data to Client Component
    return <AnalyticsPageClient initialData={initialData} />;
}