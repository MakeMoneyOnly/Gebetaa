import { redirect } from 'next/navigation';

type PageProps = {
    searchParams?: Record<string, string | string[] | undefined>;
};

export default function PosMobileRedirectPage({ searchParams }: PageProps) {
    const restaurantId = searchParams?.restaurantId;
    const restaurantValue = Array.isArray(restaurantId) ? restaurantId[0] : restaurantId;
    const nextUrl = restaurantValue ? `/waiter?restaurantId=${restaurantValue}` : '/waiter';
    redirect(nextUrl);
}
