import { createServerSupabaseClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { RestaurantLayoutClient } from '@/components/restaurant/RestaurantLayoutClient';
import type { RestaurantWithMenu, CategoryWithItems } from '@/types/database';

interface Props {
    children: React.ReactNode;
    params: Promise<{ slug: string }>;
}

async function getRestaurant(slug: string): Promise<RestaurantWithMenu | null> {
    const supabase = await createServerSupabaseClient();

    // Using type assertion since Supabase can't infer nested relations
    const { data, error } = await supabase
        .from('restaurants')
        .select(`
      *,
      categories (
        *,
        items (*)
      ),
      stations (*)
    `)
        .eq('slug', slug)
        .single();

    if (error) {
        console.error('Supabase Error (slug):', error);
        return null;
    }

    if (!data) {
        console.error('Restaurant not found for slug:', slug);
        return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const restaurant = data as any;

    // Sort categories by order_index and items by popularity
    const sortedCategories: CategoryWithItems[] = (restaurant.categories || [])
        .sort((a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((cat: any) => ({
            ...cat,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            items: (cat.items || []).sort((a: any, b: any) => b.popularity - a.popularity)
        }));

    return {
        ...restaurant,
        categories: sortedCategories,
    } as RestaurantWithMenu;
}

export default async function SlugLayout({ children, params }: Props) {
    const { slug } = await params;
    const restaurant = await getRestaurant(slug);

    if (!restaurant) {
        notFound();
    }

    return (
        <RestaurantLayoutClient restaurant={restaurant}>
            {children}
        </RestaurantLayoutClient>
    );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const restaurant = await getRestaurant(slug);

    if (!restaurant) {
        return {
            title: 'Restaurant Not Found',
        };
    }

    return {
        title: `${restaurant.name} | Digital Menu`,
        description: restaurant.description || `Browse the menu at ${restaurant.name}`,
        openGraph: {
            title: restaurant.name,
            description: restaurant.description || '',
            images: restaurant.hero_image_url ? [restaurant.hero_image_url] : [],
        },
    };
}
