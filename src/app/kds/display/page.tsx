import { redirect } from 'next/navigation';

type PageProps = {
    searchParams?: Record<string, string | string[] | undefined>;
};

export default function KdsDisplayRedirectPage({ searchParams }: PageProps) {
    const restaurantId = searchParams?.restaurantId;
    const restaurantValue = Array.isArray(restaurantId) ? restaurantId[0] : restaurantId;
    const nextUrl = restaurantValue ? `/kds?restaurantId=${restaurantValue}` : '/kds';
    redirect(nextUrl);
}
