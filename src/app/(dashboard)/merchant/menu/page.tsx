'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { Plus, Edit2, Trash2, Image as ImageIcon, Loader2, UtensilsCrossed, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/Skeleton';
import { CategoryWithItems, MenuItem } from '@/types/database';
import { MenuItemModal } from '@/features/merchant/components/MenuItemModal';

// Mock Data
const mockCategories: any[] = [
    {
        id: 'mock-cat-1',
        name: 'Starters',
        name_am: null,
        restaurant_id: 'mock-rest-1',
        items: [
            { id: 'm1', name: 'Sambusa', price: 50, description: 'Crispy pastry filled with lentils', is_available: true, image_url: null },
            { id: 'm2', name: 'Tomato Salad', price: 120, description: 'Fresh tomatoes with onions and peppers', is_available: true, image_url: null }
        ]
    },
    {
        id: 'mock-cat-2',
        name: 'Main Course',
        name_am: null,
        restaurant_id: 'mock-rest-1',
        items: [
            { id: 'm3', name: 'Doro Wat', price: 450, description: 'Spicy chicken stew', is_available: true, image_url: null },
            { id: 'm4', name: 'Kitfo', price: 550, description: 'Minced raw beef marinated in mitmita', is_available: true, image_url: null },
            { id: 'm5', name: 'Tibbs', price: 400, description: 'Sautéed beef with vegetables', is_available: true, image_url: null }
        ]
    },
    {
        id: 'mock-cat-3',
        name: 'Drinks',
        name_am: null,
        restaurant_id: 'mock-rest-1',
        items: [
            { id: 'm6', name: 'Coffee', price: 40, description: 'Traditional Ethiopian coffee', is_available: true, image_url: null },
            { id: 'm7', name: 'Tea', price: 30, description: 'Spiced tea', is_available: true, image_url: null }
        ]
    }
];

