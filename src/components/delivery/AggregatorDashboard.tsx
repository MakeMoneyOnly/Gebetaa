/**
 * Delivery Aggregator Dashboard Component
 * TASK-DELIVERY-001: Third-Party Delivery Aggregator
 *
 * Dashboard for managing delivery platform integrations
 */

'use client';

import { useState, useEffect } from 'react';

interface DeliveryPartner {
    id: string;
    partner_name: string;
    display_name: string;
    is_active: boolean;
    auto_accept_orders: boolean;
    prep_time_minutes: number;
    last_menu_sync_at: string | null;
    menu_sync_status: string;
}

interface AggregatorOrder {
    id: string;
    external_order_id: string;
    external_order_number: string | null;
    customer_name: string | null;
    customer_phone: string | null;
    delivery_address: string | null;
    items: Array<{ name: string; quantity: number; price: number }>;
    subtotal: number;
    delivery_fee: number;
    total: number;
    status: string;
    placed_at: string;
    delivery_partner: { display_name: string };
}

interface AggregatorDashboardProps {
    restaurantId: string;
}

export function AggregatorDashboard({ restaurantId }: AggregatorDashboardProps) {
    const [partners, setPartners] = useState<DeliveryPartner[]>([]);
    const [pendingOrders, setPendingOrders] = useState<AggregatorOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'orders' | 'partners' | 'sync'>('orders');

    useEffect(() => {
        loadData();
    }, [restaurantId]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [partnersRes, ordersRes] = await Promise.all([
                fetch(`/api/delivery/aggregator/orders?restaurantId=${restaurantId}`),
                fetch(
                    `/api/delivery/aggregator/orders?restaurantId=${restaurantId}&status=pending`
                ),
            ]);

            if (partnersRes.ok) {
                const data = await partnersRes.json();
                setPartners(data.data?.configs || []);
            }

            if (ordersRes.ok) {
                const data = await ordersRes.json();
                setPendingOrders(data.data?.orders || []);
            }
        } catch (error) {
            console.error('Failed to load aggregator data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSyncMenu = async (partnerId?: string) => {
        try {
            const response = await fetch('/api/delivery/aggregator/sync-menu', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ restaurantId, partnerId }),
            });

            if (response.ok) {
                loadData();
            }
        } catch (error) {
            console.error('Failed to sync menu:', error);
        }
    };

    const handleAcceptOrder = async (orderId: string) => {
        try {
            const response = await fetch(`/api/delivery/aggregator/orders/${orderId}/accept`, {
                method: 'POST',
            });

            if (response.ok) {
                loadData();
            }
        } catch (error) {
            console.error('Failed to accept order:', error);
        }
    };

    const formatTime = (isoString: string) => {
        return new Date(isoString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (isLoading) {
        return (
            <div className="p-8 text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
                <p className="mt-4 text-gray-500">Loading delivery dashboard...</p>
            </div>
        );
    }

    return (
        <div className="rounded-lg bg-white shadow dark:bg-gray-800">
            {/* Tabs */}
            <div className="border-b dark:border-gray-700">
                <div className="flex">
                    {[
                        { id: 'orders', label: 'Pending Orders', count: pendingOrders.length },
                        { id: 'partners', label: 'Partners' },
                        { id: 'sync', label: 'Menu Sync' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`border-b-2 px-6 py-4 text-sm font-medium transition-colors ${
                                activeTab === tab.id
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {tab.label}
                            {tab.count !== undefined && tab.count > 0 && (
                                <span className="ml-2 rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-600">
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <div className="p-6">
                {/* Orders Tab */}
                {activeTab === 'orders' && (
                    <div>
                        {pendingOrders.length === 0 ? (
                            <div className="py-12 text-center text-gray-500">
                                <svg
                                    className="mx-auto mb-4 h-12 w-12 text-gray-300"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                    />
                                </svg>
                                <p>No pending orders from delivery platforms</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {pendingOrders.map(order => (
                                    <div
                                        key={order.id}
                                        className="rounded-lg border p-4 dark:border-gray-700"
                                    >
                                        <div className="mb-3 flex items-start justify-between">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">
                                                        #
                                                        {order.external_order_number ||
                                                            order.external_order_id}
                                                    </span>
                                                    <span className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-600">
                                                        {order.delivery_partner?.display_name}
                                                    </span>
                                                </div>
                                                <p className="mt-1 text-sm text-gray-500">
                                                    {formatTime(order.placed_at)} •{' '}
                                                    {order.customer_name || 'Guest'}
                                                </p>
                                            </div>
                                            <span className="font-semibold">
                                                {order.total.toFixed(2)} ETB
                                            </span>
                                        </div>

                                        <div className="mb-3 text-sm text-gray-600 dark:text-gray-400">
                                            {order.items.map((item, i) => (
                                                <span key={i}>
                                                    {item.quantity}x {item.name}
                                                    {i < order.items.length - 1 && ', '}
                                                </span>
                                            ))}
                                        </div>

                                        {order.delivery_address && (
                                            <p className="mb-3 text-sm text-gray-500">
                                                📍 {order.delivery_address}
                                            </p>
                                        )}

                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleAcceptOrder(order.id)}
                                                className="flex-1 rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                                            >
                                                Accept & Add to POS
                                            </button>
                                            <button className="rounded border px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700">
                                                Reject
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Partners Tab */}
                {activeTab === 'partners' && (
                    <div>
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="font-medium">Connected Platforms</h3>
                            <button className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
                                + Add Platform
                            </button>
                        </div>

                        {partners.length === 0 ? (
                            <div className="py-12 text-center text-gray-500">
                                <p>No delivery platforms connected</p>
                                <p className="mt-2 text-sm">
                                    Connect delivery platforms to receive orders
                                </p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {partners.map(partner => (
                                    <div
                                        key={partner.id}
                                        className="flex items-center justify-between rounded-lg border p-4 dark:border-gray-700"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div
                                                className={`h-3 w-3 rounded-full ${partner.is_active ? 'bg-green-500' : 'bg-gray-300'}`}
                                            />
                                            <div>
                                                <p className="font-medium">
                                                    {partner.display_name}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {partner.is_active ? 'Active' : 'Inactive'}
                                                    {partner.auto_accept_orders &&
                                                        ' • Auto-accept enabled'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-sm text-gray-500">
                                                {partner.prep_time_minutes} min prep
                                            </span>
                                            <button className="text-sm text-blue-600 hover:text-blue-700">
                                                Settings
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Sync Tab */}
                {activeTab === 'sync' && (
                    <div>
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="font-medium">Menu Synchronization</h3>
                            <button
                                onClick={() => handleSyncMenu()}
                                className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
                            >
                                Sync All Menus
                            </button>
                        </div>

                        {partners.length === 0 ? (
                            <div className="py-12 text-center text-gray-500">
                                <p>Connect delivery platforms to sync your menu</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {partners.map(partner => (
                                    <div
                                        key={partner.id}
                                        className="flex items-center justify-between rounded-lg border p-4 dark:border-gray-700"
                                    >
                                        <div>
                                            <p className="font-medium">{partner.display_name}</p>
                                            <p className="text-sm text-gray-500">
                                                {partner.last_menu_sync_at
                                                    ? `Last synced: ${new Date(partner.last_menu_sync_at).toLocaleString()}`
                                                    : 'Never synced'}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span
                                                className={`rounded px-2 py-1 text-xs ${
                                                    partner.menu_sync_status === 'synced'
                                                        ? 'bg-green-100 text-green-600'
                                                        : partner.menu_sync_status === 'error'
                                                          ? 'bg-red-100 text-red-600'
                                                          : 'bg-gray-100 text-gray-600'
                                                }`}
                                            >
                                                {partner.menu_sync_status}
                                            </span>
                                            <button
                                                onClick={() => handleSyncMenu(partner.id)}
                                                className="rounded border px-3 py-1 text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                                            >
                                                Sync
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
