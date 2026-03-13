import { redirect } from 'next/navigation';
import { getFinancePageData, resolveRestaurantId } from '@/lib/services/dashboardDataService';
import { FinancePageClient } from '@/components/merchant/FinancePageClient';

// Force dynamic rendering - finance data changes frequently
export const dynamic = 'force-dynamic';

// Revalidate every 0 seconds (always fresh)
export const revalidate = 0;

export default async function FinancePage() {
    // Check authentication and restaurant context
    const restaurantId = await resolveRestaurantId();

    if (!restaurantId) {
        redirect('/auth/signin?error=no_restaurant');
    }

    // Fetch initial data on the server
    const initialData = await getFinancePageData();

    // Pass server-fetched data to Client Component
    return <FinancePageClient initialData={initialData} />;
}