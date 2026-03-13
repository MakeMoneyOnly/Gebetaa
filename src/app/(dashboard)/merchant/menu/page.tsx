import { redirect } from 'next/navigation';
import { getMenuPageData, resolveRestaurantId } from '@/lib/services/dashboardDataService';
import { MenuPageClient } from '@/components/merchant/MenuPageClient';

// Force dynamic rendering - menu data changes frequently
export const dynamic = 'force-dynamic';

// Revalidate every 300 seconds (5 minutes) - menu changes less frequently
export const revalidate = 300;

export default async function MenuPage() {
    // Check authentication and restaurant context
    const restaurantId = await resolveRestaurantId();

    if (!restaurantId) {
        redirect('/auth/signin?error=no_restaurant');
    }

    // Fetch initial data on the server
    const initialData = await getMenuPageData();

    // Pass server-fetched data to Client Component
    return <MenuPageClient initialData={initialData} />;
}