import { apiError, apiSuccess } from '@/lib/api/response';
import { getAuthenticatedUser, getAuthorizedRestaurantContext } from '@/lib/api/authz';

function getRangeStart(range: string | null) {
    const now = new Date();
    if (range === 'week') {
        const d = new Date(now);
        d.setDate(now.getDate() - 7);
        return d.toISOString();
    }
    if (range === 'month') {
        const d = new Date(now);
        d.setMonth(now.getMonth() - 1);
        return d.toISOString();
    }
    if (range === 'year') {
        const d = new Date(now);
        d.setFullYear(now.getFullYear() - 1);
        return d.toISOString();
    }
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
}

export async function GET(request: Request) {
    const auth = await getAuthenticatedUser();
    if (!auth.ok) {
        return auth.response;
    }

    const context = await getAuthorizedRestaurantContext(auth.user.id);
    if (!context.ok) {
        return context.response;
    }

    const url = new URL(request.url);
    const range = url.searchParams.get('range');
    const since = getRangeStart(range);

    // Calculate previous period start
    const sinceDate = new Date(since);
    const prevDate = new Date(sinceDate);
    if (range === 'week') prevDate.setDate(prevDate.getDate() - 7);
    else if (range === 'month') prevDate.setMonth(prevDate.getMonth() - 1);
    else if (range === 'year') prevDate.setFullYear(prevDate.getFullYear() - 1);
    else prevDate.setDate(prevDate.getDate() - 1); // Default is today (1 day)

    const prevSince = prevDate.toISOString();

    const [ordersRes, prevOrdersRes, requestsRes, tablesRes, reviewsRes] = await Promise.all([
        context.supabase
            .from('orders')
            .select('id, status, total_price, created_at, order_items(name, quantity, price)')
            .eq('restaurant_id', context.restaurantId)
            .gte('created_at', since),
        context.supabase
            .from('orders')
            .select('id', { count: 'exact', head: true })
            .eq('restaurant_id', context.restaurantId)
            .in('status', ['served', 'completed'])
            .gte('created_at', prevSince)
            .lt('created_at', since),
        context.supabase
            .from('service_requests')
            .select('id, status, created_at')
            .eq('restaurant_id', context.restaurantId)
            .gte('created_at', since),
        context.supabase
            .from('tables')
            .select('id, status, is_active')
            .eq('restaurant_id', context.restaurantId),
        context.supabase
            .from('reviews')
            .select('rating, created_at')
            .eq('restaurant_id', context.restaurantId),
    ]);

    if (ordersRes.error) {
        return apiError(
            'Failed to fetch analytics orders data',
            500,
            'ANALYTICS_ORDERS_FETCH_FAILED',
            ordersRes.error.message
        );
    }
    if (requestsRes.error) {
        return apiError(
            'Failed to fetch analytics requests data',
            500,
            'ANALYTICS_REQUESTS_FETCH_FAILED',
            requestsRes.error.message
        );
    }
    if (tablesRes.error) {
        return apiError(
            'Failed to fetch analytics tables data',
            500,
            'ANALYTICS_TABLES_FETCH_FAILED',
            tablesRes.error.message
        );
    }
    // review fetch failure is non-critical, we can default to 0

    const orders = ordersRes.data ?? [];
    const requests = requestsRes.data ?? [];
    const tables = tablesRes.data ?? [];
    const reviews = reviewsRes.data ?? [];

    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total_price ?? 0), 0);
    const totalOrders = orders.length;
    const completedOrders = orders.filter(order =>
        ['served', 'completed'].includes(order.status ?? '')
    ).length;
    const previousCompletedOrders = prevOrdersRes.count ?? 0;

    const pendingOrders = orders.filter(order =>
        ['pending', 'acknowledged', 'preparing', 'ready'].includes(order.status ?? '')
    ).length;
    const openRequests = requests.filter(r => (r.status ?? 'pending') === 'pending').length;

    // Table Metrics
    const activeTables = tables.filter(
        t => t.is_active !== false && t.status !== 'available'
    ).length;
    const totalTables = tables.length;

    // Review Metrics
    const totalReviews = reviews.length;
    const avgRating =
        totalReviews > 0
            ? Number(
                  (reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / totalReviews).toFixed(1)
              )
            : 0;

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const reviewsThisWeek = reviews.filter(
        r => r.created_at && new Date(r.created_at) > oneWeekAgo
    ).length;

    // Calculate Top Selling Items
    const itemSales: Record<string, { count: number; revenue: number }> = {};
    orders.forEach(order => {
        const items = order.order_items || [];
        items.forEach((item: any) => {
            const name = item.name || 'Unknown Item';
            const qty = item.quantity || 1;
            const price = item.price || 0;

            if (!itemSales[name]) {
                itemSales[name] = { count: 0, revenue: 0 };
            }
            itemSales[name].count += qty;
            itemSales[name].revenue += price * qty;
        });
    });

    const topItems = Object.entries(itemSales)
        .map(([name, stats]) => ({ name, ...stats }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    // Calculate Trends (buckets)
    const trendBuckets: Record<string, { revenue: number; orders: number }> = {};
    const now = new Date();
    const isToday = !url.searchParams.get('range') || url.searchParams.get('range') === 'today';

    // Initialize buckets
    for (let i = 0; i < (isToday ? 24 : 7); i++) {
        const key = isToday
            ? i.toString().padStart(2, '0') + ':00'
            : new Date(now.getTime() - (6 - i) * 86400000).toLocaleDateString('en-US', {
                  weekday: 'short',
              });
        trendBuckets[key] = { revenue: 0, orders: 0 };
    }

    orders.forEach(order => {
        if (!order.created_at) return;
        const date = new Date(order.created_at);
        let key = '';

        if (isToday) {
            key = date.getHours().toString().padStart(2, '0') + ':00';
        } else {
            key = date.toLocaleDateString('en-US', { weekday: 'short' });
        }

        if (trendBuckets[key]) {
            trendBuckets[key].revenue += Number(order.total_price ?? 0);
            trendBuckets[key].orders += 1;
        }
    });

    const trends = Object.entries(trendBuckets).map(([label, data]) => ({
        label,
        ...data,
    }));

    return apiSuccess({
        range_start: since,
        metrics: {
            total_revenue: totalRevenue,
            total_orders: totalOrders,
            completed_orders: completedOrders,
            previous_completed_orders: previousCompletedOrders,
            pending_orders: pendingOrders,
            open_requests: openRequests,
            active_tables: activeTables,
            total_tables: totalTables,
            conversion_rate:
                totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0,
            avg_order_value: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
            avg_rating: avgRating,
            total_reviews: totalReviews,
            reviews_this_week: reviewsThisWeek,
            top_items: topItems,
            trends: trends,
        },
    });
}
