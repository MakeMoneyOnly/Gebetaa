import { redirect } from 'next/navigation';
import { resolveRestaurantId } from '@/lib/services/dashboardDataService';
import { HelpPageClient } from '@/components/merchant/HelpPageClient';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Revalidate every 3600 seconds (1 hour) - help content changes rarely
export const revalidate = 3600;

interface SupportArticle {
    id: string;
    title: string;
    category: string;
}

interface SupportTicket {
    id: string;
    subject: string;
    description: string;
    priority: string;
    status: string;
    source: string;
    created_at: string;
    updated_at: string;
}

async function getInitialArticles(): Promise<SupportArticle[]> {
    try {
        // For now, return empty array - the client will fetch from API
        // In production, this could fetch from a CMS or database
        return [];
    } catch (error) {
        console.error('Failed to fetch initial articles:', error);
        return [];
    }
}

async function getInitialTickets(restaurantId: string): Promise<SupportTicket[]> {
    try {
        const { createClient } = await import('@/lib/supabase/server');
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('support_tickets')
            .select('id, subject, description, priority, status, source, created_at, updated_at')
            .eq('restaurant_id', restaurantId)
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) {
            console.error('Failed to fetch tickets:', error);
            return [];
        }

        return (data ?? []) as SupportTicket[];
    } catch (error) {
        console.error('Failed to fetch initial tickets:', error);
        return [];
    }
}

export default async function HelpPage() {
    // Check authentication and restaurant context
    const restaurantId = await resolveRestaurantId();

    if (!restaurantId) {
        redirect('/auth/signin?error=no_restaurant');
    }

    // Fetch initial data on the server in parallel
    const [initialArticles, initialTickets] = await Promise.all([
        getInitialArticles(),
        getInitialTickets(restaurantId),
    ]);

    // Pass server-fetched data to Client Component
    return <HelpPageClient initialArticles={initialArticles} initialTickets={initialTickets} />;
}
