'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { usePageLoadGuard } from '@/hooks/usePageLoadGuard';
import type { MenuPageData, CategoryWithItems } from '@/lib/services/dashboardDataService';

interface MenuPageClientProps {
    initialData: MenuPageData | null;
}

export function MenuPageClient({ initialData }: MenuPageClientProps) {
    const { markLoaded } = usePageLoadGuard('menu');

    const [categories, setCategories] = useState<CategoryWithItems[]>(initialData?.categories ?? []);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const restaurantId = initialData?.restaurant_id;

    useEffect(() => {
        if (initialData) {
            markLoaded();
        }
    }, [initialData, markLoaded]);

    const refreshData = useCallback(async () => {
        if (!restaurantId) return;
        setRefreshing(true);
        try {
            const response = await fetch('/api/menu');
            const result = await response.json();
            if (response.ok) {
                setCategories(result.data?.categories ?? []);
            }
        } catch (error) {
            console.error('Failed to refresh menu:', error);
            toast.error('Failed to refresh menu');
        } finally {
            setRefreshing(false);
        }
    }, [restaurantId]);

    const handleToggleAvailability = useCallback(async (itemId: string, currentStatus: boolean | null) => {
        const newStatus = !currentStatus;
        setCategories(prev =>
            prev.map(cat => ({
                ...cat,
                items: cat.items.map(item =>
                    item.id === itemId ? { ...item, is_available: newStatus } : item
                ),
            }))
        );

        try {
            const response = await fetch(`/api/menu/items/${itemId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_available: newStatus }),
            });

            if (!response.ok) throw new Error('Failed to update item');
            toast.success(newStatus ? 'Item available' : 'Item unavailable');
        } catch (error) {
            setCategories(prev =>
                prev.map(cat => ({
                    ...cat,
                    items: cat.items.map(item =>
                        item.id === itemId ? { ...item, is_available: currentStatus } : item
                    ),
                }))
            );
            toast.error('Failed to update item');
        }
    }, []);

    const filteredCategories = selectedCategory
        ? categories.filter(c => c.id === selectedCategory)
        : categories;

    const stats = {
        totalCategories: categories.length,
        totalItems: categories.reduce((sum, cat) => sum + cat.items.length, 0),
        availableItems: categories.reduce(
            (sum, cat) => sum + cat.items.filter(i => i.is_available !== false).length,
            0
        ),
    };

    return (
        <div className="min-h-screen space-y-6 pb-20">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                    <h1 className="mb-2 text-4xl font-bold tracking-tight text-gray-900">Menu</h1>
                    <p className="font-medium text-gray-500">Manage your menu items and categories.</p>
                </div>
                <button
                    onClick={refreshData}
                    disabled={refreshing}
                    className="flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-gray-700 shadow-sm transition-all hover:bg-gray-50 disabled:opacity-50"
                >
                    {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
                    <p className="text-sm font-medium text-gray-500">Categories</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalCategories}</p>
                </div>
                <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
                    <p className="text-sm font-medium text-gray-500">Total Items</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalItems}</p>
                </div>
                <div className="rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-100">
                    <p className="text-sm font-medium text-emerald-600">Available</p>
                    <p className="text-2xl font-bold text-emerald-700">{stats.availableItems}</p>
                </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2">
                <button
                    onClick={() => setSelectedCategory(null)}
                    className={cn(
                        'rounded-xl px-4 py-2 text-sm font-bold whitespace-nowrap',
                        !selectedCategory
                            ? 'bg-gray-900 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                    )}
                >
                    All
                </button>
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={cn(
                            'rounded-xl px-4 py-2 text-sm font-bold whitespace-nowrap',
                            selectedCategory === cat.id
                                ? 'bg-gray-900 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-50'
                        )}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>

            <div className="space-y-6">
                {filteredCategories.map(category => (
                    <div key={category.id} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
                        <h2 className="mb-4 text-lg font-bold text-gray-900">{category.name}</h2>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {category.items.map(item => (
                                <div
                                    key={item.id}
                                    className={cn(
                                        'rounded-xl p-4 ring-1',
                                        item.is_available !== false
                                            ? 'bg-white ring-gray-100'
                                            : 'bg-gray-50 ring-gray-200 opacity-60'
                                    )}
                                >
                                    <div className="mb-2 flex items-start justify-between">
                                        <div>
                                            <h3 className="font-bold text-gray-900">{item.name}</h3>
                                            <p className="text-sm text-gray-500">{item.price?.toLocaleString() ?? 0} ETB</p>
                                        </div>
                                        <button
                                            onClick={() => handleToggleAvailability(item.id, item.is_available)}
                                            className={cn(
                                                'rounded-lg px-2 py-1 text-xs font-bold',
                                                item.is_available !== false
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-gray-200 text-gray-600'
                                            )}
                                        >
                                            {item.is_available !== false ? 'Available' : 'Unavailable'}
                                        </button>
                                    </div>
                                    {item.description && (
                                        <p className="text-sm text-gray-500 line-clamp-2">{item.description}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}