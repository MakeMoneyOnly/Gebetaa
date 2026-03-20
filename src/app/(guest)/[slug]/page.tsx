import { Suspense } from 'react';
import { CartProvider } from '@/context/CartContext';
import { createClient } from '@/lib/supabase/server';
import { MenuClientContent } from './menu-client';
import type { Metadata } from 'next';

/**
 * Dynamic metadata for SEO - fetches restaurant information based on slug
 */
export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const { slug } = await params;

    try {
        const supabase = await createClient();

        const { data: restaurant, error } = await supabase
            .from('restaurants')
            .select('id, name, description, logo_url, slug')
            .eq('slug', slug)
            .maybeSingle();

        if (error || !restaurant) {
            return {
                title: 'Restaurant Menu | Gebeta',
                description: 'Order food online from the best restaurants in Addis Ababa',
            };
        }

        return {
            title: `${restaurant.name} Menu | Gebeta`,
            description:
                restaurant.description ||
                `Order delicious food from ${restaurant.name}'s menu on Gebeta - Ethiopia's leading restaurant platform`,
            openGraph: {
                title: `${restaurant.name} Menu | Gebeta`,
                description:
                    restaurant.description ||
                    `Browse ${restaurant.name}'s full menu and order online`,
                type: 'website',
                images: restaurant.logo_url ? [{ url: restaurant.logo_url }] : [],
            },
            twitter: {
                card: 'summary',
                title: `${restaurant.name} Menu | Gebeta`,
                description: restaurant.description || `Order from ${restaurant.name} on Gebeta`,
                images: restaurant.logo_url ? [restaurant.logo_url] : [],
            },
        };
    } catch (error) {
        console.error('Error generating metadata:', error);
        return {
            title: 'Restaurant Menu | Gebeta',
            description: 'Order food online from the best restaurants in Addis Ababa',
        };
    }
}

/**
 * Default export - Server Component that renders the client menu content
 */
export default async function MenuPage() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-screen w-full bg-[var(--background)] text-white">
                    {/* Fallback space matches main structure to avoid jar */}
                </div>
            }
        >
            <CartProvider>
                <MenuClientContent />
            </CartProvider>
        </Suspense>
    );
}
