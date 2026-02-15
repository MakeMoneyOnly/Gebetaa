'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, Edit2, Trash2, Image as ImageIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CategoryWithItems, MenuItem } from '@/types/database'; // Ensure MenuItem is imported
import { MenuItemModal } from '@/features/merchant/components/MenuItemModal';

export default function MenuPage() {
    const [categories, setCategories] = useState<CategoryWithItems[]>([]);
    const [loading, setLoading] = useState(true);
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<CategoryWithItems | null>(null);
    const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

    const supabase = createClient();

    useEffect(() => {
        fetchMenu();
    }, []);

    const fetchMenu = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Get user's restaurant first (simplified for MVP)
            const { data: staff } = await supabase
                .from('restaurant_staff')
                .select('restaurant_id')
                .eq('user_id', user.id)
                .single();

            if (!staff) return;

            const { data, error } = await supabase
                .from('categories')
                .select('*, items:menu_items(*)') // Note: using menu_items table
                .eq('restaurant_id', staff.restaurant_id)
                .order('order_index');

            if (data) {
                setCategories(data as any);
            }
        } catch (error) {
            console.error('Error fetching menu:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddCategory = async () => {
        const name = prompt("Enter category name (e.g., 'Starters', 'Main Course'):");
        if (!name) return;

        try {
            const { data: { user } } = await supabase.auth.getUser(); // Safe fetch
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
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-brand-crimson" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Menu Management</h1>
                    <p className="text-text-secondary">Manage your categories and items</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="secondary">Reorder</Button>
                    <Button onClick={handleAddCategory} className="bg-brand-crimson hover:bg-brand-crimson-hover text-white">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Category
                    </Button>
                </div>
            </div>

            <div className="grid gap-8">
                {categories.map((category) => (
                    <div key={category.id} className="space-y-4">
                        <div className="flex items-center justify-between border-b border-surface-200 pb-2">
                            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                                {category.name}
                                <span className="text-sm font-normal text-text-tertiary">({category.items.length} items)</span>
                            </h2>
                            <div className="flex gap-2">
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                    <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
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
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {/* Add Item Card */}
                            <button
                                onClick={() => { setSelectedCategory(category); setEditingItem(null); setIsModalOpen(true); }}
                                className="group flex h-full min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-surface-200 bg-surface-50/50 hover:border-brand-crimson/50 hover:bg-brand-crimson/5 transition-all"
                            >
                                <div className="rounded-full bg-surface-100 p-3 group-hover:bg-white group-hover:shadow-md transition-all">
                                    <Plus className="h-6 w-6 text-text-tertiary group-hover:text-brand-crimson" />
                                </div>
                                <span className="mt-3 font-medium text-text-secondary group-hover:text-brand-crimson">Add Item</span>
                            </button>

                            {/* Item Cards */}
                            {category.items.map((item) => (
                                <Card key={item.id} className="group relative overflow-hidden transition-all hover:shadow-lg">
                                    <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            size="sm"
                                            variant="glass"
                                            className="h-8 w-8 p-0 bg-white/90"
                                            onClick={(e) => {
                                                e.stopPropagation(); // prevent card click if any
                                                setSelectedCategory(category);
                                                setEditingItem(item);
                                                setIsModalOpen(true);
                                            }}
                                        >
                                            <Edit2 className="h-4 w-4 text-text-primary" />
                                        </Button>
                                    </div>

                                    <div className="relative aspect-video w-full overflow-hidden bg-surface-100">
                                        {item.image_url ? (
                                            <img
                                                src={item.image_url}
                                                alt={item.name}
                                                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-text-tertiary">
                                                <ImageIcon className="h-8 w-8 opacity-20" />
                                            </div>
                                        )}
                                        {/* Price Badge */}
                                        <div className="absolute bottom-2 left-2 rounded-md bg-black/70 backdrop-blur-md px-2 py-1 text-xs font-bold text-white">
                                            {item.price} ETB
                                        </div>
                                    </div>

                                    <div className="p-4">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="font-bold text-text-primary line-clamp-1">{item.name}</h3>
                                                {item.name_am && <p className="text-xs text-text-tertiary">{item.name_am}</p>}
                                            </div>
                                            <div className={cn("h-2 w-2 rounded-full", item.is_available !== false ? "bg-green-500" : "bg-red-500")} />
                                        </div>
                                        <p className="mt-2 text-xs text-text-secondary line-clamp-2">
                                            {item.description || "No description provided."}
                                        </p>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                ))}

                {categories.length === 0 && !loading && (
                    <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-surface-200 rounded-2xl bg-surface-50">
                        <div className="h-16 w-16 rounded-full bg-surface-100 flex items-center justify-center mb-4">
                            <ImageIcon className="h-8 w-8 text-text-tertiary" />
                        </div>
                        <h3 className="text-lg font-bold text-text-primary">No categories yet</h3>
                        <p className="text-text-secondary max-w-sm mt-1 mb-6">Start building your menu by adding your first category.</p>
                        <Button onClick={handleAddCategory} className="bg-brand-crimson text-white hover:bg-brand-crimson-hover">Create Category</Button>
                    </div>
                )}
            </div>

            {/* Item Modal */}
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
