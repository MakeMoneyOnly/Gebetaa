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
    const since = getRangeStart(url.searchParams.get('range'));

    const [ordersRes, requestsRes, tablesRes] = await Promise.all([
        context.supabase
            .from('orders')
            .select('id, status, total_price, created_at')
            .eq('restaurant_id', context.restaurantId)
            .gte('created_at', since),
        context.supabase
            .from('service_requests')
            .select('id, status, created_at')
            .eq('restaurant_id', context.restaurantId)
            .gte('created_at', since),
        context.supabase
            .from('tables')
            .select('id, status, is_active')
            .eq('restaurant_id', context.restaurantId),
    ]);

    if (ordersRes.error) {
        return apiError('Failed to fetch analytics orders data', 500, 'ANALYTICS_ORDERS_FETCH_FAILED', ordersRes.error.message);
    }
    if (requestsRes.error) {
        return apiError('Failed to fetch analytics requests data', 500, 'ANALYTICS_REQUESTS_FETCH_FAILED', requestsRes.error.message);
    }
    if (tablesRes.error) {
        return apiError('Failed to fetch analytics tables data', 500, 'ANALYTICS_TABLES_FETCH_FAILED', tablesRes.error.message);
    }

    const orders = ordersRes.data ?? [];
    const requests = requestsRes.data ?? [];
    const tables = tablesRes.data ?? [];

    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total_price ?? 0), 0);
    const totalOrders = orders.length;
    const completedOrders = orders.filter(order => ['served', 'completed'].includes(order.status ?? '')).length;
    const pendingOrders = orders.filter(order => ['pending', 'acknowledged', 'preparing', 'ready'].includes(order.status ?? '')).length;
    const openRequests = requests.filter(r => (r.status ?? 'pending') === 'pending').length;
    const activeTables = tables.filter(t => t.is_active !== false && t.status !== 'available').length;

    return apiSuccess({
        range_start: since,
        metrics: {
            total_revenue: totalRevenue,
            total_orders: totalOrders,
            completed_orders: completedOrders,
            pending_orders: pendingOrders,
            open_requests: openRequests,
            active_tables: activeTables,
            conversion_rate: totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0,
            avg_order_value: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
        },
    });
}
