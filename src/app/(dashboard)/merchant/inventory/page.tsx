import { redirect } from 'next/navigation';
import { getInventoryPageData, resolveRestaurantId } from '@/lib/services/dashboardDataService';
import { InventoryPageClient } from '@/components/merchant/InventoryPageClient';

// Force dynamic rendering - inventory data changes frequently
export const dynamic = 'force-dynamic';

// Revalidate every 60 seconds
export const revalidate = 60;

export default async function InventoryPage() {
    // Check authentication and restaurant context
    const restaurantId = await resolveRestaurantId();

    if (!restaurantId) {
        redirect('/auth/signin?error=no_restaurant');
    }

    // Fetch initial data on the server
    const initialData = await getInventoryPageData();

    // Pass server-fetched data to Client Component
    return <InventoryPageClient initialData={initialData} />;
}