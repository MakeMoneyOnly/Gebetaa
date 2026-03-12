/**
 * Merchant Dashboard Server Component
 * 
 * This is a Server Component that fetches initial data on the server,
 * eliminating the loading flash on initial render.
 * 
 * Architecture Pattern (Enterprise-Grade 2025):
 * 1. Server Component fetches data with proper caching strategy
 * 2. Data is passed to Client Component as serializable props
 * 3. Client Component handles interactivity and realtime updates
 * 
 * Performance Benefits:
 * - No loading skeleton on initial page load
 * - Instant render with server-provided data
 * - Improved TTI (Time to Interactive)
 * - Better SEO and Core Web Vitals
 * 
 * Caching Strategy:
 * - Command center data is dynamic (force-dynamic)
 * - Data changes frequently, so no static generation
 */

import { redirect } from 'next/navigation';
import { getCommandCenterData, resolveRestaurantId } from '@/lib/services/dashboardDataService';
import { MerchantDashboardClient } from '@/components/merchant/MerchantDashboardClient';

// Force dynamic rendering - command center data changes frequently
export const dynamic = 'force-dynamic';

// Revalidate every 0 seconds (always fresh)
export const revalidate = 0;

export default async function MerchantDashboardPage() {
    // Check if user has a restaurant context
    const restaurantId = await resolveRestaurantId();
    
    if (!restaurantId) {
        // User is not associated with any restaurant
        // Redirect to onboarding or show error
        redirect('/auth/signin?error=no_restaurant');
    }

    // Fetch initial command center data on the server
    // This eliminates the loading flash on initial render
    const initialData = await getCommandCenterData('today');

    // Pass server-fetched data to Client Component
    return <MerchantDashboardClient initialData={initialData} />;
}