export default function MenuPage() {
    const [categories, setCategories] = useState<CategoryWithItems[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<CategoryWithItems | null>(null);
    const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

    const supabase = createClient();

    useEffect(() => {
        fetchMenu();
        // Safety timeout
        const timer = setTimeout(() => {
            setLoading(false);
        }, 3000);
        return () => clearTimeout(timer);
    }, []);

    const fetchMenu = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setCategories(mockCategories);
                return;
            }

            const { data: staff } = await supabase
                .from('restaurant_staff')
                .select('restaurant_id')
                .eq('user_id', user.id)
                .single();

            if (!staff) {
                setCategories(mockCategories);
                return;
            }

            const { data, error } = await supabase
                .from('categories')
                .select('*, items:menu_items(*)')
                .eq('restaurant_id', staff.restaurant_id)
                .order('order_index');

            if (data && data.length > 0) {
                setCategories(data as any);
            } else {
                setCategories(mockCategories);
            }
        } catch (error) {
            console.error('Error fetching menu:', error);
            setCategories(mockCategories);
        } finally {
            setLoading(false);
        }
    };

    const handleAddCategory = async () => {
        const name = prompt("Enter category name (e.g., 'Starters', 'Main Course'):");
        if (!name) return;

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: staff } = await supabase
                .from('restaurant_staff')
                .select('restaurant_id')
                .eq('user_id', user.id)
                .single();

            if (!staff) return;

            const { error } = await supabase
                .from('categories')
                .insert([{
                    restaurant_id: staff.restaurant_id,
                    name: name,
                    order_index: categories.length
                }]);

            if (error) throw error;
            fetchMenu();
        } catch (err: any) {
            alert('Error adding category: ' + (err.message || 'Unknown error'));
        }
    };

    if (loading) {
        return (
            <div className="space-y-10 pb-20 min-h-screen bg-white">
                <div className="flex items-start justify-between">
                    <div className="space-y-2">
                        <Skeleton className="h-10 w-32 rounded-xl" />
                        <Skeleton className="h-4 w-48 rounded-lg" />
                    </div>
                    {/* Header Actions Skeleton */}
                    <div className="flex gap-3">
                        <Skeleton className="h-12 w-24 rounded-xl" />
                        <Skeleton className="h-12 w-36 rounded-xl" />
                    </div>
                </div>
                <div className="space-y-12">
                    {[1, 2].map((category) => (
                        <div key={category} className="space-y-6">
                            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                                <Skeleton className="h-8 w-40 rounded-lg" />
                                <div className="flex gap-2">
                                    <Skeleton className="h-9 w-9 rounded-lg" />
                                    <Skeleton className="h-9 w-9 rounded-lg" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {[1, 2, 3, 4].map((item) => (
                                    <div key={item} className="h-72 rounded-[2rem] p-4 flex flex-col gap-4 bg-white shadow-sm">
                                        <Skeleton className="w-full h-40 rounded-[1.5rem]" />
                                        <div className="space-y-2">
                                            <Skeleton className="h-5 w-3/4 rounded-lg" />
                                            <Skeleton className="h-4 w-1/2 rounded-lg" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-10 pb-20 min-h-screen bg-white">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-4xl font-bold text-black mb-2 tracking-tight">Menu</h1>
                    <p className="text-gray-500 font-medium">Manage your categories and items.</p>
                </div>
                <div className="flex gap-3">
                    <button className="h-12 px-5 bg-white text-black border border-gray-200 rounded-xl flex items-center gap-2 hover:bg-gray-50 transition-colors font-bold text-sm">
                        Reorder
                    </button>
                    <button
                        onClick={handleAddCategory}
                        className="h-12 px-5 bg-black text-white rounded-xl flex items-center gap-2 hover:bg-gray-800 transition-colors shadow-lg shadow-black/10 font-bold text-sm"
                    >
                        <Plus className="h-4 w-4" />
                        Add Category
                    </button>
                </div>
            </div>

            {/* Menu List */}
            <div className="space-y-12">
                {categories.map((category) => (
                    <div key={category.id} className="space-y-6">
                        {/* Category Header */}
                        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                            <div className="flex items-baseline gap-4">
                                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{category.name}</h2>
                                <span className="text-sm font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-full">
                                    {category.items.length} items
                                </span>
                            </div>
                            <div className="flex gap-2">
                                <button className="h-9 w-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-black hover:bg-gray-50 transition-all">
                                    <Edit2 className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={async () => {
                                        if (!confirm(`Delete category "${category.name}" and all its items?`)) return;
                                        try {
                                            const { error } = await supabase.from('categories').delete().eq('id', category.id);
                                            if (error) throw error;
                                            fetchMenu();
                                        } catch (err) {
                                            alert('Error deleting category');
                                        }
                                    }}
                                    className="h-9 w-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        {/* Items Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {/* Add Item Card */}
                            <button
                                onClick={() => { setSelectedCategory(category); setEditingItem(null); setIsModalOpen(true); }}
                                className="group h-[280px] w-full rounded-[2rem] flex flex-col items-center justify-center gap-4 bg-gray-50 hover:bg-gray-100 transition-all shadow-sm"
                            >
                                <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                    <Plus className="h-5 w-5 text-gray-400 group-hover:text-black" />
                                </div>
                                <span className="font-bold text-gray-400 group-hover:text-black">Add New Item</span>
                            </button>

                            {/* Menu Item Cards */}
                            {category.items.map((item) => (
                                <div key={item.id}
                                    onClick={() => { setSelectedCategory(category); setEditingItem(item); setIsModalOpen(true); }}
                                    className="group relative bg-white rounded-[2rem] p-4 flex flex-col gap-4 h-72 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden">

                                    {/* Image Section - Matches Skeleton h-40 */}
                                    <div className="relative w-full h-40 rounded-[1.5rem] overflow-hidden bg-gray-50 flex-shrink-0">
                                        {item.image_url ? (
                                            <img
                                                src={item.image_url}
                                                alt={item.name}
                                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-gray-300">
                                                <ImageIcon className="h-8 w-8" />
                                            </div>
                                        )}
                                        {/* Status Badge - Absolute to keep layout clean */}
                                        <div className="absolute top-3 left-3">
                                            <span className={cn("px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide backdrop-blur-md",
                                                item.is_available ? "bg-white/90 text-green-700" : "bg-black/80 text-white")}>
                                                {item.is_available ? 'In Stock' : 'Sold Out'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Content Section - Matches Skeleton space-y-2 */}
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-bold text-gray-900 leading-tight line-clamp-1">{item.name}</h3>
                                            <span className="font-bold text-black">{item.price}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 font-medium line-clamp-2 leading-relaxed">
                                            {item.description || "No description provided."}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {categories.length === 0 && !loading && (
                    <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-gray-200 rounded-[2.5rem] bg-gray-50">
                        <div className="h-20 w-20 rounded-full bg-white flex items-center justify-center mb-6 shadow-sm">
                            <UtensilsCrossed className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No categories yet</h3>
                        <p className="text-gray-500 font-medium max-w-sm mb-8">Start building your menu by adding your first category.</p>
                        <button
                            onClick={handleAddCategory}
                            className="h-12 px-8 bg-black text-white rounded-xl font-bold shadow-lg shadow-black/10 hover:bg-gray-800 transition-colors"
                        >
                            Create Category
                        </button>
                    </div>
                )}
            </div>

            <MenuItemModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingItem(null); setSelectedCategory(null); }}
                category={selectedCategory}
                itemToEdit={editingItem}
                onSuccess={() => { fetchMenu(); setIsModalOpen(false); }}
            />
        </div>
    );
}
