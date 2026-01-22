
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { MenuPageClient } from '@/components/menu/MenuPageClient';
import type { RestaurantWithMenu, CategoryWithItems } from '@/types/database';

interface Props {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ table?: string }>;
}

async function getRestaurant(slug: string): Promise<RestaurantWithMenu | null> {
    const supabase = await createServerSupabaseClient();

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

    if (error || !data) {
        return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const restaurant = data as any;

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

export default async function Page({ params, searchParams }: Props) {
    const { slug } = await params;
    const { table } = await searchParams;

    // We can rely on layout to handle 404 if restaurant not found, 
    // but we need the data here for MenuPage. 
    // Optimization: Depending on Next.js caching, this might dedup request.
    const restaurant = await getRestaurant(slug);

    if (!restaurant) {
        notFound();
    }

    return (
        <MenuPageClient
            restaurant={restaurant}
            tableNumber={table || null}
        />
    );
}
