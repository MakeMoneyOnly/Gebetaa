import { redirect } from 'next/navigation';
import { getStaffPageData, resolveRestaurantId } from '@/lib/services/dashboardDataService';
import { StaffPageClient } from '@/components/merchant/StaffPageClient';

// Force dynamic rendering - staff data changes frequently
export const dynamic = 'force-dynamic';

// Revalidate every 0 seconds (always fresh)
export const revalidate = 0;

export default async function StaffPage() {
    // Check authentication and restaurant context
    const restaurantId = await resolveRestaurantId();

    if (!restaurantId) {
        redirect('/auth/signin?error=no_restaurant');
    }

    // Fetch initial data on the server
    const initialData = await getStaffPageData();

    // Pass server-fetched data to Client Component
    return <StaffPageClient initialData={initialData} />;
}