import { redirect } from 'next/navigation';

type PageProps = {
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PosMobileRedirectPage({ searchParams }: PageProps) {
    const resolvedSearchParams = await searchParams;
    const restaurantId = resolvedSearchParams?.restaurantId;
    const restaurantValue = Array.isArray(restaurantId) ? restaurantId[0] : restaurantId;
    const nextUrl = restaurantValue ? `/waiter?restaurantId=${restaurantValue}` : '/waiter';
    redirect(nextUrl);
}
